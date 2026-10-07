"""외부 자막을 번역 소스로 쓰기와 SAMI 변환 (WI-5.004b, 사용자 요청 2026-10-07).

- 내장 텍스트 자막이 없는 영상은 옆의 외부 자막(SRT·ASS·SSA·VTT·SAMI)으로 번역한다.
  소스 고르기는 내장 트랙과 같다: 원어 → 영어 → 첫 후보 (대상 언어·일부 대사 제외).
- SAMI 는 언어 클래스마다 언어를 감지해 `<영상>.<언어>.srt` 사이드카로 바꾼다 (대상 언어 포함).
  같은 이름의 파일이 이미 있으면(사용자 파일) 건드리지 않는다. 바꾼 파일은 도구 출력으로 기록된다.
- 후보는 내장 트랙처럼 `ExtractedTrack`으로 만든다: 작업 폴더에 UTF-8 SRT(번역 입력)를 두고,
  ASS 는 원본 형식도 둔다 (ASS 출력, WI-6.003).
"""

from __future__ import annotations

import logging
from collections.abc import Callable, Collection, Sequence
from pathlib import Path

from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.io.convert import SubtitleConversionError, ass_to_srt, vtt_to_srt
from subtitle_robot.io.encoding import EncodingDetectionError, decode_subtitle
from subtitle_robot.io.langdetect import detect_content_language
from subtitle_robot.io.normalize import normalize_srt
from subtitle_robot.io.sami import SAMI_SUFFIXES, SamiError, read_sami
from subtitle_robot.lang.codes import normalize_language
from subtitle_robot.media.extract import ExtractedTrack
from subtitle_robot.media.tracks import SubtitleKind, SubtitleTrack

logger = logging.getLogger(__name__)

# 번역 소스로 읽을 수 있는 외부 자막 (이미지 자막 .sub·.idx·.sup 은 OCR, media.ocr_source)
_KINDS: dict[str, SubtitleKind] = {".srt": "srt", ".ass": "ass", ".ssa": "ass", ".vtt": "webvtt"}
# 외부 자막 후보의 순서: 내장 트랙 뒤에 둔다 (판정 사유·기록에서 구별)
EXTERNAL_ORDER_BASE = 1000
EXTERNAL_TRACK_ID = -1
# 사이드카 이름의 표시 중 언어가 아닌 것 (select._FLAG_TOKENS 와 같은 뜻)
_FLAGS = frozenset({"forced", "sdh", "cc", "hi", "default", "orig", "full", "signs", "songs"})
_HEARING_IMPAIRED = frozenset({"sdh", "cc", "hi"})

# 사이드카를 쓰는 함수 (SidecarWriter.write_text): 썼으면 경로, 쓰지 않았으면 None
TextWriter = Callable[[Path, str], Path | None]


def _tokens(video: Path, subtitle: Path) -> list[str]:
    middle = subtitle.name[len(video.stem) + 1 : len(subtitle.name) - len(subtitle.suffix)]
    return [token for token in middle.casefold().split(".") if token]


def _named_language(tokens: Sequence[str]) -> str | None:
    for token in tokens:
        if token not in _FLAGS and not token.isdigit():
            language = normalize_language(token)
            if language:
                return language
    return None


def convert_sami_sidecars(
    video: Path,
    subtitles: Sequence[Path],
    *,
    sidecar_dir: Path,
    write: TextWriter,
    tool_outputs: Collection[Path] = (),
) -> list[Path]:
    """외부 SAMI 를 언어별 SRT 사이드카로 바꾼다. 쓴 파일 목록 (이미 있는 이 도구의 출력 포함).

    같은 이름의 사용자 파일이 있거나 언어를 정하지 못한 클래스는 건너뛴다. SAMI 를 읽지 못하면
    로그만 남기고 건너뛴다 (번역은 다른 후보로 계속한다).
    """
    own = {str(path).casefold() for path in tool_outputs}
    written: list[Path] = []
    for subtitle in subtitles:
        if subtitle.suffix.lower() not in SAMI_SUFFIXES:
            continue
        try:
            tracks = read_sami(subtitle.read_bytes())
        except (SamiError, EncodingDetectionError, OSError) as exc:
            logger.warning("SAMI %s could not be read, skipped: %s", subtitle.name, exc)
            continue
        flags = [token for token in _tokens(video, subtitle) if token in _FLAGS]
        for track in tracks:
            if track.language is None:
                continue
            name = ".".join([video.stem, track.language, *flags, "srt"])
            target = sidecar_dir / name
            if target.exists() and str(target).casefold() not in own:
                logger.info("SAMI %s: %s already exists, not converted", subtitle.name, name)
                continue
            path = write(target, track.to_srt())
            if path is not None:
                written.append(path)
    return written


def external_sources(
    video: Path,
    subtitles: Sequence[Path],
    work_dir: Path,
    *,
    target: str,
) -> list[ExtractedTrack]:
    """외부 자막을 번역 소스 후보로 만든다. 대상 언어·언어를 정하지 못한 파일·SAMI 원본은 뺀다.

    Args:
        video: 영상.
        subtitles: 후보로 볼 외부 자막 (이 도구가 만든 번역 결과는 호출자가 뺀다. SAMI 를 바꾼
            SRT 는 넣는다).
        work_dir: 번역 입력 SRT 를 둘 작업 폴더.
        target: 번역 대상 언어.
    """
    sources: list[ExtractedTrack] = []
    folder = work_dir / "external"
    for index, subtitle in enumerate(sorted(subtitles, key=lambda path: path.name.casefold())):
        suffix = subtitle.suffix.lower()
        kind = _KINDS.get(suffix)
        tokens = _tokens(video, subtitle)
        if kind is None or "orig" in tokens:  # .orig 는 이 도구가 이름을 바꿔 보존한 원래 파일
            continue
        try:
            text = decode_subtitle(subtitle.read_bytes()).text
            srt = (
                ass_to_srt(text)
                if kind == "ass"
                else vtt_to_srt(text)
                if kind == "webvtt"
                else text
            )
        except (EncodingDetectionError, SubtitleConversionError, OSError) as exc:
            logger.warning(
                "external subtitle %s could not be read, skipped: %s", subtitle.name, exc
            )
            continue
        language = _named_language(tokens)
        detected = language is None
        if language is None:
            doc = normalize_srt(srt.encode("utf-8"), source_path=str(subtitle))
            language = detect_content_language(block.text for block in doc.blocks)
        if language is None or language == target:
            continue
        folder.mkdir(parents=True, exist_ok=True)
        srt_input = folder / f"external{index}.srt"
        atomic_write_text(srt_input, srt)
        raw = None
        if kind == "ass":
            raw = folder / f"external{index}.ass"
            atomic_write_text(raw, text)
        track = SubtitleTrack(
            order=EXTERNAL_ORDER_BASE + index,
            track_id=EXTERNAL_TRACK_ID,
            codec=f"external{suffix}",
            kind=kind,
            language=language,
            language_raw="",
            name=subtitle.name,
            forced="forced" in tokens,
            default=False,
            hearing_impaired=bool(_HEARING_IMPAIRED.intersection(tokens)),
        )
        sources.append(
            ExtractedTrack(track, language, subtitle, subtitle, srt_input, detected, raw=raw)
        )
    return sources


def is_external(source: ExtractedTrack) -> bool:
    """외부 자막에서 만든 소스인지."""
    return source.track.track_id == EXTERNAL_TRACK_ID
