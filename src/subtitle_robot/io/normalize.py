"""입력 정규화와 normalized.json (PROJECT-PLAN §7, WI-1.005).

바이트 → 인코딩 감지 → 파싱 → 블록 간 관계 판정 → 플래그 부여. 원문은 공백(줄바꿈 통일, 줄 끝 공백,
텍스트 안 빈 줄)만 바꾸고, 나머지 이상은 플래그로만 남긴다. 처리 방법은 뒷단계가 정한다.
이후 단계는 LLM 과 `idx` 로만 통신한다 (§3 타임스탬프 비노출).
"""

from __future__ import annotations

import hashlib
import json
import re
from enum import StrEnum
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict

from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.io.encoding import decode_subtitle
from subtitle_robot.io.parser import ParseIssueKind, RawBlock, parse_srt

SCHEMA_VERSION: Literal[1] = 1

_HTML_TAG_RE = re.compile(r"<[^>]*>")
_ASS_TAG_RE = re.compile(r"\{\\[^}]*\}")

NewlineStyle = Literal["lf", "crlf", "cr", "mixed", "none"]


class BlockFlag(StrEnum):
    """블록 이상 표시. 뒷단계가 처리 방법을 정한다 (WI-1.005 문서의 표)."""

    EMPTY = "empty"
    OVERLAP = "overlap"
    TIME_REVERSED = "time_reversed"
    NEGATIVE_DURATION = "negative_duration"
    BAD_TIMING = "bad_timing"
    NUMBER_MISSING = "number_missing"
    NUMBER_INVALID = "number_invalid"
    NUMBER_DUPLICATE = "number_duplicate"
    NUMBER_NON_SEQUENTIAL = "number_non_sequential"
    ASS_TAGS = "ass_tags"
    INNER_BLANK_LINE = "inner_blank_line"


class IssueKind(StrEnum):
    """문서 단위 이슈 종류."""

    LEADING_TEXT = "leading_text"
    BAD_TIMING = "bad_timing"
    ENCODING_LOW_CONFIDENCE = "encoding_low_confidence"


class UnsupportedSchemaError(ValueError):
    """normalized.json 의 schema_version 을 지원하지 않을 때."""


class NormalizedBlock(BaseModel):
    """정규화한 블록. `idx` 는 1부터 파일 순서다."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    idx: int
    number: str | None
    timing_line: str
    start_ms: int | None
    end_ms: int | None
    text: str
    flags: list[BlockFlag]
    translate: bool


class InputIssue(BaseModel):
    """정규화 중 발견한 문서 단위 이슈."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    kind: IssueKind
    idx: int | None
    line_no: int | None
    detail: str


