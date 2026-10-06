import threading
from collections.abc import Callable

import pytest

from subtitle_robot.llm.availability import (
    AvailabilityPolicy,
    AvailabilityState,
    ProviderGuard,
)
from subtitle_robot.llm.errors import ProviderUnavailableError
from tests.llm.fakes import FakeTime


class FakeProvider:
    def __init__(self, health: list[bool]) -> None:
        self.health = list(health)
        self.checks = 0

    def health_check(self) -> bool:
        self.checks += 1
        return self.health.pop(0) if self.health else True


class Recorder:
    def __init__(self) -> None:
        self.events: list[str] = []

    def on_unavailable(self, reason: str) -> None:
        self.events.append(f"unavailable: {reason}")

    def on_available(self) -> None:
        self.events.append("available")


def _failing(times: int, result: str = "ok") -> Callable[[], str]:
    calls = {"n": 0}

    def operation() -> str:
        calls["n"] += 1
        if calls["n"] <= times:
            raise ProviderUnavailableError("4회 연결 실패")
        return result

    return operation


class Job:
    """큐 작업 흉내: 작업 실행 한 번을 시도 1회로 센다."""

    def __init__(self) -> None:
        self.attempts = 0

    def execute(self, guard: ProviderGuard, operation: Callable[[], str]) -> str:
        self.attempts += 1
        return guard.run(operation)


def test_pause_until_recovered_without_consuming_job_attempts() -> None:
    fake = FakeTime()
    provider = FakeProvider(health=[False, False, True])
    recorder = Recorder()
    guard = ProviderGuard(
        provider,
        policy=AvailabilityPolicy(check_interval_s=60),
        runtime=fake.runtime(),
        listeners=[recorder],
    )
    job = Job()

    result = job.execute(guard, _failing(1))

    assert result == "ok"
    assert job.attempts == 1  # 일시 정지 동안 작업 시도 횟수는 늘지 않는다
    assert provider.checks == 3
    assert fake.slept == [60, 60, 60]
    assert recorder.events == ["unavailable: 4회 연결 실패", "available"]
    assert guard.state is AvailabilityState.AVAILABLE


def test_repeated_outage_pauses_again() -> None:
    fake = FakeTime()
    recorder = Recorder()
    guard = ProviderGuard(
        FakeProvider(health=[True, True]),
        policy=AvailabilityPolicy(check_interval_s=10),
        runtime=fake.runtime(),
        listeners=[recorder],
    )

    assert guard.run(_failing(2)) == "ok"
    assert recorder.events.count("available") == 2


def test_max_pause_raises_and_releases_state() -> None:
    fake = FakeTime()
    guard = ProviderGuard(
        FakeProvider(health=[False] * 10),
        policy=AvailabilityPolicy(check_interval_s=60, max_pause_s=180),
        runtime=fake.runtime(),
    )

    with pytest.raises(ProviderUnavailableError, match="180초 동안 복구되지 않았다"):
        guard.run(_failing(1))
    assert guard.state is AvailabilityState.AVAILABLE
    assert guard.last_reason == "4회 연결 실패"


def test_success_does_not_check_health() -> None:
    provider = FakeProvider(health=[])
    guard = ProviderGuard(provider, runtime=FakeTime().runtime())

    assert guard.run(lambda: "ok") == "ok"
    assert provider.checks == 0


def test_other_workers_wait_while_paused() -> None:
    probe_started = threading.Event()
    allow_recovery = threading.Event()

    class SlowProvider:
        def health_check(self) -> bool:
            probe_started.set()
            return allow_recovery.wait(timeout=5)

    guard = ProviderGuard(
        SlowProvider(), policy=AvailabilityPolicy(check_interval_s=0), runtime=FakeTime().runtime()
    )
    second_ran = threading.Event()

    first = threading.Thread(target=lambda: guard.run(_failing(1)))
    first.start()
    assert probe_started.wait(timeout=5)
    assert guard.state is AvailabilityState.UNAVAILABLE

    def second_job() -> str:
        second_ran.set()
        return "ok"

    second = threading.Thread(target=lambda: guard.run(second_job))
    second.start()
    assert not second_ran.wait(timeout=0.2)  # 일시 정지 중에는 새 작업이 공급자를 부르지 않는다

    allow_recovery.set()
    assert second_ran.wait(timeout=5)
    first.join(timeout=5)
    second.join(timeout=5)


def test_same_request_failing_while_provider_healthy_is_raised() -> None:
    """상태 확인은 바로 정상인데 같은 요청만 실패하면 무한 재시도하지 않고 넘긴다."""
    from subtitle_robot.llm.availability import AvailabilityPolicy, ProviderGuard
    from subtitle_robot.llm.errors import ProviderUnavailableError
    from subtitle_robot.llm.limiter import Runtime

    class Healthy:
        def health_check(self) -> bool:
            return True

    calls = {"n": 0}

    def too_slow() -> str:
        calls["n"] += 1
        raise ProviderUnavailableError("ReadTimeout")

    guard = ProviderGuard(
        Healthy(),
        policy=AvailabilityPolicy(check_interval_s=1, max_healthy_failures=3),
        runtime=Runtime(sleep=lambda _s: None),
    )

    with pytest.raises(ProviderUnavailableError, match="같은 요청이 3번"):
        guard.run(too_slow)
    assert calls["n"] == 3


def test_guarded_adapter_pauses_any_request() -> None:
    from subtitle_robot.llm.availability import AvailabilityPolicy, GuardedAdapter, ProviderGuard
    from subtitle_robot.llm.base import ChatMessage, ChatRequest
    from subtitle_robot.llm.errors import ProviderUnavailableError
    from subtitle_robot.llm.limiter import Runtime
    from tests.fake_llm import FakeAdapter

    calls = {"n": 0}

    def respond(_request: ChatRequest) -> str:
        calls["n"] += 1
        if calls["n"] == 1:
            raise ProviderUnavailableError("503")
        return '{"ok": true}'

    inner = FakeAdapter(respond)
    health = iter([False, True])
    inner.health_check = lambda: next(health)  # type: ignore[method-assign]
    paused: list[float] = []
    guard = ProviderGuard(
        inner, policy=AvailabilityPolicy(check_interval_s=60), runtime=Runtime(sleep=paused.append)
    )

    result = GuardedAdapter(inner, guard).chat(
        ChatRequest(messages=[ChatMessage(role="user", content="x")], schema_name="pass1_output")
    )

    assert result.json_text == '{"ok": true}'
    assert paused == [60, 60]  # 공급자 장애로 쉬었다가 복구 뒤 같은 요청을 다시 보냄
