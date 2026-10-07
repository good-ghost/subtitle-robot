"""OpenAI 호환 클라우드 공급자: OpenAI(ChatGPT), OpenRouter, Gemini (PROJECT-PLAN §27.1, WI-9.002).

세 공급자 모두 `/chat/completions`와 `response_format` json_schema 를 받는다.
공급자별 차이는 출력 상한 필드 이름(OpenAI 최신 모델은 `max_completion_tokens`)과
앱 표시 헤더(OpenRouter)뿐이다.
토큰 수를 셀 엔드포인트가 없어 NIM 과 같이 문자 수로 근사하고 응답 usage 로 보정한다.
"""

from __future__ import annotations

import logging
import re
import threading
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

import httpx

from subtitle_robot.llm.base import ChatRequest, ChatResult, ProviderInfo, ProviderSettings
from subtitle_robot.llm.errors import ProviderUnavailableError
from subtitle_robot.llm.limiter import Outcome, RetryPolicy, Runtime, default_classifier
from subtitle_robot.llm.nim import TokenEstimator
from subtitle_robot.llm.openai_compat import OpenAICompatClient

logger = logging.getLogger(__name__)

_HTTP_OK = 200
_HTTP_PAYMENT_REQUIRED = 402
_HTTP_TOO_MANY_REQUESTS = 429
# 결제·크레딧 문제는 충전·결제 전에는 풀리지 않는다 (WI-10.009n): 재시도하지 않고 재기동할 때까지
# 대기열을 멈춘다. Gemini 선불 크레딧 소진·OpenRouter 크레딧 부족은 402,
# OpenAI 는 429 insufficient_quota
_INSUFFICIENT_QUOTA = '"insufficient_quota"'
_BILLING_SNIPPET_CHARS = 200
# Gemini 하루 요청 한도(RPD)는 태평양 시간 자정에 초기화된다
# (https://ai.google.dev/gemini-api/docs/rate-limits). 분당 한도의 429 는 지금처럼 재시도하고,
# 하루 한도의 429 만 초기화 시각까지 대기열을 멈춘다 (WI-10.009m)
GEMINI_QUOTA_TZ = ZoneInfo("America/Los_Angeles")
# 429 본문(google.rpc.QuotaFailure)의 quotaId, 예: GenerateRequestsPerDayPerProjectPerModel-FreeTier
_PER_DAY_QUOTA_RE = re.compile(r'"quotaId"\s*:\s*"[^"]*PerDay', re.IGNORECASE)
# 초기화 직후의 시계 차이를 피하는 여유
_QUOTA_RESET_MARGIN = timedelta(minutes=1)


def gemini_daily_quota_exceeded(response: httpx.Response) -> bool:
    """Gemini 의 하루 요청 한도 초과 응답인지 (429 + 하루 단위 quotaId)."""
    return response.status_code == _HTTP_TOO_MANY_REQUESTS and bool(
        _PER_DAY_QUOTA_RE.search(response.text)
    )


def next_gemini_quota_reset(now: datetime) -> datetime:
    """다음 태평양 시간 자정 (UTC). 서머타임을 따른다."""
    local = now.astimezone(GEMINI_QUOTA_TZ)
    midnight = datetime.combine(local.date() + timedelta(days=1), time(), tzinfo=GEMINI_QUOTA_TZ)
    return midnight.astimezone(now.tzinfo) + _QUOTA_RESET_MARGIN


def billing_problem(response: httpx.Response) -> bool:
    """크레딧 소진·결제 필요 응답인지 (402, OpenAI 의 429 insufficient_quota)."""
    if response.status_code == _HTTP_PAYMENT_REQUIRED:
        return True
    return response.status_code == _HTTP_TOO_MANY_REQUESTS and _INSUFFICIENT_QUOTA in response.text


# OpenRouter 가 요청을 보낸 앱을 표시하는 헤더 (선택, https://openrouter.ai/docs)
APP_TITLE = "Subtitle Robot"


@dataclass(frozen=True)
class CompatProfile:
    """공급자별 차이.

    Attributes:
        name: 공급자 이름 (`llm.provider`).
        max_tokens_field: 출력 상한 필드 이름.
        headers: 인증 외에 늘 보낼 헤더.
    """

    name: str
    max_tokens_field: str = "max_tokens"
    headers: dict[str, str] = field(default_factory=dict)
    # 하루 한도 초과 응답을 알아보는 함수와 그 한도가 풀리는 시각 (없으면 429 는 늘 재시도)
    daily_quota: Callable[[httpx.Response], bool] | None = None
    daily_reset: Callable[[datetime], datetime] | None = None


PROFILES: dict[str, CompatProfile] = {
    # OpenAI 최신 모델(o 시리즈·GPT-5 계열)은 max_tokens 를 거부한다
    "openai": CompatProfile("openai", max_tokens_field="max_completion_tokens"),
    "openrouter": CompatProfile("openrouter", headers={"X-Title": APP_TITLE}),
    "gemini": CompatProfile(
        "gemini", daily_quota=gemini_daily_quota_exceeded, daily_reset=next_gemini_quota_reset
    ),
}


