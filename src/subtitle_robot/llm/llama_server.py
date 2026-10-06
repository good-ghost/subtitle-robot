"""로컬 llama.cpp `llama-server` 어댑터 (PROJECT-PLAN §6.1~§6.4, WI-1.011).

llama-server 는 이 도구가 띄우지 않는다 (§22). 첫 사용 때 `/health`, `/props`, `/v1/models` 를 읽어
컨텍스트·슬롯·실제 모델을 알아낸다. 모델 로딩 중(503)에는 실패로 세지 않고 기다린다.
"""

from __future__ import annotations

import logging
import threading
from pathlib import PurePosixPath
from typing import Any

import httpx

from subtitle_robot.llm.base import ChatRequest, ChatResult, ProviderInfo, ProviderSettings
from subtitle_robot.llm.errors import (
    LlmHttpError,
    LlmResponseError,
    NotLlamaServerError,
    ProviderUnavailableError,
)
from subtitle_robot.llm.limiter import Outcome, RetryPolicy, Runtime, default_classifier
from subtitle_robot.llm.openai_compat import OpenAICompatClient

logger = logging.getLogger(__name__)

THINKING_OFF = {"chat_template_kwargs": {"enable_thinking": False}}
LOCAL_DEFAULT_TIMEOUT_S = 600.0
_HTTP_OK = 200
_HTTP_UNAVAILABLE = 503


def llama_classifier(response: httpx.Response) -> Outcome:
    """503 은 모델 로딩 중이므로 시도 횟수에 넣지 않고 기다린다 (§6.3)."""
    if response.status_code == _HTTP_UNAVAILABLE:
        return Outcome.WAIT
    return default_classifier(response)


