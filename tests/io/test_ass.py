import pytest

from subtitle_robot.io.ass import (
    AssParseError,
    event_role,
    format_ass_time,
    parse_ass,
    parse_ass_time,
    to_ass_text,
    to_block_text,
)

ASS = """﻿[Script Info]
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, \
BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, \
Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,ＤＦ太楷書体,30,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,\
0,0,0,0,100,100,0,0,1,1.5,0,2,10,10,35,1
Style: OP_Romaji,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,\
0,0,0,0,100,100,0,0,1,1,0,8,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:02.50,Default,,0,0,0,,{\\an8}こんにちは、元気？\\N二行目
Comment: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,メモ
Dialogue: 0,0:00:03.00,0:00:04.00,OP_Romaji,,0,0,0,,kimi no na wa
Dialogue: 0,0:00:05.00,0:00:06.00,Default,,0,0,0,,{\\k20}ka{\\k30}ra
Dialogue: 0,0:00:07.00,0:00:08.00,Signs,,0,0,0,,{\\pos(10,10)}立入禁止
Dialogue: 0,0:00:09.00,0:00:10.00,Default,,0,0,0,,{\\p1}m 0 0 l 100 0 100 100{\\p0}
Dialogue: 0,0:00:11.00,0:00:12.00,Default,,0,0,0,,{\\an8}
Dialogue: 0,0:00:13.00,0:00:14.00,歌詞,,0,0,0,,夢の中へ
"""


def test_parse_events_and_fields() -> None:
    doc = parse_ass(ASS)

    assert [(e.position, e.kind) for e in doc.events][:3] == [
        (0, "Dialogue"), (1, "Comment"), (2, "Dialogue"),
    ]  # fmt: skip
    first = doc.events[0]
    assert (first.start_ms, first.end_ms, first.style) == (1000, 2500, "Default")
    assert first.text == "{\\an8}こんにちは、元気？\\N二行目"  # Text 안의 쉼표는 그대로
    assert first.with_text("안녕") == "Dialogue: 0,0:00:01.00,0:00:02.50,Default,,0,0,0,,안녕"
    assert doc.styles() == {"Default": "ＤＦ太楷書体", "OP_Romaji": "Arial"}
    assert doc.newline == "\n"


def test_event_roles() -> None:
    roles = [event_role(e) for e in parse_ass(ASS).events]

    # {\k20}ka{\k30}ra 는 가라오케 효과 레이어
    assert roles == ["dialogue", "dialogue", "song", "effect", "sign", "drawing", "empty", "song"]


def test_text_conversion_round_trip() -> None:
    assert to_block_text("{\\an8}一行目\\N二行目\\h!") == "{\\an8}一行目\n二行目 !"
    assert to_ass_text("{\\an8}첫 줄\n둘째 줄") == "{\\an8}첫 줄\\N둘째 줄"


def test_time_conversion() -> None:
    assert parse_ass_time("1:02:03.45") == 3_723_450
    assert parse_ass_time("0:00:01.5") == 1500
    assert format_ass_time(3_723_450) == "1:02:03.45"
    with pytest.raises(AssParseError):
        parse_ass_time("bad")


@pytest.mark.parametrize(
    "text",
    ["[Script Info]\nTitle: x\n", "[Events]\nDialogue: 0,0:00:01.00,0:00:02.00,D,,0,0,0,,x\n"],
)
def test_not_ass(text: str) -> None:
    with pytest.raises(AssParseError):
        parse_ass(text)


@pytest.mark.parametrize(
    ("text", "role"),
    [
        ("{\\move(523,33,523,46,6950,7250)\\clip(540,0,552,800)}ki", "effect"),
        ("{\\iclip(0,0,10,10)}x", "effect"),
        ("{\\t(0,200,\\alpha&HFF&)}fade", "effect"),
        ("{\\kf40}yo{\\ko20}ru", "effect"),
        ("{\\pos(640,300)\\frz12\\org(1,1)}KEEP OUT", "dialogue"),  # 회전 간판은 번역
        ("{\\an8}Day 1", "dialogue"),
    ],
)
def test_effect_layers(text: str, role: str) -> None:
    doc = parse_ass(
        "[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
        f"Dialogue: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,{text}\n"
    )

    assert event_role(doc.events[0]) == role
