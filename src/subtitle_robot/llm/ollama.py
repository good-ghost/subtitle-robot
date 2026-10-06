"""Ollama 어댑터: 고유 API `/api/chat` (PROJECT-PLAN §27.1, WI-9.004).

Ollama 의 OpenAI 호환 엔드포인트로는 컨텍스트 길이(`num_ctx`)를 정할 수 없어,
모델 기본값(2048~4096)을 넘는 배치 앞부분이 조용히 잘린다. 그래서 고유 API 로 `options.num_ctx`를
보낸다. 처음 쓸 때 `/api/show`로 모델의 최대 컨텍스트를 읽어 설정값(`context_tokens`)이 그보다 크면
줄인다. 구조화 출력은 `format`에 JSON schema 를 준다.
생각(thinking) 모델은 설정 `extra_body`에 `think = false`를 넣어 끈다
(생각을 지원하지 않는 모델에 보내면 거절하는 버전이 있어 기본으로 넣지 않는다).
"""

from __future__ import annotations

import logging
import threading
from typing import Any

import httpx

from subtitle_robot.llm.base import ChatRequest, ChatResult, ProviderInfo, ProviderSettings
from subtitle_robot.llm.catalog import OLLAMA_DEFAULT_CONTEXT
from subtitle_robot.llm.errors import LlmResponseError, ReasoningOnlyResponseError
from subtitle_robot.llm.limiter import (
    ConcurrencyGate,
    RateLimiter,
    RetryPolicy,
    Runtime,
    call_with_retry,
)
from subtitle_robot.llm.nim import TokenEstimator
from subtitle_robot.llm.openai_compat import extract_json_text, http_error, inline_schema_refs

logger = logging.getLogger(__name__)

_HTTP_OK = 200
_HTTP_ERROR_MIN = 400
_CONTEXT_KEY_SUFFIX = ".context_length"