class CloudCompatAdapter:
    """OpenAI 호환 클라우드 공급자 어댑터 (공급자 하나에 하나)."""

    def __init__(
        self,
        profile: CompatProfile,
        settings: ProviderSettings,
        *,
        http: httpx.Client | None = None,
        runtime: Runtime | None = None,
        policy: RetryPolicy | None = None,
    ) -> None:
        """어댑터를 만든다. 네트워크 호출은 하지 않는다."""
        self.provider = profile.name
        self._profile = profile
        self._settings = settings
        self._runtime = runtime or Runtime()
        self._client = OpenAICompatClient(
            settings,
            http=http,
            runtime=self._runtime,
            policy=policy,
            classify=self._classify,
            name=profile.name,
            max_tokens_field=profile.max_tokens_field,
            extra_headers=profile.headers,
        )
        self.estimator = TokenEstimator()
        # 하루 한도에 닿으면 풀리는 시각까지 요청을 보내지 않고 상태 확인을 실패로 돌린다
        self._blocked_until: datetime | None = None
        # 결제·크레딧 문제 응답 (재기동할 때까지 요청을 보내지 않는다)
        self._billing: str | None = None
        self._lock = threading.Lock()

    def _classify(self, response: httpx.Response) -> Outcome:
        if billing_problem(response):
            return self._block_for_billing(response)
        daily, reset = self._profile.daily_quota, self._profile.daily_reset
        if daily is None or reset is None or not daily(response):
            return default_classifier(response)
        until = reset(self._runtime.now())
        with self._lock:
            already = self._blocked_until is not None and self._blocked_until >= until
            self._blocked_until = until
        if not already:
            logger.warning(
                "%s daily request quota reached; pausing the queue until %s",
                self.provider,
                until.astimezone().strftime("%Y-%m-%d %H:%M"),
            )
        return Outcome.UNAVAILABLE

    def _block_for_billing(self, response: httpx.Response) -> Outcome:
        snippet = " ".join(response.text.split())[:_BILLING_SNIPPET_CHARS]
        with self._lock:
            first = self._billing is None
            self._billing = f"HTTP {response.status_code}: {snippet}"
        if first:
            logger.error(
                "%s billing problem (credits depleted or no quota); top up or check billing "
                "in the provider console, then Apply (restart): %s",
                self.provider,
                self._billing,
            )
        return Outcome.UNAVAILABLE

    def _billing_error(self) -> ProviderUnavailableError | None:
        with self._lock:
            billing = self._billing
        if billing is None:
            return None
        return ProviderUnavailableError(
            f"{self.provider}: 결제·크레딧 문제. 공급자 콘솔에서 충전·결제를 확인한 뒤 "
            f"적용(재기동)한다 ({billing})"
        )

    def _blocked(self) -> datetime | None:
        with self._lock:
            until = self._blocked_until
            if until is not None and self._runtime.now() >= until:
                self._blocked_until = until = None
        return until

    def _blocked_error(self, until: datetime) -> ProviderUnavailableError:
        when = until.astimezone().strftime("%Y-%m-%d %H:%M")
        return ProviderUnavailableError(f"{self.provider}: 하루 요청 한도에 닿았다 ({when} 초기화)")

    def chat(self, request: ChatRequest) -> ChatResult:
        """요청을 보내고, 성공하면 usage 로 토큰 근사 비율을 보정한다.

        Raises:
            ProviderUnavailableError: 재시도 상한을 넘었거나, 하루 요청 한도에 닿아
                초기화를 기다리거나, 결제·크레딧 문제로 재기동을 기다린다.
        """
        billing = self._billing_error()
        if billing is not None:
            raise billing
        until = self._blocked()
        if until is not None:
            raise self._blocked_error(until)
        try:
            result = self._client.chat(request)
        except ProviderUnavailableError as exc:
            billing = self._billing_error()
            if billing is not None:
                raise billing from exc
            until = self._blocked()
            if until is not None:
                raise self._blocked_error(until) from exc
            raise
        if result.prompt_tokens:
            prompt_chars = sum(len(message.content) for message in request.messages)
            self.estimator.observe(prompt_chars, result.prompt_tokens)
        return result

    def describe(self) -> ProviderInfo:
        """공급자 정보. 컨텍스트는 설정값(`context_tokens`)이고 없으면 모른다(기본값)."""
        model = self._client.model
        return ProviderInfo(
            provider=self.provider,
            base_url=self._client.base_url,
            model=model,
            model_label=model,
            context_tokens=self._settings.context_tokens,
        )

    def count_tokens(self, text: str) -> int:
        """근사 토큰 수."""
        return self.estimator.estimate(text)

    def health_check(self) -> bool:
        """`/models` 가 200 이면 요청을 받을 수 있다고 본다.

        하루 한도 초기화 전과, 결제·크레딧 문제 뒤(재기동 전)에는 거짓이다. `/models`는 크레딧이
        없어도 200 이라 그 결과로는 충전 여부를 알 수 없다.
        """
        if self._billing is not None or self._blocked() is not None:
            return False
        try:
            return self._client.get("models").status_code == _HTTP_OK
        except httpx.TransportError:
            return False

    def close(self) -> None:
        """HTTP 연결을 닫는다."""
        self._client.close()
