"""SAMI 읽기·SRT 변환 (WI-5.004b). 픽스처는 직접 만든 텍스트다."""

import pytest

from subtitle_robot.io.parser import parse_srt
from subtitle_robot.io.sami import SamiError, parse_sami, read_sami

SAMI = """<SAMI>
<HEAD>
<TITLE>Test</TITLE>
<STYLE TYPE="text/css">
<!--
P { margin-left:8pt; margin-right:8pt; }
.KRCC { Name:Korean; lang:ko-KR; SAMIType:CC; }
.ENCC { Name:English; lang:en-US; SAMIType:CC; }
-->
</STYLE>
</HEAD>
<BODY>
<SYNC Start=1000><P Class=KRCC>안녕하세요, 선장님.<br>오늘 항구가 닫힌다고 합니다.
<SYNC Start=1000><P Class=ENCC>Hello, captain.<br>They say the harbor is closing today.
<SYNC Start=3500><P Class=KRCC>&nbsp;
<SYNC Start=3500><P Class=ENCC>&nbsp;
<SYNC Start=4000><P Class=KRCC>그럼 지금 바로 떠나야겠어요. 배를 준비해 주세요.
<SYNC Start=4000><P Class=ENCC>Then we should leave right now. Get the ship ready &amp; go.
<SYNC Start=6000><P Class=KRCC>엔진이 아직 차가워요. 십 분만 기다려 주세요.
<SYNC Start=6000><P Class=ENCC>The engine is still cold. Give me <font color=red>ten</font> minutes.
</BODY>
</SAMI>
"""


def test_classes_become_language_tracks() -> None:
    tracks = {track.language: track for track in parse_sami(SAMI)}

    assert set(tracks) == {"ko", "en"}
    english = tracks["en"]
    assert english.css_class == "ENCC"
    assert english.detected is True  # 내용으로 감지했다
    # &nbsp; 는 지우는 표시라 사건이 아니고, 줄의 끝은 같은 클래스의 다음 SYNC 다
    assert [(start, end) for start, end, _ in english.events] == [
        (1000, 3500),
        (4000, 6000),
        (6000, 9000),  # 마지막 줄은 3초 보인다
    ]
    assert english.events[0][2] == "Hello, captain.\nThey say the harbor is closing today."
    assert english.events[1][2] == "Then we should leave right now. Get the ship ready & go."
    assert english.events[2][2] == "The engine is still cold. Give me ten minutes."  # 태그 제거


def test_to_srt_round_trip() -> None:
    korean = next(track for track in parse_sami(SAMI) if track.language == "ko")

    blocks = parse_srt(korean.to_srt()).blocks

    assert [block.timing_line for block in blocks] == [
        "00:00:01,000 --> 00:00:03,500",
        "00:00:04,000 --> 00:00:06,000",
        "00:00:06,000 --> 00:00:09,000",
    ]
    assert blocks[0].text == "안녕하세요, 선장님.\n오늘 항구가 닫힌다고 합니다."


def test_cp949_file_is_decoded() -> None:
    """한국에서 흔한 CP949(EUC-KR) SAMI."""
    tracks = read_sami(SAMI.encode("cp949"))

    assert {track.language for track in tracks} == {"ko", "en"}


def test_declared_language_when_content_is_unclear() -> None:
    """내용으로 정할 수 없으면 STYLE 의 lang, 그것도 없으면 흔한 클래스 이름으로 정한다."""
    sami = """<SAMI><HEAD><STYLE><!--
    .JPCC { lang: ja-JP; }
    --></STYLE></HEAD><BODY>
    <SYNC Start=0><P Class=JPCC>123
    <SYNC Start=500><P Class=KRCC>456
    </BODY></SAMI>"""

    tracks = {track.css_class: track for track in parse_sami(sami)}

    assert (tracks["JPCC"].language, tracks["JPCC"].detected) == ("ja", False)
    assert (tracks["KRCC"].language, tracks["KRCC"].detected) == ("ko", False)


def test_no_sync_is_an_error() -> None:
    with pytest.raises(SamiError):
        parse_sami("<SAMI><BODY>no captions</BODY></SAMI>")
