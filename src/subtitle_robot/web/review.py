"""완료한 번역의 자막 검수: 원본 자막과 번역 자막을 블록마다 나란히 보이고 번역 글자를 고친다 (WI-7.009).

- 대상은 처리 기록의 판정이 translated 인 영상의 번역 사이드카다: SRT(`<영상>.<대상>.srt`)와
  네이티브 ASS(`<영상>.<대상>.ass`, `output_format = "ass"|"both"`). ASS 는 파이프라인과 같은
  읽기로 Dialogue 이벤트를 블록으로 보고, 저장할 때 그 이벤트의 Text 만 바꾼다 (스타일·위치 보존).
- 원본은 소스로 쓴 자막 파일이다: 외부 자막이면 그 파일, 내장 트랙·OCR 이면 영상 옆의 소스 언어
  사이드카(SRT·ASS·VTT). 번역은 블록 구조를 그대로 두므로 블록 수가 같은 파일을 위치로 맞추고,
  다르면 시작 시각으로 맞춘다. 원본을 찾지 못해도 번역 자막만으로 검수한다.
- 번역 리포트(`report.json`)의 검토 필요 블록(needs_review)과 검사 결과를 블록에 붙인다.
- 저장은 번역 자막의 그 블록 글자만 바꾼다 (번호·시각 줄은 그대로, 구조 보존). 고친 파일은
  처리 기록의 해시와 달라져 그 뒤로 사용자가 고친 파일로 다뤄진다 (다시 처리하면 대상 언어 자막이
  있는 것으로 보아 덮어쓰지 않는다, §21.5·§21.11). 처음 번역은 처리 기록의 보관본에 남아 있다.
- 저장한 블록은 검수를 마친 것으로 적는다 (글자를 바꾸지 않고 저장해도 검수 완료다).
"""

from __future__ import annotations

import json
import logging
import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from subtitle_robot.config import AppConfig
from subtitle_robot.io.ass import render_ass, to_ass_text
from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.io.encoding import EncodingDetectionError
from subtitle_robot.io.parser import RawBlock, parse_srt
from subtitle_robot.io.subtitle_input import (
    SUBTITLE_SUFFIXES,
    SubtitleInput,
    SubtitleInputError,
    read_subtitle,
)
from subtitle_robot.lang.codes import DEFAULT_TARGET, normalize_language
from subtitle_robot.media.external import EXTERNAL_TRACK_ID
from subtitle_robot.media.select import name_tokens
from subtitle_robot.media.sidecar import ORIG_MARK, file_sha256
from subtitle_robot.series.workspace import SeriesWorkspace
from subtitle_robot.watch.ledger import LedgerEntry
from subtitle_robot.watch.worker import media_target

logger = logging.getLogger(__name__)

SRT_SUFFIX = ".srt"
ASS_SUFFIX = ".ass"
# 검수할 수 있는 번역 출력 형식
REVIEW_SUFFIXES = (SRT_SUFFIX, ASS_SUFFIX)
REPORT_FILE = "report.json"
# 검수를 마친 블록을 적는 폴더 (`<데이터>/review/<기록 번호>.json`). 다시 처리하면 기록 번호가 바뀌어 새로 시작한다
STATE_DIR = "review"
MAX_TEXT_LENGTH = 500
_TIMING_ARROW = "-->"
_BOM = "﻿"
# 요청 스레드 둘이 같은 SRT 를 함께 고치면 한쪽 수정이 사라진다 (읽기 → 쓰기 사이)
_WRITE_LOCK = threading.Lock()


class ReviewError(ValueError):
    """검수 요청을 처리할 수 없다 (`code` 가 API 오류 코드)."""

    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


@dataclass(frozen=True)
class ReviewNote:
    """번역 리포트의 검사 결과 하나."""

    code: str
    severity: str
    detail: str


@dataclass(frozen=True)
class ReviewRow:
    """검수할 블록 하나.

    Attributes:
        index: 번역 자막 안의 순서 (1부터). 블록을 가리키는 값이다 (번호 줄은 겹칠 수 있다).
            ASS 는 번역 대상 Dialogue 이벤트의 시작 시각 순서다.
        start_ms: 시작 시각. 시각 줄을 읽지 못했으면 None.
        end_ms: 끝 시각.
        source: 원본 글자. 맞는 블록이 없으면 빈 문자열.
        text: 번역 글자.
        needs_review: 번역할 때 검토 필요로 표시한 블록 (§11).
        notes: 그 블록의 검사 결과.
        reviewed: 검수를 마쳤다 (저장했다).
    """

    index: int
    start_ms: int | None
    end_ms: int | None
    source: str
    text: str
    needs_review: bool = False
    notes: tuple[ReviewNote, ...] = ()
    reviewed: bool = False


