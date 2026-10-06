"""데몬 종료 요청을 LLM 요청 사이에 반영한다 (PROJECT-PLAN §21.8, 2026-10-03 컨테이너 테스트).

번역 한 건은 수십 번의 LLM 요청이라 몇 분 걸린다. 종료 요청(SIGTERM)을 받으면 진행 중인 요청 하나만
끝내고 다음 요청 전에 `OperationCancelled` 로 빠져나온다. 작업은 시도 횟수를 늘리지 않고 다시
대기로 돌리고, 다음 기동 때 체크포인트로 이어서 처리한다.
"""

from __future__ import annotations

import threading
from collections.abc import Callable

from subtitle_robot.llm.base import ChatRequest, ChatResult, LlmAdapter, ProviderInfo


class OperationCancelled(Exception):  # noqa: N818 — 오류가 아니라 정상 종료 신호다
    """종료 요청으로 작업을 멈췄다 (LlmError 가 아니라 재시도·폴백 대상이 아니다)."""


class CancellableAdapter:
    """요청을 보내기 전에 종료 요청을 확인하는 어댑터 래퍼 (LlmAdapter)."""

    def __init__(self, adapter: LlmAdapter, stop: threading.Event) -> None:
        self._adapter = adapter
        self._stop = stop
        self.provider = adapter.provider
        # 구독 CLI 어댑터는 실행 중인 프로세스도 종료 요청 때 끝낸다 (§28.1)
        bind_stop = getattr(adapter, "bind_stop", None)
        if callable(bind_stop):
            bind_stop(stop.is_set)

    def chat(self, request: ChatRequest) -> ChatResult:
        """종료 요청이 있으면 보내지 않고 OperationCancelled.

        Raises:
            OperationCancelled: 종료 요청을 받았다.
        """
        if self._stop.is_set():
            raise OperationCancelled("종료 요청으로 멈춤")
        return self._adapter.chat(request)

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
        # 공급자별 추가 속성(context_tokens 등)은 감싼 어댑터의 것을 쓴다
        return getattr(self._adapter, name)


def stop_aware_sleep(stop: threading.Event) -> Callable[[float], None]:
    """공급자 일시 정지 중 대기: 종료 요청을 받으면 바로 OperationCancelled."""

    def sleep(seconds: float) -> None:
        if stop.wait(seconds):
            raise OperationCancelled("종료 요청으로 멈춤 (공급자 일시 정지 중)")

    return sleep
