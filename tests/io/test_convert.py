from collections.abc import Callable

import pytest

from subtitle_robot.io.convert import SubtitleConversionError, ass_to_srt, vtt_to_srt

ASS = """﻿[Script Info]
ScriptType: v4.00+

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:05.00,0:00:06.50,Default,,0,0,0,,두 번째, 쉼표 포함
Comment: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,주석은 버린다
Dialogue: 0,0:00:01.00,0:00:02.25,Default,,0,0,0,,{\\an8}첫 줄\\N둘째 줄\\h끝
"""

VTT = """WEBVTT - 헤더

NOTE 메모 블록
여러 줄

STYLE
::cue { color: red }

cue-1
00:01.000 --> 00:02.500 align:start position:10%
<v Bob><i>Hello</i> &amp; <c.yellow>bye</c></v>

01:00:00.000 --> 01:00:01.000
<ruby>漢字<rt>かんじ</rt></ruby>です<00:00:00.500>!
"""


def test_ass_to_srt_sorts_and_keeps_override_tags() -> None:
    assert ass_to_srt(ASS) == (
        "1\n00:00:01,000 --> 00:00:02,250\n{\\an8}첫 줄\n둘째 줄 끝\n\n"
        "2\n00:00:05,000 --> 00:00:06,500\n두 번째, 쉼표 포함\n"
    )


def test_vtt_to_srt_drops_vtt_only_markup() -> None:
    assert vtt_to_srt(VTT) == (
        "1\n00:00:01,000 --> 00:00:02,500\n<i>Hello</i> & bye\n\n"
        "2\n01:00:00,000 --> 01:00:01,000\n漢字です!\n"
    )


@pytest.mark.parametrize(
    ("convert", "text"),
    [
        (ass_to_srt, "[Script Info]\nTitle: x\n"),
        (vtt_to_srt, "WEBVTT\n\nNOTE only\n"),
    ],
)
def test_empty_input_is_error(convert: Callable[[str], str], text: str) -> None:
    with pytest.raises(SubtitleConversionError):
        convert(text)
