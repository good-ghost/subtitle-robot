"""파일 안정화 확인 (PROJECT-PLAN §21.7, WI-5.007).

다운로드·복사 중인 파일을 처리하지 않도록 크기·mtime 이 `stable_seconds` 동안 그대로인 파일만
준비됐다고 본다. 시각과 stat 은 주입해 테스트한다.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

StatFunc = Callable[[Path], "tuple[int, int] | None"]


def stat_size_mtime(path: Path) -> tuple[int, int] | None:
    """(크기, mtime_ns). 파일이 없으면 None."""
    try:
        stat = path.stat()
    except FileNotFoundError:
        return None
    return stat.st_size, stat.st_mtime_ns


@dataclass
class _Observation:
    signature: tuple[int, int]
    since: float


class StabilityTracker:
    """관찰 중인 파일과 마지막으로 바뀐 시각.

    Args:
        stable_seconds: 이만큼 바뀌지 않으면 준비됐다.
        stat: 파일의 (크기, mtime_ns) 를 돌려주는 함수.
    """

    def __init__(self, stable_seconds: float, *, stat: StatFunc = stat_size_mtime) -> None:
        self._stable_seconds = stable_seconds
        self._stat = stat
        self._watching: dict[Path, _Observation] = {}

    def __len__(self) -> int:
        return len(self._watching)

    def __contains__(self, path: object) -> bool:
        return path in self._watching

    def observe(self, path: Path, now: float) -> None:
        """파일을 관찰 목록에 넣는다 (이벤트가 다시 오면 상태만 갱신)."""
        signature = self._stat(path)
        if signature is None:
            self._watching.pop(path, None)
            return
        current = self._watching.get(path)
        if current is None or current.signature != signature:
            self._watching[path] = _Observation(signature, now)

    def forget(self, path: Path) -> None:
        """관찰을 그만둔다 (삭제·처리 완료)."""
        self._watching.pop(path, None)

    def ready(self, now: float) -> list[Path]:
        """준비된 파일을 꺼낸다 (목록에서 뺀다). 사라진 파일은 버리고, 바뀐 파일은 다시 기다린다."""
        done: list[Path] = []
        for path, observation in list(self._watching.items()):
            signature = self._stat(path)
            if signature is None:
                del self._watching[path]
            elif signature != observation.signature:
                self._watching[path] = _Observation(signature, now)
            elif now - observation.since >= self._stable_seconds:
                del self._watching[path]
                done.append(path)
        return sorted(done)
