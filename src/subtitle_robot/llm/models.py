"""공급자의 모델 목록 (PROJECT-PLAN §27.3, REQ-045, WI-9.005).

웹 Settings 가 모델 이름을 목록에서 고를 수 있게 공급자의 모델 목록 API 를 부른다.
- OpenAI 호환(nim·local·openrouter·openai·gemini): `GET {base_url}/models` 의 `data[].id`
- Claude: `GET /v1/models` 의 `data[].id`
- Ollama: `GET /api/tags` 의 `models[].name`
키는 비밀 저장소(Settings)에서 받고 결과·오류 메시지에 넣지 않는다 (NFR-010).
"""

from __future__ import annotations

from typing import Any, Literal

import httpx

from subtitle_robot.llm.anthropic import ANTHROPIC_VERSION
from subtitle_robot.llm.catalog import KEY_REQUIRED

ModelListErrorCode = Literal[
    "no_key", "no_base_url", "unreachable", "auth", "http_error", "format", "subscription_manual"
]
# Claude Code `--model`이 받는 별칭 (CLI 문서). 구독은 모델 목록 API 가 없다 (§28.1)
CLAUDE_CODE_MODEL_ALIASES = ("sonnet", "opus", "haiku", "fable")
_HTTP_OK = 200
_HTTP_UNAUTHORIZED = (401, 403)
MODELS_TIMEOUT_S = 15.0
# 응답이 너무 크면 화면 목록이 무거워진다 (OpenRouter 는 수백 개)
MAX_MODELS = 2000


class ModelListError(RuntimeError):
    """모델 목록을 받을 수 없다. code 는 화면이 문구로 바꾼다."""

    def __init__(self, code: ModelListErrorCode, detail: str = "") -> None:
        super().__init__(f"{code}: {detail}" if detail else code)
        self.code = code
        self.detail = detail


def subscription_models(name: str) -> list[str]:
    """구독 CLI 가 받는 모델 이름. Claude 만 문서에 정해진 별칭이 있다.

    Raises:
        ModelListError: `subscription_manual` (Codex 는 모델 이름을 직접 적는다).
    """
    if name == "claude":
        return list(CLAUDE_CODE_MODEL_ALIASES)
    raise ModelListError("subscription_manual", name)


def list_models(
    name: str,
    *,
    base_url: str,
    api_key: str | None,
    http: httpx.Client | None = None,
) -> list[str]:
    """공급자의 모델 이름 목록 (정렬, 중복 제거).

    Args:
        name: 공급자 이름.
        base_url: 공급자 주소 (설정 또는 화면이 보낸 아직 저장하지 않은 값).
        api_key: 공급자 키 (비밀 저장소).
        http: 테스트용 httpx 클라이언트.

    Raises:
        ModelListError: 키·주소가 없거나 요청이 실패했다.
    """
    if not base_url.strip():
        raise ModelListError("no_base_url")
    key = (api_key or "").strip()
    if name in KEY_REQUIRED and not key:
        raise ModelListError("no_key", name)
    root = base_url.rstrip("/")
    if name == "claude":
        url = f"{root.removesuffix('/v1')}/v1/models?limit=1000"
        headers = {"anthropic-version": ANTHROPIC_VERSION, **({"x-api-key": key} if key else {})}
    elif name == "ollama":
        url = f"{root.removesuffix('/v1').removesuffix('/api')}/api/tags"
        headers = {"Authorization": f"Bearer {key}"} if key else {}
    else:
        url = f"{root}/models"
        headers = {"Authorization": f"Bearer {key}"} if key else {}
    client = http or httpx.Client()
    try:
        response = client.get(url, headers=headers, timeout=MODELS_TIMEOUT_S)
    except httpx.TransportError as exc:
        raise ModelListError("unreachable", type(exc).__name__) from exc
    finally:
        if http is None:
            client.close()
    if response.status_code in _HTTP_UNAUTHORIZED:
        raise ModelListError("auth", f"HTTP {response.status_code}")
    if response.status_code != _HTTP_OK:
        raise ModelListError("http_error", f"HTTP {response.status_code}")
    try:
        data = response.json()
    except ValueError as exc:
        raise ModelListError("format", "JSON 이 아니다") from exc
    return _names(name, data)


def _names(name: str, data: Any) -> list[str]:
    items = data.get("models" if name == "ollama" else "data") if isinstance(data, dict) else None
    if not isinstance(items, list):
        raise ModelListError("format", "목록이 없다")
    field = "name" if name == "ollama" else "id"
    names = {
        # Gemini 의 OpenAI 호환 목록은 `models/` 를 붙여 내지만 요청에는 붙이지 않는다
        str(item[field]).removeprefix("models/")
        for item in items
        if isinstance(item, dict) and isinstance(item.get(field), str) and item[field]
    }
    return sorted(names)[:MAX_MODELS]
