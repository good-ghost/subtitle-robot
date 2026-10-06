"""실제 mkvextract·ffmpeg 로 샘플을 추출한다 (도구가 있을 때만)."""

import hashlib
import shutil
from pathlib import Path

from subtitle_robot.media.extract import extract_subtitles
from subtitle_robot.media.probe import probe
from tests.media.conftest import MediaSamples, requires_media_tools

pytestmark = requires_media_tools


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _copy(video: Path, folder: Path) -> Path:
    folder.mkdir()
    return Path(shutil.copy2(video, folder / video.name))


def test_extract_real_mkv(media_samples: MediaSamples, tmp_path: Path) -> None:
    video = _copy(media_samples.mkv, tmp_path / "media")
    before = _sha256(video)

    result = extract_subtitles(probe(video), tmp_path / "work")

    assert _sha256(video) == before  # 동영상은 읽기만 한다
    assert sorted(p.name for p in video.parent.iterdir()) == sorted(
        [
            "Movie (2020).mkv",
            "Movie (2020).en.srt",
            "Movie (2020).en.forced.srt",
            "Movie (2020).en.sdh.srt",
            "Movie (2020).ja.ass",
            "Movie (2020).ja.srt",
            "Movie (2020).ko.vtt",
        ]
    )  # 변환본·임시 파일은 동영상 옆에 없다
    by_name = {e.planned.name: e for e in result.extracted}
    assert "Hello there." in by_name["Movie (2020).en.srt"].planned.read_text(encoding="utf-8-sig")
    assert "{\\an8}こんにちは" in by_name["Movie (2020).ja.ass"].planned.read_text(
        encoding="utf-8-sig"
    )
    ass_input = by_name["Movie (2020).ja.ass"].translation_input
    assert ass_input.parent == tmp_path / "work" / "tracks"
    assert ass_input.read_text(encoding="utf-8") == (
        "1\n00:00:00,500 --> 00:00:01,500\n{\\an8}こんにちは\n"
    )
    assert "Hello VTT." in by_name["Movie (2020).ko.vtt"].translation_input.read_text(
        encoding="utf-8"
    )


def test_extract_real_mp4_detects_undetermined_language(
    media_samples: MediaSamples, tmp_path: Path
) -> None:
    video = _copy(media_samples.mp4, tmp_path / "media")
    before = _sha256(video)

    result = extract_subtitles(probe(video), tmp_path / "work")

    assert _sha256(video) == before
    assert [(e.planned.name, e.detected) for e in result.extracted] == [
        ("Show S01E02.en.srt", False),
        ("Show S01E02.ja.srt", False),
        ("Show S01E02.en.forced.srt", True),  # und → 내용(영어)으로 판정
    ]
    ja = result.extracted[1].sidecar
    assert ja is not None
    assert "こんにちは。" in ja.read_text(encoding="utf-8-sig")
