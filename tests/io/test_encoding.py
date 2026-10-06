import codecs

import pytest

from subtitle_robot.io.encoding import EncodingDetectionError, decode_subtitle

JAPANESE_SRT = """1
00:00:06,400 --> 00:00:09,150
本当によく降るわね

2
00:00:09,760 --> 00:00:12,900
洗濯物が乾かないんだよ

3
00:00:15,340 --> 00:00:16,780
田中さん、これ届いてたよ

4
00:00:18,080 --> 00:00:20,450
住所があんたの部屋になってるけど、知り合い？
"""

KOREAN_SRT = """1
00:00:01,000 --> 00:00:03,000
오늘은 비가 많이 오네요

2
00:00:04,000 --> 00:00:06,000
빨래가 하나도 안 말랐어요
"""

ENGLISH_SRT = """1
00:00:01,000 --> 00:00:03,000
I don’t know where it came from, café owner said.

2
00:00:04,000 --> 00:00:06,000
“It’s just a story,” she whispered — naïve as ever.
"""


def _family(name: str) -> str:
    return codecs.lookup(name).name


@pytest.mark.parametrize(
    ("text", "encoding"),
    [
        (JAPANESE_SRT, "cp932"),
        (JAPANESE_SRT, "euc_jp"),
        (KOREAN_SRT, "cp949"),
        (ENGLISH_SRT, "cp1252"),
    ],
)
def test_decode_detects_legacy_encoding(text: str, encoding: str) -> None:
    decoded = decode_subtitle(text.encode(encoding))

    assert decoded.text == text
    assert decoded.encoding == _family(encoding)
    assert not decoded.had_bom


def test_decode_plain_utf8_has_full_confidence() -> None:
    decoded = decode_subtitle(JAPANESE_SRT.encode("utf-8"))

    assert decoded.text == JAPANESE_SRT
    assert decoded.encoding == "utf-8"
    assert decoded.confidence == 1.0
    assert not decoded.low_confidence


@pytest.mark.parametrize(
    ("encoding", "expected"),
    [("utf-8-sig", "utf-8-sig"), ("utf-16", "utf-16"), ("utf-32", "utf-32")],
)
def test_decode_strips_bom(encoding: str, expected: str) -> None:
    decoded = decode_subtitle(JAPANESE_SRT.encode(encoding))

    assert decoded.text == JAPANESE_SRT
    assert decoded.encoding == _family(expected)
    assert decoded.had_bom
    assert not decoded.text.startswith("﻿")


def test_manual_encoding_skips_detection() -> None:
    data = JAPANESE_SRT.encode("cp932")

    decoded = decode_subtitle(data, encoding="shift_jis_2004")

    assert decoded.text == JAPANESE_SRT
    assert decoded.encoding == _family("shift_jis_2004")
    assert decoded.confidence == 1.0


def test_manual_encoding_mismatch_raises_with_position() -> None:
    data = JAPANESE_SRT.encode("cp932")

    with pytest.raises(EncodingDetectionError, match="바이트 위치"):
        decode_subtitle(data, encoding="utf-8")


def test_manual_utf8_strips_bom() -> None:
    decoded = decode_subtitle(JAPANESE_SRT.encode("utf-8-sig"), encoding="utf-8")

    assert decoded.text == JAPANESE_SRT
    assert decoded.had_bom


def test_unknown_manual_encoding_raises() -> None:
    with pytest.raises(EncodingDetectionError, match="알 수 없는 인코딩"):
        decode_subtitle(b"abc", encoding="no-such-codec")


def test_short_euc_jp_is_ambiguous_with_cp949_and_prefers_japanese() -> None:
    # 3글자 EUC-JP 는 CP949 로도 오류 없이 디코딩된다. 일본어 쪽을 고르고 신뢰도를 낮춘다
    text = "1\n00:00:01,000 --> 00:00:02,000\n本当に\n"

    decoded = decode_subtitle(text.encode("euc_jp"))

    assert decoded.text == text
    assert decoded.encoding == "euc_jp"
    assert decoded.low_confidence
    assert "cp949" in decoded.alternatives


@pytest.mark.parametrize("encoding", ["cp932", "euc_jp"])
def test_full_japanese_file_is_not_ambiguous(encoding: str) -> None:
    decoded = decode_subtitle(JAPANESE_SRT.encode(encoding))

    assert decoded.encoding == _family(encoding)
    assert not decoded.low_confidence
