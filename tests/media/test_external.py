"""외부 자막 소스·SAMI 변환 (WI-5.004b). 자막 픽스처는 직접 만든 텍스트다."""

from pathlib import Path

from subtitle_robot.io.parser import parse_srt
from subtitle_robot.media.external import (
    EXTERNAL_TRACK_ID,
    convert_sami_sidecars,
    external_sources,
    is_external,
)
from subtitle_robot.media.extract import ExtractionResult
from subtitle_robot.media.probe import ProbeResult
from subtitle_robot.media.select import decide, target_evidence
from subtitle_robot.media.tmdb import OriginLanguage
from subtitle_robot.media.tracks import SubtitleTrack
from tests.io.test_sami import SAMI

ENGLISH_SRT = (
    "1\n00:00:01,000 --> 00:00:03,000\nThe harbor is closing in an hour, captain.\n\n"
    "2\n00:00:04,000 --> 00:00:06,000\nThen we leave now. Get the ship ready for the storm.\n"
)
FRENCH_SRT = (
    "1\n00:00:01,000 --> 00:00:03,000\n"
    "Le port est fermé dans une heure, et je ne sais pas pourquoi.\n\n"
    "2\n00:00:04,000 --> 00:00:06,000\n"
    "Alors nous partons, et vous restez avec les autres dans la maison.\n\n"
    "3\n00:00:07,000 --> 00:00:09,000\n"
    "Je pense que la tempête est pour nous, pas pour le bateau.\n"
)
ENGLISH_ONLY_SAMI = """<SAMI><HEAD><STYLE><!-- .ENCC { lang:en-US; } --></STYLE></HEAD><BODY>
<SYNC Start=1000><P Class=ENCC>The harbor is closing in an hour, captain.
<SYNC Start=3000><P Class=ENCC>&nbsp;
<SYNC Start=4000><P Class=ENCC>Then we leave now. Get the ship ready for the storm.
</BODY></SAMI>"""


def _writer(written: list[Path]):  # type: ignore[no-untyped-def]
    def write(target: Path, text: str) -> Path:
        target.write_text(text, encoding="utf-8")
        written.append(target)
        return target

    return write


def _video(tmp_path: Path, name: str = "Movie (2026).mkv") -> Path:
    video = tmp_path / name
    video.write_bytes(b"video")
    return video


def test_sami_becomes_language_srt_sidecars(tmp_path: Path) -> None:
    video = _video(tmp_path)
    sami = tmp_path / "Movie (2026).smi"
    sami.write_bytes(SAMI.encode("cp949"))
    written: list[Path] = []

    paths = convert_sami_sidecars(video, [sami], sidecar_dir=tmp_path, write=_writer(written))

    assert sorted(p.name for p in paths) == ["Movie (2026).en.srt", "Movie (2026).ko.srt"]
    korean = parse_srt((tmp_path / "Movie (2026).ko.srt").read_text(encoding="utf-8"))
    assert korean.blocks[0].text == "안녕하세요, 선장님.\n오늘 항구가 닫힌다고 합니다."


def test_sami_does_not_touch_an_existing_user_file(tmp_path: Path) -> None:
    video = _video(tmp_path)
    (tmp_path / "Movie (2026).smi").write_text(SAMI, encoding="utf-8")
    user = tmp_path / "Movie (2026).en.srt"
    user.write_text("user file", encoding="utf-8")
    written: list[Path] = []

    paths = convert_sami_sidecars(
        video, [tmp_path / "Movie (2026).smi"], sidecar_dir=tmp_path, write=_writer(written)
    )

    assert [p.name for p in paths] == ["Movie (2026).ko.srt"]
    assert user.read_text(encoding="utf-8") == "user file"
    # 이 도구가 앞서 쓴 파일이면 다시 쓴다
    again = convert_sami_sidecars(
        video,
        [tmp_path / "Movie (2026).smi"],
        sidecar_dir=tmp_path,
        write=_writer(written),
        tool_outputs=[user, *paths],
    )
    assert sorted(p.name for p in again) == ["Movie (2026).en.srt", "Movie (2026).ko.srt"]


