"""Tesseract 호출·결과 정리·OCR→SRT (WI-5.004c). Tesseract 는 가짜 실행기로 바꾼다."""

from pathlib import Path

import pytest

from subtitle_robot.io.parser import parse_srt
from subtitle_robot.media.commands import CommandResult
from subtitle_robot.ocr import tesseract
from subtitle_robot.ocr.bitmap import Bitmap, ImageEvent
from subtitle_robot.ocr.subtitle import ocr_events
from subtitle_robot.ocr.tesseract import (
    OcrError,
    clean_text,
    installed_languages,
    recognize,
    tesseract_language,
)
from tests.ocr.encoders import FakeTesseract


def _bitmap(width: int) -> Bitmap:
    return Bitmap(width, 2, bytes([255]) * width * 2)


def test_language_names() -> None:
    assert [tesseract_language(code) for code in ("en", "ja", "ko", "fr", "zh")] == [
        "eng", "jpn", "kor", "fra", "chi_sim",
    ]  # fmt: skip
    assert tesseract_language("xx") is None


def test_installed_languages_skips_header() -> None:
    fake = FakeTesseract({}, languages=["eng", "jpn", "osd"])

    assert installed_languages(fake) == frozenset({"eng", "jpn", "osd"})


def test_recognize_splits_pages_in_order_across_chunks(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(tesseract, "CHUNK_SIZE", 2)
    monkeypatch.setattr(tesseract, "MIN_CHUNK_SIZE", 1)
    fake = FakeTesseract({10: "one", 11: "two", 12: "", 13: "four", 14: "five"})

    texts = recognize([_bitmap(w) for w in range(10, 15)], "eng", tmp_path, run=fake, workers=2)

    assert texts == ["one", "two", "", "four", "five"]
    assert len(fake.ocr_calls) == 3  # 2 + 2 + 1장 (상한 2)
    call = fake.ocr_calls[0]
    assert call[2:] == ["stdout", "-l", "eng", "--psm", "6", "-c", "preserve_interword_spaces=1"]


def test_chunks_are_spread_over_workers(tmp_path: Path) -> None:
    fake = FakeTesseract({})

    recognize([_bitmap(10)] * 64, "eng", tmp_path, run=fake, workers=4)

    assert len(fake.ocr_calls) == 4  # 16장씩


def test_recognize_reports_failures(tmp_path: Path) -> None:
    def failing(_args: object) -> CommandResult:
        return CommandResult(1, "", "Error opening data file jpn.traineddata")

    with pytest.raises(OcrError, match=r"jpn\.traineddata"):
        recognize([_bitmap(10)], "jpn", tmp_path, run=failing)

    def short(_args: object) -> CommandResult:
        return CommandResult(0, "only one\f", "")

    with pytest.raises(OcrError, match="결과 수"):
        recognize([_bitmap(10), _bitmap(11)], "eng", tmp_path, run=short)


def test_clean_text_joins_cjk_but_keeps_korean_spacing() -> None:
    assert clean_text("  今日 は 晴れ 。 \n\n  Hello  world \n") == "今日は晴れ。\nHello  world"
    assert clean_text("오늘 날씨가 좋네요") == "오늘 날씨가 좋네요"


def test_clean_text_fixes_capital_i_read_as_bar() -> None:
    """실측(2026-10-07): DejaVu Sans 의 `I don't` 를 `| don't` 로 읽었다."""
    assert clean_text("| don't trust |t.\n|'m here") == "I don't trust It.\nI'm here"
    assert clean_text("12 | 34") == "12 | 34"  # 라틴 문자가 없는 줄은 그대로


def test_ocr_events_drops_empty_and_merges_repeats(tmp_path: Path) -> None:
    events = [
        ImageEvent(1000, 2000, _bitmap(10)),
        ImageEvent(2000, 3000, _bitmap(11)),  # 같은 글자가 바로 이어진다
        ImageEvent(4000, 5000, _bitmap(12)),  # 읽은 글자 없음
        ImageEvent(6000, 7000, _bitmap(13)),
    ]
    fake = FakeTesseract({10: "Hello", 11: "Hello", 13: "Bye"})

    result = ocr_events(events, "eng", tmp_path, run=fake)

    blocks = parse_srt(result.srt).blocks
    assert [(b.timing_line, b.text) for b in blocks] == [
        ("00:00:01,000 --> 00:00:03,000", "Hello"),
        ("00:00:06,000 --> 00:00:07,000", "Bye"),
    ]
    assert (result.images, result.blocks) == (4, 2)


def test_runner_limits_openmp_threads() -> None:
    run = tesseract.ocr_runner(low_priority=True)

    assert run.keywords["env"]["OMP_THREAD_LIMIT"] == "1"  # type: ignore[attr-defined]
    assert run.keywords["low_priority"] is True  # type: ignore[attr-defined]