@dataclass(frozen=True)
class Review:
    """검수 화면에 보일 자막.

    Attributes:
        name: 번역 자막 파일 이름 (SRT 또는 ASS).
        subtitles: 이 영상에서 검수할 수 있는 번역 자막 이름들.
        source_name: 원본으로 쓴 파일 이름. 찾지 못했으면 None.
        aligned: 원본과 블록 수가 같아 위치로 맞췄다 (False 면 시작 시각으로 맞췄다).
        edited: 번역한 뒤 고친 파일이다 (처리 기록의 해시와 다르다).
        rows: 블록.
    """

    name: str
    subtitles: list[str]
    source_name: str | None
    aligned: bool
    edited: bool
    rows: list[ReviewRow] = field(default_factory=list)


# ---------------------------------------------------------------- 검수 대상


def translated_names(entry: LedgerEntry, target: str) -> list[str]:
    """기록의 출력 중 번역 자막 이름 (`<영상>.<대상>[...].srt|.ass`). 파일이 있는지는 보지 않는다."""
    names = []
    for output in entry.sidecars.outputs:
        path = Path(output.path)
        tokens = name_tokens(entry.path, path)
        if path.suffix.lower() not in REVIEW_SUFFIXES or not tokens or ORIG_MARK in tokens:
            continue
        if normalize_language(tokens[0]) == target:
            names.append(path.name)
    return names


def is_reviewable(entry: LedgerEntry, target: str) -> bool:
    """검수 화면을 열 수 있는 기록인지 (번역했고 번역 자막 출력이 있다)."""
    return entry.verdict == "translated" and bool(translated_names(entry, target))


def _translated_path(entry: LedgerEntry, target: str, name: str | None) -> tuple[Path, list[str]]:
    names = translated_names(entry, target) if entry.verdict == "translated" else []
    if not names:
        raise ReviewError("review_unavailable")
    chosen = name or names[0]
    if chosen not in names:
        raise ReviewError("subtitle_not_found")
    path = next(Path(o.path) for o in entry.sidecars.outputs if Path(o.path).name == chosen)
    if not path.is_file():
        raise ReviewError("subtitle_not_found")
    return path, names


# ---------------------------------------------------------------- 읽기


def load_review(
    entry: LedgerEntry, config: AppConfig, data_dir: Path, name: str | None = None
) -> Review:
    """기록의 번역 자막을 원본·리포트·검수 상태와 합쳐 읽는다.

    Raises:
        ReviewError: `review_unavailable`(번역 SRT 가 없는 기록), `subtitle_not_found`,
            `srt_invalid`.
    """
    target = config.translation.target_language
    path, names = _translated_path(entry, target, name)
    blocks = _translated_blocks(path)
    source_name, sources, aligned = _source_texts(entry, path, blocks, target)
    flagged, notes = _report_notes(_report_path(entry, config, data_dir))
    reviewed = read_reviewed(state_path(data_dir, entry.id), path.name)
    rows = [
        ReviewRow(
            index=index,
            start_ms=block.start_ms,
            end_ms=block.end_ms,
            source=sources.get(index, ""),
            text=block.text,
            needs_review=index in flagged,
            notes=tuple(notes.get(index, ())),
            reviewed=index in reviewed,
        )
        for index, block in enumerate(blocks, start=1)
    ]
    edited = file_sha256(path) != entry.sidecars.output_hash(path)
    return Review(path.name, names, source_name, aligned, edited, rows)


@dataclass(frozen=True)
class _Block:
    """번역 자막의 블록 (형식과 무관한 모양)."""

    start_ms: int | None
    end_ms: int | None
    text: str


def _translated_blocks(path: Path) -> list[_Block]:
    """번역 자막의 블록: SRT 는 파일의 블록, ASS 는 번역 대상 Dialogue 이벤트."""
    if path.suffix.lower() == ASS_SUFFIX:
        return [_Block(b.start_ms, b.end_ms, b.text) for b in _read_ass(path).doc.blocks]
    return [_Block(b.start_ms, b.end_ms, b.text) for b in _read_blocks(path)]


def _read_blocks(path: Path) -> list[RawBlock]:
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise ReviewError("srt_invalid") from exc
    return parse_srt(text.lstrip(_BOM)).blocks


def _read_ass(path: Path) -> SubtitleInput:
    """번역 ASS 를 파이프라인과 같은 읽기로 (블록 ↔ Dialogue 이벤트 대응을 함께 얻는다)."""
    try:
        return read_subtitle(path)
    except (SubtitleInputError, EncodingDetectionError) as exc:
        raise ReviewError("srt_invalid") from exc


