from pathlib import Path

import pytest

from subtitle_robot.config import MediaConfig
from subtitle_robot.media.extract import ExtractedTrack, ExtractionResult
from subtitle_robot.media.probe import ProbeResult
from subtitle_robot.media.select import (
    WatchKind,
    classify_media,
    decide,
    ensure_series_workspace,
    select_source,
    slugify,
    stage_episode,
    target_evidence,
)
from subtitle_robot.media.tracks import SubtitleKind, SubtitleTrack
from subtitle_robot.series.manifest import EpisodeId
from subtitle_robot.series.workspace import SeriesWorkspace

KO_SRT = "1\n00:00:01,000 --> 00:00:02,000\n안녕하세요, 오늘은 날씨가 좋네요\n"
EN_SRT = "1\n00:00:01,000 --> 00:00:02,000\nHello there, nice weather today\n"


def _track(
    order: int,
    kind: SubtitleKind = "srt",
    language: str | None = "en",
    *,
    forced: bool = False,
    name: str = "",
) -> SubtitleTrack:
    return SubtitleTrack(
        order=order,
        track_id=order + 1,
        codec=kind,
        kind=kind,
        language=language,
        language_raw=language or "und",
        name=name,
        forced=forced,
        default=False,
        hearing_impaired=False,
    )


def _extracted(track: SubtitleTrack, language: str, tmp: Path) -> ExtractedTrack:
    path = tmp / f"t{track.order}.srt"
    return ExtractedTrack(track, language, None, path, path)


@pytest.fixture
def video(tmp_path: Path) -> Path:
    path = tmp_path / "Movie (2020).mkv"
    path.write_bytes(b"video")
    return path


def _probe(video: Path, *tracks: SubtitleTrack) -> ProbeResult:
    return ProbeResult(video, "mkv", tracks)


# ---------------------------------------------------------------- 대상 언어 자막 판정


def test_embedded_korean_text_and_image(video: Path) -> None:
    assert target_evidence(_probe(video, _track(0, language="ko")), None)
    image = _probe(video, _track(0, "image", "ko"))
    assert target_evidence(image, None) == "내장 한국어 트랙 #0 (image)"
    assert target_evidence(image, None, image_counts=False) is None


def test_undetermined_track_detected_as_korean(video: Path) -> None:
    track = _track(0, language=None)
    extraction = ExtractionResult(video, [_extracted(track, "ko", video.parent)])

    assert target_evidence(_probe(video, track), extraction) == "내장 한국어 트랙 #0 (내용 감지)"


@pytest.mark.parametrize(
    "name",
    [
        "Movie (2020).ko.srt",
        "Movie (2020).KOR.ass",
        "Movie (2020).korean.srt",
        "Movie (2020).ko.orig.srt",
        "Movie (2020).ko.forced.sup",
    ],
)
def test_external_korean_by_name(video: Path, name: str) -> None:
    (video.parent / name).write_text("x", encoding="utf-8")

    assert target_evidence(_probe(video), None) == f"외부 자막 {name}"


def test_unmarked_external_detected_by_content(video: Path) -> None:
    (video.parent / "Movie (2020).srt").write_text(KO_SRT, encoding="utf-8")
    (video.parent / "Movie (2020).en.srt").write_text(
        KO_SRT, encoding="utf-8"
    )  # 언어 표시가 있으면 내용은 보지 않는다

    assert target_evidence(_probe(video), None) == "외부 자막 Movie (2020).srt (내용 한국어)"


@pytest.mark.parametrize(
    "files",
    [
        {"Movie (2020).srt": EN_SRT},
        {"Movie (2020).forced.srt": EN_SRT},
        {"Movie (2020).eng.srt": KO_SRT},
        {"Movie (2020) extra.ko.srt": KO_SRT},  # 영상 이름으로 시작하지 않는다
        {"Other.ko.srt": KO_SRT},
    ],
)
def test_no_korean(video: Path, files: dict[str, str]) -> None:
    for name, text in files.items():
        (video.parent / name).write_text(text, encoding="utf-8")

    assert target_evidence(_probe(video, _track(0)), None) is None


# ---------------------------------------------------------------- 소스 선택·판정


