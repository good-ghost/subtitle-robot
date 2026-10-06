import pytest

from subtitle_robot.io.parser import (
    ParseIssueKind,
    RawBlock,
    parse_srt,
    parse_timestamp,
    parse_timing_line,
)


def _texts(blocks: list[RawBlock]) -> list[str]:
    return [b.text for b in blocks]


# ---------------------------------------------------------------- parse_timestamp


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("00:00:01,000", 1000),
        ("00:00:01.500", 1500),  # 소수점 '.'
        ("0:00:01,5", 1500),  # 한 자리 시, 소수 1자리
        ("00:00:01,05", 1050),  # 소수 2자리
        ("00:00:01", 1000),  # 소수부 없음
        ("01:02,500", 62500),  # 시 생략
        ("99:59:59,999", 359999999),
        ("100:00:00,000", 360000000),  # 시 3자리
        ("00:00:01:500", 1500),  # 소수 구분자 ':'
    ],
)
def test_parse_timestamp_accepts_lenient_forms(value: str, expected: int) -> None:
    assert parse_timestamp(value) == expected


@pytest.mark.parametrize("value", ["", "-00:00:01,000", "00:0x:01,000", "00:60:00,000", "abc"])
def test_parse_timestamp_rejects_invalid(value: str) -> None:
    assert parse_timestamp(value) is None


def test_parse_timing_line_ignores_coordinate_tail_and_single_arrow() -> None:
    assert parse_timing_line("00:00:01,000 --> 00:00:02,000  X1:100 X2:200 Y1:10 Y2:20") == (
        1000,
        2000,
    )
    assert parse_timing_line("00:00:01,000 -> 00:00:02,000") == (1000, 2000)
    assert parse_timing_line("00:00:01,000-->00:00:02,000") == (1000, 2000)


# ---------------------------------------------------------------- parse_srt


def test_standard_file() -> None:
    result = parse_srt(
        "1\n00:00:01,000 --> 00:00:02,000\nHello\n\n2\n00:00:03,000 --> 00:00:04,000\nWorld\n"
    )

    assert [b.number_line for b in result.blocks] == ["1", "2"]
    assert _texts(result.blocks) == ["Hello", "World"]
    assert result.blocks[1].start_ms == 3000
    assert result.blocks[1].line_no == 6
    assert result.issues == []
    assert result.leading_text == ""


def test_missing_number_line() -> None:
    result = parse_srt(
        "00:00:01,000 --> 00:00:02,000\nHello\n\n00:00:03,000 --> 00:00:04,000\nWorld"
    )

    assert [b.number_line for b in result.blocks] == [None, None]
    assert _texts(result.blocks) == ["Hello", "World"]


def test_non_numeric_number_line_after_blank() -> None:
    result = parse_srt("a12\n00:00:01,000 --> 00:00:02,000\nHello\n")

    assert result.blocks[0].number_line == "a12"
    assert result.leading_text == ""


def test_missing_blank_separator_between_blocks() -> None:
    result = parse_srt(
        "1\n00:00:01,000 --> 00:00:02,000\nHello\n2\n00:00:03,000 --> 00:00:04,000\nWorld\n"
    )

    assert [b.number_line for b in result.blocks] == ["1", "2"]
    assert _texts(result.blocks) == ["Hello", "World"]


def test_blank_line_inside_text_is_kept() -> None:
    result = parse_srt(
        "1\n00:00:01,000 --> 00:00:02,000\nline one\n\nline two\n\n"
        "2\n00:00:03,000 --> 00:00:04,000\nnext\n"
    )

    assert _texts(result.blocks) == ["line one\n\nline two", "next"]


def test_text_line_without_blank_above_is_not_number() -> None:
    # 번호 없는 블록: 바로 윗줄 "second line" 은 앞 블록 텍스트다
    result = parse_srt(
        "1\n00:00:01,000 --> 00:00:02,000\nfirst\nsecond line\n00:00:03,000 --> 00:00:04,000\nnext"
    )

    assert _texts(result.blocks) == ["first\nsecond line", "next"]
    assert result.blocks[1].number_line is None


