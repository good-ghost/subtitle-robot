"""호출 제어: RPM 제한, 동시 요청 제한, 재시도·백오프 (PROJECT-PLAN §6.3, WI-1.009).

limiter 와 gate 는 공급자 어댑터 하나에 하나씩 두고, 같은 프로세스의 모든 작업이 공유한다.
시계·sleep·jitter 는 `Runtime` 으로 주입해 테스트를 결정적으로 만든다.
"""

from __future__ import annotations

import random
import threading
import time
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from enum import Enum, auto

import httpx

from subtitle_robot.llm.errors import ProviderUnavailableError

_HTTP_TOO_MANY_REQUESTS = 429
_HTTP_SERVER_ERROR = 500
_HTTP_CLIENT_ERROR = 400


def _utc_now() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True)
class Runtime:
    """시간 관련 의존성. 테스트에서 가짜로 바꾼다."""

    clock: Callable[[], float] = time.monotonic
    sleep: Callable[[float], None] = time.sleep
    jitter: Callable[[], float] = random.random
    now: Callable[[], datetime] = field(default=_utc_now)


class RateLimiter:
    """분당 요청 수 제한. 요청 사이 간격을 60/rpm 초 이상으로 벌린다. rpm 0 이면 제한 없음."""

    def __init__(self, rpm: int, runtime: Runtime | None = None) -> None:
        if rpm < 0:
            raise ValueError(f"rpm 은 0 이상이어야 한다: {rpm}")
        self._interval = 60.0 / rpm if rpm else 0.0
        self._next_at: float | None = None
        self._lock = threading.Lock()
        self._runtime = runtime or Runtime()

    def acquire(self) -> None:
        """다음 요청을 보낼 수 있을 때까지 기다린다."""
        if not self._interval:
            return
        # 슬롯 예약은 잠금 안에서, 대기는 잠금 밖에서 한다 (다른 스레드도 다음 슬롯을 예약하게)
        with self._lock:
            now = self._runtime.clock()
            start = now if self._next_at is None else max(now, self._next_at)
            self._next_at = start + self._interval
        if start > now:
            self._runtime.sleep(start - now)


class ConcurrencyGate:
    """동시 요청 수 제한 (llama-server 는 슬롯 수, NIM 은 설정값)."""

    def __init__(self, limit: int) -> None:
        if limit < 1:
            raise ValueError(f"동시 요청 수는 1 이상이어야 한다: {limit}")
        self.limit = limit
        self._semaphore = threading.BoundedSemaphore(limit)

    @contextmanager
    def slot(self) -> Iterator[None]:
        """슬롯 하나를 잡는다."""
        with self._semaphore:
            yield


class Outcome(Enum):
    """응답 분류."""

    SUCCESS = auto()
    RETRY = auto()  # 429·5xx: 백오프 후 재시도, 시도 횟수에 넣는다
    WAIT = auto()  # 로딩 중 503 등: 시도 횟수에 넣지 않고 기다린다
    FAIL = auto()  # 재시도해도 소용없는 오류: 호출자에게 그대로 돌려준다


Classifier = Callable[[httpx.Response], Outcome]


def default_classifier(response: httpx.Response) -> Outcome:
    """429·5xx 는 재시도, 그 밖의 4xx 는 실패, 나머지는 성공."""
    status = response.status_code
    if status == _HTTP_TOO_MANY_REQUESTS or status >= _HTTP_SERVER_ERROR:
        return Outcome.RETRY
    if status >= _HTTP_CLIENT_ERROR:
        return Outcome.FAIL
    return Outcome.SUCCESS


