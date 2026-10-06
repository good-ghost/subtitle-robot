"""M1 완료 기준: 이상 케이스 포함 정규화 → 쓰기 → 다시 파싱 왕복 (PROJECT-PLAN §16, WI-1.006)."""

from pathlib import Path

import pytest

from subtitle_robot.io.normalize import BlockFlag, NormalizedDocument, normalize_srt
from subtitle_robot.io.writer import format_srt

FIXTURES = Path(__file__).parent.parent / "fixtures" / "srt"
EN_ANOMALIES = FIXTURES / "anomalies.en.srt"
JA_FANSUB = FIXTURES / "fansub_notes.ja.srt"


def _signature(doc: NormalizedDocument) -> list[tuple[object, ...]]:
    return [(b.number, b.timing_line, b.start_ms, b.end_ms, b.text) for b in doc.blocks]


def _expected_after_write(doc: NormalizedDocument) -> list[tuple[object, ...]]:
    """쓰고 다시 읽었을 때 기대하는 블록. 번호 줄이 없던 블록은 라이터가 위치 번호를 쓴다."""
    return [
        (
            b.number if b.number is not None else str(b.idx),
            b.timing_line,
            b.start_ms,
            b.end_ms,
            b.text,
        )
        for b in doc.blocks
    ]


def _round_trip(doc: NormalizedDocument) -> tuple[str, NormalizedDocument]:
    written = format_srt(doc.blocks)
    return written, normalize_srt(written.encode("utf-8"), source_path="written.srt")


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


@pytest.mark.parametrize("fixture", [EN_ANOMALIES, JA_FANSUB], ids=["en", "ja"])
@pytest.mark.parametrize("newline", ["\n", "\r\n"], ids=["lf", "crlf"])
def test_round_trip_preserves_blocks(fixture: Path, newline: str) -> None:
    original = normalize_srt(
        _read(fixture).replace("\n", newline).encode("utf-8"), source_path=fixture.name
    )

    written, again = _round_trip(original)

    assert _signature(again) == _expected_after_write(original)
    assert [b.translate for b in again.blocks] == [b.translate for b in original.blocks]
    # 정규화 결과를 다시 쓰면 같은 문자열이 나온다 (멱등)
    assert format_srt(again.blocks) == written


@pytest.mark.parametrize("encoding", ["utf-8-sig", "utf-16", "cp932", "euc_jp"])
def test_japanese_round_trip_across_encodings(encoding: str) -> None:
    text = _read(JA_FANSUB)
    reference = normalize_srt(text.encode("utf-8"), source_path=JA_FANSUB.name)

    original = normalize_srt(text.replace("\n", "\r\n").encode(encoding), source_path="in.srt")
    _, again = _round_trip(original)

    assert original.encoding.replace("_", "-").startswith(
        encoding.split("-sig")[0].replace("_", "-")
    )
    assert not any(issue.kind == "encoding_low_confidence" for issue in original.issues)
    assert _signature(original) == _signature(reference)
    assert _signature(again) == _expected_after_write(reference)


def test_english_fixture_exercises_anomalies() -> None:
    doc = normalize_srt(EN_ANOMALIES.read_bytes(), source_path=EN_ANOMALIES.name)
    flags = {flag for block in doc.blocks for flag in block.flags}

    assert doc.leading_text == "Some Movie (2026) - English subtitles"
    assert len(doc.blocks) == 10
    assert {
        BlockFlag.NUMBER_MISSING,
        BlockFlag.NUMBER_DUPLICATE,
        BlockFlag.NUMBER_INVALID,
        BlockFlag.NUMBER_NON_SEQUENTIAL,
        BlockFlag.OVERLAP,
        BlockFlag.EMPTY,
        BlockFlag.BAD_TIMING,
        BlockFlag.INNER_BLANK_LINE,
    } <= flags
    broken = next(b for b in doc.blocks if BlockFlag.BAD_TIMING in b.flags)
    assert broken.timing_line == "00:01:03,000 --> 00:01:0x"
    assert broken.translate  # 타이밍만 깨졌고 텍스트는 번역 대상


def test_japanese_fixture_reproduces_m0_sample_patterns() -> None:
    doc = normalize_srt(JA_FANSUB.read_bytes(), source_path=JA_FANSUB.name)
    by_idx = {b.idx: b for b in doc.blocks}

    assert BlockFlag.ASS_TAGS in by_idx[1].flags  # 제작진 메모의 ASS 태그
    assert BlockFlag.TIME_REVERSED in by_idx[3].flags  # 00:16:45 → 00:00:30
    assert BlockFlag.TIME_REVERSED in by_idx[4].flags  # 00:00:30 → 00:00:06 (본편 시작)
    assert by_idx[10].translate is False  # 빈 블록
    assert by_idx[11].text == "- ケーキ美味しいのに\n- しょうがないだろ（笑）"
    assert BlockFlag.ASS_TAGS in by_idx[12].flags


def test_missing_number_is_written_as_position_number() -> None:
    doc = normalize_srt(EN_ANOMALIES.read_bytes(), source_path=EN_ANOMALIES.name)
    missing = [b.idx for b in doc.blocks if b.number is None]

    _, again = _round_trip(doc)

    assert missing == [3]
    assert again.blocks[2].number == "3"