def test_empty_block() -> None:
    result = parse_srt(
        "1\n00:00:01,000 --> 00:00:02,000\n\n\n2\n00:00:03,000 --> 00:00:04,000\nWorld\n"
    )

    assert _texts(result.blocks) == ["", "World"]


def test_consecutive_timing_lines_make_empty_block() -> None:
    result = parse_srt("1\n00:00:01,000 --> 00:00:02,000\n00:00:03,000 --> 00:00:04,000\nWorld")

    assert _texts(result.blocks) == ["", "World"]
    assert [b.number_line for b in result.blocks] == ["1", None]


def test_bad_timing_keeps_original_line_and_reports() -> None:
    result = parse_srt("1\n00:00:01,000 --> 00:0x:02\nHello\n")

    block = result.blocks[0]
    assert block.timing_line == "00:00:01,000 --> 00:0x:02"
    assert block.start_ms is None
    assert block.end_ms is None
    assert block.text == "Hello"
    assert [(i.kind, i.line_no) for i in result.issues] == [(ParseIssueKind.BAD_TIMING, 2)]


def test_leading_text_is_reported() -> None:
    result = parse_srt("My Movie subtitles\n\n1\n00:00:01,000 --> 00:00:02,000\nHello\n")

    assert result.leading_text == "My Movie subtitles"
    assert result.issues[0].kind is ParseIssueKind.LEADING_TEXT
    assert _texts(result.blocks) == ["Hello"]


@pytest.mark.parametrize("ending", ["", "\n", "\n\n\n", "\n  \n"])
def test_trailing_blank_lines_do_not_matter(ending: str) -> None:
    result = parse_srt(f"1\n00:00:01,000 --> 00:00:02,000\nHello{ending}")

    assert _texts(result.blocks) == ["Hello"]


def test_crlf_and_trailing_spaces_are_normalized() -> None:
    result = parse_srt("1\r\n00:00:01,000 --> 00:00:02,000  \r\nHello  \r\nWorld\r\n\r\n")

    assert result.blocks[0].timing_line == "00:00:01,000 --> 00:00:02,000"
    assert result.blocks[0].text == "Hello\nWorld"


def test_tags_and_japanese_text_are_preserved() -> None:
    text = "{\\an8}<i>本当によく降るわね</i>\n- 洗濯物が…"
    result = parse_srt(f"1\n00:00:01,000 --> 00:00:02,000\n{text}\n")

    assert result.blocks[0].text == text


def test_digit_text_line_after_blank_before_timing_is_number() -> None:
    # 숫자만 있는 줄 + 타이밍 줄 = 다음 블록 번호 (앞 블록 텍스트로 넣지 않는다)
    result = parse_srt(
        "1\n00:00:01,000 --> 00:00:02,000\nHello\n\n12\n00:00:03,000 --> 00:00:04,000\nX"
    )

    assert [b.number_line for b in result.blocks] == ["1", "12"]


def test_empty_input() -> None:
    result = parse_srt("")

    assert result.blocks == []
    assert result.issues == []


def test_html_comment_with_arrow_is_text_not_timing() -> None:
    # 실제 자막(HOTD)에서 확인: 텍스트 안 HTML 주석의 "-->" 를 타이밍 줄로 오인하면 안 된다
    result = parse_srt(
        "1\n00:01:57,700 --> 00:02:03,212\n<!-- 오프닝 시작 -->\n\n"
        "2\n00:02:04,000 --> 00:02:05,000\nSpring of the DEAD</font><!-- 엔딩 시작 -->\n"
    )

    assert _texts(result.blocks) == [
        "<!-- 오프닝 시작 -->",
        "Spring of the DEAD</font><!-- 엔딩 시작 -->",
    ]
