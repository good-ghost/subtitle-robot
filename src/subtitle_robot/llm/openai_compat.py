"""OpenAI-compatible `/chat/completions` 클라이언트 (PROJECT-PLAN §6.1, §6.5, WI-1.008).

요청 조립·재시도·응답 해석·오류 분류를 맡는다. 공급자 어댑터는 이 클라이언트를 감싸 기본값과
공급자 고유 엔드포인트만 더한다.
"""

from __future__ import annotations

import re
from typing import Any

import httpx

from subtitle_robot.llm.base import ChatRequest, ChatResult, ProviderSettings
from subtitle_robot.llm.errors import (
    LlmAuthError,
    LlmHttpError,
    LlmResponseError,
    ReasoningOnlyResponseError,
    StructuredOutputRejectedError,
)
from subtitle_robot.llm.limiter import (
    Classifier,
    ConcurrencyGate,
    RateLimiter,
    RetryPolicy,
    Runtime,
    call_with_retry,
    default_classifier,
)

_THINK_BLOCK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)
_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL)
_HTTP_UNAUTHORIZED = 401
_HTTP_FORBIDDEN = 403
_HTTP_BAD_REQUEST = 400
_HTTP_UNPROCESSABLE = 422
_HTTP_ERROR_MIN = 400
_ERROR_SNIPPET_CHARS = 300


def inline_schema_refs(schema: dict[str, Any]) -> dict[str, Any]:
    """`$ref`/`$defs` 를 펼친 스키마. 일부 서버의 문법 변환기가 `$ref` 를 처리하지 못한다 (§6.5)."""
    defs: dict[str, Any] = schema.get("$defs", {})

    def walk(node: Any) -> Any:
        if isinstance(node, dict):
            if "$ref" in node:
                return walk(defs[node["$ref"].rsplit("/", 1)[-1]])
            return {key: walk(value) for key, value in node.items() if key != "$defs"}
        if isinstance(node, list):
            return [walk(item) for item in node]
        return node

    result: dict[str, Any] = walk(schema)
    return result


def extract_json_text(content: str) -> str:
    """본문에서 JSON 부분만 남긴다: `<think>` 블록, 코드펜스, 앞뒤 설명을 걷어 낸다."""
    text = _THINK_BLOCK_RE.sub("", content)
    if "</think>" in text:  # 여는 태그가 템플릿에 들어가 닫는 태그만 오는 경우
        text = text.rsplit("</think>", 1)[1]
    fence = _FENCE_RE.search(text)
    if fence:
        text = fence.group(1)
    first, last = text.find("{"), text.rfind("}")
    if first != -1 and last > first:
        text = text[first : last + 1]
    return text.strip()


