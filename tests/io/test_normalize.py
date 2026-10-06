import json
import re
from pathlib import Path

import pytest

from subtitle_robot.io.normalize import (
    BlockFlag,
    IssueKind,
    NormalizedDocument,
    UnsupportedSchemaError,
    detect_newline,
    load_normalized,
    normalize_srt,
    normalize_srt_file,
    save_normalized,
)


def _normalize(text: str, encoding: str = "utf-8") -> NormalizedDocument:
    return normalize_srt(text.encode(encoding), source_path="in.srt")


def _block(n: str | None, start: str, end: str, text: str) -> str:
    head = f"{n}\n" if n is not None else ""
    return f"{head}{start} --> {end}\n{text}\n\n"


def _flags(doc: NormalizedDocument) -> list[list[BlockFlag]]:
    return [b.flags for b in doc.blocks]


def test_clean_file_has_no_flags_and_sequential_idx() -> None:
    doc = _normalize(
        _block("1", "00:00:01,000", "00:00:02,000", "Hello")
        + _block("2", "00:00:02,000", "00:00:03,000", "World")
    )

    assert [b.idx for b in doc.blocks] == [1, 2]
    assert _flags(doc) == [[], []]
    assert all(b.translate for b in doc.blocks)
    assert doc.issues == []
    assert doc.schema_version == 1


@pytest.mark.parametrize("text", ["", "<i></i>", "{\\an8}", "   "])
def test_empty_block_is_not_translated(text: str) -> None:
    doc = _normalize(
        f"1\n00:00:01,000 --> 00:00:02,000\n{text}\n\n2\n00:00:03,000 --> 00:00:04,000\nB\n"
    )

    assert BlockFlag.EMPTY in doc.blocks[0].flags
    assert doc.blocks[0].translate is False
    assert doc.blocks[1].translate is True


def test_overlap_with_previous_block() -> None:
    doc = _normalize(
        _block("1", "00:00:01,000", "00:00:05,000", "A")
        + _block("2", "00:00:03,000", "00:00:06,000", "B")
    )

    assert _flags(doc)[1] == [BlockFlag.OVERLAP]


def test_time_reversed_like_fansub_notes() -> None:
    # M0 일본어 샘플 앞부분: 제작진 메모 블록이 본편보다 뒤 시각을 가진다
    doc = _normalize(
        _block("1", "00:16:45,850", "00:16:49,730", "Bathtub gin:美國禁酒時期")
        + _block("2", "00:00:30,040", "00:00:35,040", "本字幕由字幕組製作")
        + _block("3", "00:00:06,400", "00:00:09,150", "本当によく降るわね")
    )

    assert BlockFlag.TIME_REVERSED in doc.blocks[1].flags
    assert BlockFlag.TIME_REVERSED in doc.blocks[2].flags
    assert BlockFlag.OVERLAP in doc.blocks[1].flags


def test_negative_duration() -> None:
    doc = _normalize(_block("1", "00:00:05,000", "00:00:04,000", "A"))

    assert _flags(doc)[0] == [BlockFlag.NEGATIVE_DURATION]


def test_bad_timing_flag_and_issue_with_idx() -> None:
    doc = _normalize(
        _block("1", "00:00:01,000", "00:00:02,000", "A")
        + "2\n00:00:03,000 --> 00:0x:04\nB\n\n"
        + _block("3", "00:00:05,000", "00:00:06,000", "C")
    )

    assert _flags(doc)[1] == [BlockFlag.BAD_TIMING]
    assert doc.blocks[1].start_ms is None
    assert doc.blocks[1].timing_line == "00:00:03,000 --> 00:0x:04"
    # 시간 판정은 시각을 해석한 마지막 블록(1)과 비교한다
    assert _flags(doc)[2] == []
    assert [(i.kind, i.idx, i.line_no) for i in doc.issues] == [(IssueKind.BAD_TIMING, 2, 6)]


def test_number_flags() -> None:
    doc = _normalize(
        _block("1", "00:00:01,000", "00:00:02,000", "A")
        + _block("1", "00:00:02,000", "00:00:03,000", "dup")
        + _block("5", "00:00:03,000", "00:00:04,000", "gap")
        + _block("a6", "00:00:04,000", "00:00:05,000", "invalid")
        + _block(None, "00:00:05,000", "00:00:06,000", "missing")
        + _block("6", "00:00:06,000", "00:00:07,000", "next")
    )

    assert _flags(doc) == [
        [],
        [BlockFlag.NUMBER_DUPLICATE],
        [BlockFlag.NUMBER_NON_SEQUENTIAL],
        [BlockFlag.NUMBER_INVALID],
        [BlockFlag.NUMBER_MISSING],
        [],  # 마지막 숫자 번호 5 다음이므로 연속
    ]
    assert [b.number for b in doc.blocks] == ["1", "1", "5", "a6", None, "6"]