def _source_candidates(entry: LedgerEntry, translated: Path, target: str) -> list[Path]:
    """원본일 수 있는 파일: 외부 자막 소스면 그 파일, 아니면 영상 옆의 소스 언어 자막."""
    video = entry.path
    source = entry.source or {}
    if source.get("track_id") == EXTERNAL_TRACK_ID and source.get("name"):
        return [video.parent / str(source["name"])]
    language = normalize_language(str(source.get("language") or ""))
    if language is None or language == target or not video.parent.is_dir():
        return []
    prefix = f"{video.stem}.".casefold()
    found = []
    for path in sorted(video.parent.iterdir()):
        if path == translated or not path.name.casefold().startswith(prefix):
            continue
        tokens = name_tokens(video, path)
        if path.suffix.lower() not in SUBTITLE_SUFFIXES or not tokens or ORIG_MARK in tokens:
            continue
        if normalize_language(tokens[0]) == language:
            found.append(path)
    own = {Path(o.path) for o in entry.sidecars.outputs}
    # 이 도구가 뽑은 사이드카를 먼저 본다 (소스 트랙 그 자체다)
    return sorted(found, key=lambda path: (path not in own, path.name.casefold()))


def _source_texts(
    entry: LedgerEntry, translated: Path, blocks: list[_Block], target: str
) -> tuple[str | None, dict[int, str], bool]:
    """(원본 파일 이름, 번역 블록 순서 → 원본 글자, 위치로 맞췄는지)."""
    readable: list[tuple[Path, list[Any]]] = []
    for path in _source_candidates(entry, translated, target):
        if not path.is_file():
            continue
        try:
            source_blocks = read_subtitle(path).doc.blocks
        except (SubtitleInputError, EncodingDetectionError, OSError) as exc:
            logger.warning("review: source %s could not be read: %s", path.name, exc)
            continue
        if len(source_blocks) == len(blocks):
            texts = {index: block.text for index, block in enumerate(source_blocks, start=1)}
            return path.name, texts, True
        readable.append((path, source_blocks))
    if not readable:
        return None, {}, False
    # 블록 수가 다르면(파일을 바꿨거나 다른 트랙) 시작 시각이 같은 블록만 붙인다
    path, source_blocks = readable[0]
    by_start = {block.start_ms: block.text for block in source_blocks if block.start_ms is not None}
    texts = {
        index: by_start[block.start_ms]
        for index, block in enumerate(blocks, start=1)
        if block.start_ms in by_start
    }
    return path.name, texts, False


def _report_path(entry: LedgerEntry, config: AppConfig, data_dir: Path) -> Path:
    """번역 리포트 위치: 영화는 작업공간, 시리즈는 그 화의 작업 폴더 (대상 언어별, §26.5)."""
    language = config.translation.target_language
    media = media_target(config, data_dir, entry.path)
    if media.kind == "series" and media.episode is not None:
        workspace = SeriesWorkspace(media.workspace, language)
        return workspace.work_dir / str(media.episode) / REPORT_FILE
    root = media.workspace if language == DEFAULT_TARGET else media.workspace / f"work-{language}"
    return root / REPORT_FILE


