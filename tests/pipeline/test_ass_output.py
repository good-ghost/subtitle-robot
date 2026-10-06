from pathlib import Path

import pytest

from subtitle_robot.cli import EXIT_OK, EXIT_USAGE, main
from subtitle_robot.io.ass import japanese_only_fonts, parse_ass, render_ass
from subtitle_robot.pipeline.runner import RunOptions, translate_file
from subtitle_robot.pipeline.style import StylePolicy
from tests.fake_llm import FakeAdapter
from tests.io.test_ass import ASS as STYLED_ASS
from tests.pipeline.test_ass_input import ASS
from tests.series.test_runner import _respond


def _events(path: Path) -> list[tuple[str, int, int, str, str]]:
    doc = parse_ass(path.read_text(encoding="utf-8-sig"))
    return [(e.kind, e.start_ms, e.end_ms, e.style, e.field("layer")) for e in doc.events]


def test_render_keeps_original_lines_and_replaces_text_only() -> None:
    doc = parse_ass(STYLED_ASS)

    out = render_ass(doc, {0: "{\\an8}안녕\\N두 줄"}, font="Noto Sans CJK KR")

    lines = out.splitlines()
    assert lines[0] == "[Script Info]"
    assert lines[1] == "; translated by Subtitle Robot"
    original = STYLED_ASS.lstrip("﻿").splitlines()
    changed = [line for line in lines[2:] if line not in original]
    assert changed == [
        "Style: Default,Noto Sans CJK KR,30,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,"
        "0,0,0,0,100,100,0,0,1,1.5,0,2,10,10,35,1",
        "Style: OP_Romaji,Noto Sans CJK KR,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,"
        "0,0,0,0,100,100,0,0,1,1,0,8,10,10,10,1",
        "Dialogue: 0,0:00:01.00,0:00:02.50,Default,,0,0,0,,{\\an8}안녕\\N두 줄",
    ]
    again = render_ass(parse_ass(out), {})
    assert again.count("; translated by Subtitle Robot") == 1
    assert japanese_only_fonts(doc) == ["ＤＦ太楷書体"]


def test_ass_input_writes_native_ass(tmp_path: Path) -> None:
    source = tmp_path / "Show S01E01.ja.ass"
    source.write_text(ASS, encoding="utf-8")
    output = tmp_path / "Show S01E01.ko.ass"

    result = translate_file(
        source,
        output,
        tmp_path / "work",
        FakeAdapter(_respond),
        RunOptions(style=StylePolicy(lyrics="keep", ass_exclude_styles=("signs",))),
    )

    assert _events(output) == _events(source)  # 이벤트 수·순서·타이밍·스타일·레이어
    texts = [e.text for e in parse_ass(output.read_text(encoding="utf-8")).events]
    assert texts == [
        "번역",
        "本字幕由字幕組共同製作",
        "夢の中へ行こう",
        "立入禁止です",
        "{\\an8}번역",
    ]
    assert result.output_path == output
    assert not any(n["kind"] == "ass_font" for n in result.report.input_issues)


def test_japanese_font_warning_and_override(tmp_path: Path) -> None:
    source = tmp_path / "a.ass"
    source.write_text(STYLED_ASS.replace("\\k20", "x").replace("\\k30", "y"), encoding="utf-8")

    plain = translate_file(source, tmp_path / "a.ko.ass", tmp_path / "w1", FakeAdapter(_respond))
    assert [n["kind"] for n in plain.report.input_issues] == ["ass_font"]

    fixed = translate_file(
        source, tmp_path / "b.ko.ass", tmp_path / "w2", FakeAdapter(_respond),
        RunOptions(ass_font="Noto Sans CJK KR"),
    )  # fmt: skip
    assert fixed.report.input_issues == []
    assert "Style: Default,Noto Sans CJK KR" in (tmp_path / "b.ko.ass").read_text(encoding="utf-8")


def test_cli_format_option(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    source = tmp_path / "Show.ja.ass"
    source.write_text(ASS, encoding="utf-8")
    srt = tmp_path / "plain.en.srt"
    srt.write_text("1\n00:00:01,000 --> 00:00:02,000\nHello there\n", encoding="utf-8")
    adapter = FakeAdapter(_respond)

    def factory(_config: object) -> FakeAdapter:
        return adapter

    assert main(["translate", str(source), "--format", "srt"], adapter_factory=factory) == EXIT_OK
    assert (tmp_path / "Show.ko.srt").exists()
    assert not (tmp_path / "Show.ko.ass").exists()
    assert main(["translate", str(srt), "--format", "ass"], adapter_factory=factory) == EXIT_USAGE
    assert "ASS 출력은 ASS" in capsys.readouterr().err


def test_effect_layers_are_kept_untouched_in_ass_output(tmp_path: Path) -> None:
    effect = "{\\move(523,33,523,46,6950,7250)\\clip(540,0,552,800)}kimi"
    source = tmp_path / "op.en.ass"
    source.write_text(
        "[Script Info]\nScriptType: v4.00+\n\n[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
        "Dialogue: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,Good morning, Mr. Tanaka.\n"
        + "".join(
            f"Dialogue: 0,0:00:03.00,0:00:04.00,OP - ROM,,0,0,0,,{effect}\n" for _ in range(50)
        ),
        encoding="utf-8",
    )
    adapter = FakeAdapter(_respond)

    result = translate_file(source, tmp_path / "op.ko.ass", tmp_path / "w", adapter)

    assert result.report.blocks == 1  # 효과 조각 50개는 번역 블록이 아니다
    texts = [e.text for e in parse_ass((tmp_path / "op.ko.ass").read_text(encoding="utf-8")).events]
    assert texts[0] == "번역"
    assert texts[1:] == [effect] * 50
