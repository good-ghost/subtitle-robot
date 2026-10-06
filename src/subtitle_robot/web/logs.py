"""로그 조회 API (PROJECT-PLAN §25.8, REQ-038, WI-7.007)."""

from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Query
from pydantic import BaseModel

from subtitle_robot.watch.logfile import read_log
from subtitle_robot.web.context import Context

router = APIRouter(prefix="/api")

LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
DEFAULT_LIMIT = 500
MAX_LIMIT = 2000


class LogEntryOut(BaseModel):
    """로그 항목."""

    time: str
    level: str
    thread: str
    logger: str
    message: str


class LogChunkOut(BaseModel):
    """로그 항목과 이어 읽을 위치 (reset 이면 화면이 목록을 새로 그린다)."""

    entries: list[LogEntryOut]
    cursor: str
    reset: bool


@router.get("/logs")
def logs(
    context: Context,
    level: LogLevel = "DEBUG",
    after: str | None = None,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = DEFAULT_LIMIT,
) -> LogChunkOut:
    """데몬 로그 파일의 최근 항목. after(이전 cursor)를 주면 그 뒤 항목만."""
    chunk = read_log(context.data_dir, cursor=after, level=level, limit=limit)
    return LogChunkOut(
        entries=[LogEntryOut(**vars(entry)) for entry in chunk.entries],
        cursor=chunk.cursor,
        reset=chunk.reset,
    )
