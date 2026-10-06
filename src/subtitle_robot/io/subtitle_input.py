"""자막 파일 입력: SRT·ASS·SSA·WebVTT → 정규화 문서 (PROJECT-PLAN §24.1, WI-6.001).

파이프라인은 SRT 블록 모델로 일한다. ASS·VTT 는 읽을 때 이벤트(큐)마다 블록 하나를 만들고,
ASS 는 블록 ↔ 이벤트 대응을 남겨 네이티브 출력(WI-6.002)이 원본 이벤트를 고쳐 쓰게 한다.
- ASS: Dialogue 만 블록이 된다 (Comment·그림 이벤트는 제외). 블록은 시작 시각 순이다
- 노래·제외 스타일 이벤트는 번역 제외 사유를 미리 정한다 (`lyrics` 정책, `[ass] exclude_styles`)
- 원본 해시는 원래 파일 바이트로 계산한다 (이어 실행 판정)
"""

from __future__ import annotations

import hashlib
from collections.abc import Collection
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from subtitle_robot.io.ass import (
    SKIPPED_ROLES,
    AssDocument,
    AssParseError,
    EventRole,
    event_role,
    parse_ass,
    to_block_text,
)
from subtitle_robot.io.convert import SubtitleConversionError, render_srt, vtt_to_srt
from subtitle_robot.io.encoding import DecodedText, decode_subtitle
from subtitle_robot.io.normalize import NormalizedDocument, normalize_srt

SubtitleFormat = Literal["srt", "ass", "vtt"]
SUBTITLE_SUFFIXES: dict[str, SubtitleFormat] = {
    ".srt": "srt",
    ".ass": "ass",
    ".ssa": "ass",
    ".vtt": "vtt",
}


class SubtitleInputError(ValueError):
    """자막 파일을 읽을 수 없다 (모르는 확장자, ASS·VTT 해석 실패)."""


@dataclass(frozen=True)
class EventRef:
    """블록이 가리키는 ASS 이벤트."""

    position: int
    role: EventRole
    style: str


@dataclass(frozen=True)
class SubtitleInput:
    """읽은 자막.

    Attributes:
        format: 입력 형식.
        doc: 정규화 문서 (블록 모델).
        events: ASS 블록 idx → 원본 이벤트. SRT·VTT 는 비어 있다.
        ass: ASS 원본 모델 (네이티브 출력용). SRT·VTT 는 None.
    """

    format: SubtitleFormat
    doc: NormalizedDocument
    events: dict[int, EventRef] = field(default_factory=dict)
    ass: AssDocument | None = None

    def song_blocks(self) -> list[int]:
        """노래로 분류한 블록 (가라오케 태그·OP/ED 스타일)."""
        return [idx for idx, ref in self.events.items() if ref.role == "song"]

    def blocks_with_styles(self, styles: Collection[str]) -> list[int]:
        """스타일 이름이 목록에 있는 블록 (대소문자 무시)."""
        wanted = {style.casefold() for style in styles}
        return [idx for idx, ref in self.events.items() if ref.style.casefold() in wanted]


def subtitle_format(path: Path) -> SubtitleFormat | None:
    """확장자로 자막 형식을 정한다 (대소문자 무시). 다루지 않는 파일이면 None."""
    return SUBTITLE_SUFFIXES.get(Path(path).suffix.lower())


def read_subtitle(path: Path, *, encoding: str | None = None) -> SubtitleInput:
    """자막 파일을 읽어 정규화한다.

    Raises:
        SubtitleInputError: 모르는 확장자이거나 ASS·VTT 를 해석할 수 없다.
        EncodingDetectionError: 인코딩을 정하지 못했다.
    """
    path = Path(path)
    kind = subtitle_format(path)
    if kind is None:
        raise SubtitleInputError(f"다루지 않는 자막 형식: {path.name} (srt, ass, ssa, vtt)")
    data = path.read_bytes()
    if kind == "srt":
        return SubtitleInput("srt", normalize_srt(data, source_path=str(path), encoding=encoding))
    decoded = decode_subtitle(data, encoding)
    try:
        if kind == "vtt":
            srt_text = vtt_to_srt(decoded.text)
            return SubtitleInput("vtt", _normalized(srt_text, data, path, decoded))
        ass = parse_ass(decoded.text)
    except (AssParseError, SubtitleConversionError) as exc:
        raise SubtitleInputError(f"{path.name}: {exc}") from exc
    rows = sorted(
        (
            (event.start_ms, event.position, event)
            for event in ass.events
            if event.kind == "Dialogue" and event_role(event) not in SKIPPED_ROLES
        ),
        key=lambda row: (row[0], row[1]),
    )
    if not rows:
        raise SubtitleInputError(f"{path.name}: 번역할 Dialogue 이벤트가 없다")
    srt_text = render_srt(
        [(event.start_ms, event.end_ms, to_block_text(event.text)) for _, _, event in rows]
    )
    events = {
        idx: EventRef(event.position, event_role(event), event.style)
        for idx, (_, _, event) in enumerate(rows, start=1)
    }
    return SubtitleInput("ass", _normalized(srt_text, data, path, decoded), events, ass)


def _normalized(
    srt_text: str, original: bytes, path: Path, decoded: DecodedText
) -> NormalizedDocument:
    """변환한 SRT 를 정규화하고 원본 파일의 해시·인코딩 정보를 남긴다."""
    doc = normalize_srt(srt_text.encode("utf-8"), source_path=str(path), encoding="utf-8")
    return doc.model_copy(
        update={
            "source_sha256": hashlib.sha256(original).hexdigest(),
            "encoding": decoded.encoding,
            "encoding_confidence": decoded.confidence,
            "had_bom": decoded.had_bom,
        }
    )
