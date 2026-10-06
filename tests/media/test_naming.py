from pathlib import Path

import pytest

from subtitle_robot.media.naming import find_existing, plan_sidecar_names, sidecar_extension
from subtitle_robot.media.tracks import SubtitleKind, SubtitleTrack


def _track(
    order: int,
    kind: SubtitleKind = "srt",
    *,
    forced: bool = False,
    sdh: bool = False,
    name: str = "",
) -> SubtitleTrack:
    return SubtitleTrack(
        order=order,
        track_id=order + 1,
        codec=kind,
        kind=kind,
        language="en",
        language_raw="eng",
        name=name,
        forced=forced,
        default=False,
        hearing_impaired=sdh,
    )


def test_sidecar_names_follow_media_server_rules() -> None:
    video = Path("/m/Movie (2020).mkv")
    tracks = [
        (_track(0), "en"),
        (_track(1, forced=True), "en"),
        (_track(2, sdh=True), "en"),
        (_track(3), "en"),
        (_track(4, "ass"), "ja"),
        (_track(5, "webvtt"), "ko"),
        (_track(6, name="English SDH"), "en"),  # 이름의 SDH 도 sdh
    ]

    names = plan_sidecar_names(video, tracks, "mkv")

    assert {order: path.name for order, path in names.items()} == {
        0: "Movie (2020).en.srt",
        1: "Movie (2020).en.forced.srt",
        2: "Movie (2020).en.sdh.srt",
        3: "Movie (2020).en.2.srt",
        4: "Movie (2020).ja.ass",
        5: "Movie (2020).ko.vtt",
        6: "Movie (2020).en.2.sdh.srt",
    }
    assert names[0].parent == Path("/m")


def test_mp4_sidecars_are_srt_and_directory_override() -> None:
    names = plan_sidecar_names(
        Path("/m/Show S01E02.mp4"), [(_track(0, "mov_text"), "ja")], "mp4", directory=Path("/o")
    )

    assert names[0] == Path("/o/Show S01E02.ja.srt")


def test_order_follows_container_not_input() -> None:
    names = plan_sidecar_names(Path("/m/a.mkv"), [(_track(3), "en"), (_track(1), "en")], "mkv")

    assert names[1].name == "a.en.srt"
    assert names[3].name == "a.en.2.srt"


def test_image_track_has_no_sidecar_extension() -> None:
    with pytest.raises(ValueError, match="텍스트"):
        sidecar_extension(_track(0, "image"), "mkv")


def test_find_existing_ignores_case(tmp_path: Path) -> None:
    (tmp_path / "Movie.EN.srt").write_text("x", encoding="utf-8")

    assert find_existing(tmp_path / "Movie.en.srt") == tmp_path / "Movie.EN.srt"
    assert find_existing(tmp_path / "Movie.ja.srt") is None
    assert find_existing(tmp_path / "none" / "Movie.en.srt") is None
