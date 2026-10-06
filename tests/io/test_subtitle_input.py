import hashlib
from pathlib import Path

import pytest

from subtitle_robot.io.subtitle_input import SubtitleInputError, read_subtitle, subtitle_format
from tests.io.test_ass import ASS

VTT = "WEBVTT\n\n00:01.000 --> 00:02.000\nHello there\n\n00:03.000 --> 00:04.000\nBye\n"


def test_ass_blocks_follow_time_and_map_to_events(tmp_path: Path) -> None:
    path = tmp_path / "Show S01E01.ja.ass"
    # 파일 순서와 시각 순서가 다른 경우 (간판 이벤트가 앞에 있음)
    text = ASS.replace(
        "Dialogue: 0,0:00:07.00,0:00:08.00,Signs", "Dialogue: 0,0:00:00.50,0:00:08.00,Signs"
    )
    path.write_text(text, encoding="utf-8-sig")

    source = read_subtitle(path)

    assert source.format == "ass"
    blocks = source.doc.blocks
    assert [(b.idx, b.start_ms) for b in blocks] == [
        (1, 500), (2, 1000), (3, 3000), (4, 13000),
    ]  # fmt: skip
    assert blocks[1].text == "{\\an8}こんにちは、元気？\n二行目"
    assert {idx: (ref.position, ref.role) for idx, ref in source.events.items()} == {
        1: (4, "sign"), 2: (0, "dialogue"), 3: (2, "song"), 4: (7, "song"),
    }  # fmt: skip  # Comment·효과 레이어(\\k)·그림·빈 이벤트는 블록이 아니다
    assert source.song_blocks() == [3, 4]
    assert source.blocks_with_styles(["signs"]) == [1]
    assert source.doc.source_sha256 == hashlib.sha256(path.read_bytes()).hexdigest()
    assert source.doc.had_bom
    assert source.ass is not None


def test_vtt_and_srt(tmp_path: Path) -> None:
    vtt = tmp_path / "a.en.vtt"
    vtt.write_text(VTT, encoding="utf-8")
    srt = tmp_path / "a.en.srt"
    srt.write_text("1\n00:00:01,000 --> 00:00:02,000\nHi\n", encoding="utf-8")

    assert [b.text for b in read_subtitle(vtt).doc.blocks] == ["Hello there", "Bye"]
    assert read_subtitle(vtt).events == {}
    assert read_subtitle(srt).format == "srt"


def test_format_and_errors(tmp_path: Path) -> None:
    assert subtitle_format(Path("x.SSA")) == "ass"
    assert subtitle_format(Path("x.sub")) is None
    with pytest.raises(SubtitleInputError, match="다루지 않는"):
        read_subtitle(tmp_path / "x.sub")
    empty = tmp_path / "empty.ass"
    empty.write_text(
        "[Events]\nFormat: Layer, Start, End, Style, Text\nComment: 0,0:00:01.00,0:00:02.00,D,x\n",
        encoding="utf-8",
    )
    with pytest.raises(SubtitleInputError, match="Dialogue"):
        read_subtitle(empty)
    broken = tmp_path / "broken.ass"
    broken.write_text("[Script Info]\n", encoding="utf-8")
    with pytest.raises(SubtitleInputError, match="Format"):
        read_subtitle(broken)