def test_select_first_full_text_track(video: Path) -> None:
    tracks = [
        _track(0, language="en", forced=True),
        _track(1, language="en", name="Signs & Songs"),
        _track(2, language="ja"),
        _track(3, language="en"),
    ]
    extraction = ExtractionResult(
        video, [_extracted(t, t.language or "", video.parent) for t in tracks]
    )

    def order(item: ExtractedTrack | None) -> int:
        assert item is not None
        return item.track.order

    assert order(select_source(extraction)) == 3  # 원어를 모르면 영어 전체 트랙
    assert order(select_source(extraction, original="en")) == 3  # 원어 트랙
    assert order(select_source(extraction, original="ja")) == 2
    assert order(select_source(extraction, original="fr")) == 3  # 원어 트랙이 없으면 영어 트랙
    assert order(select_source(extraction, skip_forced=False)) == 0
    assert order(select_source(extraction, target="ja")) == 3  # 대상 언어 트랙은 소스가 아니다


def test_select_english_then_first_track(video: Path) -> None:
    """원어를 모르거나 원어 트랙이 없으면 영어, 영어도 없으면 첫 트랙 (§26.6, WI-8.006b)."""

    def extraction_of(*languages: str) -> ExtractionResult:
        tracks = [_track(order, language=code) for order, code in enumerate(languages)]
        return ExtractionResult(
            video, [_extracted(t, t.language or "", video.parent) for t in tracks]
        )

    def order(item: ExtractedTrack | None) -> int:
        assert item is not None
        return item.track.order

    multi = extraction_of("ar", "en", "es", "fr")  # 여러 언어 릴리스: 첫 트랙이 아랍어
    assert order(select_source(multi)) == 1
    assert order(select_source(multi, original="ja")) == 1  # 원어(일본어) 트랙이 없다
    assert order(select_source(multi, original="fr")) == 3  # 원어 트랙이 앞선다
    assert order(select_source(extraction_of("ar", "es"))) == 0  # 영어도 없으면 첫 트랙
    assert order(select_source(multi, target="en")) == 0  # 대상이 영어면 영어는 소스가 아니다

    decision = decide(_probe(video, *[item.track for item in multi.extracted]), multi)
    assert "소스 트랙 #1 (en" in decision.reason
    assert "영어 트랙 (원어 모름)" in decision.reason


def test_decide_verdicts(video: Path) -> None:
    en = _track(0)
    extraction = ExtractionResult(video, [_extracted(en, "en", video.parent)])
    decision = decide(_probe(video, en), extraction)
    assert decision.verdict == "translate"
    assert decision.source is not None
    assert "소스 트랙 #0 (en" in decision.reason

    assert (
        decide(_probe(video, _track(0, "image")), ExtractionResult(video)).verdict == "image_only"
    )
    assert decide(_probe(video), ExtractionResult(video)).verdict == "no_source"
    forced = _track(0, forced=True)
    only_forced = ExtractionResult(video, [_extracted(forced, "en", video.parent)])
    assert decide(_probe(video, forced), only_forced).verdict == "no_source"

    (video.parent / "Movie (2020).ko.srt").write_text(KO_SRT, encoding="utf-8")
    assert decide(_probe(video, en), extraction).verdict == "has_target"
    # 대상 en: 영어 트랙이 있으므로 대상 언어 자막 있음 (한국어 외부 자막은 대상 언어가 아니다)
    english = decide(_probe(video, _track(0, language="en")), extraction, target="en")
    assert english.verdict == "has_target"
    assert english.reason == "내장 English(en) 트랙 #0 (srt)"
    assert MediaConfig(source_langs=["ja"]).target_image_counts  # 옛 설정도 읽는다


# ---------------------------------------------------------------- 영화/시리즈·작업공간