def test_ass_tags_flagged_and_kept() -> None:
    text = "{\\fs50\\bord2\\an5\\pos(639,525)}Day 1\n殺人之夜"
    doc = _normalize(_block("1", "00:01:21,010", "00:01:26,020", text))

    assert _flags(doc)[0] == [BlockFlag.ASS_TAGS]
    assert doc.blocks[0].text == text


def test_inner_blank_lines_removed_and_flagged() -> None:
    doc = _normalize(
        "1\n00:00:01,000 --> 00:00:02,000\nline one\n\n  \nline two\n\n"
        "2\n00:00:03,000 --> 00:00:04,000\nB\n"
    )

    assert doc.blocks[0].text == "line one\nline two"
    assert _flags(doc)[0] == [BlockFlag.INNER_BLANK_LINE]


def test_only_whitespace_changes() -> None:
    original = (
        "1  \r\n00:00:01,000 --> 00:00:02,000\r\n<i>Hello</i>   \r\n\r\n  World\t\r\n\r\n"
        "2\r\n00:00:03,000 --> 00:00:04,000\r\n本当に、よく降るわね　\r\n"
    )
    doc = _normalize(original)
    squeeze = re.compile(r"\s")

    assert [squeeze.sub("", b.text) for b in doc.blocks] == [
        "<i>Hello</i>World",
        "本当に、よく降るわね",
    ]
    assert doc.blocks[0].text == "<i>Hello</i>\n  World"  # 줄 앞 공백은 원문 그대로


def test_leading_text_and_encoding_metadata() -> None:
    data = ("Title line\n\n" + _block("1", "00:00:01,000", "00:00:02,000", "本当に")).encode(
        "utf-8-sig"
    )

    doc = normalize_srt(data, source_path="movie.ja.srt")

    assert doc.leading_text == "Title line"
    assert doc.issues[0].kind is IssueKind.LEADING_TEXT
    assert doc.had_bom
    assert doc.encoding == "utf-8-sig"
    assert doc.newline == "lf"
    assert len(doc.source_sha256) == 64


def test_legacy_encoding_document() -> None:
    text = _block("1", "00:00:06,400", "00:00:09,150", "本当によく降るわね") + _block(
        "2", "00:00:09,760", "00:00:12,900", "洗濯物が乾かないんだよ"
    )

    doc = _normalize(text.replace("\n", "\r\n"), encoding="cp932")

    assert doc.encoding == "cp932"
    assert doc.newline == "crlf"
    assert [b.text for b in doc.blocks] == ["本当によく降るわね", "洗濯物が乾かないんだよ"]


@pytest.mark.parametrize(
    ("text", "expected"),
    [("a\nb", "lf"), ("a\r\nb", "crlf"), ("a\rb", "cr"), ("a\r\nb\nc", "mixed"), ("a", "none")],
)
def test_detect_newline(text: str, expected: str) -> None:
    assert detect_newline(text) == expected


def test_save_and_load_round_trip(tmp_path: Path) -> None:
    source = tmp_path / "in.srt"
    source.write_bytes(
        (
            _block("1", "00:00:01,000", "00:00:02,000", "{\\an8}本当に")
            + _block(None, "00:00:01,500", "00:00:03,000", "")
        ).encode("euc_jp")
    )
    doc = normalize_srt_file(source)
    target = tmp_path / "normalized.json"

    save_normalized(doc, target)

    assert load_normalized(target) == doc
    assert "本当に" in target.read_text(
        encoding="utf-8"
    )  # 사람이 읽을 수 있게 이스케이프하지 않는다


def test_load_rejects_other_schema_version(tmp_path: Path) -> None:
    target = tmp_path / "normalized.json"
    payload = _normalize(_block("1", "00:00:01,000", "00:00:02,000", "A")).model_dump(mode="json")
    payload["schema_version"] = 2
    target.write_text(json.dumps(payload), encoding="utf-8")

    with pytest.raises(UnsupportedSchemaError, match="schema_version 2"):
        load_normalized(target)


def test_ambiguous_encoding_is_reported_as_issue() -> None:
    doc = _normalize(_block("1", "00:00:01,000", "00:00:02,000", "本当に"), encoding="euc_jp")

    assert doc.encoding == "euc_jp"
    assert doc.issues[0].kind is IssueKind.ENCODING_LOW_CONFIDENCE
    assert "cp949" in doc.issues[0].detail


def test_comment_only_block_is_empty() -> None:
    doc = _normalize(_block("1", "00:01:57,700", "00:02:03,212", "<!-- 오프닝 시작 -->"))

    assert doc.blocks[0].translate is False
    assert doc.blocks[0].text == "<!-- 오프닝 시작 -->"
