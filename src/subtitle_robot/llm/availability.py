"""공급자 가용성 상태와 일시 정지·재개 (PROJECT-PLAN §6.3, WI-1.012).

연결 거부·429·5xx 가 재시도 상한을 넘으면 limiter 가 `ProviderUnavailableError` 를 낸다.
가드는 이를 받아 공급자를 "불가"로 표시하고, 주기적으로 상태를 확인하다가 복구되면
같은 작업을 다시 실행한다.
작업 시도 횟수는 호출자(큐, Phase 5)가 세므로 일시 정지 동안에는 늘지 않는다.
"""

from __future__ import annotations

import logging
import threading
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol, TypeVar

from subtitle_robot.llm.base import ChatRequest, ChatResult, LlmAdapter, ProviderInfo
from subtitle_robot.llm.errors import ProviderUnavailableError
from subtitle_robot.llm.limiter import Runtime

logger = logging.getLogger(__name__)

T = TypeVar("T")


class AvailabilityState(StrEnum):
    """공급자 상태 (`queue list`·로그에 표시)."""

    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"


class HealthCheckable(Protocol):
    """상태 확인을 할 수 있는 어댑터."""

    def health_check(self) -> bool:
        """지금 요청을 받을 수 있는지."""
        ...


class AvailabilityListener(Protocol):
    """일시 정지·재개 알림을 받는 쪽 (작업 큐가 구현한다)."""

    def on_unavailable(self, reason: str) -> None:
        """공급자가 불가 상태가 됐다. 큐는 새 작업 시작을 멈춘다."""
        ...

    def on_available(self) -> None:
        """공급자가 복구됐다. 큐는 작업을 재개한다."""
        ...


@dataclass(frozen=True)
class AvailabilityPolicy:
    """일시 정지 정책.

    Attributes:
        check_interval_s: 불가 상태에서 상태를 확인하는 간격.
        max_pause_s: 일시 정지 누적 상한. None 이면 복구될 때까지 기다린다 (감시 데몬 기본).
            CLI 처럼 사람이 기다리는 경우 상한을 두고, 넘으면 오류를 올린다.
    """

    check_interval_s: float = 60.0
    max_pause_s: float | None = None
    # 쉬고 나서 첫 상태 확인이 바로 정상인데 같은 작업이 또 실패한 횟수 상한.
    # 공급자 장애가 아니라 그 요청이 문제(너무 큰 요청의 시간 초과 등)라서 넘긴다 (2026-10-03)
    max_healthy_failures: int = 3


class GuardedAdapter:
    """모든 요청을 공급자 가드로 감싸는 어댑터 (LlmAdapter).

    Pass 2 배치뿐 아니라 Pass 1·요약·reconcile 요청도 공급자 장애 때 일시 정지하게 한다 (§6.3).
    """

    def __init__(self, adapter: LlmAdapter, guard: ProviderGuard) -> None:
        self._adapter = adapter
        self._guard = guard
        self.provider = adapter.provider

    def chat(self, request: ChatRequest) -> ChatResult:
        """가드를 거쳐 요청한다."""
        return self._guard.run(lambda: self._adapter.chat(request))

    def describe(self) -> ProviderInfo:
        """공급자·모델 정보."""
        return self._adapter.describe()

    def count_tokens(self, text: str) -> int:
        """토큰 수."""
        return self._adapter.count_tokens(text)

    def health_check(self) -> bool:
        """상태 확인."""
        return self._adapter.health_check()

    def close(self) -> None:
        """HTTP 연결을 닫는다."""
        self._adapter.close()

    def __getattr__(self, name: str) -> object:
        return getattr(self._adapter, name)


class ProviderGuard:
    """공급자 호출을 감싸 불가 시 일시 정지하고 복구되면 재개한다. 워커끼리 공유한다."""

    def __init__(
        self,
        adapter: HealthCheckable,
        *,
        policy: AvailabilityPolicy | None = None,
        runtime: Runtime | None = None,
        listeners: Sequence[AvailabilityListener] = (),
    ) -> None:
        """가드를 만든다."""
        self._adapter = adapter
        self._policy = policy or AvailabilityPolicy()
        self._runtime = runtime or Runtime()
        self._listeners = list(listeners)
        self._available = threading.Event()
        self._available.set()
        self._lock = threading.Lock()
        self._probing = False
        self.last_reason = ""

    @property
    def state(self) -> AvailabilityState:
        """현재 상태."""
        if self._available.is_set():
            return AvailabilityState.AVAILABLE
        return AvailabilityState.UNAVAILABLE

    def add_listener(self, listener: AvailabilityListener) -> None:
        """알림을 받을 쪽을 더한다."""
        self._listeners.append(listener)

    def run(self, operation: Callable[[], T]) -> T:
        """작업을 실행한다. 공급자 불가면 복구될 때까지 기다렸다가 같은 작업을 다시 실행한다.

        Raises:
            ProviderUnavailableError: `max_pause_s` 동안 복구되지 않았다.
        """
        healthy_failures = 0
        while True:
            self._available.wait()
            try:
                return operation()
            except ProviderUnavailableError as exc:
                if self._pause_until_recovered(str(exc)):
                    healthy_failures += 1
                    if healthy_failures >= self._policy.max_healthy_failures:
                        raise ProviderUnavailableError(
                            f"공급자는 정상인데 같은 요청이 {healthy_failures}번 실패했다 "
                            f"(요청이 너무 크거나 느릴 수 있다): {exc}"
                        ) from exc

    def _pause_until_recovered(self, reason: str) -> bool:
        """복구될 때까지 기다린다. 첫 상태 확인에서 바로 정상이었으면 True."""
        with self._lock:
            already_probing = self._probing
            if not already_probing:
                self._probing = True
                self._available.clear()
                self.last_reason = reason
        if already_probing:
            # 다른 워커가 상태를 확인하고 있다. 복구를 기다렸다가 다시 시도한다
            self._available.wait()
            return False

        logger.warning("provider unavailable, pausing: %s", reason)
        self._notify(lambda listener: listener.on_unavailable(reason))
        waited = 0.0
        try:
            while True:
                self._runtime.sleep(self._policy.check_interval_s)
                waited += self._policy.check_interval_s
                if self._adapter.health_check():
                    logger.info("provider recovered after %.0fs", waited)
                    self._notify(lambda listener: listener.on_available())
                    return waited <= self._policy.check_interval_s
                limit = self._policy.max_pause_s
                if limit is not None and waited >= limit:
                    raise ProviderUnavailableError(
                        f"공급자가 {waited:.0f}초 동안 복구되지 않았다 (마지막 오류: {reason})"
                    )
        finally:
            with self._lock:
                self._probing = False
            # 상한 초과로 포기한 경우에도 대기 중인 워커를 풀어 각자 다시 판단하게 한다
            self._available.set()

    def _notify(self, call: Callable[[AvailabilityListener], None]) -> None:
        for listener in self._listeners:
            call(listener)
