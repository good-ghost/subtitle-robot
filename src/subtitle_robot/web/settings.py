"""설정 조회·저장·재기동 API (PROJECT-PLAN §25.9, REQ-039, WI-7.008).

데몬이 읽은 `config.toml`을 고친다. 설정은 시작할 때 한 번 읽으므로(§6.1) 저장한 값은
재기동 뒤에 적용된다. 파일의 주석·키 순서와 화면이 다루지 않는 키(`extra_body` 등)는
`tomlkit`으로 그대로 두고 바뀐 값만 쓴다. 비밀(API 키·웹 토큰)은 환경 변수라 여기에 없다.
"""

from __future__ import annotations

import os
import tempfile
import tomllib
from zoneinfo import available_timezones
from pathlib import Path
from typing import Any, Literal

import tomlkit
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ValidationError
from tomlkit.items import Table

from subtitle_robot.config import (
    AppConfig,
    ProviderConfig,
    ProviderSettingMissingError,
    load_config,
    parse_config,
    provider_defaults,
    with_provider_defaults,
)
from subtitle_robot.lang.codes_data import LANGUAGES
from subtitle_robot.llm.catalog import PROVIDER_NAMES, AuthMode, ProviderName
from subtitle_robot.llm.logins import SubscriptionProvider, available_subscription_clis
from subtitle_robot.llm.models import ModelListError, list_models, subscription_models
from subtitle_robot.secret_store import SecretStore
from subtitle_robot.web.context import Context

router = APIRouter(prefix="/api")

# 화면에서 고치는 항목. 나머지 키는 파일 값 그대로 둔다
EDITABLE: dict[str, tuple[str, ...]] = {
    "llm": ("provider",),
    "retry": ("max_retries_unit", "max_retries_batch"),
    "system": ("timezone",),
    "translation": ("target_language",),
    # 키는 비밀 저장소(Settings 키 탭, §28.2)라 여기에 없다
    "tmdb": ("enabled", "timeout"),
    "watch": (
        "enabled", "scan_existing", "backlog_order", "backlog_skip_if_external",
        "reconcile_interval", "stable_seconds", "polling", "polling_interval", "include", "exclude",
        "exclude_dirs", "paths",
    ),
    "media": (
        "extract_langs", "skip_forced", "target_image_counts", "output_mode", "output_format",
        "output_root", "series_window", "tool_priority",
    ),
    "sidecar": ("on_conflict", "rename_style"),
    "ledger": ("hash_bytes", "restore_missing_outputs"),
    "queue": ("workers", "max_attempts"),
    # static_dir 는 이미지 안의 경로라 화면에서 다루지 않는다
    "web": ("enabled", "host", "port", "session_hours"),
}  # fmt: skip
# 이름이 바뀐 키: (표, 새 이름) → 옛 이름. 새 이름으로 저장할 때 파일의 옛 키를 지운다
# (둘 다 있으면 검증이 모르는 키로 거절한다, §26.6)
RENAMED_KEYS: dict[tuple[str, str], str] = {("media", "target_image_counts"): "korean_image_counts"}
PROVIDER_FIELDS = (
    "base_url", "model", "pass1_model", "rpm", "concurrency", "timeout", "temperature",
    "max_output_tokens", "context_tokens", "auth",
)  # fmt: skip
# 보이기만 하는 항목 (키는 비밀 저장소, §28.2)
PROVIDER_READONLY: tuple[str, ...] = ()

ReadOnlyReason = Literal["no_config_file", "read_only"]


class FieldError(BaseModel):
    """검증 오류 하나. loc 은 `watch.stable_seconds` 같은 점 경로.

    type·ctx 는 pydantic 오류 종류와 기준값이다 (화면이 문구를 번역한다, message 는 영어 원문).
    """

    loc: str
    message: str
    type: str = ""
    ctx: dict[str, str] = Field(default_factory=dict)


class LanguageOut(BaseModel):
    """대상 언어 목록 항목 (ISO 639-1 과 영어 이름)."""

    code: str
    name: str


TIMEZONES = sorted(available_timezones())
LANGUAGE_OPTIONS = [
    LanguageOut(code=info.code, name=info.name)
    for info in sorted(LANGUAGES.values(), key=lambda item: item.name)
]


