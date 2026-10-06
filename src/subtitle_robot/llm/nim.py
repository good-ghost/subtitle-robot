"""NVIDIA NIM 어댑터 (PROJECT-PLAN §6.1~§6.3, WI-1.010).

기본값은 M0 실측으로 정했다: deepseek-v4.1-flash, json_schema 출력, thinking 끔.
NIM 은 토큰 수를 셀 엔드포인트가 없어 문자/토큰 비율로 근사하고, 응답 usage 로 비율을 보정한다.
"""

from __future__ import annotations

import math
import threading

import httpx
from pydantic import SecretStr

from subtitle_robot.llm.base import ChatRequest, ChatResult, ProviderInfo, ProviderSettings
from subtitle_robot.llm.limiter import RetryPolicy, Runtime
from subtitle_robot.llm.openai_compat import OpenAICompatClient

NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"
NIM_DEFAULT_MODEL = "deepseek-ai/deepseek-v4.1-flash"
NIM_DEFAULT_RPM = 30
# 요청 하나의 제한 시간. 무료 엔드포인트가 혼잡하면 작은 요청도 54초, 큰 배치는 120초를 넘었다
# (2026-10-03 실사용 테스트, 사용자 결정으로 120 → 300초)
NIM_DEFAULT_TIMEOUT_S = 300.0
THINKING_OFF = {"chat_template_kwargs": {"enable_thinking": False}}
# M0 실측 프롬프트 문자/토큰: en 약 3.0, ja 약 2.5. 작은 쪽을 써서 토큰을 넉넉히 잡는다
DEFAULT_CHARS_PER_TOKEN = 2.5
_HTTP_OK = 200


def nim_default_settings(api_key: SecretStr | None = None) -> ProviderSettings:
    """PROJECT-PLAN v5.4 §6.1 의 NIM 기본 설정."""
    return ProviderSettings(
        base_url=NIM_BASE_URL,
        model=NIM_DEFAULT_MODEL,
        api_key=api_key,
        rpm=NIM_DEFAULT_RPM,
        concurrency=1,
        timeout_s=NIM_DEFAULT_TIMEOUT_S,
        temperature=0.2,
        response_format="json_schema",
        extra_body=THINKING_OFF,
    )


class TokenEstimator:
    """문자 수로 토큰 수를 근사한다. 실제 usage 를 관측할수록 비율을 보정한다 (§6.4)."""

    def __init__(self, default_chars_per_token: float = DEFAULT_CHARS_PER_TOKEN) -> None:
        self._default = default_chars_per_token
        self._chars = 0
        self._tokens = 0
        self._lock = threading.Lock()

    @property
    def chars_per_token(self) -> float:
        """현재 비율. 관측이 없으면 기본값."""
        with self._lock:
            return self._chars / self._tokens if self._tokens else self._default

    def observe(self, chars: int, tokens: int) -> None:
        """요청 하나의 프롬프트 문자 수와 실제 프롬프트 토큰 수를 기록한다."""
        if chars <= 0 or tokens <= 0:
            return
        with self._lock:
            self._chars += chars
            self._tokens += tokens

    def estimate(self, text: str) -> int:
        """근사 토큰 수 (올림)."""
        return math.ceil(len(text) / self.chars_per_token) if text else 0


class NimAdapter:
    """NVIDIA NIM Cloud 어댑터."""

    provider = "nim"

    def __init__(
        self,
        settings: ProviderSettings,
        *,
        http: httpx.Client | None = None,
        runtime: Runtime | None = None,
        policy: RetryPolicy | None = None,
    ) -> None:
        """어댑터를 만든다. 네트워크 호출은 하지 않는다."""
        self._client = OpenAICompatClient(
            settings, http=http, runtime=runtime, policy=policy, name="nim"
        )
        self.estimator = TokenEstimator()

    def chat(self, request: ChatRequest) -> ChatResult:
        """요청을 보내고, 성공하면 usage 로 토큰 근사 비율을 보정한다."""
        result = self._client.chat(request)
        if result.prompt_tokens:
            prompt_chars = sum(len(message.content) for message in request.messages)
            self.estimator.observe(prompt_chars, result.prompt_tokens)
        return result

    def describe(self) -> ProviderInfo:
        """공급자 정보. NIM 은 컨텍스트 크기를 API 로 알려주지 않는다 (모델별 설정은 M6)."""
        model = self._client.model
        return ProviderInfo(
            provider=self.provider, base_url=self._client.base_url, model=model, model_label=model
        )

    def count_tokens(self, text: str) -> int:
        """근사 토큰 수."""
        return self.estimator.estimate(text)

    def health_check(self) -> bool:
        """`/models` 가 200 이면 요청을 받을 수 있다고 본다."""
        try:
            return self._client.get("models").status_code == _HTTP_OK
        except httpx.TransportError:
            return False

    def close(self) -> None:
        """HTTP 연결을 닫는다."""
        self._client.close()
