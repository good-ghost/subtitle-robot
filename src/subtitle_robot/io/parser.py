"""관대한 SRT 파서 (PROJECT-PLAN §7, WI-1.003).

깨진 SRT 를 거부하지 않고 블록 목록으로 읽는다. 블록 경계는 빈 줄이 아니라 타이밍 줄로 찾는다
(텍스트 안 빈 줄, 빠진 구분 빈 줄에 대응). 출력에서 블록 구조를 100% 보존해야 하므로(REQ-002)
번호 줄과 타이밍 줄은 원문을 보관하고, 해석한 밀리초는 내부 계산에만 쓴다.

블록 사이의 관계(번호 중복, 시간 겹침 등) 판정은 정규화기(`normalize.py`)가 한다.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import StrEnum

# 왼쪽이 숫자로 시작하고 화살표(--> 또는 ->)가 있는 줄을 타이밍 줄 후보로 본다
_TIMING_CANDIDATE_RE = re.compile(r"^\s*\d[\d:.,;\s]*-{1,2}>\s*\S")
# 화살표 양쪽 시각. 오른쪽 시각 뒤의 꼬리(X1:… 좌표 등)는 무시한다
_TIMING_RE = re.compile(r"^\s*(.+?)\s*-{1,2}>\s*(\S+)")
# [H+:]MM:SS[,.:]f{1,3} — 시는 생략 가능, 소수부 1~3자리 또는 생략
_TIMESTAMP_RE = re.compile(r"^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[,.:](\d{1,3}))?$")

_MS_DIGITS = 3
_MAX_MINUTES = 59
_MAX_SECONDS = 59


class ParseIssueKind(StrEnum):
    """파서가 남기는 이슈 종류."""

    LEADING_TEXT = "leading_text"
    BAD_TIMING = "bad_timing"


@dataclass(frozen=True, slots=True)
class RawBlock:
    """파일에서 읽은 블록 하나.

    Attributes:
        number_line: 원본 번호 줄(앞뒤 공백 제거). 번호 줄이 없으면 None.
        timing_line: 원본 타이밍 줄(앞뒤 공백 제거).
        start_ms: 시작 시각. 해석하지 못하면 None.
        end_ms: 끝 시각. 해석하지 못하면 None.
        text: 텍스트 줄을 "\\n" 으로 이은 것. 줄 끝 공백과 앞뒤 빈 줄은 제거, 안쪽 빈 줄은 보존.
        line_no: 타이밍 줄의 1-based 줄 번호.
    """

    number_line: str | None
    timing_line: str
    start_ms: int | None
    end_ms: int | None
    text: str
    line_no: int


@dataclass(frozen=True, slots=True)
class ParseIssue:
    """파싱 중 발견한 이상."""

    kind: ParseIssueKind
    line_no: int
    detail: str


@dataclass(frozen=True, slots=True)
class ParseResult:
    """파싱 결과."""

    blocks: list[RawBlock]
    leading_text: str
    issues: list[ParseIssue]


def parse_timestamp(value: str) -> int | None:
    """SRT 시각 문자열을 밀리초로 바꾼다. 해석할 수 없으면 None.

    Args:
        value: `00:01:02,500`, `0:01:02.5`, `01:02,500`, `00:01:02` 같은 시각.

    Returns:
        밀리초. 분·초가 59 를 넘거나 형식이 다르면 None.
    """
    match = _TIMESTAMP_RE.match(value.strip())
    if match is None:
        return None
    hours_s, minutes_s, seconds_s, fraction_s = match.groups()
    hours = int(hours_s) if hours_s else 0
    minutes, seconds = int(minutes_s), int(seconds_s)
    if minutes > _MAX_MINUTES or seconds > _MAX_SECONDS:
        return None
    # 소수부는 초의 분수다: "5" → 500ms, "05" → 50ms
    millis = int(fraction_s.ljust(_MS_DIGITS, "0")) if fraction_s else 0
    return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis


def parse_timing_line(line: str) -> tuple[int, int] | None:
    """타이밍 줄에서 (시작, 끝) 밀리초를 읽는다. 어느 한쪽이라도 해석할 수 없으면 None."""
    match = _TIMING_RE.match(line)
    if match is None:
        return None
    start, end = parse_timestamp(match.group(1)), parse_timestamp(match.group(2))
    if start is None or end is None:
        return None
    return start, end


def is_timing_candidate(line: str) -> bool:
    """블록 시작으로 볼 타이밍 줄 후보인지."""
    return _TIMING_CANDIDATE_RE.match(line) is not None


def parse_srt(text: str) -> ParseResult:
    """SRT 문자열을 블록 목록으로 읽는다.

    Args:
        text: 디코딩한 SRT 문자열. 줄바꿈은 무엇이든 된다.

    Returns:
        블록, 첫 블록 앞 텍스트, 이슈.
    """
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    starts = _find_block_starts(lines)

    blocks: list[RawBlock] = []
    issues: list[ParseIssue] = []
    for pos, (number_idx, timing_idx) in enumerate(starts):
        end_idx = _block_start_line(starts[pos + 1]) if pos + 1 < len(starts) else len(lines)
        timing_line = lines[timing_idx].strip()
        times = parse_timing_line(timing_line)
        if times is None:
            issues.append(
                ParseIssue(
                    ParseIssueKind.BAD_TIMING, timing_idx + 1, f"타이밍 해석 실패: {timing_line}"
                )
            )
        blocks.append(
            RawBlock(
                number_line=lines[number_idx].strip() if number_idx is not None else None,
                timing_line=timing_line,
                start_ms=times[0] if times else None,
                end_ms=times[1] if times else None,
                text=_join_text(lines[timing_idx + 1 : end_idx]),
                line_no=timing_idx + 1,
            )
        )

    first_line = _block_start_line(starts[0]) if starts else len(lines)
    leading_text = _join_text(lines[:first_line])
    if leading_text:
        issues.insert(
            0, ParseIssue(ParseIssueKind.LEADING_TEXT, 1, f"첫 블록 앞 텍스트: {leading_text[:80]}")
        )
    return ParseResult(blocks, leading_text, issues)


def _find_block_starts(lines: list[str]) -> list[tuple[int | None, int]]:
    """각 블록의 (번호 줄 인덱스 또는 None, 타이밍 줄 인덱스)."""
    starts: list[tuple[int | None, int]] = []
    previous_timing = -1
    for idx, line in enumerate(lines):
        if not is_timing_candidate(line):
            continue
        starts.append((_number_line_index(lines, idx, previous_timing), idx))
        previous_timing = idx
    return starts


def _number_line_index(lines: list[str], timing_idx: int, previous_timing: int) -> int | None:
    """타이밍 줄 바로 윗줄이 번호 줄이면 그 인덱스.

    숫자만 있으면 번호 줄이다. 숫자가 아니어도 그 윗줄이 빈 줄(또는 파일 시작)이면 번호 줄로
    본다(잘못된 번호). 그 외에는 앞 블록의 텍스트다.
    """
    candidate = timing_idx - 1
    if candidate <= previous_timing:
        return None
    stripped = lines[candidate].strip()
    if not stripped:
        return None
    if stripped.isascii() and stripped.isdigit():
        return candidate
    above_is_blank = candidate == 0 or not lines[candidate - 1].strip()
    return candidate if above_is_blank else None


def _block_start_line(start: tuple[int | None, int]) -> int:
    number_idx, timing_idx = start
    return number_idx if number_idx is not None else timing_idx


def _join_text(lines: list[str]) -> str:
    stripped = [line.rstrip() for line in lines]
    while stripped and not stripped[0]:
        stripped.pop(0)
    while stripped and not stripped[-1]:
        stripped.pop()
    return "\n".join(stripped)
