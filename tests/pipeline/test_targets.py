"""다른 원본·대상 언어 조합 (PROJECT-PLAN §26.2~§26.5, WI-8.003).

일본어 원본은 대상과 관계없이 일본어 전용 규칙, 한국어 대상은 원본과 관계없이 한국어 전용 처리를
쓴다 (사용자 지시 2026-10-04). 공통 처리는 전용 로직이 없는 언어에만 쓴다.
"""

import json
import re
from collections.abc import Callable
from pathlib import Path
from typing import Any

from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.io.parser import parse_srt
from subtitle_robot.lang.target import schema_for_target
from subtitle_robot.llm.base import ChatRequest
from subtitle_robot.pipeline.report import render_summary
from subtitle_robot.pipeline.runner import RunOptions, translate_file
from subtitle_robot.pipeline.schema import Pass2Output
from subtitle_robot.pipeline.validator import replace_word, residual_pattern
from tests.fake_llm import FakeAdapter

JA_SRT = (
    "1\n00:00:01,000 --> 00:00:02,000\n田中さん、これ\n\n"
    "2\n00:00:03,000 --> 00:00:04,000\n届いてたよ。\n"
)
FR_SRT = (
    "1\n00:00:01,000 --> 00:00:02,000\nJean, tu viens\n\n"
    "2\n00:00:03,000 --> 00:00:04,000\navec moi à Paris ?\n"
)


def _responder(
    pass1: dict[str, Any], texts: dict[int, str], field: str
) -> Callable[[ChatRequest], str]:
    def respond(request: ChatRequest) -> str:
        if request.schema_name == "pass1_output":
            return json.dumps(pass1, ensure_ascii=False)
        message = request.messages[-1].content
        match = re.search(r"<translate>\n(.*)\n</translate>", message, re.DOTALL)
        assert match
        units = [
            {"unit": u["unit"], "blocks": [{"idx": b["idx"], field: texts[b["idx"]]}
                                           for b in u["blocks"]]}
            for u in json.loads(match.group(1))["units"]
        ]  # fmt: skip
        return json.dumps({"units": units}, ensure_ascii=False)

    return respond


def _requests(adapter: FakeAdapter, kind: str) -> list[ChatRequest]:
    return [r for r in adapter.requests if r.schema_name == f"{kind}_output"]


def _properties(schema: dict[str, Any]) -> set[str]:
    names: set[str] = set()
    for definition in [schema, *schema.get("$defs", {}).values()]:
        names |= set(definition.get("properties", {}))
    return names


def test_japanese_to_english_keeps_japanese_rules_without_korean_processing(
    tmp_path: Path,
) -> None:
    source = tmp_path / "ep.ja.srt"
    source.write_text(JA_SRT, encoding="utf-8")
    pass1 = {
        "new_entities": [
            {"tmp": "n1", "type": "person", "source": "田中", "reading": "たなか",
             "origin": "japanese", "suggestion": "Tanaka", "seen_suffixes": ["さん"],
             "first_seen": 1, "count": 1},
        ]
    }  # fmt: skip
    adapter = FakeAdapter(_responder(pass1, {1: "Tanaka-san, this", 2: "arrived."}, "text"))

    result = translate_file(
        source, tmp_path / "ep.en.srt", tmp_path / "work", adapter, RunOptions(target="en")
    )

    (pass1_request,) = _requests(adapter, "pass1")
    system = pass1_request.messages[0].content
    assert "glossary for translation into English" in system
    assert "Japanese rules:" in system  # 일본어 전용 규칙 (가나 읽기·origin)
    assert "Hangul" not in system
    assert "suggestion" in _properties(pass1_request.output_schema or {})
    assert "ko_suggestion" not in _properties(pass1_request.output_schema or {})
    entry = load_glossary(tmp_path / "work" / "glossary.yaml").entries[0]
    # 한글 음역(generated) 대신 LLM 제안, 경칭은 매처가 떼어 낸다 (일본어 전용 로직)
    assert (entry.target, entry.target_source, entry.avoid) == ("Tanaka", "llm", ())
    (pass2_request,) = _requests(adapter, "pass2")
    assert "(Japanese -> English)" in pass2_request.messages[0].content
    assert "<honorifics>\n\n</honorifics>" in pass2_request.messages[-1].content
    assert "E0001 田中 = Tanaka" in pass2_request.messages[-1].content
    assert "text" in _properties(pass2_request.output_schema or {})
    assert [b.text for b in parse_srt(result.output_path.read_text()).blocks] == [
        "Tanaka-san, this",
        "arrived.",
    ]
    assert result.report.prompt_versions["pass2"].startswith("pass2.ja-en@")
    assert result.report.target_lang == "en"
    assert "언어: ja → en," in render_summary(result.report)


