import pytest

from subtitle_robot.io.normalize import normalize_srt
from subtitle_robot.io.parser import parse_srt
from subtitle_robot.io.writer import format_srt
from subtitle_robot.pipeline.context import prepare_source
from subtitle_robot.pipeline.schema import Pass2Output
from subtitle_robot.pipeline.splitter import (
    assemble_output,
    clean_text,
    collect_translations,
    fallback_split,
    restore_leading_tags,
    unit_text,
)

OUTPUT = Pass2Output.model_validate(
    {
        "units": [
            {
                "unit": "U1",
                "blocks": [{"idx": 1, "ko": "어디서 온 건지"}, {"idx": 2, "ko": "모르겠지만"}],
            },
            {"unit": "U2", "blocks": [{"idx": 3, "ko": "착하지."}, {"idx": 3, "ko": "중복"}]},
        ]
    }
)


def test_collect_translations_keeps_duplicates_for_validation() -> None:
    assert collect_translations(OUTPUT) == {
        1: ["어디서 온 건지"],
        2: ["모르겠지만"],
        3: ["착하지.", "중복"],
    }


def test_unit_text_joins_in_order() -> None:
    assert unit_text(OUTPUT, [1, 2]) == "어디서 온 건지 모르겠지만"


@pytest.mark.parametrize(
    ("text", "weights", "expected"),
    [
        ("어디서 온 건지 모르겠지만 스타벅이 완전히 겁에 질렸어", [33, 40],
         ["어디서 온 건지 모르겠지만", "스타벅이 완전히 겁에 질렸어"]),
        ("하나 둘 셋 넷", [1, 1, 1, 1], ["하나", "둘", "셋", "넷"]),
        ("긴 첫 문장의 내용이 여기 있다 끝", [90, 10], ["긴 첫 문장의 내용이 여기 있다", "끝"]),
        ("가나다라", [1, 1], ["가나", "다라"]),  # 어절이 블록보다 적으면 글자 단위
        ("하나", [5], ["하나"]),
    ],
)  # fmt: skip
def test_fallback_split(text: str, weights: list[int], expected: list[str]) -> None:
    assert fallback_split(text, weights) == expected


@pytest.mark.parametrize("count", [2, 3, 4, 5])
def test_fallback_split_never_drops_words_or_leaves_empty(count: int) -> None:
    text = "원본 블록 길이 비율대로 어절 경계에서 나눈 결과는 빈 블록이 없어야 한다"

    pieces = fallback_split(text, [10] * count)

    assert len(pieces) == count
    assert all(pieces)
    assert " ".join(pieces).split() == text.split()


def test_fallback_split_short_text_pads() -> None:
    assert fallback_split("아", [1, 1]) == ["아", ""]


def test_restore_leading_tags_and_clean_text() -> None:
    source = prepare_source(1, "{\\an8}田中さん")

    assert restore_leading_tags("타나카 상", source) == "{\\an8}타나카 상"
    assert restore_leading_tags("x", None) == "x"
    assert clean_text("첫 줄  \n\n둘째 줄") == "첫 줄\n둘째 줄"


def test_assemble_output_preserves_structure() -> None:
    srt = (
        "1\n00:00:01,000 --> 00:00:02,000\n{\\an8}田中さん\n\n"
        "7\n00:00:03,000 --> 00:00:0x\n本字幕由字幕組製作\n\n"
        "8\n00:00:05,000 --> 00:00:06,000\n[door slams]\n\n"
        "9\n00:00:07,000 --> 00:00:08,000\nこれ\n"
    )
    doc = normalize_srt(srt.encode("utf-8"), source_path="t.srt")
    sources = {b.idx: prepare_source(b.idx, b.text) for b in doc.blocks}

    blocks = assemble_output(
        doc,
        translations={1: "타나카 상", 4: "이거\n\n줘"},
        excluded={2: "non_source_language", 3: "sdh_drop"},
        sources=sources,
    )

    assert [b.text for b in blocks] == ["{\\an8}타나카 상", "本字幕由字幕組製作", "", "이거\n줘"]
    written = format_srt(blocks)
    reparsed = parse_srt(written).blocks
    assert [b.timing_line for b in reparsed] == [b.timing_line for b in doc.blocks]
    assert [b.number_line for b in reparsed] == ["1", "7", "8", "9"]


def test_assemble_missing_translation_keeps_source() -> None:
    doc = normalize_srt(b"1\n00:00:01,000 --> 00:00:02,000\nHello\n", source_path="t.srt")

    (block,) = assemble_output(doc, {}, {}, {})

    assert block.text == "Hello"
