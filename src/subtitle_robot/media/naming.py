"""사이드카 자막 파일 이름 (PROJECT-PLAN §21.4, WI-5.002).

`<영상 이름>.<언어>[.<순번>][.sdh][.forced].<확장자>` — Jellyfin·Plex 가 읽는 규칙이다.
순번은 같은 이름이 될 때만 컨테이너 순서상 두 번째부터 붙인다.
"""

from __future__ import annotations

from collections import Counter
from collections.abc import Sequence
from pathlib import Path

from subtitle_robot.media.tracks import Container, SubtitleKind, SubtitleTrack

_MKV_EXTENSIONS: dict[SubtitleKind, str] = {
    "srt": "srt",
    "ass": "ass",
    "webvtt": "vtt",
}


def sidecar_extension(track: SubtitleTrack, container: Container) -> str:
    """사이드카 확장자. MKV 는 원본 형식, MP4 는 ffmpeg 가 SRT 로 뽑는다.

    Raises:
        ValueError: 추출하지 않는 트랙(이미지·모르는 코덱)이다.
    """
    if not track.is_text:
        raise ValueError(f"텍스트 트랙이 아니다: {track.codec}")
    if container == "mp4":
        return "srt"
    try:
        return _MKV_EXTENSIONS[track.kind]
    except KeyError as exc:
        raise ValueError(f"MKV 에서 추출하지 않는 코덱: {track.codec}") from exc


def plan_sidecar_names(
    video: Path,
    tracks: Sequence[tuple[SubtitleTrack, str]],
    container: Container,
    *,
    directory: Path | None = None,
) -> dict[int, Path]:
    """트랙(컨테이너 순서)과 언어로 사이드카 경로를 정한다.

    Args:
        video: 동영상 경로. 이름(확장자 제외)이 사이드카 이름 앞부분이 된다.
        tracks: (트랙, 언어) 목록. 컨테이너 순서여야 순번이 맞다.
        container: 컨테이너 종류 (확장자 결정).
        directory: 사이드카 폴더. 없으면 동영상 옆.

    Returns:
        트랙 order → 사이드카 경로.
    """
    folder = directory or video.parent
    used: Counter[str] = Counter()
    names: dict[int, Path] = {}
    for track, language in sorted(tracks, key=lambda item: item[0].order):
        flags = (".sdh" if track.is_sdh else "") + (".forced" if track.forced else "")
        extension = sidecar_extension(track, container)
        key = f"{language}{flags}.{extension}"
        used[key] += 1
        number = f".{used[key]}" if used[key] > 1 else ""
        names[track.order] = folder / f"{video.stem}.{language}{number}{flags}.{extension}"
    return names


def find_existing(target: Path) -> Path | None:
    """같은 폴더에서 대소문자를 무시하고 같은 이름의 파일을 찾는다.

    §21.11: `Movie.EN.srt` 도 `Movie.en.srt` 와 충돌로 본다.
    """
    if target.exists():
        return target
    folder = target.parent
    if not folder.is_dir():
        return None
    wanted = target.name.casefold()
    return next((path for path in folder.iterdir() if path.name.casefold() == wanted), None)
