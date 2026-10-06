import copy
import json
from collections.abc import Sequence
from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.media.commands import CommandResult
from subtitle_robot.media.probe import (
    ProbeError,
    container_of,
    parse_ffprobe,
    parse_mkvmerge,
    probe,
)
from subtitle_robot.media.tracks import classify_ffprobe_codec, classify_mkv_codec

FIXTURES = Path(__file__).parent.parent / "fixtures" / "media"


def _fixture(name: str) -> dict[str, Any]:
    data: dict[str, Any] = json.loads((FIXTURES / name).read_text(encoding="utf-8"))
    return data


def test_mkvmerge_tracks_in_container_order() -> None:
    result = parse_mkvmerge(Path("sample.mkv"), _fixture("mkvmerge-sample.json"))

    summary = [
        (t.order, t.track_id, t.kind, t.language, t.name, t.forced, t.is_sdh) for t in result.tracks
    ]
    assert summary == [
        (0, 1, "srt", "en", "English", False, False),
        (1, 2, "srt", "en", "Signs & Songs", True, False),  # language_ietf en-US 우선
        (2, 3, "srt", "en", "English SDH", False, True),  # hearing_impaired 플래그
        (3, 4, "ass", "ja", "", False, False),
        (4, 5, "srt", None, "日本語", False, False),  # und
        (5, 6, "webvtt", "ko", "", False, False),
    ]
    assert result.tracks[1].language_raw == "en-US"
    assert result.tracks[4].effective_language == "ja"  # und 는 트랙 이름 힌트로
    assert not result.tracks[3].default
    assert result.segment_uid == "4581519ee033ee50e36c73ce6def2241"
    assert len(result.text_tracks) == 6


def test_mkvmerge_image_tracks_are_not_text() -> None:
    data = _fixture("mkvmerge-sample.json")
    subtitle = next(t for t in data["tracks"] if t["type"] == "subtitles")
    for track_id, codec_id in enumerate(("S_HDMV/PGS", "S_VOBSUB", "S_DVBSUB"), start=10):
        image = copy.deepcopy(subtitle)
        image["id"] = track_id
        image["properties"]["codec_id"] = codec_id
        data["tracks"].append(image)

    result = parse_mkvmerge(Path("sample.mkv"), data)

    assert [t.kind for t in result.tracks[-3:]] == ["image"] * 3
    assert all(t.is_image and not t.is_text for t in result.tracks[-3:])
    assert len(result.text_tracks) == 6


def test_mkvmerge_unrecognized_file_is_error() -> None:
    data = {
        "container": {"recognized": False},
        "errors": ["The type of file 'x' could not be recognized."],
    }

    with pytest.raises(ProbeError, match="could not be recognized"):
        parse_mkvmerge(Path("x.mkv"), data)


def test_ffprobe_tracks() -> None:
    result = parse_ffprobe(Path("sample.mp4"), _fixture("ffprobe-sample.json"))

    summary = [
        (t.order, t.track_id, t.kind, t.language, t.forced, t.default) for t in result.tracks
    ]
    assert summary == [
        (0, 1, "mov_text", "en", False, True),
        (1, 2, "mov_text", "ja", False, False),
        (2, 3, "mov_text", None, True, False),
    ]
    assert all(t.name == "" for t in result.tracks)  # ffmpeg 기본 핸들러 이름은 트랙 이름이 아니다
    assert result.segment_uid is None


@pytest.mark.parametrize(
    ("codec", "expected"),
    [
        ("subrip", "srt"),
        ("ass", "ass"),
        ("webvtt", "webvtt"),
        ("mov_text", "mov_text"),
        ("hdmv_pgs_subtitle", "image"),
        ("dvd_subtitle", "image"),
        ("dvb_subtitle", "image"),
        ("eia_608", "unknown"),
    ],
)
def test_classify_ffprobe_codec(codec: str, expected: str) -> None:
    assert classify_ffprobe_codec(codec) == expected


@pytest.mark.parametrize(
    ("codec_id", "expected"),
    [
        ("S_TEXT/UTF8", "srt"),
        ("S_TEXT/SSA", "ass"),
        ("S_TEXT/WEBVTT", "webvtt"),
        ("S_HDMV/PGS", "image"),
        ("S_KATE", "unknown"),
    ],
)
def test_classify_mkv_codec(codec_id: str, expected: str) -> None:
    assert classify_mkv_codec(codec_id) == expected


def test_container_of() -> None:
    assert container_of(Path("A.MKV")) == "mkv"
    assert container_of(Path("a.m4v")) == "mp4"
    assert container_of(Path("a.avi")) is None


def test_probe_dispatches_by_container() -> None:
    calls: list[list[str]] = []

    def run(args: Sequence[str]) -> CommandResult:
        calls.append(list(args))
        name = "mkvmerge-sample.json" if args[0] == "mkvmerge" else "ffprobe-sample.json"
        return CommandResult(0, (FIXTURES / name).read_text(encoding="utf-8"), "")

    assert len(probe(Path("/m/a.mkv"), run=run).tracks) == 6
    assert len(probe(Path("/m/b.mp4"), run=run).tracks) == 3
    assert calls[0] == ["mkvmerge", "-J", "/m/a.mkv"]
    assert calls[1][0] == "ffprobe"
    assert calls[1][-1] == "/m/b.mp4"


@pytest.mark.parametrize(
    ("result", "message"),
    [
        (CommandResult(2, "", "Error: file not found"), "file not found"),
        (CommandResult(0, "not json", ""), "JSON"),
    ],
)
def test_probe_errors(result: CommandResult, message: str) -> None:
    with pytest.raises(ProbeError, match=message):
        probe(Path("a.mkv"), run=lambda _args: result)


def test_probe_rejects_other_containers() -> None:
    with pytest.raises(ProbeError, match="다루지 않는"):
        probe(Path("a.avi"), run=lambda _args: CommandResult(0, "{}", ""))
