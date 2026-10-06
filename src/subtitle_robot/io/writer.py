"""SRT 라이터 (PROJECT-PLAN §7, WI-1.004).

블록 구조 100% 보존(REQ-002)을 위해 기본 출력은 원본 번호 줄과 원본 타이밍 줄을 그대로 쓴다.
타이밍 줄을 다시 포맷하지 않으므로 해석하지 못한 타이밍도 원문 그대로 남는다.
"""

from __future__ import annotations

from collections.abc import Iterable
from pathlib import Path
from typing import Literal, Protocol

from subtitle_robot.io.atomic import atomic_write_text

Newline = Literal["\n", "\r\n"]


class SrtBlock(Protocol):
    """라이터가 읽는 블록 속성."""

    @property
    def number(self) -> str | None: ...

    @property
    def timing_line(self) -> str: ...

    @property
    def text(self) -> str: ...


def format_srt(
    blocks: Iterable[SrtBlock], *, renumber: bool = False, newline: Newline = "\n"
) -> str:
    """블록을 SRT 문자열로 만든다.

    Args:
        blocks: 출력할 블록 (파일 순서).
        renumber: True 면 1부터 연속 번호를 쓴다 (`--renumber`). False 면 원본 번호 줄을 쓰고,
            번호가 없던 블록에는 출력 위치 번호를 쓴다.
        newline: 줄바꿈.

    Returns:
        블록마다 "번호, 타이밍, 텍스트, 빈 줄" 형태의 문자열.

    Raises:
        ValueError: 텍스트에 빈 줄이 있어 플레이어가 블록 경계로 오인할 수 있는 경우.
    """
    chunks: list[str] = []
    for position, block in enumerate(blocks, start=1):
        if _has_blank_line(block.text):
            raise ValueError(
                f"{position}번째 블록 텍스트에 빈 줄이 있다. "
                "정규화(normalize_srt)를 먼저 거쳐야 한다"
            )
        number = str(position) if renumber or block.number is None else block.number
        lines = [number, block.timing_line]
        if block.text:
            lines.extend(block.text.split("\n"))
        chunks.append("\n".join(lines) + "\n")
    text = "\n".join(chunks)
    return text.replace("\n", newline) if newline != "\n" else text


def write_srt_file(
    path: Path,
    blocks: Iterable[SrtBlock],
    *,
    renumber: bool = False,
    newline: Newline = "\n",
    encoding: str = "utf-8",
) -> None:
    """SRT 파일을 원자적으로 쓴다 (임시 파일 → rename)."""
    atomic_write_text(
        path, format_srt(blocks, renumber=renumber, newline=newline), encoding=encoding
    )


def _has_blank_line(text: str) -> bool:
    return any(not line.strip() for line in text.split("\n")) if text else False