class OllamaAdapter:
    """Ollama `/api/chat` 어댑터."""

    provider = "ollama"

    def __init__(
        self,
        settings: ProviderSettings,
        *,
        http: httpx.Client | None = None,
        runtime: Runtime | None = None,
        policy: RetryPolicy | None = None,
    ) -> None:
        """어댑터를 만든다. 네트워크 호출은 첫 사용 때 한다."""
        self._settings = settings
        self._owns_http = http is None
        self._http = http or httpx.Client()
        self._runtime = runtime or Runtime()
        self._policy = policy or RetryPolicy()
        slots = settings.concurrency if isinstance(settings.concurrency, int) else 1
        self._limiter = RateLimiter(settings.rpm, self._runtime)
        self._gate = ConcurrencyGate(slots)
        self.estimator = TokenEstimator()
        self._num_ctx: int | None = None
        self._lock = threading.Lock()

    @property
    def root_url(self) -> str:
        """서버 루트 (`http://127.0.0.1:11434`). 설정에 `/v1`·`/api`가 붙어 있어도 받는다."""
        return self._settings.base_url.rstrip("/").removesuffix("/v1").removesuffix("/api")

    def _headers(self) -> dict[str, str]:
        """인증 헤더 (프록시 뒤 Ollama). 이 값은 로그·예외에 넣지 않는다."""
        key = self._settings.api_key
        return {"Authorization": f"Bearer {key.get_secret_value()}"} if key else {}

    def num_ctx(self) -> int:
        """요청에 쓸 컨텍스트 길이: 설정값(기본 8192)과 모델 최대값 중 작은 쪽. 결과는 캐시한다."""
        with self._lock:
            if self._num_ctx is None:
                wanted = self._settings.context_tokens or OLLAMA_DEFAULT_CONTEXT
                limit = self._model_context()
                self._num_ctx = min(wanted, limit) if limit else wanted
                if limit and limit < wanted:
                    logger.info("ollama context %d reduced to model maximum %d", wanted, limit)
            return self._num_ctx

    def _model_context(self) -> int | None:
        """`/api/show`의 모델 최대 컨텍스트. 읽을 수 없으면 None (설정값을 그대로 쓴다)."""
        try:
            response = self._http.post(
                f"{self.root_url}/api/show",
                json={"model": self._settings.model},
                headers=self._headers(),
                timeout=30.0,
            )
        except httpx.TransportError as exc:
            logger.warning("ollama /api/show failed: %s", exc)
            return None
        if response.status_code != _HTTP_OK:
            logger.warning("ollama /api/show HTTP %d", response.status_code)
            return None
        try:
            info = response.json().get("model_info") or {}
        except (ValueError, AttributeError):
            return None
        lengths = [
            value
            for key, value in info.items()
            if key.endswith(_CONTEXT_KEY_SUFFIX) and isinstance(value, int) and value > 0
        ]
        return min(lengths) if lengths else None

    def build_body(self, request: ChatRequest) -> dict[str, Any]:
        """`/api/chat` 요청 본문."""
        options: dict[str, Any] = {
            "num_ctx": self.num_ctx(),
            "num_predict": request.max_tokens or self._settings.max_output_tokens,
        }
        temperature = (
            request.temperature if request.temperature is not None else self._settings.temperature
        )
        if temperature is not None:
            options["temperature"] = temperature
        body: dict[str, Any] = {
            "model": self._settings.model,
            "messages": [message.model_dump() for message in request.messages],
            "stream": False,
            "options": options,
        }
        mode = self._settings.response_format
        if request.output_schema is not None and mode == "json_schema":
            body["format"] = inline_schema_refs(request.output_schema)
        elif request.output_schema is not None and mode == "json_object":
            body["format"] = "json"
        body.update(self._settings.extra_body)
        return body

    def chat(self, request: ChatRequest) -> ChatResult:
        """요청을 보내고 결과를 해석한다.

        Raises:
            ProviderUnavailableError: 연결 거부·5xx 재시도 상한 초과.
            LlmAuthError: 401/403 (프록시).
            StructuredOutputRejectedError: `format` 요청이 400 으로 거부됨.
            LlmHttpError: 그 밖의 HTTP 오류 (없는 모델 404 등).
            LlmResponseError: 응답 형식 이상.
        """
        body = self.build_body(request)
        url = f"{self.root_url}/api/chat"
        outcome = call_with_retry(
            lambda: self._http.post(
                url, json=body, headers=self._headers(), timeout=self._settings.timeout_s
            ),
            limiter=self._limiter,
            gate=self._gate,
            policy=self._policy,
            runtime=self._runtime,
            describe="ollama chat",
        )
        response = outcome.response
        if response.status_code >= _HTTP_ERROR_MIN:
            raise http_error(response, structured="format" in body)
        try:
            data = response.json()
        except ValueError as exc:
            raise LlmResponseError("ollama: 응답이 JSON 이 아니다") from exc
        result = parse_ollama_response(
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
        """공급자 정보. 컨텍스트는 실제로 보내는 `num_ctx`."""
        model = self._settings.model
        return ProviderInfo(
            provider=self.provider,
            base_url=self.root_url,
            model=model,
            model_label=model,
            context_tokens=self.num_ctx(),
        )

    def count_tokens(self, text: str) -> int:
        """근사 토큰 수 (응답의 prompt_eval_count 로 보정)."""
        return self.estimator.estimate(text)

    def health_check(self) -> bool:
        """`/api/version` 이 200 이면 요청을 받을 수 있다고 본다."""
        try:
            response = self._http.get(
                f"{self.root_url}/api/version", headers=self._headers(), timeout=10.0
            )
        except httpx.TransportError:
            return False
        return response.status_code == _HTTP_OK

    def close(self) -> None:
        """직접 만든 httpx 클라이언트를 닫는다."""
        if self._owns_http:
            self._http.close()


def parse_ollama_response(
    data: Any, *, latency_s: float, model: str, attempts: int, retries: int
) -> ChatResult:
    """`/api/chat` 응답을 해석한다.

    Raises:
        ReasoningOnlyResponseError: content 가 비고 thinking 에만 답이 왔다.
        LlmResponseError: message 가 없거나 본문이 비어 있다.
    """
    message = data.get("message") if isinstance(data, dict) else None
    if not isinstance(message, dict):
        raise LlmResponseError("ollama: 응답에 message 가 없다")
    content = str(message.get("content") or "")
    if not content.strip():
        if str(message.get("thinking") or "").strip():
            raise ReasoningOnlyResponseError(
                "ollama: content 가 비고 thinking 에만 답이 왔다. 공급자 설정 extra_body 에 "
                "think = false 를 넣어야 한다"
            )
        raise LlmResponseError(
            f"ollama: 응답 본문이 비어 있다 (done_reason={data.get('done_reason')})"
        )
    return ChatResult(
        content=content,
        json_text=extract_json_text(content),
        finish_reason=data.get("done_reason"),
        prompt_tokens=data.get("prompt_eval_count"),
        completion_tokens=data.get("eval_count"),
        reasoning_tokens=None,
        latency_s=latency_s,
        model=model,
        attempts=attempts,
        retries=retries,
    )