def test_external_sources_language_and_formats(tmp_path: Path) -> None:
    video = _video(tmp_path)
    named = tmp_path / "Movie (2026).eng.srt"
    named.write_text(ENGLISH_SRT, encoding="utf-8")
    unmarked = tmp_path / "Movie (2026).srt"
    unmarked.write_bytes(FRENCH_SRT.encode("cp1252"))  # 언어 표시 없음, 레거시 인코딩
    korean = tmp_path / "Movie (2026).ko.srt"
    korean.write_text("1\n00:00:01,000 --> 00:00:02,000\n안녕하세요\n", encoding="utf-8")
    preserved = tmp_path / "Movie (2026).en.orig.srt"
    preserved.write_text(ENGLISH_SRT, encoding="utf-8")

    sources = external_sources(
        video, [named, unmarked, korean, preserved], tmp_path / "work", target="ko"
    )

    by_name = {source.track.name: source for source in sources}
    assert set(by_name) == {named.name, unmarked.name}  # 대상 언어·.orig 는 뺀다
    assert (by_name[named.name].language, by_name[named.name].detected) == ("en", False)
    assert (by_name[unmarked.name].language, by_name[unmarked.name].detected) == ("fr", True)
    french = by_name[unmarked.name].translation_input.read_text(encoding="utf-8")
    assert "tempête est pour nous" in french  # UTF-8 로 바꿔 둔다
    assert all(is_external(s) and s.track.track_id == EXTERNAL_TRACK_ID for s in sources)


def test_decide_uses_external_only_without_embedded_text(tmp_path: Path) -> None:
    video = _video(tmp_path)
    english = tmp_path / "Movie (2026).en.srt"
    english.write_text(ENGLISH_SRT, encoding="utf-8")
    french = tmp_path / "Movie (2026).fr.srt"
    french.write_text(FRENCH_SRT, encoding="utf-8")
    sources = external_sources(video, [english, french], tmp_path / "work", target="ko")
    calls: list[int] = []

    def externals():  # type: ignore[no-untyped-def]
        calls.append(1)
        return sources

    no_tracks = ProbeResult(video, "mkv", ())
    decision = decide(no_tracks, ExtractionResult(video), external=externals)
    assert decision.verdict == "translate"
    assert decision.source is not None
    assert decision.source.language == "en"  # 영어 우선
    assert decision.reason.startswith("외부 자막 Movie (2026).en.srt (en) — 내장 텍스트 자막 없음")

    origin = OriginLanguage(language="fr", source="tmdb:movie/1")
    by_origin = decide(no_tracks, ExtractionResult(video), origin=origin, external=externals)
    assert by_origin.source is not None
    assert by_origin.source.language == "fr"  # 원어 우선

    # 내장 텍스트 트랙이 있으면(쓸 수 없는 forced 뿐이어도) 외부 자막을 보지 않는다
    forced = SubtitleTrack(
        order=0, track_id=1, codec="S_TEXT/UTF8", kind="srt", language="en", language_raw="eng",
        name="", forced=True, default=False, hearing_impaired=False,
    )  # fmt: skip
    calls.clear()
    embedded = decide(
        ProbeResult(video, "mkv", (forced,)), ExtractionResult(video), external=externals
    )
    assert embedded.verdict == "no_source"
    assert calls == []


def test_korean_sami_is_target_evidence(tmp_path: Path) -> None:
    video = _video(tmp_path)
    (tmp_path / "Movie (2026).smi").write_text(SAMI, encoding="utf-8")

    evidence = target_evidence(ProbeResult(video, "mkv", ()), None, target="ko")

    assert evidence == "외부 자막 Movie (2026).smi (내용 한국어)"
    english_only = tmp_path / "Other.mkv"
    english_only.write_bytes(b"video")
    (tmp_path / "Other.smi").write_text(ENGLISH_ONLY_SAMI, encoding="utf-8")
    assert target_evidence(ProbeResult(english_only, "mkv", ()), None, target="ko") is None