@pytest.mark.parametrize(
    ("relative", "kind", "expected"),
    [
        ("Show/Season 01/Show - S01E02 - Title.mkv", "auto", ("series", "Show", "show", "S01E02")),
        ("Show/S2/Show.2x05.mkv", "auto", ("series", "Show", "show", "S02E05")),
        # 시즌 폴더에 릴리스 그룹 표시가 붙고 그 위가 감시 루트면 파일 이름에서 작품 이름
        (
            "SEASON 02 [Sav1or]/[Sav1or] Muv-Luv Alternative - S02E01 - Graduation [BD][1080p].mkv",
            "auto",
            ("series", "Muv-Luv Alternative", "muv-luv-alternative", "S02E01"),
        ),
        ("Show/Season 1 (BD)/Show - S01E02.mkv", "auto", ("series", "Show", "show", "S01E02")),
        ("[Cleo]91_Days_-_03_(BD).mkv", "series", ("series", "91 Days", "91-days", "S01E03")),
        (
            "葬送のフリーレン 第3話.mp4",
            "auto",
            ("series", "葬送のフリーレン", "葬送のフリーレン", "S01E03"),
        ),
        ("Movie (2020)/Movie (2020).mkv", "auto", ("movie", "Movie (2020)", "movie-2020", None)),
        ("Show/Season 01/Show S01E02.mkv", "movie", ("movie", "Show S01E02", "show-s01e02", None)),
    ],
)
def test_classify_media(
    tmp_path: Path, relative: str, kind: WatchKind, expected: tuple[str, str, str, str | None]
) -> None:
    watch_root = tmp_path / "media"
    video = watch_root / relative

    target = classify_media(video, tmp_path / "data", kind=kind, watch_root=watch_root)

    episode = str(target.episode) if target.episode else None
    assert (target.kind, target.title, target.slug, episode) == expected
    folder = "series" if expected[0] == "series" else "movies"
    assert target.workspace == tmp_path / "data" / folder / expected[2]


def test_slugify() -> None:
    assert slugify("91 Days") == "91-days"
    assert slugify("  ---  ") == "untitled"
    assert slugify("Ｆｕｌｌ　Ｗｉｄｔｈ") == "full-width"


def test_series_workspace_and_staging(tmp_path: Path) -> None:
    watch_root = tmp_path / "media"
    video = watch_root / "Show" / "Season 01" / "Show S01E02.mkv"
    target = classify_media(video, tmp_path / "data", watch_root=watch_root)
    source = tmp_path / "input.srt"
    source.write_text(EN_SRT, encoding="utf-8")

    workspace = ensure_series_workspace(target, "ja")
    staged = stage_episode(workspace, EpisodeId(1, 2), source, "en")
    stage_episode(workspace, EpisodeId(1, 3), source, "ja")
    stage_episode(workspace, EpisodeId(1, 2), source, "en")  # 다시 넣어도 매니페스트는 한 번

    assert staged == target.workspace / "episodes" / "S01E02.srt"
    again = SeriesWorkspace(target.workspace)
    settings = again.settings()
    assert (settings.title, settings.src_lang) == ("Show", "ja")
    assert [(e.id, e.src_lang) for e in settings.episodes] == [("S01E02", "en")]
    assert [e.key for e in again.scan().episodes] == ["S01E02", "S01E03"]
    assert ensure_series_workspace(target, "en").settings().src_lang == "ja"  # 기존 설정 유지


def test_own_previous_output_is_not_target_evidence(video: Path) -> None:
    previous = video.parent / "Movie (2020).ko.srt"
    previous.write_text(KO_SRT, encoding="utf-8")

    assert target_evidence(_probe(video), None, tool_outputs=[previous]) is None
    assert target_evidence(_probe(video), None) == "외부 자막 Movie (2020).ko.srt"


def test_stage_episode_replaces_other_format(tmp_path: Path) -> None:
    target = classify_media(
        tmp_path / "media" / "Show" / "Show S01E02.mkv", tmp_path / "data", kind="series",
        watch_root=tmp_path / "media",
    )  # fmt: skip
    workspace = ensure_series_workspace(target, "ja")
    srt = tmp_path / "in.srt"
    srt.write_text(EN_SRT, encoding="utf-8")
    ass = tmp_path / "in.ass"
    ass.write_text("[Events]\nFormat: Layer, Start, End, Style, Text\n", encoding="utf-8")

    stage_episode(workspace, EpisodeId(1, 2), srt, "ja")
    staged = stage_episode(workspace, EpisodeId(1, 2), ass, "ja")

    assert staged.name == "S01E02.ass"
    assert sorted(p.name for p in staged.parent.iterdir()) == ["S01E02.ass"]