class SettingsOut(BaseModel):
    """설정 화면 상태. languages 는 대상 언어로 고를 수 있는 언어다 (§26.7)."""

    path: str | None
    writable: bool
    reason: ReadOnlyReason | None
    restart_pending: bool
    values: dict[str, Any]
    languages: list[LanguageOut] = Field(default_factory=lambda: LANGUAGE_OPTIONS)
    # 시간대로 고를 수 있는 IANA 이름 (§28.4)
    timezones: list[str] = Field(default_factory=lambda: TIMEZONES)
    # 이 이미지에 CLI 가 있어 구독으로 쓸 수 있는 공급자 (latest 는 없음, WI-10.009e)
    subscription_clis: list[SubscriptionProvider] = Field(
        default_factory=available_subscription_clis
    )


class SettingsIn(BaseModel):
    """저장 요청. values 는 SettingsOut.values 와 같은 모양이다."""

    values: dict[str, Any]


class RestartOut(BaseModel):
    """재기동 요청 결과."""

    restarting: bool


class SettingsError(Exception):
    """저장할 수 없다 (HTTP 상태와 오류 코드, 검증 오류 목록)."""

    def __init__(self, status: int, code: str, errors: list[FieldError] | None = None) -> None:
        super().__init__(code)
        self.status = status
        self.code = code
        self.errors = errors or []


@router.get("/settings")
def get_settings(context: Context) -> SettingsOut:
    """저장된 설정 값(기본값 포함)과 쓰기 가능 여부."""
    path = context.config_path
    reason = _read_only_reason(path)
    config = load_config(path) if path is not None and path.is_file() else context.config
    return SettingsOut(
        path=str(path) if path else None,
        writable=reason is None,
        reason=reason,
        restart_pending=_restart_pending(path, context.started_at),
        values=editable_values(config),
    )


@router.put("/settings")
def put_settings(body: SettingsIn, context: Context) -> SettingsOut:
    """검증해 저장한다. 실패는 400(항목별 오류) 또는 409(쓸 수 없음)."""
    path = context.config_path
    try:
        if path is None:
            raise SettingsError(409, "no_config_file")
        config = save_settings(path, body.values)
    except SettingsError as exc:
        detail: dict[str, Any] = {"code": exc.code, "errors": [e.model_dump() for e in exc.errors]}
        raise HTTPException(status_code=exc.status, detail=detail) from exc
    return SettingsOut(
        path=str(path),
        writable=True,
        reason=None,
        restart_pending=_restart_pending(path, context.started_at),
        values=editable_values(config),
    )


@router.post("/daemon/restart", status_code=202)
def restart(context: Context) -> RestartOut:
    """데몬에 종료를 요청한다. 컨테이너 재시작 정책이 다시 띄운다 (§25.9)."""
    if context.request_restart is None:
        raise HTTPException(status_code=409, detail="restart_unavailable")
    context.request_restart()
    return RestartOut(restarting=True)


class ModelsOut(BaseModel):
    """공급자 모델 목록."""

    models: list[str]


@router.get("/providers/{name}/models")
def provider_models(
    name: ProviderName, context: Context, base_url: str | None = None, auth: AuthMode = "api_key"
) -> ModelsOut:
    """공급자의 모델 목록 (§27.3). base_url 을 주면 아직 저장하지 않은 주소로 묻는다.

    키는 비밀 저장소(Settings)의 것을 쓰고 응답·오류에 넣지 않는다. 실패는 400 `{code, detail}`.
    구독(auth=subscription)은 API 목록이 없어 CLI 가 받는 별칭만 준다 (§28.1).
    """
    if auth == "subscription":
        try:
            return ModelsOut(models=subscription_models(name))
        except ModelListError as exc:
            raise HTTPException(
                status_code=400, detail={"code": exc.code, "detail": exc.detail}
            ) from exc
    path = context.config_path
    raw = tomllib.loads(path.read_text(encoding="utf-8")) if path and path.is_file() else {}
    merged = with_provider_defaults(raw, source="settings")
    provider = {**provider_defaults(name), **merged["providers"].get(name, {})}
    try:
        models = list_models(
            name,
            base_url=base_url if base_url is not None else str(provider.get("base_url") or ""),
            api_key=SecretStore.for_data_dir(context.data_dir).provider_key(name),
        )
    except ModelListError as exc:
        raise HTTPException(
            status_code=400, detail={"code": exc.code, "detail": exc.detail}
        ) from exc
    return ModelsOut(models=models)


