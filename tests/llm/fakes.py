"""LLM 테스트용 가짜 시간 의존성."""

from datetime import UTC, datetime, timedelta

from subtitle_robot.llm.limiter import Runtime


class FakeTime:
    """sleep 하면 시계가 그만큼 흐르는 가짜 시간. sleep 기록을 남긴다."""

    def __init__(self, start: float = 1000.0) -> None:
        self.now_s = start
        self.slept: list[float] = []
        self.epoch = datetime(2026, 10, 2, tzinfo=UTC)

    def clock(self) -> float:
        return self.now_s

    def sleep(self, seconds: float) -> None:
        self.slept.append(seconds)
        self.now_s += seconds

    def now(self) -> datetime:
        return self.epoch + timedelta(seconds=self.now_s)

    def runtime(self) -> Runtime:
        return Runtime(clock=self.clock, sleep=self.sleep, jitter=lambda: 0.0, now=self.now)