class OpenAICompatClient:
    """OpenAI-compatible chat 클라이언트 하나 (공급자 하나에 하나, 프로세스 안에서 공유)."""

    def __init__(
        self,
        settings: ProviderSettings,
        *,
        http: httpx.Client | None = None,
        runtime: Runtime | None = None,
        policy: RetryPolicy | None = None,
        classify: Classifier = default_classifier,
        concurrency: int | None = None,
        name: str = "llm",
        max_tokens_field: str = "max_tokens",
        extra_headers: dict[str, str] | None = None,
    ) -> None:
        """클라이언트를 만든다.

        Args:
            settings: 공급자 설정.
            http: 공유할 httpx 클라이언트. 없으면 만든다 (`close()` 로 닫음).
            runtime: 시간 의존성 (테스트용).
            policy: 재시도 정책.
            classify: 응답 분류기.
            concurrency: 동시 요청 수. 설정이 `auto` 일 때 어댑터가 알아낸 값을 준다.
            name: 오류 메시지에 쓸 공급자 이름.
            max_tokens_field: 출력 상한 필드 이름 (OpenAI 최신 모델은 `max_completion_tokens`).
            extra_headers: 인증 외에 늘 보낼 헤더 (OpenRouter 앱 표시 등).
        """
        self.settings = settings
        self.name = name
        self.max_tokens_field = max_tokens_field
        self._extra_headers = dict(extra_headers or {})
        self.model = settings.model
        self._owns_http = http is None
        self._http = http or httpx.Client()
        self._runtime = runtime or Runtime()
        self._policy = policy or RetryPolicy()
        self._classify = classify
        slots = concurrency or (
            settings.concurrency if isinstance(settings.concurrency, int) else 1
        )
        self._limiter = RateLimiter(settings.rpm, self._runtime)
        self._gate = ConcurrencyGate(slots)

    @property
    def base_url(self) -> str:
        """`…/v1` 형태의 기준 URL (끝 슬래시 없음)."""
        return self.settings.base_url.rstrip("/")

    def auth_headers(self) -> dict[str, str]:
        """인증 헤더. 이 값은 로그·예외에 넣지 않는다."""
        key = self.settings.api_key
        headers = dict(self._extra_headers)
        if key:
            headers["Authorization"] = f"Bearer {key.get_secret_value()}"
        return headers

    def build_body(self, request: ChatRequest) -> dict[str, Any]:
        """요청 본문을 만든다."""
        body: dict[str, Any] = {
            "model": self.model,
            "messages": [message.model_dump() for message in request.messages],
        }
        temperature = (
            request.temperature if request.temperature is not None else self.settings.temperature
        )
        # 키 순서는 0.7.0 전 본문과 같게 둔다 (temperature 가 없는 공급자만 빠진다)
        if temperature is not None:
            body["temperature"] = temperature
        body[self.max_tokens_field] = request.max_tokens or self.settings.max_output_tokens
        body["stream"] = False
        mode = self.settings.response_format
        if request.output_schema is not None and mode == "json_schema":
            body["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "name": request.schema_name,
                    "schema": inline_schema_refs(request.output_schema),
                },
            }
        elif request.output_schema is not None and mode == "json_object":
            body["response_format"] = {"type": "json_object"}
        body.update(self.settings.extra_body)
        return body

    def chat(self, request: ChatRequest) -> ChatResult:
        """요청을 보내고 결과를 해석한다.

        Raises:
            ProviderUnavailableError: 연결·429·5xx 재시도 상한 초과.
            LlmAuthError: 401/403.
            StructuredOutputRejectedError: 구조화 출력 요청이 400/422 로 거부됨.
            LlmHttpError: 그 밖의 HTTP 오류.
            ReasoningOnlyResponseError: content 가 비고 reasoning 만 옴.
            LlmResponseError: 응답 형식 이상.
        """
        body = self.build_body(request)
        url = f"{self.base_url}/chat/completions"
        outcome = call_with_retry(
            lambda: self._http.post(
                url, json=body, headers=self.auth_headers(), timeout=self.settings.timeout_s
            ),
            limiter=self._limiter,
            gate=self._gate,
            policy=self._policy,
            runtime=self._runtime,
            classify=self._classify,
            describe=f"{self.name} chat",
        )
        response = outcome.response
        if response.status_code >= _HTTP_ERROR_MIN:
            raise http_error(response, structured="response_format" in body)
        try:
            data = response.json()
        except ValueError as exc:
            raise LlmResponseError(f"{self.name}: 응답이 JSON 이 아니다") from exc
        return parse_chat_response(
            data,
            latency_s=outcome.latency_s,
            model=self.model,
            attempts=outcome.attempts,
            retries=outcome.retries,
            name=self.name,
        )

    def get(self, path: str, *, timeout_s: float = 10.0) -> httpx.Response:
        """보조 엔드포인트 GET (재시도 없음). `path` 는 base_url 기준 상대 경로 또는 절대 URL."""
        url = path if path.startswith("http") else f"{self.base_url}/{path.lstrip('/')}"
        return self._http.get(url, headers=self.auth_headers(), timeout=timeout_s)

    def post_json(
        self, url: str, payload: dict[str, Any], *, timeout_s: float = 30.0
    ) -> httpx.Response:
        """보조 엔드포인트 POST (재시도 없음)."""
        return self._http.post(url, json=payload, headers=self.auth_headers(), timeout=timeout_s)

    def set_concurrency(self, slots: int) -> None:
        """동시 요청 수를 바꾼다 (llama-server 슬롯 수를 알아낸 뒤)."""
        self._gate = ConcurrencyGate(slots)

    @property
    def concurrency(self) -> int:
        """현재 동시 요청 상한."""
        return self._gate.limit

    def close(self) -> None:
        """직접 만든 httpx 클라이언트를 닫는다."""
        if self._owns_http:
            self._http.close()


def parse_chat_response(
    data: Any,
    *,
    latency_s: float,
    model: str,
    attempts: int,
    retries: int,
    name: str = "llm",
) -> ChatResult:
    """`/chat/completions` 응답 JSON 을 해석한다.

    Raises:
        ReasoningOnlyResponseError: content 가 비고 reasoning 필드에만 답이 왔다.
        LlmResponseError: choices 가 없거나 본문이 비어 있다.
    """
    choices = data.get("choices") if isinstance(data, dict) else None
    if not choices:
        raise LlmResponseError(f"{name}: 응답에 choices 가 없다")
    choice = choices[0]
    message = choice.get("message") or {}
    content = message.get("content") or ""
    reasoning = message.get("reasoning_content") or message.get("reasoning") or ""
    if not content.strip():
        if reasoning.strip():
            raise ReasoningOnlyResponseError(
                f"{name}: content 가 비고 reasoning 필드에만 답이 왔다. 공급자 설정 extra_body 에 "
                "chat_template_kwargs.enable_thinking = false 가 있는지 확인해야 한다"
            )
        raise LlmResponseError(
            f"{name}: 응답 본문이 비어 있다 (finish_reason={choice.get('finish_reason')})"
        )

    usage = data.get("usage") or {}
    details = usage.get("completion_tokens_details") or {}
    return ChatResult(
        content=content,
        json_text=extract_json_text(content),
        finish_reason=choice.get("finish_reason"),
        prompt_tokens=usage.get("prompt_tokens"),
        completion_tokens=usage.get("completion_tokens"),
        reasoning_tokens=details.get("reasoning_tokens"),
        latency_s=latency_s,
        model=model,
        attempts=attempts,
        retries=retries,
    )


def http_error(response: httpx.Response, *, structured: bool) -> LlmHttpError:
    """HTTP 오류 응답을 분류한다 (Claude 어댑터도 같은 규칙을 쓴다)."""
    status = response.status_code
    snippet = response.text[:_ERROR_SNIPPET_CHARS]
    if status in (_HTTP_UNAUTHORIZED, _HTTP_FORBIDDEN):
        return LlmAuthError(status, "인증 실패. 웹 Settings 의 키 탭에서 API 키를 확인한다")
    if structured and status in (_HTTP_BAD_REQUEST, _HTTP_UNPROCESSABLE):
        return StructuredOutputRejectedError(status, f"구조화 출력 요청 거부: {snippet}")
    return LlmHttpError(status, snippet)
