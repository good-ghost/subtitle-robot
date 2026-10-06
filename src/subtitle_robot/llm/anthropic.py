"""Anthropic Claude 어댑터: Messages API (PROJECT-PLAN §27.1, WI-9.003).

구조화 출력은 출력 스키마를 `input_schema`로 둔 도구 하나를 `tool_choice`로 강제 호출하게 하고,
그 도구 입력을 JSON 본문으로 쓴다. 시스템 프롬프트는 `system` 필드로 보내고 `max_tokens`는 필수다.
`stop_reason = max_tokens`는 다른 공급자의 `finish_reason = length`(잘림)로 본다.
529(과부하)는 5xx 라 지금 재시도 규칙(429·5xx)을 그대로 따른다.
토큰 수는 NIM 과 같이 근사하고 usage 로 보정한다.
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from subtitle_robot.llm.base import ChatRequest, ChatResult, ProviderInfo, ProviderSettings
from subtitle_robot.llm.errors import LlmResponseError
from subtitle_robot.llm.limiter import (
    ConcurrencyGate,
    RateLimiter,
    RetryPolicy,
    Runtime,
    call_with_retry,
)
from subtitle_robot.llm.nim import TokenEstimator
from subtitle_robot.llm.openai_compat import extract_json_text, http_error, inline_schema_refs

ANTHROPIC_VERSION = "2023-06-01"
_HTTP_OK = 200
_HTTP_ERROR_MIN = 400
# 도구 이름 규칙 (^[a-zA-Z0-9_-]{1,64}$) 밖의 글자는 바꾼다
_TOOL_NAME_MAX = 64
_STOP_REASONS = {"max_tokens": "length", "end_turn": "stop", "tool_use": "stop"}


class ClaudeAdapter:
    """Anthropic Messages API 어댑터."""

    provider = "claude"

    def __init__(
        self,
        settings: ProviderSettings,
        *,
        http: httpx.Client | None = None,
        runtime: Runtime | None = None,
        policy: RetryPolicy | None = None,
    ) -> None:
        """어댑터를 만든다. 네트워크 호출은 하지 않는다."""
        self._settings = settings
        self._owns_http = http is None
        self._http = http or httpx.Client()
        self._runtime = runtime or Runtime()
        self._policy = policy or RetryPolicy()
        slots = settings.concurrency if isinstance(settings.concurrency, int) else 1
        self._limiter = RateLimiter(settings.rpm, self._runtime)
        self._gate = ConcurrencyGate(slots)
        self.estimator = TokenEstimator()

    @property
    def root_url(self) -> str:
        """API 루트 (`https://api.anthropic.com`). 설정에 `/v1`을 붙여도 받는다."""
        return self._settings.base_url.rstrip("/").removesuffix("/v1")

    def _headers(self) -> dict[str, str]:
        """인증·버전 헤더. 이 값은 로그·예외에 넣지 않는다."""
        headers = {"anthropic-version": ANTHROPIC_VERSION}
        key = self._settings.api_key
        if key:
            headers["x-api-key"] = key.get_secret_value()
        return headers

    def build_body(self, request: ChatRequest) -> dict[str, Any]:
        """Messages API 요청 본문."""
        system = "\n\n".join(m.content for m in request.messages if m.role == "system")
        body: dict[str, Any] = {
            "model": self._settings.model,
            "max_tokens": request.max_tokens or self._settings.max_output_tokens,
            "messages": [
                {"role": m.role, "content": m.content}
                for m in request.messages
                if m.role != "system"
            ],
        }
        if system:
            body["system"] = system
        temperature = (
            request.temperature if request.temperature is not None else self._settings.temperature
        )
        if temperature is not None:
            body["temperature"] = temperature
        if request.output_schema is not None and self._settings.response_format != "none":
            name = tool_name(request.schema_name)
            body["tools"] = [
                {
                    "name": name,
                    "description": "Return the result. Call this tool exactly once.",
                    "input_schema": inline_schema_refs(request.output_schema),
                }
            ]
            body["tool_choice"] = {"type": "tool", "name": name}
        body.update(self._settings.extra_body)
        return body

    def chat(self, request: ChatRequest) -> ChatResult:
        """요청을 보내고 결과를 해석한다.

        Raises:
            ProviderUnavailableError: 연결·429·5xx(529 포함) 재시도 상한 초과.
            LlmAuthError: 401/403.
            StructuredOutputRejectedError: 도구(구조화 출력) 요청이 400 으로 거부됨.
            LlmHttpError: 그 밖의 HTTP 오류.
            LlmResponseError: 응답 형식 이상.
        """
        body = self.build_body(request)
        url = f"{self.root_url}/v1/messages"
        outcome = call_with_retry(
            lambda: self._http.post(
                url, json=body, headers=self._headers(), timeout=self._settings.timeout_s
            ),
            limiter=self._limiter,
            gate=self._gate,
            policy=self._policy,
            runtime=self._runtime,
            describe="claude chat",
        )
        response = outcome.response
        if response.status_code >= _HTTP_ERROR_MIN:
            raise http_error(response, structured="tools" in body)
        try:
            data = response.json()
        except ValueError as exc:
            raise LlmResponseError("claude: 응답이 JSON 이 아니다") from exc
        result = parse_messages_response(
            data,
            latency_s=outcome.latency_s,
            model=self._settings.model,
            attempts=outcome.attempts,
            retries=outcome.retries,
        )
        if result.prompt_tokens:
            prompt_chars = sum(len(message.content) for message in request.messages)
            self.estimator.observe(prompt_chars, result.prompt_tokens)
        return result

    def describe(self) -> ProviderInfo:
        """공급자 정보. 컨텍스트는 설정값(`context_tokens`)이고 없으면 모른다(기본값)."""
        model = self._settings.model
        return ProviderInfo(
            provider=self.provider,
            base_url=self.root_url,
            model=model,
            model_label=model,
            context_tokens=self._settings.context_tokens,
        )

    def count_tokens(self, text: str) -> int:
        """근사 토큰 수."""
        return self.estimator.estimate(text)

    def health_check(self) -> bool:
        """`/v1/models` 가 200 이면 요청을 받을 수 있다고 본다."""
        try:
            response = self._http.get(
                f"{self.root_url}/v1/models", headers=self._headers(), timeout=10.0
            )
        except httpx.TransportError:
            return False
        return response.status_code == _HTTP_OK

    def close(self) -> None:
        """직접 만든 httpx 클라이언트를 닫는다."""
        if self._owns_http:
            self._http.close()


def tool_name(schema_name: str) -> str:
    """스키마 이름을 도구 이름 규칙에 맞춘다."""
    cleaned = "".join(
        ch if ch.isascii() and (ch.isalnum() or ch in "_-") else "_" for ch in schema_name
    )
    return (cleaned or "output")[:_TOOL_NAME_MAX]


def parse_messages_response(
    data: Any, *, latency_s: float, model: str, attempts: int, retries: int
) -> ChatResult:
    """Messages API 응답을 해석한다. 도구 호출이 있으면 그 입력이 JSON 본문이다.

    Raises:
        LlmResponseError: content 가 없거나 비어 있다.
    """
    blocks = data.get("content") if isinstance(data, dict) else None
    if not isinstance(blocks, list) or not blocks:
        raise LlmResponseError("claude: 응답에 content 가 없다")
    tool = next((b for b in blocks if isinstance(b, dict) and b.get("type") == "tool_use"), None)
    if tool is not None:
        content = json.dumps(tool.get("input") or {}, ensure_ascii=False)
        json_text = content
    else:
        content = "".join(
            str(b.get("text", ""))
            for b in blocks
            if isinstance(b, dict) and b.get("type") == "text"
        )
        if not content.strip():
            raise LlmResponseError(
                f"claude: 응답 본문이 비어 있다 (stop_reason={data.get('stop_reason')})"
            )
        json_text = extract_json_text(content)
    stop_reason = data.get("stop_reason")
    usage = data.get("usage") or {}
    return ChatResult(
        content=content,
        json_text=json_text,
        finish_reason=_STOP_REASONS.get(str(stop_reason), stop_reason),
        prompt_tokens=usage.get("input_tokens"),
        completion_tokens=usage.get("output_tokens"),
        reasoning_tokens=None,
        latency_s=latency_s,
        model=model,
        attempts=attempts,
        retries=retries,
    )
