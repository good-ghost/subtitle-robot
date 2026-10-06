"""자막 트랙 추출 → 사이드카 + 번역 입력 (PROJECT-PLAN §21.4, WI-5.002).

`langs`(설정 `extract_langs` + 대상 언어·원어)의 텍스트 트랙과 소스 후보 첫 트랙을 추출한다
(번역 여부와 무관). 도구 한 번 실행으로 작업 폴더에 뽑은 뒤
사이드카 폴더에 임시 파일로 복사하고 rename 한다 (작업 폴더와 미디어 폴더가 다른 파일 시스템이어도
원자적). 번역 입력용 SRT 변환본은 작업 폴더에만 둔다.
규칙은 WI-5.002.
"""

from __future__ import annotations

import os
import shutil
import tempfile
from collections.abc import Callable, Collection, Sequence
from dataclasses import dataclass, field
from pathlib import Path

from subtitle_robot.io.atomic import atomic_write_text, default_file_mode
from subtitle_robot.io.convert import SubtitleConversionError, ass_to_srt, vtt_to_srt
from subtitle_robot.io.langdetect import detect_content_language
from subtitle_robot.io.normalize import normalize_srt_file
from subtitle_robot.media.commands import CommandResult, MediaToolError, Runner, run_command
from subtitle_robot.media.naming import find_existing, plan_sidecar_names, sidecar_extension
from subtitle_robot.media.probe import ProbeResult
from subtitle_robot.media.tracks import SubtitleTrack

MKVEXTRACT = "mkvextract"
FFMPEG = "ffmpeg"
# mkvextract·ffmpeg 는 자막 블록이 영상 전체에 흩어져 있어 파일을 끝까지 읽는다
# (네트워크 마운트의 대용량 파일 기준)
EXTRACT_TIMEOUT_S = 1800
DEFAULT_LANGS: tuple[str, ...] = ("en", "ja", "ko")
# mkvextract 종료 코드: 0 성공, 1 경고, 2 오류
_MKVEXTRACT_ERROR = 2

# (임시 파일, 대상 경로) → 실제로 쓴 경로. 쓰지 않았으면 None (임시 파일 정리는 호출자가 한다)
Installer = Callable[[Path, Path], Path | None]


class ExtractionError(MediaToolError):
    """자막 추출 실패."""


@dataclass(frozen=True)
class ExtractedTrack:
    """추출한 트랙.

    Attributes:
        track: 원래 트랙.
        language: 정한 언어 (ISO 639-1).
        sidecar: 쓴 사이드카 경로. 같은 이름의 파일이 있어 쓰지 않았으면 None.
        planned: 사이드카 이름 (썼든 못 썼든).
        translation_input: 번역 입력 SRT (작업 폴더).
        detected: 언어를 내용으로 감지했다 (트랙 언어 미지정).
        raw: 작업 폴더에 뽑은 원본 형식 파일 (ASS 트랙이면 `.ass`, WI-6.003).
            없으면 번역 입력과 같다.
    """

    track: SubtitleTrack
    language: str
    sidecar: Path | None
    planned: Path
    translation_input: Path
    detected: bool = False
    raw: Path | None = None


@dataclass(frozen=True)
class SkippedTrack:
    """추출하지 않은 트랙과 사유."""

    track: SubtitleTrack
    reason: str


@dataclass
class ExtractionResult:
    """추출 결과."""

    video: Path
    extracted: list[ExtractedTrack] = field(default_factory=list)
    skipped: list[SkippedTrack] = field(default_factory=list)

    def languages(self) -> set[str]:
        """추출한 트랙의 언어."""
        return {item.language for item in self.extracted}


def keep_existing(temp: Path, target: Path) -> Path | None:
    """같은 이름(대소문자 무시)의 파일이 있으면 쓰지 않는다. 기존 파일 이름 변경은 WI-5.003."""
    if find_existing(target) is not None:
        return None
    temp.replace(target)
    return target


def run_extract_command(args: Sequence[str]) -> CommandResult:
    """추출 명령 실행 (파일 전체를 읽으므로 긴 제한 시간)."""
    return run_command(args, timeout=EXTRACT_TIMEOUT_S)


