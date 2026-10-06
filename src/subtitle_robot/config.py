"""전역 설정 `config.toml` 로딩 (PROJECT-PLAN §6.1, §21.10, WI-1.007).

설정은 시작할 때 한 번 읽는다. 공급자를 바꾸려면 파일을 고치고 재기동한다 (폴백 없음, §22).
API 키는 설정 파일에 두지 않는다. 웹 Settings 가 데이터 폴더의 비밀 저장소에 둔다 (§28.2, NFR-010).
"""

from __future__ import annotations

import logging
import os
import time
import tomllib
from pathlib import Path
from typing import Any, Literal
from zoneinfo import available_timezones

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    SecretStr,
    ValidationError,
    field_validator,
    model_validator,
)

from subtitle_robot.lang.codes import DEFAULT_TARGET, LanguageCodeField
from subtitle_robot.llm.base import ProviderSettings, ResponseFormatMode
from subtitle_robot.llm.catalog import (
    ANTHROPIC_BASE_URL,
    CLOUD_DEFAULT_TIMEOUT_S,
    GEMINI_BASE_URL,
    GEMINI_DEFAULT_MODEL,
    GEMINI_DEFAULT_RPM,
    OLLAMA_BASE_URL,
    OLLAMA_DEFAULT_CONTEXT,
    OPENAI_BASE_URL,
    OPENROUTER_BASE_URL,
    SUBSCRIPTION_PROVIDERS,
    AuthMode,
    ProviderName,
)
from subtitle_robot.llm.llama_server import LOCAL_DEFAULT_TIMEOUT_S
from subtitle_robot.llm.nim import (
    NIM_BASE_URL,
    NIM_DEFAULT_MODEL,
    NIM_DEFAULT_RPM,
    NIM_DEFAULT_TIMEOUT_S,
)

logger = logging.getLogger(__name__)

THINKING_OFF: dict[str, Any] = {"chat_template_kwargs": {"enable_thinking": False}}
LOCAL_DEFAULT_MODEL = "Qwen3.8-27B-UD-Q4_K_XL"

# 파일에 없는 키는 이 값을 쓴다 (§6.1 v5.4, §27.1). local 의 base_url 은 환경마다 달라 기본값이 없다
_PROVIDER_DEFAULTS: dict[str, dict[str, Any]] = {
    "nim": {
        "base_url": NIM_BASE_URL,
        "model": NIM_DEFAULT_MODEL,
        "rpm": NIM_DEFAULT_RPM,
        "concurrency": 1,
        "timeout": NIM_DEFAULT_TIMEOUT_S,
        "extra_body": THINKING_OFF,
    },
    "local": {
        "model": LOCAL_DEFAULT_MODEL,
        "rpm": 0,
        "concurrency": "auto",
        "timeout": LOCAL_DEFAULT_TIMEOUT_S,
        "extra_body": THINKING_OFF,
    },
    # 새 공급자 (§27.1): 모델은 기본값이 없다 (Q-20)
    "ollama": {
        "base_url": OLLAMA_BASE_URL,
        "timeout": LOCAL_DEFAULT_TIMEOUT_S,
        "context_tokens": OLLAMA_DEFAULT_CONTEXT,
    },
    "openrouter": {
        "base_url": OPENROUTER_BASE_URL,
        "timeout": CLOUD_DEFAULT_TIMEOUT_S,
    },
    # 최신 OpenAI 추론 모델은 temperature 를 받지 않는다 (§27.1)
    "openai": {
        "base_url": OPENAI_BASE_URL,
        "timeout": CLOUD_DEFAULT_TIMEOUT_S,
        "temperature": None,
    },
    "claude": {
        "base_url": ANTHROPIC_BASE_URL,
        "timeout": CLOUD_DEFAULT_TIMEOUT_S,
    },
    # 기본 공급자 (WI-10.009l): 모델·분당 요청 수 기본값이 있다 (무료 등급 기준)
    "gemini": {
        "base_url": GEMINI_BASE_URL,
        "model": GEMINI_DEFAULT_MODEL,
        "rpm": GEMINI_DEFAULT_RPM,
        "timeout": CLOUD_DEFAULT_TIMEOUT_S,
    },
}
# 설정 파일에 [llm] provider 가 없을 때 쓰는 공급자 (0.8.2 까지 nim, 사용자 결정 2026-10-06)
DEFAULT_PROVIDER: ProviderName = "gemini"