@dataclass(frozen=True)
class RetryPolicy:
    """재시도 정책.

    Attributes:
        max_attempts: 시도 횟수 상한 (첫 시도 포함). 넘으면 공급자 불가로 본다.
        backoff_base_s: 지수 백오프 기준 (n번째 실패 뒤 base × 2^(n-1) 초).
        backoff_max_s: 백오프 상한. `Retry-After` 는 이 상한을 적용하지 않고 따른다.
        wait_poll_s: WAIT 응답 뒤 다시 확인할 간격.
        wait_max_s: WAIT 누적 상한. 넘으면 공급자 불가로 본다.
    """

    max_attempts: int = 4
    backoff_base_s: float = 2.0
    backoff_max_s: float = 60.0
    wait_poll_s: float = 5.0
    wait_max_s: float = 600.0

    def backoff(self, failures: int) -> float:
        """실패 횟수에 따른 기본 대기 시간 (jitter 제외)."""
        return min(self.backoff_base_s * 2.0 ** (failures - 1), self.backoff_max_s)


@dataclass(frozen=True)
class CallOutcome:
    """재시도를 거친 최종 응답."""

    response: httpx.Response
    attempts: int
    retries: int
    latency_s: float


def retry_after_seconds(response: httpx.Response, now: datetime) -> float | None:
    """`Retry-After` 헤더(초 또는 HTTP-date)를 초로 바꾼다. 없거나 해석할 수 없으면 None."""
    value = response.headers.get("retry-after")
    if not value:
        return None
    seconds = _parse_seconds(value)
    if seconds is not None:
        return max(0.0, seconds)
    when = _parse_http_date(value)
    if when is None:
        return None
    return max(0.0, (when - now).total_seconds())


def _parse_seconds(value: str) -> float | None:
    try:
        return float(value)
    except ValueError:
        return None


def _parse_http_date(value: str) -> datetime | None:
    try:
        when = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    return when if when.tzinfo is not None else when.replace(tzinfo=UTC)


def call_with_retry(
    send: Callable[[], httpx.Response],
    *,
    limiter: RateLimiter,
    gate: ConcurrencyGate,
    policy: RetryPolicy,
    runtime: Runtime,
    classify: Classifier = default_classifier,
    describe: str = "LLM 호출",
) -> CallOutcome:
    """요청을 보내고 분류에 따라 재시도·대기한다.

    Args:
        send: 요청 하나를 보내는 함수.
        limiter: RPM 제한.
        gate: 동시 요청 제한. 대기(sleep)는 슬롯 밖에서 한다.
        policy: 재시도 정책.
        runtime: 시간 의존성.
        classify: 응답 분류기 (llama-server 는 로딩 503 을 WAIT 로 본다).
        describe: 오류 메시지에 넣을 호출 설명.

    Returns:
        SUCCESS 또는 FAIL 로 분류된 응답. FAIL 의 해석은 호출자가 한다.

    Raises:
        ProviderUnavailableError: 재시도 상한 또는 대기 상한을 넘은 경우.
    """
    attempts = retries = 0
    waited = 0.0
    while True:
        limiter.acquire()
        started = runtime.clock()
        try:
            with gate.slot():
                response = send()
        except httpx.TransportError as exc:  # 연결 거부·타임아웃 포함
            attempts += 1
            if attempts >= policy.max_attempts:
                raise ProviderUnavailableError(
                    f"{describe}: {attempts}회 연결 실패 ({type(exc).__name__}: {exc})"
                ) from exc
            retries += 1
            runtime.sleep(policy.backoff(attempts) + runtime.jitter())
            continue
        latency = runtime.clock() - started

        outcome = classify(response)
        if outcome is Outcome.WAIT:
            if waited >= policy.wait_max_s:
                raise ProviderUnavailableError(
                    f"{describe}: HTTP {response.status_code} 대기가 {waited:.0f}초를 넘었다"
                )
            runtime.sleep(policy.wait_poll_s)
            waited += policy.wait_poll_s
            continue
        attempts += 1
        if outcome is Outcome.RETRY:
            if attempts >= policy.max_attempts:
                raise ProviderUnavailableError(
                    f"{describe}: HTTP {response.status_code} 로 {attempts}회 실패"
                )
            retries += 1
            delay = retry_after_seconds(response, runtime.now())
            runtime.sleep(
                delay if delay is not None else policy.backoff(attempts) + runtime.jitter()
            )
            continue
        return CallOutcome(response, attempts, retries, latency)
