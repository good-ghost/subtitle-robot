import json
from pathlib import Path

from subtitle_robot.pipeline.runner import RunOptions, translate_file
from subtitle_robot.pipeline.style import StylePolicy
from tests.fake_llm import FakeAdapter
from tests.series.test_runner import _respond

ASS = """[Script Info]
ScriptType: v4.00+

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,田中さん、おはよう
Dialogue: 0,0:00:03.00,0:00:04.00,Default,,0,0,0,,本字幕由字幕組共同製作
Dialogue: 0,0:00:05.00,0:00:06.00,OP,,0,0,0,,夢の中へ行こう
Dialogue: 0,0:00:07.00,0:00:08.00,Signs,,0,0,0,,立入禁止です
Dialogue: 0,0:00:09.00,0:00:10.00,Default,,0,0,0,,{\\an8}また明日ね
"""


def _translate(tmp_path: Path, style: StylePolicy) -> tuple[list[str], dict[str, int]]:
    source = tmp_path / "Show S01E01.ja.ass"
    source.write_text(ASS, encoding="utf-8")
    output = tmp_path / "out.ko.srt"
    result = translate_file(
        source, output, tmp_path / "work", FakeAdapter(_respond), RunOptions(style=style)
    )
    blocks = [
        chunk.split("\n", 2)[2]
        for chunk in output.read_text(encoding="utf-8").strip().split("\n\n")
    ]
    return blocks, result.report.excluded


def test_ass_input_translates_with_exclusions(tmp_path: Path) -> None:
    blocks, excluded = _translate(
        tmp_path, StylePolicy(lyrics="keep", ass_exclude_styles=("signs",))
    )

    assert blocks == [
        "번역",
        "本字幕由字幕組共同製作",  # 원본 언어가 아니다 (Q-02)
        "夢の中へ行こう",  # 노래, lyrics keep
        "立入禁止です",  # 제외 스타일
        "{\\an8}번역",  # 앞 태그 복원 (Q-01)
    ]
    assert excluded == {"lyrics_keep": 1, "non_source_language": 1, "style_excluded": 1}
    saved = json.loads((tmp_path / "work" / "normalized.json").read_text(encoding="utf-8"))
    assert len(saved["blocks"]) == 5


def test_songs_are_translated_by_default(tmp_path: Path) -> None:
    blocks, excluded = _translate(tmp_path, StylePolicy())

    assert blocks[2] == "번역"
    assert excluded == {"non_source_language": 1}


def test_style_hash_unchanged_by_new_default_setting() -> None:
    policy = StylePolicy()
    legacy = policy.model_dump(mode="json")
    del legacy["ass_exclude_styles"]
    del legacy["target_lang"]

    import hashlib

    expected = hashlib.sha256(
        json.dumps(legacy, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()[: len(policy.style_hash())]
    assert policy.style_hash() == expected  # 기존 작업공간이 설정 변경으로 판정되지 않는다
    assert StylePolicy(ass_exclude_styles=("Signs",)).style_hash() != policy.style_hash()
    assert StylePolicy(target_lang="en").style_hash() != policy.style_hash()