class ConfigError(ValueError):
    """설정 파일을 읽을 수 없거나 값이 잘못됐다. 메시지에 위치(키 경로)를 담는다."""


class ProviderSettingMissingError(ConfigError):
    """고른 공급자의 칸 하나(base_url·model 이 비었거나 auth 를 쓸 수 없다)가 맞지 않다.

    웹 설정 화면이 그 칸에 오류를 보인다.
    """

    def __init__(self, provider: str, field: str, message: str) -> None:
        super().__init__(message)
        self.provider = provider
        self.field = field


class _Strict(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")


class LlmSection(_Strict):
    """`[llm]`."""

    provider: ProviderName = DEFAULT_PROVIDER


class ProviderConfig(_Strict):
    """`[providers.<name>]`. 키 이름은 §6.1 예시를 따른다."""

    base_url: str
    # 0.8.0 전 설정. 읽기만 하고 쓰지 않는다 (키는 Settings 의 비밀 저장소, §28.2)
    api_key_env: str | None = None
    # 새 공급자는 기본값이 없다. 고른 공급자의 모델이 비면 active_provider 가 설정 오류를 낸다
    model: str = ""
    pass1_model: str = ""
    rpm: int = Field(default=0, ge=0)
    concurrency: int | Literal["auto"] = 1
    timeout: float = Field(default=120.0, gt=0)
    # None 이면 보내지 않는다 (OpenAI 추론 모델)
    temperature: float | None = 0.2
    max_output_tokens: int = Field(default=8192, gt=0)
    # 요청 하나의 컨텍스트 (배치 예산·Ollama num_ctx). 없으면 공급자 정보, 그것도 없으면 기본값
    context_tokens: int | None = Field(default=None, gt=0)
    response_format: ResponseFormatMode = "json_schema"
    extra_body: dict[str, Any] = Field(default_factory=dict)
    # subscription 이면 API 대신 공식 CLI 를 구독 로그인으로 실행한다 (claude·openai, §28.1)
    auth: AuthMode = "api_key"

    def to_settings(
        self, api_key: SecretStr | None, *, model: str | None = None
    ) -> ProviderSettings:
        """어댑터 설정으로 바꾼다. `model` 을 주면 그 모델로 (Pass 1 전용 모델 등)."""
        return ProviderSettings(
            base_url=self.base_url,
            model=model or self.model,
            api_key=api_key,
            rpm=self.rpm,
            concurrency=self.concurrency,
            timeout_s=self.timeout,
            temperature=self.temperature,
            max_output_tokens=self.max_output_tokens,
            context_tokens=self.context_tokens,
            response_format=self.response_format,
            extra_body=self.extra_body,
        )


class RetryConfig(_Strict):
    """`[retry]` — 검증 error 재시도 상한 (§11.2). HTTP 재시도와는 별개다."""

    max_retries_unit: int = Field(default=2, ge=0)
    max_retries_batch: int = Field(default=3, ge=0)


class WatchPath(_Strict):
    """`[[watch.paths]]` — 감시 경로와 종류 (§21.6)."""

    path: str
    kind: Literal["movie", "series", "auto"] = "auto"


class WatchConfig(_Strict):
    """`[watch]` — 감시 데몬 (§21.7)."""

    enabled: bool = True
    scan_existing: bool = True
    backlog_order: Literal["newest", "path"] = "newest"
    backlog_skip_if_external: bool = True
    reconcile_interval: int = Field(default=900, gt=0)
    stable_seconds: int = Field(default=60, ge=0)
    polling: bool = False
    # polling 감시가 폴더 전체를 훑는 간격(초). 짧으면 큰 라이브러리·네트워크 저장소에 부하가 크다
    polling_interval: float = Field(default=30.0, gt=0)
    include: list[str] = Field(default_factory=lambda: ["*.mkv", "*.mp4"])
    exclude: list[str] = Field(default_factory=lambda: ["*.part", "*.!qB", "*.tmp", "*sample*"])
    # 이 이름의 폴더 안 파일은 감시하지 않는다. 다운로드 도구가 압축을 푸는 중인 폴더
    # (SABnzbd `_UNPACK_…`·`_FAILED_…`)에서 추출이 시작돼 다운로드와 겹치지 않게 한다
    exclude_dirs: list[str] = Field(default_factory=lambda: ["_UNPACK_*", "_FAILED_*"])
    paths: list[WatchPath] = Field(default_factory=list)


_EXTRACT_LANGS: tuple[str, ...] = ("en", "ja", "ko")


class MediaConfig(_Strict):
    """`[media]` — 동영상 자막 추출·번역 판정 (§21.4, §21.5, §21.10)."""

    # 사이드카로 뽑을 언어. 대상 언어·원어·첫 후보 트랙은 이 목록과 관계없이 뽑는다 (§26.6)
    extract_langs: list[LanguageCodeField] = Field(default_factory=lambda: list(_EXTRACT_LANGS))
    # 0.6.0 전 소스 선택 설정. 읽기만 하고 쓰지 않는다 (소스는 원어 트랙 → 첫 트랙, §26.6)
    source_langs: list[str] | None = None
    source_preference: str | None = None
    skip_forced: bool = True
    # 대상 언어 이미지 자막도 "대상 언어 자막 있음"으로 본다 (0.6.0 전 이름 korean_image_counts)
    target_image_counts: bool = Field(
        default=True, validation_alias=AliasChoices("target_image_counts", "korean_image_counts")
    )
    output_mode: Literal["sidecar", "mirror"] = "sidecar"
    # 번역 결과 사이드카 형식 (Q-07): srt(기본, 호환성) | ass(ASS 트랙이면 스타일 보존) | both
    output_format: Literal["srt", "ass", "both"] = "srt"
    output_root: str = "/output"
    # 검사·추출 도구 우선순위: low 는 ionice idle·nice 19
    # (다운로드 등 다른 작업에 디스크를 양보한다)
    tool_priority: Literal["low", "normal"] = "low"
    series_window: int = Field(default=600, ge=0)

    @model_validator(mode="after")
    def _warn_ignored(self) -> MediaConfig:
        ignored = [
            name for name in ("source_langs", "source_preference") if name in self.model_fields_set
        ]
        if ignored:
            logger.warning(
                "config [media] %s is no longer used: the source track is the original-language "
                "track (TMDB) or the first text track",
                ", ".join(ignored),
            )
        return self


class SidecarConfig(_Strict):
    """`[sidecar]` — 이름이 겹치는 외부 자막 처리 (§21.11)."""

    on_conflict: Literal["rename", "skip"] = "rename"
    rename_style: Literal["orig", "backup"] = "orig"


class LedgerConfig(_Strict):
    """`[ledger]` — 처리 기록 (§21.12)."""

    hash_bytes: int = Field(default=4 * 1024 * 1024, gt=0)
    restore_missing_outputs: bool = True


class QueueConfig(_Strict):
    """`[queue]` — 작업 큐 (§21.8)."""

    workers: int = Field(default=1, ge=1)
    max_attempts: int = Field(default=5, ge=1)


class WebConfig(_Strict):
    """`[web]` — 감시 데몬의 웹 운영 화면 (§25.2).

    관리 계정은 처음 접속할 때 만들고 비밀 저장소에 둔다 (§28.3).
    """

    enabled: bool = True
    host: str = "0.0.0.0"  # noqa: S104 — 컨테이너 밖(LAN)에서 접속한다. 관리 계정 로그인으로 보호
    # 다른 *arr·미디어 도구와 겹치지 않는 번호 (0.8.0 전 기본 8090)
    port: int = Field(default=8949, ge=0, le=65535)
    # 0.8.0 전 설정. 읽기만 하고 쓰지 않는다 (사용자 이름은 관리 계정, §28.3)
    username: str | None = None
    session_hours: int = Field(default=168, gt=0)
    # 빌드한 화면 위치. 컨테이너 이미지에는 이 경로에 들어 있다 (§25.6)
    static_dir: str = "/app/web"


class SystemConfig(_Strict):
    """`[system]` — 시간대 (§28.4, REQ-048). 비우면 컨테이너 `TZ`."""

    timezone: str = ""

    @field_validator("timezone")
    @classmethod
    def _check_timezone(cls, value: str) -> str:
        name = value.strip()
        if name and name not in available_timezones():
            raise ValueError(f"모르는 시간대: {name!r} (IANA 이름, 예: Asia/Seoul)")
        return name


def apply_timezone(config: AppConfig) -> None:
    """설정의 시간대를 이 프로세스에 적용한다 (로그·큐 시각). 비어 있으면 그대로 둔다."""
    name = config.system.timezone
    if name:
        os.environ["TZ"] = name
        time.tzset()


class TranslationConfig(_Strict):
    """`[translation]` — 번역 대상 언어 (§26.1, REQ-040)."""

    target_language: LanguageCodeField = DEFAULT_TARGET


class TmdbConfig(_Strict):
    """`[tmdb]` — 작품 원어 조회 (§26.6). 키는 Settings 의 비밀 저장소에 있다 (§28.2)."""

    enabled: bool = True
    # 0.8.0 전 설정. 읽기만 하고 쓰지 않는다 (키는 Settings 의 비밀 저장소, §28.2)
    api_key_env: str | None = None
    timeout: float = Field(default=10.0, gt=0)


class AppConfig(_Strict):
    """전역 설정 전체.

    미디어 확장 설정(`watch`·`media`·`sidecar`·`ledger`·`queue`)은 §21.10, `web` 은 §25.2 를 따른다.
    """

    llm: LlmSection = Field(default_factory=LlmSection)
    providers: dict[ProviderName, ProviderConfig]
    retry: RetryConfig = Field(default_factory=RetryConfig)
    system: SystemConfig = Field(default_factory=SystemConfig)
    translation: TranslationConfig = Field(default_factory=TranslationConfig)
    watch: WatchConfig = Field(default_factory=WatchConfig)
    media: MediaConfig = Field(default_factory=MediaConfig)
    sidecar: SidecarConfig = Field(default_factory=SidecarConfig)
    ledger: LedgerConfig = Field(default_factory=LedgerConfig)
    queue: QueueConfig = Field(default_factory=QueueConfig)
    tmdb: TmdbConfig = Field(default_factory=TmdbConfig)
    web: WebConfig = Field(default_factory=WebConfig)

    def active_provider(self) -> tuple[ProviderName, ProviderConfig]:
        """`llm.provider` 가 가리키는 공급자 설정.

        Raises:
            ConfigError: 해당 `[providers.<name>]` 이 없거나 모델·주소가 비어 있다.
        """
        name = self.llm.provider
        provider = self.providers.get(name)
        if provider is None:
            raise ProviderSettingMissingError(
                name,
                "base_url",
                f"llm.provider = {name!r} 인데 [providers.{name}] 설정이 없다 (base_url 필요)",
            )
        if not provider.base_url.strip():
            raise ProviderSettingMissingError(
                name, "base_url", f"providers.{name}.base_url 이 비어 있다"
            )
        if provider.auth == "subscription" and name not in SUBSCRIPTION_PROVIDERS:
            raise ProviderSettingMissingError(
                name,
                "auth",
                f"providers.{name}.auth = 'subscription' 은 claude·openai 만 쓸 수 있다",
            )
        if not provider.model.strip():
            raise ProviderSettingMissingError(
                name,
                "model",
                f"providers.{name}.model 이 비어 있다 "
                "(Settings 또는 config.toml 에서 모델을 정한다)",
            )
        return name, provider


def load_config(path: Path | None = None) -> AppConfig:
    """설정 파일을 읽는다. 경로가 없으면 기본값(Gemini)만으로 만든다.

    Raises:
        ConfigError: 파일이 없거나, TOML 문법이 틀렸거나, 값이 잘못됐다.
    """
    if path is None:
        return parse_config({}, source="기본값")
    path = Path(path)
    try:
        raw = tomllib.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ConfigError(f"설정 파일이 없다: {path}") from exc
    except tomllib.TOMLDecodeError as exc:
        raise ConfigError(f"{path}: TOML 문법 오류: {exc}") from exc
    return parse_config(raw, source=str(path))


def _warn_env_keys(raw: dict[str, Any], source: str) -> None:
    """0.8.0 전 `api_key_env`(키 환경 변수 이름)는 더 쓰지 않는다고 알린다 (Q-24)."""
    providers = raw.get("providers")
    tables = [
        f"providers.{name}"
        for name, table in (providers.items() if isinstance(providers, dict) else [])
        if isinstance(table, dict) and "api_key_env" in table
    ]
    tmdb = raw.get("tmdb")
    if isinstance(tmdb, dict) and "api_key_env" in tmdb:
        tables.append("tmdb")
    if tables:
        logger.warning(
            "%s: api_key_env (%s) is no longer used; enter keys in the web Settings",
            source,
            ", ".join(tables),
        )


def provider_defaults(name: str) -> dict[str, Any]:
    """파일에 없는 공급자 키에 쓰는 기본값 (§6.1). local 의 base_url 은 기본값이 없다."""
    return dict(_PROVIDER_DEFAULTS.get(name, {}))


def with_provider_defaults(raw: dict[str, Any], *, source: str) -> dict[str, Any]:
    """공급자 기본값을 채운 dict (검증 전). 웹 설정 화면도 같은 규칙으로 검증한다 (§25.9).

    Raises:
        ConfigError: providers 가 표가 아니다.
    """
    merged = dict(raw)
    user_providers = raw.get("providers", {})
    if not isinstance(user_providers, dict):
        raise ConfigError(f"{source}: providers 는 표([providers.<이름>])여야 한다")
    providers: dict[str, Any] = {DEFAULT_PROVIDER: {**_PROVIDER_DEFAULTS[DEFAULT_PROVIDER]}}
    # 고른 공급자가 파일에 없어도 기본값으로 채운다 (오류가 "모델이 비어 있다"로 구체적이게)
    llm = raw.get("llm")
    active = llm.get("provider") if isinstance(llm, dict) else None
    if (
        isinstance(active, str)
        and active in _PROVIDER_DEFAULTS
        and "base_url" in _PROVIDER_DEFAULTS[active]
    ):
        providers[active] = {**_PROVIDER_DEFAULTS[active]}
    for name, values in user_providers.items():
        if not isinstance(values, dict):
            raise ConfigError(f"{source}: providers.{name} 은 표여야 한다")
        providers[name] = {**_PROVIDER_DEFAULTS.get(name, {}), **values}
    merged["providers"] = providers
    return merged


def parse_config(raw: dict[str, Any], *, source: str) -> AppConfig:
    """TOML 에서 읽은 dict 를 기본값과 합쳐 검증한다."""
    _warn_env_keys(raw, source)
    merged = with_provider_defaults(raw, source=source)
    try:
        return AppConfig.model_validate(merged)
    except ValidationError as exc:
        details = "; ".join(
            f"{'.'.join(str(part) for part in error['loc'])}: {error['msg']}"
            for error in exc.errors()
        )
        raise ConfigError(f"{source}: 설정 값 오류 — {details}") from exc
