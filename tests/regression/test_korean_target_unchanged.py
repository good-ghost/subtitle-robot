"""대상 ko·원본 en/ja 는 다국어(Phase 8) 전과 같은 요청을 보낸다 (PROJECT-PLAN §26 불변식).

값은 Phase 8 착수 시점 코드(WI-8.001, 동작 변경 없음)로 계산한 해시다.
바뀌면 지금 작업공간의 번역이 stale 이 되거나 LLM 이 다른 요청을 받는다.
일부러 바꾼 것이 아니면 기대값을 고치지 않는다.
"""

import hashlib
import json
from pathlib import Path

import pytest

from subtitle_robot.analysis.analyzer import format_known_glossary
from subtitle_robot.analysis.schema import request_schema
from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.lang.codes import language_name
from subtitle_robot.pipeline.context import ContextBuilder, ContextSettings
from subtitle_robot.pipeline.schema import Pass2Output
from subtitle_robot.pipeline.style import CustomHonorific, StylePolicy
from subtitle_robot.pipeline.unitizer import unitize
from subtitle_robot.prompt import load_prompt
from tests.pipeline.test_context_translator import _doc

EXAMPLE = Path(__file__).parent.parent.parent / "examples" / "glossary.example.yaml"


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def _schema_sha(schema: dict[str, object]) -> str:
    return _sha(json.dumps(schema, sort_keys=True, ensure_ascii=False))


def _prompts() -> dict[str, str]:
    values: dict[str, str] = {}
    for lang in ("en", "ja"):
        for pass_name in ("pass1", "pass2"):
            prompt = load_prompt(pass_name, lang)
            values[prompt.version] = _sha(prompt.render(src_lang=language_name(lang)))
        summary = load_prompt("summary", lang)
        values[summary.version] = _sha(summary.render(src_lang=lang, max_chars="400"))
    return values


def _user_messages() -> str:
    doc = _doc()
    plan = unitize(doc, "ja")
    glossary = load_glossary(EXAMPLE)
    builder = ContextBuilder(
        doc, plan, glossary.entries, "ja", StylePolicy(), ContextSettings(),
        relations=glossary.relations,
    )  # fmt: skip
    return "\n".join(
        builder.build(f"B{n}", [unit.unit_id]).user_message for n, unit in enumerate(plan.units)
    )


EXPECTED: dict[str, object] = {
    "prompts": {
        "pass1.en@c71de68e": "94c44d69b7e6bee4",
        "pass2.en@4deaa89e": "9ba7691c86767d04",
        "summary.en@db60163c": "f0383ebc01268fc7",
        "pass1.ja@082c2d85": "4b32dac8539f6fd8",
        "pass2.ja@7f521413": "1f918d4a6048d2ee",
        "summary.ja@1d1255d7": "8fcbf3e5613faafc",
    },
    "pass1_schema": "1d115cd208b7870a",
    "pass2_schema": "a717ec9633f67fa9",
    "style_default": "25fd4cee88a5",
    "style_custom": "f9e9b17bb6ad",
    "pass2_user": "92afc058005097b1",
    "pass1_known": "58bf1cc3c07dddf6",
}


def _actual() -> dict[str, object]:
    custom = StylePolicy(
        honorifics_policy="translate",
        honorifics_custom={"先輩": CustomHonorific(ko="선배")},
        sdh="drop",
    )
    return {
        "prompts": _prompts(),
        "pass1_schema": _schema_sha(request_schema()),
        "pass2_schema": _schema_sha(Pass2Output.model_json_schema()),
        "style_default": StylePolicy().style_hash(),
        "style_custom": custom.style_hash(),
        "pass2_user": _sha(_user_messages()),
        "pass1_known": _sha(format_known_glossary(load_glossary(EXAMPLE).entries)),
    }


@pytest.mark.parametrize("key", sorted(EXPECTED))
def test_korean_target_requests_unchanged(key: str) -> None:
    assert _actual()[key] == EXPECTED[key]
