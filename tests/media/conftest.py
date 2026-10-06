"""실제 mkvtoolnix·ffmpeg 로 작은 샘플 동영상을 만든다 (도구가 있을 때만).

자막 텍스트는 직접 만든 것이다. 도구가 없는 환경에서는 실측 테스트를 건너뛰고, 출력 해석은 저장해 둔
실제 출력(tests/fixtures/media)으로 검사한다.
"""

from __future__ import annotations

import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

import pytest

MEDIA_TOOLS = ("mkvmerge", "mkvextract", "ffmpeg", "ffprobe")
HAS_MEDIA_TOOLS = all(shutil.which(tool) for tool in MEDIA_TOOLS)
requires_media_tools = pytest.mark.skipif(
    not HAS_MEDIA_TOOLS, reason="mkvtoolnix·ffmpeg 가 없다 (실측 테스트)"
)

EN_SRT = "1\n00:00:00,500 --> 00:00:01,500\nHello there.\n"
JA_SRT = "1\n00:00:00,500 --> 00:00:01,500\nこんにちは。\n"
JA_ASS = """[Script Info]
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, \
Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, \
Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,\
2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.50,0:00:01.50,Default,,0,0,0,,{\\an8}こんにちは
"""
EN_VTT = "WEBVTT\n\n00:00:00.500 --> 00:00:01.500\nHello VTT.\n"


@dataclass(frozen=True)
class MediaSamples:
    """샘플 동영상 경로."""

    mkv: Path
    mp4: Path


def run_tool(args: list[str]) -> None:
    """미디어 도구를 실행한다 (실패하면 예외)."""
    subprocess.run(args, check=True, capture_output=True)  # noqa: S603 — 테스트용 고정 인자


@pytest.fixture(scope="session")
def media_samples(tmp_path_factory: pytest.TempPathFactory) -> MediaSamples:
    """MKV: SRT·forced·SDH·ASS·und·WebVTT 트랙, MP4: mov_text 3개 (en·ja·und forced)."""
    if not HAS_MEDIA_TOOLS:
        pytest.skip("mkvtoolnix·ffmpeg 가 없다")
    root = tmp_path_factory.mktemp("media")
    for name, text in {
        "en.srt": EN_SRT,
        "ja.srt": JA_SRT,
        "ja.ass": JA_ASS,
        "en.vtt": EN_VTT,
    }.items():
        (root / name).write_text(text, encoding="utf-8")
    video = root / "video.mkv"
    run_tool(
        [
            "ffmpeg",
            "-v",
            "error",
            "-y",
            "-f",
            "lavfi",
            "-i",
            "color=c=black:s=64x64:d=2",
            "-c:v",
            "mpeg4",
            str(video),
        ]
    )
    mkv = root / "Movie (2020).mkv"
    run_tool(
        [
            "mkvmerge",
            "-q",
            "-o",
            str(mkv),
            str(video),
            "--language",
            "0:eng",
            "--track-name",
            "0:English",
            str(root / "en.srt"),
            "--language",
            "0:en-US",
            "--forced-display-flag",
            "0:1",
            "--track-name",
            "0:Signs & Songs",
            str(root / "en.srt"),
            "--language",
            "0:eng",
            "--hearing-impaired-flag",
            "0:1",
            "--track-name",
            "0:English SDH",
            str(root / "en.srt"),
            "--language",
            "0:jpn",
            "--default-track-flag",
            "0:0",
            str(root / "ja.ass"),
            "--language",
            "0:und",
            "--track-name",
            "0:日本語",
            str(root / "ja.srt"),
            "--language",
            "0:kor",
            str(root / "en.vtt"),
        ]
    )
    mp4 = root / "Show S01E02.mp4"
    run_tool(
        [
            "ffmpeg",
            "-v",
            "error",
            "-y",
            "-f",
            "lavfi",
            "-i",
            "color=c=black:s=64x64:d=2",
            "-i",
            str(root / "en.srt"),
            "-i",
            str(root / "ja.srt"),
            "-i",
            str(root / "en.srt"),
            "-map",
            "0",
            "-map",
            "1",
            "-map",
            "2",
            "-map",
            "3",
            "-c:v",
            "mpeg4",
            "-c:s",
            "mov_text",
            "-metadata:s:s:0",
            "language=eng",
            "-metadata:s:s:1",
            "language=jpn",
            "-metadata:s:s:2",
            "language=und",
            "-disposition:s:0",
            "default",
            "-disposition:s:2",
            "forced",
            str(mp4),
        ]
    )
    return MediaSamples(mkv=mkv, mp4=mp4)