def extract_subtitles(
    result: ProbeResult,
    work_dir: Path,
    *,
    langs: Sequence[str] = DEFAULT_LANGS,
    always: Collection[int] = (),
    sidecar_dir: Path | None = None,
    install: Installer = keep_existing,
    run: Runner = run_extract_command,
) -> ExtractionResult:
    """텍스트 트랙을 사이드카로 추출하고 번역 입력 SRT 를 작업 폴더에 만든다.

    Args:
        result: Probe 결과.
        work_dir: 작업 폴더 (추출 원본·변환본).
        langs: 추출할 언어.
        always: 언어와 관계없이 추출할 트랙 순서 (소스 후보 첫 트랙, §26.6). 텍스트 트랙만.
        sidecar_dir: 사이드카 폴더. 없으면 동영상 옆.
        install: 임시 파일을 사이드카 자리에 놓는 방법 (기본: 기존 파일이 있으면 쓰지 않음).
        run: 명령 실행기.

    Raises:
        ExtractionError: 도구가 오류로 끝났거나 결과 파일이 없다.
        MediaToolError: 도구가 없거나 시간 안에 끝나지 않았다.
    """
    extraction = ExtractionResult(result.path)
    candidates: list[SubtitleTrack] = []
    for track in result.tracks:
        reason = _skip_reason(track, langs, any_language=track.order in always)
        if reason:
            extraction.skipped.append(SkippedTrack(track, reason))
        else:
            candidates.append(track)
    if not candidates:
        return extraction

    tracks_dir = work_dir / "tracks"
    tracks_dir.mkdir(parents=True, exist_ok=True)
    raw = {
        track.order: tracks_dir / f"track{track.order}.{sidecar_extension(track, result.container)}"
        for track in candidates
    }
    _extract_raw(result, candidates, raw, run)

    decided: list[tuple[SubtitleTrack, str, Path, bool]] = []
    for track in candidates:
        try:
            srt_input = _translation_input(raw[track.order])
        except SubtitleConversionError as exc:
            extraction.skipped.append(SkippedTrack(track, f"SRT 변환 실패: {exc}"))
            continue
        language = track.effective_language
        detected = language is None
        if language is None:
            texts = [block.text for block in normalize_srt_file(srt_input).blocks]
            language = detect_content_language(texts)
        if language is None or (language not in langs and track.order not in always):
            extraction.skipped.append(SkippedTrack(track, f"내용 언어 {language or '판단 불가'}"))
            continue
        decided.append((track, language, srt_input, detected))

    names = plan_sidecar_names(
        result.path,
        [(track, language) for track, language, _, _ in decided],
        result.container,
        directory=sidecar_dir,
    )
    for track, language, srt_input, detected in decided:
        target = names[track.order]
        sidecar = _install_copy(raw[track.order], target, install)
        extraction.extracted.append(
            ExtractedTrack(
                track, language, sidecar, target, srt_input, detected, raw=raw[track.order]
            )
        )
    return extraction


def _skip_reason(
    track: SubtitleTrack, langs: Sequence[str], *, any_language: bool = False
) -> str | None:
    if track.is_image:
        return "이미지 자막 (OCR 범위 밖)"
    if not track.is_text:
        return f"다루지 않는 코덱 {track.codec}"
    language = track.effective_language
    if language is not None and language not in langs and not any_language:
        return f"언어 {language}"
    return None


def _extract_raw(
    result: ProbeResult,
    tracks: Sequence[SubtitleTrack],
    raw: dict[int, Path],
    run: Runner,
) -> None:
    """도구 한 번 실행으로 모든 트랙을 작업 폴더에 뽑는다 (파일을 한 번만 읽는다)."""
    for path in raw.values():
        path.unlink(missing_ok=True)
    if result.container == "mkv":
        args = [MKVEXTRACT, str(result.path), "tracks", "-q"]
        args += [f"{track.track_id}:{raw[track.order]}" for track in tracks]
        completed = run(args)
        failed = completed.returncode >= _MKVEXTRACT_ERROR
    else:
        args = [FFMPEG, "-v", "error", "-nostdin", "-y", "-i", str(result.path)]
        for track in tracks:
            args += ["-map", f"0:s:{track.order}", "-c:s", "srt", str(raw[track.order])]
        completed = run(args)
        failed = completed.returncode != 0
    if failed:
        raise ExtractionError(f"{args[0]} 실패 ({result.path}): {completed.tail()}")
    missing = [str(path) for path in raw.values() if not path.is_file()]
    if missing:
        raise ExtractionError(f"추출 결과가 없다: {', '.join(missing)}")


def _translation_input(raw: Path) -> Path:
    """번역 입력 SRT. SRT 는 추출본 그대로, ASS·VTT 는 작업 폴더에 변환본을 만든다."""
    suffix = raw.suffix.lower()
    if suffix == ".srt":
        return raw
    text = raw.read_text(encoding="utf-8-sig", errors="replace")
    converted = ass_to_srt(text) if suffix == ".ass" else vtt_to_srt(text)
    target = raw.with_name(f"{raw.stem}.converted.srt")
    atomic_write_text(target, converted)
    return target


def _install_copy(source: Path, target: Path, install: Installer) -> Path | None:
    """작업 폴더의 추출본을 대상 폴더의 임시 파일로 복사한 뒤 설치한다.

    임시 파일은 남기지 않는다.
    """
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(dir=target.parent, prefix=f".{target.name}.", suffix=".tmp")
    temp = Path(temp_name)
    try:
        os.fchmod(fd, default_file_mode())
        with os.fdopen(fd, "wb") as handle, source.open("rb") as src:
            shutil.copyfileobj(src, handle)
            handle.flush()
            os.fsync(handle.fileno())
        return install(temp, target)
    finally:
        temp.unlink(missing_ok=True)
