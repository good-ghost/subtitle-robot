from pathlib import Path

import pytest

from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.series.manifest import EpisodeId, episode_id_from_name, scan_episodes
from subtitle_robot.series.settings import (
    SeriesSettingsError,
    load_series_settings,
)
from subtitle_robot.series.workspace import SeriesInitError, init_series


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("Show.S01E02.1080p.WEB-DL.srt", "S01E02"),
        ("show s2e10 x264.srt", "S02E10"),
        ("Show 1x05.srt", "S01E05"),
        ("Show - 3x12 - Title.srt", "S03E12"),
        ("Show E07.srt", "S01E07"),
        ("Show EP12.ja.srt", "S01E12"),
        ("番組名 第3話.srt", "S01E03"),
        ("番組名 第１２話.srt", "S01E12"),  # 전각 숫자도 인식한다
        ("[Moozzi2] High School Of The Dead - 10 (BD 1920x1080 x.264 Flac).srt", "S01E10"),
        ("[Moozzi2] High School Of The Dead - 12 END (BD 1920x1080 x.264 Flac).srt", "S01E12"),
        ("[Moozzi2] High School Of The Dead - OVA (BD 1920x1080 x.264 Flac).srt", None),
        ("[Cleo]91_Days_-_01_(Dual Audio_10bit_720p_x265).ja.srt", "S01E01"),
        ("[Group]_Show_-_07v2_[720p].srt", "S01E07"),
        ("Some.Movie.Title.2026.1080p.WEB-DL.DD+5.1.H.264-GROUP.en.srt", None),
        ("movie.srt", None),
    ],
)
def test_episode_id_from_name(name: str, expected: str | None) -> None:
    result = episode_id_from_name(name)

    assert (str(result) if result else None) == expected


def test_episode_id_order_and_parse() -> None:
    assert sorted([EpisodeId(2, 1), EpisodeId(1, 10), EpisodeId(1, 2)]) == [
        EpisodeId(1, 2),
        EpisodeId(1, 10),
        EpisodeId(2, 1),
    ]
    assert EpisodeId.parse("S01E07") == EpisodeId(1, 7)
    with pytest.raises(ValueError, match="형식"):
        EpisodeId.parse("1x07")


def _touch(root: Path, *names: str) -> None:
    for name in names:
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("1\n00:00:01,000 --> 00:00:02,000\nx\n", encoding="utf-8")


def test_init_creates_workspace_and_scans(tmp_path: Path) -> None:
    root = tmp_path / "MySeries"
    _touch(
        root,
        "S01/Show.S01E02.srt",
        "S01/Show.S01E01.srt",
        "S02/Show.S02E01.srt",
        "S01/special.srt",
        "out/S01E01.ko.srt",  # 출력은 에피소드가 아니다
        "work/S01E01/tmp.srt",
        "S01/Show.S01E01.ko.srt",
    )

    workspace, scan = init_series(root, "ja", title="My Series")

    assert [e.key for e in scan.episodes] == ["S01E01", "S01E02", "S02E01"]
    assert [p.name for p in scan.unrecognized] == ["special.srt"]
    settings = load_series_settings(root)
    assert (settings.src_lang, settings.mode, settings.transliteration) == (
        "ja",
        "prescan",
        "common",
    )
    assert settings.style().honorifics_policy == "transliterate"
    assert load_glossary(workspace.glossary_path).series == "My Series"
    assert workspace.output_path(scan.episodes[0]) == root / "out" / "S01E01.ko.srt"


def test_init_keeps_existing_files_and_manifest_maps_unrecognized(tmp_path: Path) -> None:
    root = tmp_path / "S"
    _touch(root, "a/Show.S01E01.srt", "b/special.srt", "c/Show.S01E01.srt")
    init_series(root, "en")
    settings_path = root / "series.toml"
    settings_path.write_text(
        settings_path.read_text(encoding="utf-8")
        + '\n[[episodes]]\nid = "S01E13"\nfile = "b/special.srt"\nsrc_lang = "ja"\n',
        encoding="utf-8",
    )

    _, scan = init_series(root, "en")  # 다시 실행해도 설정을 덮어쓰지 않는다

    assert [e.key for e in scan.episodes] == ["S01E01", "S01E13"]
    assert scan.episodes[1].src_lang == "ja"
    assert scan.unrecognized == ()
    assert [(key, p.parent.name) for key, p in scan.duplicates] == [("S01E01", "c")]


def test_init_errors(tmp_path: Path) -> None:
    with pytest.raises(SeriesInitError, match="폴더가 없다"):
        init_series(tmp_path / "none", "ja")
    with pytest.raises(SeriesInitError, match="src_lang"):
        init_series(tmp_path, "xx")


def test_settings_errors(tmp_path: Path) -> None:
    with pytest.raises(SeriesSettingsError, match="series init"):
        load_series_settings(tmp_path)
    (tmp_path / "series.toml").write_text('src_lang = "ja"\nmode = "fast"\n', encoding="utf-8")
    with pytest.raises(SeriesSettingsError, match="mode"):
        load_series_settings(tmp_path)


def test_scan_without_settings(tmp_path: Path) -> None:
    _touch(tmp_path, "E01.srt", "E02.srt")

    assert [e.key for e in scan_episodes(tmp_path).episodes] == ["S01E01", "S01E02"]


def test_scan_accepts_ass_and_vtt_and_skips_outputs(tmp_path: Path) -> None:
    from subtitle_robot.series.manifest import scan_episodes

    for name in ("Show S01E01.ja.ass", "Show S01E02.en.vtt", "Show S01E03.ssa"):
        (tmp_path / name).write_text("x", encoding="utf-8")
    (tmp_path / "Show S01E01.ko.ass").write_text("x", encoding="utf-8")  # 번역 결과
    (tmp_path / "extract" / "S01E04").mkdir(parents=True)
    (tmp_path / "extract" / "S01E04" / "Show S01E04.srt").write_text("x", encoding="utf-8")
    (tmp_path / "Show S01E05.sub").write_text("x", encoding="utf-8")  # 다루지 않는 형식

    scan = scan_episodes(tmp_path)

    assert [(e.key, e.path.name) for e in scan.episodes] == [
        ("S01E01", "Show S01E01.ja.ass"),
        ("S01E02", "Show S01E02.en.vtt"),
        ("S01E03", "Show S01E03.ssa"),
    ]
    assert scan.unrecognized == ()