def test_french_to_korean_uses_korean_prompt_with_generic_source_rules(tmp_path: Path) -> None:
    source = tmp_path / "ep.srt"
    source.write_text(FR_SRT, encoding="utf-8")
    pass1 = {
        "new_entities": [
            {"tmp": "n1", "type": "person", "source": "Jean", "ko_suggestion": "장",
             "first_seen": 1, "count": 1},
            {"tmp": "n2", "type": "place", "source": "Paris", "ko_suggestion": "파리",
             "first_seen": 2, "count": 1},
        ]
    }  # fmt: skip
    adapter = FakeAdapter(_responder(pass1, {1: "장, 너", 2: "나랑 파리 갈래?"}, "ko"))

    result = translate_file(
        source, tmp_path / "ep.ko.srt", tmp_path / "work", adapter, RunOptions(src="fr")
    )

    (pass1_request,) = _requests(adapter, "pass1")
    assert "Source language rules:" in pass1_request.messages[0].content
    assert "ko_suggestion" in _properties(pass1_request.output_schema or {})
    (pass2_request,) = _requests(adapter, "pass2")
    system = pass2_request.messages[0].content
    assert "(French -> Korean)" in system
    assert "Hangul" in system
    # 공통 프로파일: 소문자로 시작하는 다음 블록은 같은 문장
    assert '"blocks": [{"idx": 1' in pass2_request.messages[-1].content
    assert result.src_lang == "fr"
    assert result.report.prompt_versions["pass2"].startswith("pass2.fr@")
    assert [b.text for b in parse_srt(result.output_path.read_text()).blocks] == [
        "장, 너",
        "나랑 파리 갈래?",
    ]


def test_english_to_french_skips_residual_check_and_uses_longer_lines(tmp_path: Path) -> None:
    source = tmp_path / "ep.en.srt"
    source.write_text(
        "1\n00:00:01,000 --> 00:00:02,000\nI think we should go to the station now.\n",
        encoding="utf-8",
    )
    reply = {1: "Je pense qu'on devrait aller à la gare."}  # 39자: 22자 기준이면 warning
    adapter = FakeAdapter(_responder({"new_entities": []}, reply, "text"))

    result = translate_file(
        source, tmp_path / "ep.fr.srt", tmp_path / "work", adapter, RunOptions(target="fr")
    )

    assert result.report.issue_counts == {}
    assert result.report.needs_review == []


def test_schema_field_names_per_target() -> None:
    korean = Pass2Output.model_json_schema()
    english = schema_for_target(korean, "en")

    assert schema_for_target(korean, "ko") is korean
    block = english["$defs"]["Pass2Block"]
    assert set(block["properties"]) == {"idx", "text"}
    assert block["required"] == ["idx", "text"]
    assert block["properties"]["text"]["title"] == "Text"
    term = english["$defs"]["NewTerm"]["properties"]
    assert "suggestion" in term
    assert "ko_suggestion" not in term
    # 응답은 두 이름을 모두 받는다
    old = Pass2Output.model_validate({"units": [{"unit": "U1", "blocks": [{"idx": 1, "ko": "a"}]}]})
    new = Pass2Output.model_validate(
        {"units": [{"unit": "U1", "blocks": [{"idx": 1, "text": "a"}]}]}
    )
    assert old == new


def test_residual_pattern_follows_scripts() -> None:
    assert residual_pattern("en", "ko") is not None
    assert residual_pattern("en", "fr") is None
    assert residual_pattern("fr", "de") is None
    assert residual_pattern("ja", "en") is not None
    assert residual_pattern("zh", "ja") is None  # 일본어는 한자를 쓴다
    ru = residual_pattern("ru", "en")
    assert ru is not None
    assert ru.findall("Hello Привет") == ["Привет"]
    assert residual_pattern("sw", "ja") is not None  # 라틴 문자 언어 → 공통 라틴 패턴


def test_replace_word_respects_word_boundaries() -> None:
    assert replace_word("Jon and Jonathan", "Jon", "John") == ("John and Jonathan", 1)
    assert replace_word("田中さんと田中", "田中", "Tanaka") == (
        "TanakaさんとTanaka",
        2,
    )
    assert replace_word("x", "", "y") == ("x", 0)


def test_output_ratio_for_unmeasured_languages() -> None:
    from subtitle_robot.pipeline.batcher import output_ratio_for

    assert output_ratio_for("qwen3", "fr") == output_ratio_for("qwen3", "en")
    assert output_ratio_for("qwen3", "zh") == output_ratio_for("qwen3", "ja")
    assert output_ratio_for("other", "ko") == output_ratio_for("other", "ja")


def test_cjk_blocks_excluded_for_other_sources() -> None:
    from subtitle_robot.io.normalize import normalize_srt
    from subtitle_robot.pipeline.unitizer import unitize

    text = (
        "1\n00:00:01,000 --> 00:00:02,000\nBonjour.\n\n"
        "2\n00:00:03,000 --> 00:00:04,000\n本字幕由花語千夏字幕組共同製作\n\n"
        "3\n00:00:05,000 --> 00:00:06,000\nこんにちは\n"
    )
    doc = normalize_srt(text.encode(), source_path="t.srt")

    assert unitize(doc, "fr").excluded == {2: "non_source_language", 3: "non_source_language"}
    assert unitize(doc, "zh").excluded == {3: "non_source_language"}
