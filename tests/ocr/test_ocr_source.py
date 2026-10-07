"""이미지 자막 후보·고르기·OCR 소스 (WI-5.004c)."""

from pathlib import Path
from typing import Any

from subtitle_robot.io.parser import parse_srt
from subtitle_robot.media.commands import CommandResult
from subtitle_robot.media.external import EXTERNAL_TRACK_ID
from subtitle_robot.media.ocr_source import (
    ImageCandidate,
    image_candidates,
    ocr_source,
    pick_image,
)
from subtitle_robot.media.probe import ProbeResult
from subtitle_robot.media.tracks import SubtitleTrack
from tests.ocr.encoders import FakeTesseract, encode_pgs, encode_vobsub, glyph

ENGLISH = {40: "The harbor is closing in an hour, captain.", 60: "Then we leave now."}
FRENCH = {
    40: "Le port est fermé dans une heure, et je ne sais pas pourquoi.",
    60: "Alors nous partons, et vous restez avec les autres dans la maison.",
}
PGS = encode_pgs([(1000, 3000, [glyph(40)]), (4000, 6000, [glyph(60)])])
INSTALLED = frozenset({"eng", "fra", "jpn", "kor"})


def _track(order: int, codec: str, language: str | None, **kwargs: Any) -> SubtitleTrack:
    return SubtitleTrack(
        order=order, track_id=order + 2, codec=codec, kind="image", language=language,
        language_raw=language or "", name=kwargs.get("name", ""),
        forced=kwargs.get("forced", False), default=False, hearing_impaired=False,
    )  # fmt: skip


def _no_extract(_args: object) -> CommandResult:
    raise AssertionError("외부 파일은 뽑지 않는다")


def test_candidates_from_tracks_and_files(tmp_path: Path) -> None:
    video = tmp_path / "Sea Lark (2026).mkv"
    files = [tmp_path / name for name in (
        "Sea Lark (2026).en.sup", "Sea Lark (2026).fr.idx", "Sea Lark (2026).fr.sub",
        "Sea Lark (2026).ja.idx", "Sea Lark (2026).en.orig.sup",
    )]  # fmt: skip
    for path in files:
        path.write_bytes(b"x")
    files[3].with_suffix(".sub").unlink(missing_ok=True)  # 짝이 없는 .idx
    tracks = (
        _track(0, "S_HDMV/PGS", "en"),
        _track(1, "S_VOBSUB", "ja"),
        _track(2, "S_DVBSUB", "de"),  # DVB 는 다루지 않는다
    )

    candidates = image_candidates(ProbeResult(video, "mkv", tracks), files)

    assert [(c.track.order, c.language, c.path.name if c.path else None) for c in candidates] == [
        (0, "en", None),
        (1, "ja", None),
        (2000, "en", "Sea Lark (2026).en.sup"),
        (2001, "fr", "Sea Lark (2026).fr.idx"),
    ]
    assert candidates[2].track.track_id == EXTERNAL_TRACK_ID
    assert image_candidates(ProbeResult(video, "mp4", tracks), []) == []  # MP4 트랙은 다루지 않는다


def test_pick_original_then_english_then_first() -> None:
    korean = ImageCandidate(_track(0, "S_HDMV/PGS", "ko"))
    forced = ImageCandidate(_track(1, "S_HDMV/PGS", "ja", forced=True))
    german = ImageCandidate(_track(2, "S_HDMV/PGS", "de"))
    english = ImageCandidate(_track(3, "S_HDMV/PGS", "en"))
    japanese = ImageCandidate(_track(4, "S_HDMV/PGS", "ja"))
    every = [korean, forced, german, english, japanese]

    def pick(original: str | None, candidates: list[ImageCandidate]) -> ImageCandidate | None:
        return pick_image(candidates, original=original, target="ko", skip_forced=True)

    assert pick("ja", every) is japanese  # forced 는 건너뛴다
    assert pick(None, every) is english
    assert pick(None, [korean, german]) is german
    assert pick(None, [korean]) is None


