"""이미지 자막을 OCR 해 번역 소스로 쓰기 (WI-5.004c, 사용자 요청 2026-10-07).

텍스트 자막(내장·외부)이 없고 이미지 자막만 있을 때, `[media] ocr = true` 이고 Tesseract 가 있으면
이미지 자막 하나를 골라 읽는다. CPU 를 많이 쓰므로 기본은 끄고, 성능 좋은 PC 에서 `ocr` 이미지
태그로 켠다 (운영 서버는 끈 채로 둔다).

- 후보: MKV 의 PGS·VobSub 트랙, 옆의 `.sup`·`.idx`(+`.sub`) 파일.
  MP4 의 이미지 트랙은 다루지 않는다.
- 고르기는 텍스트 트랙과 같다: 원어 → 영어 → 순서상 첫 후보 (대상 언어·일부 대사 트랙 제외).
  언어 표시가 없으면 원어(없으면 영어)로 읽고 내용으로 언어를 확인한다.
- 읽은 결과는 `<영상>.<언어>.srt` 사이드카로 남기고(호출자) 번역 입력으로 쓴다.
- 결과는 작업 폴더에 두어 실패한 작업을 다시 처리할 때 다시 읽지 않는다
  (영상 크기·수정 시각이 같을 때).
"""

from __future__ import annotations

import json
import logging
import os
from collections.abc import Collection, Sequence
from dataclasses import dataclass
from pathlib import Path

from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.io.langdetect import detect_content_language
from subtitle_robot.io.normalize import normalize_srt
from subtitle_robot.lang.codes import language_name, normalize_language
from subtitle_robot.media.commands import Runner
from subtitle_robot.media.external import EXTERNAL_TRACK_ID
from subtitle_robot.media.extract import MKVEXTRACT, ExtractedTrack, ExtractionError
from subtitle_robot.media.probe import ProbeResult
from subtitle_robot.media.select import FALLBACK_SOURCE_LANGUAGE, is_partial_track
from subtitle_robot.media.tracks import SubtitleTrack
from subtitle_robot.ocr.subtitle import PGS_SUFFIX, ocr_events, read_image_events, vobsub_pair
from subtitle_robot.ocr.tesseract import tesseract_language

logger = logging.getLogger(__name__)

# MKV 이미지 코덱 → mkvextract 로 뽑을 파일 확장자 (VobSub 는 .sub 옆에 .idx 를 만든다)
_MKV_IMAGE_SUFFIXES: dict[str, str] = {"S_HDMV/PGS": ".sup", "S_VOBSUB": ".sub"}
# 외부 이미지 자막 후보의 순서 (내장 트랙·외부 텍스트 자막 뒤)
OCR_EXTERNAL_ORDER_BASE = 2000
OCR_DIR = "ocr"
_MKVEXTRACT_ERROR = 2
_FLAGS = frozenset({"forced", "sdh", "cc", "hi", "default", "orig", "full", "signs", "songs"})
_HEARING_IMPAIRED = frozenset({"sdh", "cc", "hi"})


@dataclass(frozen=True)
class ImageCandidate:
    """OCR 후보 하나.

    Attributes:
        track: 내장 트랙, 또는 외부 파일을 나타내는 트랙 (track_id -1).
        path: 외부 파일 (`.sup`·`.idx`). 내장 트랙이면 None (뽑아서 쓴다).
    """

    track: SubtitleTrack
    path: Path | None = None

    @property
    def language(self) -> str | None:
        """트랙·파일 이름의 언어."""
        return self.track.effective_language


@dataclass(frozen=True)
class OcrSource:
    """OCR 결과.

    Attributes:
        source: 번역 소스 (SRT 는 작업 폴더). 읽지 못했으면 None.
        note: 판정 사유에 붙일 설명.
        images: 그림 수.
        blocks: 읽은 자막 수.
    """

    source: ExtractedTrack | None
    note: str
    images: int = 0
    blocks: int = 0


