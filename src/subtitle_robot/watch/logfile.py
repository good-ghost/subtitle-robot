"""데몬 로그 파일: 회전 저장과 읽기 (PROJECT-PLAN §25.8, REQ-038, WI-7.007).

`watch`는 stderr(컨테이너 로그)와 함께 `<데이터 폴더>/logs/daemon.log`에 같은 형식으로 쓴다.
웹 Logs 화면이 이 파일을 읽으므로 재기동 뒤에도 이전 로그가 보인다.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from logging.handlers import RotatingFileHandler
from pathlib import Path

LOG_DIR_NAME = "logs"
LOG_FILE_NAME = "daemon.log"
# 5MB 에서 회전하고 현재 파일과 이전 파일 2개, 모두 3개를 둔다
LOG_MAX_BYTES = 5 * 1024 * 1024
LOG_BACKUP_COUNT = 2
# 화면이 처음 열 때 읽는 파일 끝부분의 크기 (최근 로그 수천 줄)
TAIL_BYTES = 512 * 1024
LEVELS = ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL")

# 데몬 로그 형식(cli.DAEMON_LOG_FORMAT)의 한 줄: 시각 레벨 스레드 로거: 메시지
_HEADER = re.compile(
    r"^(?P<time>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (?P<level>[A-Z]+) "
    r"(?P<thread>\S+) (?P<logger>\S+): (?P<message>.*)$"
)


@dataclass(frozen=True)
class LogEntry:
    """로그 항목 하나 (트레이스백 같은 이어진 줄은 message 에 붙는다)."""

    time: str
    level: str
    thread: str
    logger: str
    message: str


@dataclass(frozen=True)
class LogChunk:
    """읽은 항목과 다음에 이어 읽을 위치.

    reset 이 참이면 파일이 회전·교체됐거나 처음 읽은 것이라 화면이 목록을 새로 그린다.
    """

    entries: list[LogEntry]
    cursor: str
    reset: bool


def log_path(data_dir: Path) -> Path:
    """데몬 로그 파일 위치."""
    return Path(data_dir) / LOG_DIR_NAME / LOG_FILE_NAME


def open_log_handler(data_dir: Path) -> RotatingFileHandler:
    """회전하는 로그 파일 처리기. 폴더가 없으면 만든다.

    Raises:
        OSError: 폴더를 만들거나 파일을 열 수 없다.
    """
    path = log_path(data_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    return RotatingFileHandler(
        path, maxBytes=LOG_MAX_BYTES, backupCount=LOG_BACKUP_COUNT, encoding="utf-8"
    )


def read_log(
    data_dir: Path, *, cursor: str | None = None, level: str = "DEBUG", limit: int = 500
) -> LogChunk:
    """로그 항목을 읽는다.

    Args:
        data_dir: 데이터 폴더.
        cursor: 이전 응답의 cursor. 같은 파일이면 그 뒤에 쓴 항목만 읽는다.
        level: 이 레벨 이상만.
        limit: 돌려줄 최대 항목 수 (최근 것).
    """
    path = log_path(data_dir)
    try:
        stat = path.stat()
    except FileNotFoundError:
        return LogChunk([], "", reset=True)
    identity = f"{stat.st_dev}-{stat.st_ino}"
    offset = _cursor_offset(cursor, identity, stat.st_size)
    if offset is not None:
        text = _read_from(path, offset)
        reset = False
    else:
        text = _tail_text(path, stat.st_size)
        reset = True
    entries = [entry for entry in _parse(text) if _level_rank(entry.level) >= _level_rank(level)]
    return LogChunk(entries[-limit:], f"{identity}:{stat.st_size}", reset)


def _cursor_offset(cursor: str | None, identity: str, size: int) -> int | None:
    """같은 파일이고 그 사이에 줄지 않았으면 이어 읽을 위치."""
    if not cursor or ":" not in cursor:
        return None
    previous, _, position = cursor.rpartition(":")
    if previous != identity or not position.isdigit() or int(position) > size:
        return None
    return int(position)


def _read_from(path: Path, offset: int) -> str:
    with path.open("rb") as handle:
        handle.seek(offset)
        return handle.read().decode("utf-8", errors="replace")


def _tail_text(path: Path, size: int) -> str:
    """현재 파일 끝부분. 모자라면 직전 회전 파일의 끝부분을 앞에 붙인다."""
    current = _tail_bytes(path, size, TAIL_BYTES)
    missing = TAIL_BYTES - len(current)
    rotated = path.with_name(f"{path.name}.1")
    older = b""
    if missing > 0 and rotated.is_file():
        older = _tail_bytes(rotated, rotated.stat().st_size, missing)
    return (older + current).decode("utf-8", errors="replace")


def _tail_bytes(path: Path, size: int, wanted: int) -> bytes:
    with path.open("rb") as handle:
        handle.seek(max(0, size - wanted), os.SEEK_SET)
        data = handle.read()
    if size > wanted:
        # 중간에서 자른 첫 줄은 버린다
        data = data.partition(b"\n")[2]
    return data


def _parse(text: str) -> list[LogEntry]:
    entries: list[LogEntry] = []
    for line in text.splitlines():
        match = _HEADER.match(line)
        if match:
            entries.append(LogEntry(**match.groupdict()))
        elif entries and line:
            last = entries[-1]
            entries[-1] = LogEntry(
                last.time, last.level, last.thread, last.logger, f"{last.message}\n{line}"
            )
        # 앞 항목 없이 이어진 줄(잘린 트레이스백 꼬리)은 버린다
    return entries


def _level_rank(level: str) -> int:
    # 모르는 레벨 이름은 가장 낮게 본다 (걸러지지 않게)
    name = level.upper()
    return LEVELS.index(name) if name in LEVELS else 0