def _report_notes(path: Path) -> tuple[set[int], dict[int, list[ReviewNote]]]:
    """리포트의 (검토 필요 블록, 블록 → 검사 결과). 없거나 읽지 못하면 비어 있다."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return set(), {}
    except (OSError, ValueError) as exc:
        logger.warning("review: report %s could not be read: %s", path, exc)
        return set(), {}
    if not isinstance(data, dict):
        return set(), {}
    flagged = {idx for idx in data.get("needs_review") or [] if isinstance(idx, int)}
    notes: dict[int, list[ReviewNote]] = {}
    for issue in data.get("issues") or []:
        if not isinstance(issue, dict) or not isinstance(issue.get("idx"), int):
            continue
        note = ReviewNote(
            str(issue.get("code", "")), str(issue.get("severity", "")), str(issue.get("detail", ""))
        )
        if note not in notes.setdefault(issue["idx"], []):
            notes[issue["idx"]].append(note)
    return flagged, notes


# ---------------------------------------------------------------- 저장


def clean_text(text: str) -> str:
    """사용자가 고친 글자를 SRT 에 넣을 수 있게 다듬고 검증한다.

    빈 줄은 SRT 에서 블록을 끝내므로 뺀다. 시각 줄처럼 보이는 글자(`-->`)는 받지 않는다.

    Raises:
        ReviewError: `text_empty`, `text_too_long`, `text_invalid`.
    """
    lines = [line.strip() for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
    cleaned = "\n".join(line for line in lines if line)
    if not cleaned:
        raise ReviewError("text_empty")
    if len(cleaned) > MAX_TEXT_LENGTH:
        raise ReviewError("text_too_long")
    if _TIMING_ARROW in cleaned:
        raise ReviewError("text_invalid")
    return cleaned


def save_text(
    entry: LedgerEntry, config: AppConfig, data_dir: Path, name: str, index: int, text: str
) -> ReviewRow:
    """번역 자막의 블록 하나의 글자를 바꿔 쓰고 검수 완료로 적는다.

    글자가 그대로면 파일을 다시 쓰지 않는다 (확인만 하고 저장한 경우). SRT 는 번호·시각 줄과 다른
    블록을 읽은 그대로 쓰고, ASS 는 그 Dialogue 이벤트의 Text 만 바꾼다 (스타일·다른 이벤트 그대로).

    Raises:
        ReviewError: `review_unavailable`, `subtitle_not_found`, `srt_invalid`, `block_not_found`,
            `text_*`.
    """
    path, _names = _translated_path(entry, config.translation.target_language, name)
    cleaned = clean_text(text)
    with _WRITE_LOCK:
        write = _save_ass if path.suffix.lower() == ASS_SUFFIX else _save_srt
        block, changed = write(path, index, cleaned)
        if changed:
            logger.info("review: block %d of %s edited", index, path.name)
        _mark_reviewed(state_path(data_dir, entry.id), path.name, index)
    return ReviewRow(index, block.start_ms, block.end_ms, "", cleaned, reviewed=True)


def _save_srt(path: Path, index: int, cleaned: str) -> tuple[_Block, bool]:
    """SRT 블록 하나의 글자를 바꿔 쓴다. (그 블록, 파일을 다시 썼는지)."""
    blocks = _read_blocks(path)
    if not 1 <= index <= len(blocks):
        raise ReviewError("block_not_found")
    block = blocks[index - 1]
    changed = block.text != cleaned
    if changed:
        texts = [cleaned if at == index else b.text for at, b in enumerate(blocks, start=1)]
        atomic_write_text(path, _format(blocks, texts))
    return _Block(block.start_ms, block.end_ms, cleaned), changed


def _save_ass(path: Path, index: int, cleaned: str) -> tuple[_Block, bool]:
    """ASS 의 그 블록에 해당하는 Dialogue 이벤트의 Text 만 바꿔 쓴다 (원본 줄·스타일은 그대로)."""
    source = _read_ass(path)
    block = next((b for b in source.doc.blocks if b.idx == index), None)
    ref = source.events.get(index)
    if block is None or ref is None or source.ass is None:
        raise ReviewError("block_not_found")
    changed = block.text != cleaned
    if changed:
        text = render_ass(source.ass, {ref.position: to_ass_text(cleaned)})
        atomic_write_text(path, (_BOM if source.doc.had_bom else "") + text)
    return _Block(block.start_ms, block.end_ms, cleaned), changed


def _format(blocks: list[RawBlock], texts: list[str]) -> str:
    """SRT 본문 (번호 줄·시각 줄은 읽은 그대로, 번호 줄이 없던 블록은 순서 번호)."""
    chunks = [
        f"{block.number_line or position}\n{block.timing_line}\n{text}\n"
        for position, (block, text) in enumerate(zip(blocks, texts, strict=True), start=1)
    ]
    return "\n".join(chunks)


# ---------------------------------------------------------------- 검수 상태


def state_path(data_dir: Path, entry_id: int) -> Path:
    """기록 하나의 검수 상태 파일."""
    return Path(data_dir) / STATE_DIR / f"{entry_id}.json"


def read_reviewed(path: Path, name: str) -> set[int]:
    """검수를 마친 블록 순서. 상태 파일이 없거나 읽을 수 없으면 없는 것으로 본다."""
    return {index for index in _read_state(path).get(name, []) if isinstance(index, int)}


def _mark_reviewed(path: Path, name: str, index: int) -> None:
    state = _read_state(path)
    reviewed = {value for value in state.get(name, []) if isinstance(value, int)}
    if index in reviewed:
        return
    state[name] = sorted(reviewed | {index})
    path.parent.mkdir(parents=True, exist_ok=True)
    atomic_write_text(path, json.dumps(state))


def _read_state(path: Path) -> dict[str, list[Any]]:
    """상태 파일의 SRT 이름 → 블록 순서 목록. 깨진 파일은 빈 상태로 본다 (검수 표시만 사라진다)."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}
    except (OSError, ValueError) as exc:
        logger.warning("review: state %s could not be read: %s", path, exc)
        return {}
    if not isinstance(data, dict):
        return {}
    return {name: value for name, value in data.items() if isinstance(value, list)}