def image_candidates(probed: ProbeResult, subtitles: Sequence[Path]) -> list[ImageCandidate]:
    """OCR 할 수 있는 이미지 자막: MKV 의 PGS·VobSub 트랙과 외부 `.sup`·`.idx` 파일."""
    candidates: list[ImageCandidate] = []
    if probed.container == "mkv":
        candidates += [
            ImageCandidate(track)
            for track in sorted(probed.tracks, key=lambda item: item.order)
            if track.codec.upper() in _MKV_IMAGE_SUFFIXES
        ]
    video = probed.path
    # .orig 는 이 도구가 이름을 바꿔 보존한 원래 파일이다
    files = [
        path
        for path in sorted(subtitles, key=lambda item: item.name.casefold())
        if (path.suffix.lower() == PGS_SUFFIX
            or (path.suffix.lower() == ".idx" and vobsub_pair(path, ".sub") is not None))
        and "orig" not in _tokens(video, path)
    ]  # fmt: skip
    for index, path in enumerate(files):
        tokens = _tokens(video, path)
        language = next(
            (normalize_language(t) for t in tokens if t not in _FLAGS and normalize_language(t)),
            None,
        )
        track = SubtitleTrack(
            order=OCR_EXTERNAL_ORDER_BASE + index,
            track_id=EXTERNAL_TRACK_ID,
            codec=f"external{path.suffix.lower()}",
            kind="image",
            language=language,
            language_raw="",
            name=path.name,
            forced="forced" in tokens,
            default=False,
            hearing_impaired=bool(_HEARING_IMPAIRED.intersection(tokens)),
        )
        candidates.append(ImageCandidate(track, path))
    return candidates


def _tokens(video: Path, subtitle: Path) -> list[str]:
    middle = subtitle.name[len(video.stem) + 1 : len(subtitle.name) - len(subtitle.suffix)]
    return [token for token in middle.casefold().split(".") if token]


def pick_image(
    candidates: Sequence[ImageCandidate],
    *,
    original: str | None,
    target: str,
    skip_forced: bool,
) -> ImageCandidate | None:
    """OCR 할 후보: 원어 → 영어 → 순서상 첫 후보. 대상 언어·일부 대사 트랙은 뺀다."""
    usable = [
        item
        for item in candidates
        if item.language != target and not (skip_forced and is_partial_track(item.track))
    ]
    for language in dict.fromkeys(code for code in (original, FALLBACK_SOURCE_LANGUAGE) if code):
        preferred = [item for item in usable if item.language == language]
        if preferred:
            return preferred[0]
    return usable[0] if usable else None


def ocr_source(
    video: Path,
    candidate: ImageCandidate,
    work_dir: Path,
    *,
    original: str | None,
    target: str,
    installed: Collection[str],
    extract_run: Runner,
    ocr_run: Runner,
    workers: int,
) -> OcrSource:
    """후보를 읽어 번역 소스로 만든다.

    Args:
        video: 영상.
        candidate: 고른 후보.
        work_dir: 작업 폴더 (`ocr/` 아래에 뽑은 파일·그림·결과를 둔다).
        original: 작품 원어 (언어 표시 없는 후보를 읽을 언어).
        target: 번역 대상 언어.
        installed: Tesseract 에 설치된 언어 데이터.
        extract_run: mkvextract 실행기.
        ocr_run: Tesseract 실행기.
        workers: 동시에 돌릴 Tesseract 수.

    Raises:
        ExtractionError: 내장 트랙을 뽑지 못했다.
        OcrError: Tesseract 가 실패했다.
        MediaToolError: 도구가 없거나 시간 안에 끝나지 않았다.
    """
    folder = work_dir / OCR_DIR
    folder.mkdir(parents=True, exist_ok=True)
    order = candidate.track.order
    srt_path = folder / f"track{order}.srt"
    stamp = _video_stamp(video)
    cached = _cached_language(srt_path, stamp)
    label = _label(candidate)
    if cached is not None:
        logger.info("OCR of %s reused from %s", label, srt_path)
        return _result(candidate, cached, srt_path, f"OCR {label} (이전 결과)", 0, 0)

    path = candidate.path or _extract(video, candidate.track, folder, extract_run)
    try:
        events, declared = read_image_events(path)
    except (ValueError, OSError) as exc:
        return OcrSource(None, f"이미지 자막 {label} 을 읽지 못함: {exc}")
    if not events:
        return OcrSource(None, f"이미지 자막 {label} 에 그림이 없음")
    language = candidate.language or declared
    guess = language or next(
        (code for code in (original, FALLBACK_SOURCE_LANGUAGE) if code and _has(code, installed)),
        FALLBACK_SOURCE_LANGUAGE,
    )
    if not _has(guess, installed):
        return OcrSource(None, f"Tesseract 에 {language_name(guess)}({guess}) 언어 데이터 없음")
    result = ocr_events(
        events, _name(guess), folder / f"pages{order}", run=ocr_run, workers=workers
    )
    if language is None:
        detected = _detect(result.srt)
        if detected is not None and detected != guess and _has(detected, installed):
            logger.info("OCR of %s read as %s, re-reading as %s", label, guess, detected)
            result = ocr_events(
                events, _name(detected), folder / f"pages{order}", run=ocr_run, workers=workers
            )
            guess = detected
        elif detected is not None and detected != guess:
            return OcrSource(None, f"OCR {label}: 내용 {detected}, Tesseract 언어 데이터 없음")
    if result.blocks == 0:
        return OcrSource(None, f"OCR {label}: 읽은 글자 없음 (그림 {result.images}장)")
    if guess == target:
        return OcrSource(None, f"OCR {label}: 대상 언어 자막")
    atomic_write_text(srt_path, result.srt)
    _write_stamp(srt_path, stamp, guess)
    note = f"OCR {label} (그림 {result.images}장 → 자막 {result.blocks}개)"
    return _result(
        candidate, guess, srt_path, note, result.images, result.blocks, detected=language is None
    )


