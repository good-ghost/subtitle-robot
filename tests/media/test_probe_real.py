"""실제 mkvmerge·ffprobe 로 샘플을 검사한다 (도구가 있을 때만)."""

from subtitle_robot.media.probe import probe
from tests.media.conftest import MediaSamples, requires_media_tools

pytestmark = requires_media_tools


def test_probe_real_mkv(media_samples: MediaSamples) -> None:
    result = probe(media_samples.mkv)

    assert result.container == "mkv"
    assert [(t.kind, t.effective_language, t.forced, t.is_sdh) for t in result.tracks] == [
        ("srt", "en", False, False),
        ("srt", "en", True, False),
        ("srt", "en", False, True),
        ("ass", "ja", False, False),
        ("srt", "ja", False, False),
        ("webvtt", "ko", False, False),
    ]
    assert result.segment_uid


def test_probe_real_mp4(media_samples: MediaSamples) -> None:
    result = probe(media_samples.mp4)

    assert result.container == "mp4"
    assert [(t.kind, t.language, t.forced) for t in result.tracks] == [
        ("mov_text", "en", False),
        ("mov_text", "ja", False),
        ("mov_text", None, True),
    ]
