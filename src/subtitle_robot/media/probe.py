"""동영상 자막 트랙 검사 (PROJECT-PLAN §21.3, WI-5.001).

MKV 는 `mkvmerge -J`, MP4 는 `ffprobe` 로 검사한다. 트랙 번호 체계가 도구마다 다르므로
추출도 같은 계열 도구로 한다 (MKV → mkvextract, MP4 → ffmpeg). 동영상 파일은 읽기만 한다.
"""

from __future__ import annotations

import json
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from subtitle_robot.lang.codes import normalize_language
from subtitle_robot.media.commands import CommandResult, MediaToolError, Runner, run_command
from subtitle_robot.media.tracks import (
    Container,
    SubtitleTrack,
    classify_ffprobe_codec,
    classify_mkv_codec,
)

MKVMERGE = "mkvmerge"
FFPROBE = "ffprobe"
# 네트워크 마운트의 대용량 파일도 헤더만 읽으므로 이 안에 끝난다.
# 넘으면 아직 쓰는 중이거나 마운트 문제다
PROBE_TIMEOUT_S = 120
_CONTAINERS: dict[str, Container] = {".mkv": "mkv", ".mp4": "mp4", ".m4v": "mp4"}
# mkvmerge 종료 코드: 0 성공, 1 경고, 2 오류
_MKVMERGE_ERROR = 2
# ffmpeg 가 MP4 자막 트랙에 기본으로 넣는 핸들러 이름. 트랙 이름으로 보지 않는다
_DEFAULT_HANDLER_NAMES = frozenset({"SubtitleHandler", "Subtitle", ""})


class ProbeError(MediaToolError):
    """트랙 검사 실패 (인식 못 하는 파일, 출력 해석 실패)."""


@dataclass(frozen=True)
class ProbeResult:
    """검사 결과.

    Attributes:
        path: 동영상 경로.
        container: 컨테이너 종류.
        tracks: 자막 트랙 (컨테이너 순서).
        segment_uid: MKV segment UID (영상 식별 보조, §21.12). 없으면 None.
    """

    path: Path
    container: Container
    tracks: tuple[SubtitleTrack, ...]
    segment_uid: str | None = None

    @property
    def text_tracks(self) -> tuple[SubtitleTrack, ...]:
        """텍스트 자막 트랙."""
        return tuple(track for track in self.tracks if track.is_text)


def container_of(path: Path) -> Container | None:
    """확장자로 컨테이너를 정한다 (대소문자 무시). 다루지 않는 파일이면 None."""
    return _CONTAINERS.get(Path(path).suffix.lower())


def run_probe_command(args: Sequence[str]) -> CommandResult:
    """검사 명령 실행 (헤더만 읽으므로 짧은 제한 시간)."""
    return run_command(args, timeout=PROBE_TIMEOUT_S)


def probe(path: Path, *, run: Runner = run_probe_command) -> ProbeResult:
    """동영상의 자막 트랙을 검사한다.

    Raises:
        ProbeError: 다루지 않는 컨테이너, 도구 오류 종료, 출력 해석 실패.
        MediaToolError: 도구가 없거나 시간 안에 끝나지 않았다.
    """
    path = Path(path)
    container = container_of(path)
    if container == "mkv":
        result = run([MKVMERGE, "-J", str(path)])
        if result.returncode >= _MKVMERGE_ERROR:
            raise ProbeError(f"mkvmerge 실패 ({path}): {result.tail()}")
        return parse_mkvmerge(path, _load_json(result.stdout, path))
    if container == "mp4":
        result = run(
            [
                FFPROBE,
                "-v",
                "error",
                "-select_streams",
                "s",
                "-show_streams",
                "-of",
                "json",
                str(path),
            ]
        )
        if result.returncode != 0:
            raise ProbeError(f"ffprobe 실패 ({path}): {result.tail()}")
        return parse_ffprobe(path, _load_json(result.stdout, path))
    raise ProbeError(f"다루지 않는 컨테이너: {path}")


def parse_mkvmerge(path: Path, data: Mapping[str, Any]) -> ProbeResult:
    """`mkvmerge -J` 출력을 해석한다. 언어는 `language_ietf` 를 우선한다 (§21.3).

    Raises:
        ProbeError: 인식하지 못한 파일이거나 mkvmerge 가 오류를 보고했다.
    """
    container = data.get("container") or {}
    errors = data.get("errors") or []
    if errors or not container.get("recognized", False):
        detail = "; ".join(str(error) for error in errors) or "인식하지 못한 파일"
        raise ProbeError(f"mkvmerge: {path}: {detail}")
    tracks: list[SubtitleTrack] = []
    for track in data.get("tracks") or []:
        if track.get("type") != "subtitles":
            continue
        props = track.get("properties") or {}
        codec_id = str(props.get("codec_id", ""))
        raw = str(props.get("language_ietf") or props.get("language") or "")
        tracks.append(
            SubtitleTrack(
                order=len(tracks),
                track_id=int(track["id"]),
                codec=codec_id,
                kind=classify_mkv_codec(codec_id),
                language=normalize_language(raw),
                language_raw=raw,
                name=str(props.get("track_name") or ""),
                forced=bool(props.get("forced_track", False)),
                default=bool(props.get("default_track", False)),
                hearing_impaired=bool(props.get("flag_hearing_impaired", False)),
            )
        )
    segment_uid = (container.get("properties") or {}).get("segment_uid")
    return ProbeResult(path, "mkv", tuple(tracks), str(segment_uid) if segment_uid else None)


def parse_ffprobe(path: Path, data: Mapping[str, Any]) -> ProbeResult:
    """`ffprobe -show_streams` 출력을 해석한다 (자막 스트림만)."""
    tracks: list[SubtitleTrack] = []
    for stream in data.get("streams") or []:
        if stream.get("codec_type") != "subtitle":
            continue
        tags = stream.get("tags") or {}
        disposition = stream.get("disposition") or {}
        codec = str(stream.get("codec_name", ""))
        raw = str(tags.get("language") or "")
        name = str(tags.get("title") or tags.get("handler_name") or "")
        tracks.append(
            SubtitleTrack(
                order=len(tracks),
                track_id=int(stream["index"]),
                codec=codec,
                kind=classify_ffprobe_codec(codec),
                language=normalize_language(raw),
                language_raw=raw,
                name="" if name in _DEFAULT_HANDLER_NAMES else name,
                forced=bool(disposition.get("forced", 0)),
                default=bool(disposition.get("default", 0)),
                hearing_impaired=bool(disposition.get("hearing_impaired", 0)),
            )
        )
    return ProbeResult(path, "mp4", tuple(tracks))


def _load_json(text: str, path: Path) -> Mapping[str, Any]:
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ProbeError(f"검사 출력이 JSON 이 아니다 ({path}): {exc}") from exc
    if not isinstance(data, dict):
        raise ProbeError(f"검사 출력 형식이 다르다 ({path})")
    return data