def test_external_pgs_is_read_and_cached(tmp_path: Path) -> None:
    video = tmp_path / "Movie.mkv"
    video.write_bytes(b"video")
    sup = tmp_path / "Movie.en.sup"
    sup.write_bytes(PGS)
    candidate = image_candidates(ProbeResult(video, "mkv", ()), [sup])[0]
    fake = FakeTesseract(ENGLISH)

    def run() -> Any:
        return ocr_source(
            video, candidate, tmp_path / "work", original=None, target="ko", installed=INSTALLED,
            extract_run=_no_extract, ocr_run=fake, workers=1,
        )  # fmt: skip

    result = run()

    assert result.source is not None
    assert result.note == "OCR Movie.en.sup (그림 2장 → 자막 2개)"
    assert result.source.language == "en"
    blocks = parse_srt(result.source.translation_input.read_text(encoding="utf-8")).blocks
    assert [b.text for b in blocks] == list(ENGLISH.values())
    assert fake.ocr_calls[0][fake.ocr_calls[0].index("-l") + 1] == "eng"

    again = run()  # 실패한 작업을 다시 처리할 때: 다시 읽지 않는다
    assert again.source is not None
    assert again.note == "OCR Movie.en.sup (이전 결과)"
    assert len(fake.ocr_calls) == 1


def test_unknown_language_is_detected_and_reread(tmp_path: Path) -> None:
    """언어 표시가 없으면 영어로 읽고, 내용이 프랑스어면 프랑스어 데이터로 다시 읽는다."""
    video = tmp_path / "Film.mkv"
    video.write_bytes(b"video")
    sup = tmp_path / "Film.sup"
    sup.write_bytes(PGS)
    candidate = image_candidates(ProbeResult(video, "mkv", ()), [sup])[0]
    fake = FakeTesseract(FRENCH, by_language={"fra": FRENCH})

    result = ocr_source(
        video, candidate, tmp_path / "work", original=None, target="ko", installed=INSTALLED,
        extract_run=_no_extract, ocr_run=fake, workers=1,
    )  # fmt: skip

    assert result.source is not None
    assert (result.source.language, result.source.detected) == ("fr", True)
    languages = [call[call.index("-l") + 1] for call in fake.ocr_calls]
    assert languages == ["eng", "fra"]


def test_missing_language_data_and_target_language(tmp_path: Path) -> None:
    video = tmp_path / "Movie.mkv"
    video.write_bytes(b"video")
    sup = tmp_path / "Movie.ja.sup"
    sup.write_bytes(PGS)
    candidate = image_candidates(ProbeResult(video, "mkv", ()), [sup])[0]

    missing = ocr_source(
        video, candidate, tmp_path / "w1", original=None, target="ko", installed={"eng"},
        extract_run=_no_extract, ocr_run=FakeTesseract({}), workers=1,
    )  # fmt: skip
    assert missing.source is None
    assert missing.note == "Tesseract 에 Japanese(ja) 언어 데이터 없음"

    empty = ocr_source(
        video, candidate, tmp_path / "w2", original=None, target="ko", installed=INSTALLED,
        extract_run=_no_extract, ocr_run=FakeTesseract({}), workers=1,
    )  # fmt: skip
    assert empty.source is None
    assert empty.note == "OCR Movie.ja.sup: 읽은 글자 없음 (그림 2장)"


def test_embedded_vobsub_is_extracted(tmp_path: Path) -> None:
    video = tmp_path / "Movie.mkv"
    video.write_bytes(b"video")
    idx, sub = encode_vobsub([(1000, 3000, glyph(20)), (4000, 6000, glyph(30))])
    commands: list[list[str]] = []

    def mkvextract(args: Any) -> CommandResult:
        commands.append(list(args))
        target = Path(args[-1].split(":", 1)[1])
        target.write_bytes(sub)
        target.with_suffix(".idx").write_text(idx, encoding="ascii")
        return CommandResult(0, "", "")

    track = SubtitleTrack(
        order=0, track_id=3, codec="S_VOBSUB", kind="image", language="en", language_raw="eng",
        name="", forced=False, default=True, hearing_impaired=False,
    )  # fmt: skip
    fake = FakeTesseract({40: ENGLISH[40], 60: ENGLISH[60]})  # VobSub 그림은 두 배

    result = ocr_source(
        video, ImageCandidate(track), tmp_path / "work", original=None, target="ko",
        installed=INSTALLED, extract_run=mkvextract, ocr_run=fake, workers=1,
    )  # fmt: skip

    assert result.source is not None
    assert result.note == "OCR 트랙 #0 (S_VOBSUB, en) (그림 2장 → 자막 2개)"
    assert commands[0][:4] == ["mkvextract", str(video), "tracks", "-q"]
    assert commands[0][4].startswith("3:")