def editable_values(config: AppConfig) -> dict[str, Any]:
    """화면에 보일 값 (JSON 모양). 파일에 없는 공급자는 기본값에 빈 주소로 채운다."""
    dumped = config.model_dump(mode="json")
    values: dict[str, Any] = {
        section: {name: dumped[section][name] for name in fields}
        for section, fields in EDITABLE.items()
    }
    providers: dict[str, Any] = {}
    for name in PROVIDER_NAMES:
        source = dumped["providers"].get(name) or _unconfigured_provider(name)
        providers[name] = {key: source.get(key) for key in PROVIDER_FIELDS + PROVIDER_READONLY}
    values["providers"] = providers
    return values


def _unconfigured_provider(name: str) -> dict[str, Any]:
    """파일에 없는 공급자: 기본값을 채운다 (화면이 기본값을 따로 두지 않게).

    주소 기본값이 없는 공급자(local)는 빈 주소, 모델 기본값이 없는 새 공급자는 빈 모델이다.
    """
    defaults = ProviderConfig.model_validate({"base_url": "", **provider_defaults(name)})
    return defaults.model_dump(mode="json")


def save_settings(path: Path, values: dict[str, Any]) -> AppConfig:
    """바뀐 값만 파일에 쓴다 (주석·다른 키 보존, 임시 파일 → rename).

    Raises:
        SettingsError: 쓸 수 없는 파일(409), 잘못된 값(400).
    """
    reason = _read_only_reason(path)
    if reason is not None:
        raise SettingsError(409, reason)
    text = path.read_text(encoding="utf-8")
    raw = tomllib.loads(text)
    before = editable_values(parse_config(raw, source=str(path)))
    configured = set(raw.get("providers", {})) | {"nim"}
    changes = _changes(before, values, configured)
    if not changes:
        return parse_config(raw, source=str(path))
    for keys, value in changes:
        _drop_legacy_key(raw, keys)
        _set_raw(raw, keys, value)
    config = _validate(raw)
    # 화면이 보낸 값이 아니라 검증된 값을 쓴다 ("30" → 30 처럼 형이 맞춰진다)
    validated = editable_values(config)
    document = tomlkit.parse(text)
    for keys, _ in changes:
        _drop_legacy_key(document, keys)
        _set_document(document, keys, _lookup(validated, keys))
    _atomic_write(path, tomlkit.dumps(document))
    return config


def _changes(
    before: dict[str, Any], values: dict[str, Any], configured: set[str]
) -> list[tuple[tuple[str, ...], Any]]:
    """(키 경로, 새 값) 목록. 다루는 항목만 보고, 값이 같으면 건너뛴다.

    configured 는 파일(또는 기본값)에 이미 있는 공급자다.
    """
    changes: list[tuple[tuple[str, ...], Any]] = []
    for section, fields in EDITABLE.items():
        submitted = values.get(section)
        if isinstance(submitted, dict):
            changes.extend(
                ((section, name), submitted[name])
                for name in fields
                if name in submitted and submitted[name] != before[section][name]
            )
    providers = values.get("providers")
    if isinstance(providers, dict):
        for name in PROVIDER_NAMES:
            if name in configured:
                changes.extend(_provider_changes(name, before["providers"][name], providers.get(name)))
            else:
                changes.extend(_new_provider_changes(name, providers.get(name)))
    return changes


def _provider_changes(
    name: str, current: dict[str, Any], submitted: object
) -> list[tuple[tuple[str, ...], Any]]:
    """파일에 있는 공급자 하나의 바뀐 값."""
    if not isinstance(submitted, dict):
        return []
    return [
        (("providers", name, key), submitted[key])
        for key in PROVIDER_FIELDS
        if key in submitted and submitted[key] != current.get(key)
    ]


