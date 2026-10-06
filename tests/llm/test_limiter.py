import threading
from collections.abc import Callable, Iterator, Sequence
from itertools import pairwise

import httpx
import pytest

from subtitle_robot.llm.errors import ProviderUnavailableError
from subtitle_robot.llm.limiter import (
    CallOutcome,
    ConcurrencyGate,
    Outcome,
    RateLimiter,
    RetryPolicy,
    call_with_retry,
    default_classifier,
    retry_after_seconds,
)
from tests.llm.fakes import FakeTime

REQUEST = httpx.Request("POST", "http://llm.test/v1/chat/completions")


def _response(status: int, headers: dict[str, str] | None = None) -> httpx.Response:
    return httpx.Response(status, headers=headers, request=REQUEST)


def _sender(items: Sequence[httpx.Response | Exception]) -> Callable[[], httpx.Response]:
    queue: Iterator[httpx.Response | Exception] = iter(items)

    def send() -> httpx.Response:
        item = next(queue)
        if isinstance(item, Exception):
            raise item
        return item

    return send


def _call(
    fake: FakeTime, items: Sequence[httpx.Response | Exception], **kwargs: object
) -> CallOutcome:
    return call_with_retry(
        _sender(items),
        limiter=RateLimiter(0, fake.runtime()),
        gate=ConcurrencyGate(1),
        policy=RetryPolicy(),
        runtime=fake.runtime(),
        **kwargs,  # type: ignore[arg-type]
    )


# ---------------------------------------------------------------- RateLimiter


def test_rate_limiter_spaces_requests_by_rpm() -> None:
    fake = FakeTime()
    limiter = RateLimiter(30, fake.runtime())  # 2초 간격

    stamps = []
    for _ in range(4):
        limiter.acquire()
        stamps.append(fake.clock())

    assert [b - a for a, b in pairwise(stamps)] == [2.0, 2.0, 2.0]


def test_rate_limiter_does_not_wait_when_requests_are_sparse() -> None:
    fake = FakeTime()
    limiter = RateLimiter(60, fake.runtime())

    limiter.acquire()
    fake.now_s += 5.0
    limiter.acquire()

    assert fake.slept == []


def test_rate_limiter_zero_means_unlimited() -> None:
    fake = FakeTime()
    limiter = RateLimiter(0, fake.runtime())

    for _ in range(10):
        limiter.acquire()

    assert fake.slept == []


def test_rate_limiter_rejects_negative() -> None:
    with pytest.raises(ValueError, match="rpm"):
        RateLimiter(-1)


# ---------------------------------------------------------------- ConcurrencyGate


def test_concurrency_gate_blocks_third_caller_until_slot_frees() -> None:
    gate = ConcurrencyGate(2)
    release = threading.Event()
    holders_in = threading.Semaphore(0)
    third_entered = threading.Event()

    def holder() -> None:
        with gate.slot():
            holders_in.release()
            release.wait(timeout=5)

    def third() -> None:
        with gate.slot():
            third_entered.set()

    holders = [threading.Thread(target=holder) for _ in range(2)]
    for thread in holders:
        thread.start()
    for _ in range(2):
        assert holders_in.acquire(timeout=5)
    late = threading.Thread(target=third)
    late.start()

    assert not third_entered.wait(timeout=0.2)  # 슬롯 2개가 모두 찼다
    release.set()
    assert third_entered.wait(timeout=5)
    for thread in [*holders, late]:
        thread.join(timeout=5)


def test_concurrency_gate_rejects_zero() -> None:
    with pytest.raises(ValueError, match="동시 요청"):
        ConcurrencyGate(0)


# ---------------------------------------------------------------- call_with_retry


def test_success_first_try() -> None:
    fake = FakeTime()

    outcome = _call(fake, [_response(200)])

    assert (outcome.attempts, outcome.retries) == (1, 0)
    assert fake.slept == []


def test_exponential_backoff_on_5xx() -> None:
    fake = FakeTime()

    outcome = _call(fake, [_response(500), _response(502), _response(503), _response(200)])

    assert (outcome.attempts, outcome.retries) == (4, 3)
    assert fake.slept == [2.0, 4.0, 8.0]


def test_retry_after_seconds_is_honored() -> None:
    fake = FakeTime()

    _call(fake, [_response(429, {"retry-after": "7"}), _response(200)])

    assert fake.slept == [7.0]


def test_retry_after_http_date_is_honored() -> None:
    fake = FakeTime()
    when = fake.now().timestamp() + 30
    from email.utils import formatdate

    _call(fake, [_response(429, {"retry-after": formatdate(when, usegmt=True)}), _response(200)])

    assert fake.slept == [pytest.approx(30.0, abs=1.0)]


def test_retry_exhausted_raises_provider_unavailable() -> None:
    fake = FakeTime()

    with pytest.raises(ProviderUnavailableError, match="HTTP 503 로 4회"):
        _call(fake, [_response(503)] * 4)


def test_connection_errors_exhausted_raise_provider_unavailable() -> None:
    fake = FakeTime()
    refused = httpx.ConnectError("Connection refused", request=REQUEST)

    with pytest.raises(ProviderUnavailableError, match="4회 연결 실패"):
        _call(fake, [refused] * 4)
    assert fake.slept == [2.0, 4.0, 8.0]


def test_timeout_then_success() -> None:
    fake = FakeTime()

    outcome = _call(fake, [httpx.ReadTimeout("timed out", request=REQUEST), _response(200)])

    assert (outcome.attempts, outcome.retries) == (2, 1)


def test_wait_outcome_does_not_count_attempts() -> None:
    fake = FakeTime()

    def classify(response: httpx.Response) -> Outcome:
        return Outcome.WAIT if response.status_code == 503 else default_classifier(response)

    outcome = _call(fake, [_response(503)] * 3 + [_response(200)], classify=classify)

    assert (outcome.attempts, outcome.retries) == (1, 0)
    assert fake.slept == [5.0, 5.0, 5.0]


def test_wait_beyond_limit_raises() -> None:
    fake = FakeTime()
    policy = RetryPolicy(wait_poll_s=5.0, wait_max_s=10.0)

    with pytest.raises(ProviderUnavailableError, match="대기"):
        call_with_retry(
            _sender([_response(503)] * 5),
            limiter=RateLimiter(0),
            gate=ConcurrencyGate(1),
            policy=policy,
            runtime=fake.runtime(),
            classify=lambda _r: Outcome.WAIT,
        )


def test_client_error_returns_immediately() -> None:
    fake = FakeTime()

    outcome = _call(fake, [_response(400)])

    assert outcome.response.status_code == 400
    assert outcome.attempts == 1
    assert fake.slept == []


def test_retry_after_parsing() -> None:
    fake = FakeTime()

    assert retry_after_seconds(_response(429), fake.now()) is None
    assert retry_after_seconds(_response(429, {"retry-after": "garbage"}), fake.now()) is None
    assert retry_after_seconds(_response(429, {"retry-after": "-3"}), fake.now()) == 0.0