class NormalizedDocument(BaseModel):
    """정규화 결과 전체 (`normalized.json`)."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    schema_version: Literal[1] = SCHEMA_VERSION
    source_path: str
    source_sha256: str
    encoding: str
    encoding_confidence: float
    had_bom: bool
    newline: NewlineStyle
    leading_text: str
    blocks: list[NormalizedBlock]
    issues: list[InputIssue]


def normalize_srt(
    data: bytes, *, source_path: str, encoding: str | None = None
) -> NormalizedDocument:
    """SRT 파일 바이트를 정규화한다.

    Args:
        data: 파일 원본 바이트.
        source_path: 원본 경로 (기록용).
        encoding: 사용자가 지정한 인코딩 (`--encoding`). 없으면 감지한다.

    Returns:
        정규화 문서.

    Raises:
        EncodingDetectionError: 인코딩을 정하지 못한 경우.
    """
    decoded = decode_subtitle(data, encoding)
    parsed = parse_srt(decoded.text)

    issues: list[InputIssue] = []
    if decoded.low_confidence:
        issues.append(
            InputIssue(
                kind=IssueKind.ENCODING_LOW_CONFIDENCE,
                idx=None,
                line_no=None,
                detail=f"{decoded.encoding} 로 감지(신뢰도 {decoded.confidence:.2f}"
                + (f", 동점 후보 {', '.join(decoded.alternatives)}" if decoded.alternatives else "")
                + "). 글자가 깨지면 --encoding 으로 지정",
            )
        )
    line_to_idx = {block.line_no: idx for idx, block in enumerate(parsed.blocks, start=1)}
    issues.extend(
        InputIssue(
            kind=IssueKind(issue.kind.value),
            idx=line_to_idx.get(issue.line_no) if issue.kind is ParseIssueKind.BAD_TIMING else None,
            line_no=issue.line_no,
            detail=issue.detail,
        )
        for issue in parsed.issues
    )

    return NormalizedDocument(
        source_path=source_path,
        source_sha256=hashlib.sha256(data).hexdigest(),
        encoding=decoded.encoding,
        encoding_confidence=decoded.confidence,
        had_bom=decoded.had_bom,
        newline=detect_newline(decoded.text),
        leading_text=parsed.leading_text,
        blocks=_normalize_blocks(parsed.blocks),
        issues=issues,
    )


def normalize_srt_file(path: Path, *, encoding: str | None = None) -> NormalizedDocument:
    """파일을 읽어 정규화한다."""
    return normalize_srt(Path(path).read_bytes(), source_path=str(path), encoding=encoding)


def save_normalized(doc: NormalizedDocument, path: Path) -> None:
    """normalized.json 을 원자적으로 저장한다."""
    atomic_write_text(Path(path), doc.model_dump_json(indent=2) + "\n")


def load_normalized(path: Path) -> NormalizedDocument:
    """normalized.json 을 읽는다.

    Raises:
        UnsupportedSchemaError: schema_version 이 지원하는 값이 아닐 때.
    """
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    version = raw.get("schema_version") if isinstance(raw, dict) else None
    if version != SCHEMA_VERSION:
        raise UnsupportedSchemaError(
            f"{path}: normalized.json schema_version {version!r} 은 지원하지 않는다 "
            f"(지원: {SCHEMA_VERSION}). 원본 SRT 에서 다시 정규화해야 한다"
        )
    return NormalizedDocument.model_validate(raw)


def detect_newline(text: str) -> NewlineStyle:
    """원본 문자열의 줄바꿈 방식."""
    crlf = text.count("\r\n")
    lone_cr = text.count("\r") - crlf
    lone_lf = text.count("\n") - crlf
    kinds = [kind for kind, count in (("crlf", crlf), ("cr", lone_cr), ("lf", lone_lf)) if count]
    if not kinds:
        return "none"
    if len(kinds) > 1:
        return "mixed"
    style: NewlineStyle = "crlf" if kinds[0] == "crlf" else "cr" if kinds[0] == "cr" else "lf"
    return style


def visible_text(text: str) -> str:
    """HTML·ASS 태그를 뺀 텍스트 (빈 블록 판정용)."""
    return _ASS_TAG_RE.sub("", _HTML_TAG_RE.sub("", text))


def _normalize_blocks(raw_blocks: list[RawBlock]) -> list[NormalizedBlock]:
    blocks: list[NormalizedBlock] = []
    seen_numbers: set[str] = set()
    last_numeric: int | None = None
    last_timed: RawBlock | None = None
    for idx, raw in enumerate(raw_blocks, start=1):
        flags: list[BlockFlag] = []
        flags += _number_flags(raw.number_line, seen_numbers, last_numeric)
        flags += _time_flags(raw, last_timed)

        text = raw.text
        if _has_inner_blank_line(text):
            text = "\n".join(line for line in text.split("\n") if line.strip())
            flags.append(BlockFlag.INNER_BLANK_LINE)
        if _ASS_TAG_RE.search(text):
            flags.append(BlockFlag.ASS_TAGS)
        if not visible_text(text).strip():
            flags.append(BlockFlag.EMPTY)

        if raw.number_line is not None:
            seen_numbers.add(raw.number_line)
            if raw.number_line.isascii() and raw.number_line.isdigit():
                last_numeric = int(raw.number_line)
        if raw.start_ms is not None:
            last_timed = raw

        blocks.append(
            NormalizedBlock(
                idx=idx,
                number=raw.number_line,
                timing_line=raw.timing_line,
                start_ms=raw.start_ms,
                end_ms=raw.end_ms,
                text=text,
                flags=flags,
                translate=BlockFlag.EMPTY not in flags,
            )
        )
    return blocks


def _number_flags(number: str | None, seen: set[str], last_numeric: int | None) -> list[BlockFlag]:
    if number is None:
        return [BlockFlag.NUMBER_MISSING]
    if not (number.isascii() and number.isdigit()):
        return [BlockFlag.NUMBER_INVALID]
    if number in seen:
        return [BlockFlag.NUMBER_DUPLICATE]
    if last_numeric is not None and int(number) != last_numeric + 1:
        return [BlockFlag.NUMBER_NON_SEQUENTIAL]
    return []


def _time_flags(raw: RawBlock, previous: RawBlock | None) -> list[BlockFlag]:
    """시간 플래그. 직전 블록은 시각을 해석한 마지막 블록(파일 순서)이다."""
    if raw.start_ms is None or raw.end_ms is None:
        return [BlockFlag.BAD_TIMING]
    flags: list[BlockFlag] = []
    if raw.end_ms < raw.start_ms:
        flags.append(BlockFlag.NEGATIVE_DURATION)
    if previous is not None and previous.start_ms is not None and previous.end_ms is not None:
        # 두 판정은 독립이다: 역순 블록은 대개 겹침에도 해당한다
        if raw.start_ms < previous.end_ms:
            flags.append(BlockFlag.OVERLAP)
        if raw.start_ms < previous.start_ms:
            flags.append(BlockFlag.TIME_REVERSED)
    return flags


def _has_inner_blank_line(text: str) -> bool:
    return any(not line.strip() for line in text.split("\n")) if text else False
