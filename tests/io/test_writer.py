from dataclasses import dataclass
from pathlib import Path

import pytest

from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.io.parser import parse_srt
from subtitle_robot.io.writer import format_srt, write_srt_file


@dataclass(frozen=True)
class Block:
    number: str | None
    timing_line: str
    text: str


def _blocks_from(text: str) -> list[Block]:
    return [Block(b.number_line, b.timing_line, b.text) for b in parse_srt(text).blocks]


CANONICAL = (
    "1\n00:00:01,000 --> 00:00:02,000\nHello\nWorld\n"
    "\n"
    "7\n00:00:03.5 --> 00:00:04,000  X1:10 X2:20\n<i>- What?</i>\n"
    "\n"
    "7\n00:00:05,000 --> 00:0x:06\n{\\an8}本当によく降るわね\n"
    "\n"
    "a12\n00:00:07,000 --> 00:00:08,000\n"
    "\n"
    "9\n00:00:09,000 --> 00:00:10,000\n최종\n"
)


def test_parse_then_format_reproduces_canonical_input() -> None:
    # 원본 번호(중복·비숫자 포함)와 타이밍 줄 원문(비표준·해석 불가 포함)이 그대로 나온다
    assert format_srt(_blocks_from(CANONICAL)) == CANONICAL


def test_missing_number_gets_position_number() -> None:
    blocks = [
        Block(None, "00:00:01,000 --> 00:00:02,000", "A"),
        Block("5", "00:00:03,000 --> 00:00:04,000", "B"),
    ]

    assert format_srt(blocks) == (
        "1\n00:00:01,000 --> 00:00:02,000\nA\n\n5\n00:00:03,000 --> 00:00:04,000\nB\n"
    )


def test_renumber_writes_sequential_numbers() -> None:
    out = format_srt(_blocks_from(CANONICAL), renumber=True)

    assert [b.number_line for b in parse_srt(out).blocks] == ["1", "2", "3", "4", "5"]


def test_crlf_newline() -> None:
    blocks = [Block("1", "00:00:01,000 --> 00:00:02,000", "A\nB")]

    assert format_srt(blocks, newline="\r\n") == "1\r\n00:00:01,000 --> 00:00:02,000\r\nA\r\nB\r\n"


def test_empty_block_round_trips() -> None:
    text = "1\n00:00:01,000 --> 00:00:02,000\n\n2\n00:00:03,000 --> 00:00:04,000\nB\n"

    assert format_srt(_blocks_from(text)) == text


def test_blank_line_inside_text_is_rejected() -> None:
    blocks = [Block("1", "00:00:01,000 --> 00:00:02,000", "A\n\nB")]

    with pytest.raises(ValueError, match="1번째 블록"):
        format_srt(blocks)


def test_empty_list() -> None:
    assert format_srt([]) == ""


def test_write_srt_file_is_utf8_and_atomic(tmp_path: Path) -> None:
    target = tmp_path / "out.ko.srt"
    target.write_text("old", encoding="utf-8")

    write_srt_file(target, _blocks_from(CANONICAL))

    assert target.read_bytes() == CANONICAL.encode("utf-8")
    assert [p.name for p in tmp_path.iterdir()] == ["out.ko.srt"]  # 임시 파일이 남지 않는다


def test_atomic_write_keeps_original_on_failure(tmp_path: Path) -> None:
    target = tmp_path / "keep.txt"
    target.write_text("original", encoding="utf-8")

    with pytest.raises(UnicodeEncodeError):
        atomic_write_text(target, "한국어", encoding="ascii")

    assert target.read_text(encoding="utf-8") == "original"
    assert [p.name for p in tmp_path.iterdir()] == ["keep.txt"]
