import json
import re
from pathlib import Path

import pytest

from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.io.normalize import NormalizedDocument, normalize_srt
from subtitle_robot.llm.base import ChatRequest
from subtitle_robot.pipeline.context import ContextBuilder, ContextSettings, prepare_source
from subtitle_robot.pipeline.style import StylePolicy
from subtitle_robot.pipeline.translator import Pass2Translator
from subtitle_robot.pipeline.unitizer import UnitPlan, unitize
from tests.fake_llm import FakeAdapter

EXAMPLE = Path(__file__).parent.parent.parent / "examples" / "glossary.example.yaml"
LINES = [
    "{\\an8}田中さん、これ",
    "佐藤さんの部屋に",
    "届いてたよ。",
    "ヒロシ君は？",
    "知らない。",
    "{\\i1}もう寝た{\\i0}。",
]


def _doc(lines: list[str] = LINES) -> NormalizedDocument:
    body = "".join(
        f"{n}\n00:00:{n:02},000 --> 00:00:{n:02},800\n{text}\n\n"
        for n, text in enumerate(lines, start=1)
    )
    return normalize_srt(body.encode("utf-8"), source_path="t.srt")


def _builder(style: StylePolicy | None = None, **settings: int) -> tuple[ContextBuilder, UnitPlan]:
    doc = _doc()
    plan = unitize(doc, "ja")
    entries = load_glossary(EXAMPLE).entries
    return ContextBuilder(
        doc, plan, entries, "ja", style or StylePolicy(), ContextSettings(**settings)
    ), plan


def _section(message: str, name: str) -> str:
    match = re.search(rf"<{name}[^>]*>\n(.*?)\n</{name}>", message, re.DOTALL)
    assert match, name
    return match.group(1)


def test_prepare_source_splits_ass_tags() -> None:
    block = prepare_source(1, "{\\an8}{\\fs40}田中{\\i1}さん{\\i0}")

    assert block.text == "田中さん"
    assert block.leading_tags == "{\\an8}{\\fs40}"
    assert block.inner_tags == ("{\\i1}", "{\\i0}")
    assert prepare_source(2, "<i>Hi</i>").text == "<i>Hi</i>"  # HTML 태그는 남긴다


def test_sections_are_in_fixed_order_with_only_matched_entries() -> None:
    builder, plan = _builder()
    first = plan.units[0]

    request = builder.build("B001", [first.unit_id])

    order = [m.group(1) for m in re.finditer(r"^<(\w+)", request.user_message, re.MULTILINE)]
    assert order == [
        "glossary", "honorifics", "relations", "style",
        "previous_translations", "upcoming_context", "translate",
    ]  # fmt: skip
    glossary = _section(request.user_message, "glossary")
    # 첫 unit 은 블록 1(田中さん、これ)뿐이다. 佐藤(E0012)·John(E0003)은 이 배치에 나오지 않는다
    assert glossary.splitlines() == [
        "E0007 田中ヒロシ = 타나카 히로시 | 田中 = 타나카 | ヒロシ = 히로시 | ヒロ = 히로 "
        "| AVOID: 다나카",
    ]
    assert _section(request.user_message, "honorifics") == "さん = 상 (space)"
    assert request.entity_revs == {"E0007": 1}


def test_translate_payload_has_clean_text_and_units() -> None:
    builder, plan = _builder()

    request = builder.build("B001", [u.unit_id for u in plan.units])
    payload = json.loads(_section(request.user_message, "translate"))

    first_block = payload["units"][0]["blocks"][0]
    assert first_block == {"idx": 1, "src": "田中さん、これ"}  # ASS 태그 제거
    assert builder.sources[1].leading_tags == "{\\an8}"
    # 블록이 태그로 시작하면 그 태그는 앞 태그로 복원하고, 중간 태그만 리포트용으로 남는다
    assert builder.sources[6].leading_tags == "{\\i1}"
    assert builder.sources[6].inner_tags == ("{\\i0}",)
    assert [b["idx"] for u in payload["units"] for b in u["blocks"]] == [1, 2, 3, 4, 5, 6]


def test_previous_and_upcoming_context() -> None:
    builder, plan = _builder(previous_blocks=2, upcoming_blocks=2)
    unit_of = plan.unit_of()

    request = builder.build(
        "B002",
        [unit_of[4]],
        previous=[(1, "타나카 상, 이거"), (2, "사토 상 방에"), (3, "와 있었어.")],
    )

    assert _section(request.user_message, "previous_translations").splitlines() == [
        "2: 佐藤さんの部屋に => 사토 상 방에",
        "3: 届いてたよ。 => 와 있었어.",
    ]
    assert _section(request.user_message, "upcoming_context").splitlines() == [
        "5: 知らない。",
        "6: もう寝た。",
    ]
    assert _section(request.user_message, "honorifics") == "君 = 쿤 (space)"


def test_original_name_style_uses_source() -> None:
    builder, plan = _builder(StylePolicy(name_style="original"))

    request = builder.build("B001", [plan.units[0].unit_id])

    assert (
        _section(request.user_message, "glossary")
        .splitlines()[0]
        .startswith("E0007 田中ヒロシ = 田中ヒロシ | 田中 = 田中")
    )
    assert "AVOID" not in request.user_message


def test_estimate_fixed_tokens_covers_glossary_and_context() -> None:
    builder, _ = _builder()

    tokens = builder.estimate_fixed_tokens("SYSTEM PROMPT", len)

    assert tokens > len("SYSTEM PROMPT") + len("E0007 田中ヒロシ = 타나카 히로시")


# ---------------------------------------------------------------- 번역기


def _reply(units: list[tuple[str, list[int]]]) -> dict[str, object]:
    return {
        "units": [
            {"unit": u, "blocks": [{"idx": i, "ko": f"번역{i}"} for i in idxs]} for u, idxs in units
        ]
    }


def test_translator_sends_system_and_parses_output() -> None:
    builder, plan = _builder()
    adapter = FakeAdapter(lambda _r: _reply([(u.unit_id, list(u.idxs)) for u in plan.units]))
    translator = Pass2Translator(adapter, "ja")

    response = translator.translate(builder.build("B001", [u.unit_id for u in plan.units]))

    request: ChatRequest = adapter.requests[0]
    assert "Japanese -> Korean" in request.messages[0].content
    assert request.output_schema is not None
    assert response.output is not None
    assert response.error_kind is None
    assert translator.prompt_version.startswith("pass2.ja@")


@pytest.mark.parametrize(
    ("reply", "kind"),
    [
        ("not json", "json"),
        ('{"units": "x"}', "schema"),
        (('{"units": [', "length"), "truncated"),
    ],
)
def test_translator_classifies_bad_responses(reply: object, kind: str) -> None:
    builder, plan = _builder()
    translator = Pass2Translator(FakeAdapter(lambda _r: reply), "ja")  # type: ignore[arg-type,return-value]

    response = translator.translate(builder.build("B001", [plan.units[0].unit_id]))

    assert response.output is None
    assert response.error_kind == kind