def _result(
    candidate: ImageCandidate,
    language: str,
    srt_path: Path,
    note: str,
    images: int,
    blocks: int,
    *,
    detected: bool = False,
) -> OcrSource:
    track = candidate.track
    source = ExtractedTrack(
        track, language, None, candidate.path or srt_path, srt_path, detected=detected
    )
    return OcrSource(source, note, images, blocks)


def _label(candidate: ImageCandidate) -> str:
    track = candidate.track
    if candidate.path is not None:
        return candidate.path.name
    return f"트랙 #{track.order} ({track.codec}, {track.language or '언어 모름'})"


def _has(code: str, installed: Collection[str]) -> bool:
    name = tesseract_language(code)
    return name is not None and name in installed


def _name(code: str) -> str:
    name = tesseract_language(code)
    if name is None:  # _has 로 확인한 뒤에만 부른다
        raise ValueError(f"Tesseract 언어 이름을 모른다: {code}")
    return name


def _detect(srt: str) -> str | None:
    doc = normalize_srt(srt.encode("utf-8"), source_path="ocr.srt")
    return detect_content_language(block.text for block in doc.blocks)


def _extract(video: Path, track: SubtitleTrack, folder: Path, run: Runner) -> Path:
    """MKV 의 이미지 트랙을 뽑는다. VobSub 는 `.sub` 옆에 `.idx` 도 생긴다."""
    suffix = _MKV_IMAGE_SUFFIXES[track.codec.upper()]
    target = folder / f"track{track.order}{suffix}"
    target.unlink(missing_ok=True)
    completed = run([MKVEXTRACT, str(video), "tracks", "-q", f"{track.track_id}:{target}"])
    if completed.returncode >= _MKVEXTRACT_ERROR or not target.is_file():
        raise ExtractionError(f"{MKVEXTRACT} 실패 ({video}): {completed.tail()}")
    return target


def _video_stamp(video: Path) -> list[int]:
    stat = video.stat()
    return [stat.st_size, stat.st_mtime_ns]


def _stamp_path(srt_path: Path) -> Path:
    return srt_path.with_suffix(".json")


def _cached_language(srt_path: Path, stamp: list[int]) -> str | None:
    """같은 영상에서 읽어 둔 결과의 언어. 없거나 영상이 바뀌었으면 None."""
    meta = _stamp_path(srt_path)
    if not (srt_path.is_file() and meta.is_file()):
        return None
    try:
        saved = json.loads(meta.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    if not isinstance(saved, dict) or saved.get("video") != stamp:
        return None
    language = saved.get("language")
    return language if isinstance(language, str) else None


def _write_stamp(srt_path: Path, stamp: list[int], language: str) -> None:
    atomic_write_text(
        _stamp_path(srt_path), json.dumps({"video": stamp, "language": language}) + os.linesep
    )