def _new_provider_changes(name: str, submitted: object) -> list[tuple[tuple[str, ...], Any]]:
    """파일에 없던 공급자: 기본값과 다른 값만 쓴다 (모두 기본값이면 표를 만들지 않는다).

    주소 기본값이 없는 공급자(local)는 주소를 넣었을 때만 만든다.
    """
    if not isinstance(submitted, dict):
        return []
    defaults = _unconfigured_provider(name)
    if not defaults.get("base_url") and not submitted.get("base_url"):
        return []
    return [
        (("providers", name, key), submitted[key])
        for key in PROVIDER_FIELDS
        if key in submitted and submitted[key] != defaults.get(key)
    ]


def _validate(raw: dict[str, Any]) -> AppConfig:
    try:
        config = AppConfig.model_validate(with_provider_defaults(raw, source="settings"))
        config.active_provider()
    except ValidationError as exc:
        errors = [
            FieldError(
                loc=".".join(str(part) for part in error["loc"]),
                message=error["msg"],
                type=error["type"],
                ctx={key: str(value) for key, value in error.get("ctx", {}).items()},
            )
            for error in exc.errors()
        ]
        raise SettingsError(400, "invalid_settings", errors) from exc
    except ProviderSettingMissingError as exc:
        # 고른 공급자의 주소(local 등)나 모델(새 공급자)이 비었다
        kinds = {"model": "model_missing", "auth": "subscription_unsupported"}
        kind = kinds.get(exc.field, "provider_missing")
        location = f"providers.{exc.provider}.{exc.field}"
        errors = [FieldError(loc=location, message=str(exc), type=kind)]
        raise SettingsError(400, "invalid_settings", errors) from exc
    return config


def _drop_legacy_key(table: Any, keys: tuple[str, ...]) -> None:
    """새 이름으로 쓰는 키의 옛 이름을 지운다 (dict 와 tomlkit 문서 모두)."""
    legacy = RENAMED_KEYS.get((keys[0], keys[-1])) if len(keys) == 2 else None
    section = table.get(keys[0]) if legacy else None
    if section is not None and legacy in section:
        del section[legacy]


def _set_raw(raw: dict[str, Any], keys: tuple[str, ...], value: Any) -> None:
    table = raw
    for key in keys[:-1]:
        table = table.setdefault(key, {})
    table[keys[-1]] = value


def _lookup(values: dict[str, Any], keys: tuple[str, ...]) -> Any:
    found: Any = values
    for key in keys:
        found = found[key]
    return found


def _set_document(document: tomlkit.TOMLDocument, keys: tuple[str, ...], value: Any) -> None:
    """tomlkit 문서에 값을 넣는다. 없는 표는 만든다 (providers 는 상위 표)."""
    table: Any = document
    for depth, key in enumerate(keys[:-1]):
        if key not in table:
            table.add(key, tomlkit.table(is_super_table=depth == 0 and key == "providers"))
        table = table[key]
    name = keys[-1]
    if keys == ("watch", "paths"):
        paths = tomlkit.aot()
        for item in value:
            row: Table = tomlkit.table()
            row.update(item)
            paths.append(row)
        value = paths
    table[name] = value


def _atomic_write(path: Path, text: str) -> None:
    mode = path.stat().st_mode & 0o777
    fd, temp_name = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    temp = Path(temp_name)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(text)
        temp.chmod(mode)
        temp.replace(path)
    except BaseException:
        temp.unlink(missing_ok=True)
        raise


def _read_only_reason(path: Path | None) -> ReadOnlyReason | None:
    if path is None or not path.is_file():
        return "no_config_file"
    # 임시 파일 → rename 이라 폴더에도 쓸 수 있어야 한다 (:ro 마운트면 둘 다 안 된다)
    if not (os.access(path, os.W_OK) and os.access(path.parent, os.W_OK)):
        return "read_only"
    return None


def _restart_pending(path: Path | None, started_at: float) -> bool:
    """저장한 값이 아직 적용되지 않았다 (파일이 데몬 시작 뒤에 바뀌었다)."""
    if path is None or not path.is_file():
        return False
    return path.stat().st_mtime > started_at