class LlamaServerAdapter:
    """llama-server 어댑터."""

    provider = "local"

    def __init__(
        self,
        settings: ProviderSettings,
        *,
        http: httpx.Client | None = None,
        runtime: Runtime | None = None,
        policy: RetryPolicy | None = None,
    ) -> None:
        """어댑터를 만든다. 네트워크 호출은 첫 사용(`connect`) 때 한다."""
        self._settings = settings
        self._runtime = runtime or Runtime()
        self._policy = policy or RetryPolicy()
        self._client = OpenAICompatClient(
            settings,
            http=http,
            runtime=self._runtime,
            policy=self._policy,
            classify=llama_classifier,
            concurrency=1,
            name="llama-server",
        )
        self._info: ProviderInfo | None = None
        self._lock = threading.Lock()

    @property
    def root_url(self) -> str:
        """`/v1` 을 뺀 서버 루트 (`/health`, `/props`, `/tokenize` 가 여기 있다)."""
        return self._client.base_url.removesuffix("/v1")

    def connect(self) -> ProviderInfo:
        """서버 상태를 확인하고 모델·컨텍스트·슬롯을 읽는다. 결과는 캐시한다.

        Raises:
            NotLlamaServerError: 다른 서비스가 응답한다.
            ProviderUnavailableError: 연결할 수 없거나 로딩 대기가 상한을 넘었다.
        """
        with self._lock:
            if self._info is None:
                self._info = self._probe()
                self._client.model = self._info.model
                self._client.set_concurrency(self._concurrency(self._info))
            return self._info

    def chat(self, request: ChatRequest) -> ChatResult:
        """요청을 보낸다. 처음이면 먼저 `connect` 한다."""
        self.connect()
        return self._client.chat(request)

    def describe(self) -> ProviderInfo:
        """공급자 정보 (`connect` 결과)."""
        return self.connect()

    def count_tokens(self, text: str) -> int:
        """`/tokenize` 로 정확한 토큰 수를 센다.

        Raises:
            LlmHttpError: `/tokenize` 가 실패했다.
        """
        if not text:
            return 0
        self.connect()
        response = self._post(f"{self.root_url}/tokenize", {"content": text})
        if response.status_code != _HTTP_OK:
            raise LlmHttpError(response.status_code, f"/tokenize 실패: {response.text[:200]}")
        tokens = _json(response).get("tokens")
        if not isinstance(tokens, list):
            raise LlmResponseError("/tokenize 응답에 tokens 목록이 없다")
        return len(tokens)

    def health_check(self) -> bool:
        """`/health` 가 llama-server 형식으로 200 이면 요청을 받을 수 있다."""
        try:
            response = self._client.get(f"{self.root_url}/health")
        except httpx.TransportError:
            return False
        return response.status_code == _HTTP_OK and _is_llama_health(response)

    def close(self) -> None:
        """HTTP 연결을 닫는다."""
        self._client.close()

    # ---------------------------------------------------------------- 내부

    def _probe(self) -> ProviderInfo:
        self._wait_until_loaded()
        props = _json(self._get(f"{self.root_url}/props"))
        generation = props.get("default_generation_settings") or {}
        # llama-server 는 default_generation_settings.n_ctx 에 슬롯 하나의 컨텍스트를 준다
        context = _int_or_none(generation.get("n_ctx"))
        slots = _int_or_none(props.get("total_slots"))
        model_path = str(props.get("model_path") or "")
        served = [
            str(item.get("id"))
            for item in _json(self._get(f"{self._client.base_url}/models")).get("data", [])
        ]

        expected = self._settings.model
        if expected in served:
            request_model = expected
        elif served:
            # --alias 없이 띄우면 id 가 GGUF 전체 경로다 (M0 실측)
            request_model = served[0]
        else:
            request_model = expected
        label = PurePosixPath(model_path).stem if model_path else request_model
        notes: list[str] = []
        if expected not in {label, request_model, PurePosixPath(request_model).stem}:
            notes.append(f"설정 모델 {expected} 과 서버에 로드된 모델 {label} 이 다르다")
            logger.warning("llama-server model mismatch: expected=%s actual=%s", expected, label)
        return ProviderInfo(
            provider=self.provider,
            base_url=self._client.base_url,
            model=request_model,
            model_label=label,
            context_tokens=context,
            slots=slots,
            notes=tuple(notes),
        )

    def _wait_until_loaded(self) -> None:
        waited = 0.0
        while True:
            response = self._get(f"{self.root_url}/health")
            if not _is_llama_health(response):
                raise NotLlamaServerError(
                    f"{self.root_url} 의 /health 응답이 llama-server 형식이 아니다 "
                    f"(HTTP {response.status_code}). 주소·포트를 확인해야 한다"
                )
            if response.status_code == _HTTP_OK:
                return
            if response.status_code != _HTTP_UNAVAILABLE or waited >= self._policy.wait_max_s:
                raise ProviderUnavailableError(
                    f"llama-server 가 준비되지 않았다 "
                    f"(HTTP {response.status_code}, {waited:.0f}초 대기)"
                )
            self._runtime.sleep(self._policy.wait_poll_s)
            waited += self._policy.wait_poll_s

    def _concurrency(self, info: ProviderInfo) -> int:
        configured = self._settings.concurrency
        if isinstance(configured, int):
            return configured
        return info.slots or 1

    def _get(self, url: str) -> httpx.Response:
        try:
            return self._client.get(url)
        except httpx.TransportError as exc:
            raise ProviderUnavailableError(
                f"llama-server 에 연결할 수 없다: {self.root_url} ({type(exc).__name__})"
            ) from exc

    def _post(self, url: str, payload: dict[str, Any]) -> httpx.Response:
        try:
            return self._client.post_json(url, payload)
        except httpx.TransportError as exc:
            raise ProviderUnavailableError(
                f"llama-server 에 연결할 수 없다: {self.root_url} ({type(exc).__name__})"
            ) from exc


def _is_llama_health(response: httpx.Response) -> bool:
    """llama-server `/health` 는 JSON 이고 `status` 또는 `error` 키를 가진다."""
    try:
        body = response.json()
    except ValueError:
        return False
    return isinstance(body, dict) and ("status" in body or "error" in body)


def _json(response: httpx.Response) -> dict[str, Any]:
    try:
        body = response.json()
    except ValueError as exc:
        raise LlmResponseError(f"llama-server 응답이 JSON 이 아니다: {response.url}") from exc
    if not isinstance(body, dict):
        raise LlmResponseError(f"llama-server 응답 형식이 다르다: {response.url}")
    return body


def _int_or_none(value: object) -> int | None:
    return value if isinstance(value, int) and not isinstance(value, bool) else None
