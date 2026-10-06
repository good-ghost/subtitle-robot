import json
import re
from collections.abc import Callable
from pathlib import Path
from typing import Literal

import pytest

from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.io.normalize import normalize_srt
from subtitle_robot.llm.base import ChatRequest
from subtitle_robot.pipeline.batcher import Batch
from subtitle_robot.pipeline.context import ContextBuilder
from subtitle_robot.pipeline.schema import Pass2Output
from subtitle_robot.pipeline.style import StylePolicy
from subtitle_robot.pipeline.translator import Pass2Translator
from subtitle_robot.pipeline.unitizer import UnitPlan, unitize
from subtitle_robot.pipeline.validator import (
    BatchOutcome,
    BatchProcessor,
    RetryLimits,
    Validator,
)
from tests.fake_llm import FakeAdapter

EXAMPLE = Path(__file__).parent.parent.parent / "examples" / "glossary.example.yaml"
JA_LINES = ["田中さん、これ", "佐藤さんの部屋に", "届いてたよ。"]  # 단위: [1], [2, 3]
EN_LINES = ["Did John Miller see that weird light", "in the backyard?", "NASA said no."]
Answer = dict[int, str]
Lang = Literal["en", "ja"]


def _setup(lines: list[str], lang: Lang) -> tuple[ContextBuilder, UnitPlan, Validator]:
    body = "".join(
        f"{n}\n00:00:{n:02},000 --> 00:00:{n:02},800\n{t}\n\n" for n, t in enumerate(lines, 1)
    )
    doc = normalize_srt(body.encode("utf-8"), source_path="t.srt")
    plan = unitize(doc, lang)
    entries = load_glossary(EXAMPLE).entries
    builder = ContextBuilder(doc, plan, entries, lang, StylePolicy())
    return builder, plan, Validator(entries, lang, StylePolicy(), builder.sources)


def _requested(request: ChatRequest) -> list[tuple[str, list[int]]]:
    match = re.search(r"<translate>\n(.*)\n</translate>", request.messages[-1].content, re.DOTALL)
    assert match
    payload = json.loads(match.group(1))
    return [(u["unit"], [b["idx"] for b in u["blocks"]]) for u in payload["units"]]


def _responder(answers: list[Answer | str]) -> Callable[[ChatRequest], str]:
    """요청마다 다음 답을 쓴다. dict 는 요청한 idx 만 담아 돌려준다."""
    queue = list(answers)

    def respond(request: ChatRequest) -> str:
        answer = queue.pop(0) if len(queue) > 1 else queue[0]
        if isinstance(answer, str):
            return answer
        units = [
            {"unit": uid, "blocks": [{"idx": i, "ko": answer[i]} for i in idxs if i in answer]}
            for uid, idxs in _requested(request)
        ]
        return json.dumps({"units": units}, ensure_ascii=False)

    return respond


def _run(
    lines: list[str], lang: Lang, answers: list[Answer | str], **limits: int
) -> tuple[BatchOutcome, FakeAdapter]:
    builder, plan, validator = _setup(lines, lang)
    adapter = FakeAdapter(_responder(answers))
    processor = BatchProcessor(
        builder, Pass2Translator(adapter, lang), validator, plan, RetryLimits(**limits)
    )
    batch = Batch(
        batch_id="B001",
        unit_ids=tuple(u.unit_id for u in plan.units),
        idxs=tuple(i for u in plan.units for i in u.idxs),
        input_tokens=0,
        expected_output_tokens=0,
    )
    return processor.run(batch), adapter


def _codes(outcome: BatchOutcome) -> list[str]:
    return sorted(issue.code for issue in outcome.issues)


GOOD_JA = {1: "타나카 상, 이거", 2: "사토 상 방에", 3: "와 있었어."}


def test_clean_batch_has_no_errors() -> None:
    outcome, adapter = _run(JA_LINES, "ja", [GOOD_JA])

    assert outcome.translations == GOOD_JA
    assert [i for i in outcome.issues if i.severity == "error"] == []
    assert outcome.needs_review == set()
    assert len(adapter.requests) == 1


def test_format_error_retries_batch_then_succeeds() -> None:
    outcome, adapter = _run(JA_LINES, "ja", ["not json", '{"units": 1}', "oops", GOOD_JA])

    assert outcome.batch_attempts == 4
    assert outcome.translations == GOOD_JA
    assert "batch_format" not in _codes(outcome)
    assert len(adapter.requests) == 4


def test_format_error_forever_does_not_stop_pipeline() -> None:
    outcome, _ = _run(JA_LINES, "ja", ["not json"])

    assert "batch_format" in _codes(outcome)
    assert outcome.needs_review == {1, 2, 3}
    assert outcome.translations[1] == "田中さん、これ"  # 원문 유지


def test_unit_retry_only_requests_failing_units() -> None:
    missing_two = {1: "타나카 상, 이거", 3: "와 있었어."}
    outcome, adapter = _run(JA_LINES, "ja", [missing_two, GOOD_JA])

    assert [uid for uid, _ in _requested(adapter.requests[1])] == ["U2"]
    assert outcome.translations == GOOD_JA
    assert outcome.unit_retries == 1


def test_structural_error_after_retries_uses_fallback_split() -> None:
    merged = {1: "타나카 상, 이거", 2: "사토 상 방에 와 있었어."}  # idx 3 누락
    outcome, adapter = _run(JA_LINES, "ja", [merged])

    assert len(adapter.requests) == 3  # 배치 1 + unit 재요청 2
    assert "fallback_split" in _codes(outcome)
    assert outcome.translations[2]
    assert outcome.translations[3]
    assert " ".join([outcome.translations[2], outcome.translations[3]]) == "사토 상 방에 와 있었어."


def test_empty_translation_is_error_then_fallback() -> None:
    outcome, _ = _run(JA_LINES, "ja", [{**GOOD_JA, 3: " "}], unit_retries=0)

    assert "fallback_split" in _codes(outcome)


def test_avoid_used_is_replaced_with_particle_fix() -> None:
    wrong = {1: "다나카가 이거", 2: "사토 상 방에", 3: "와 있었어."}
    outcome, _ = _run(JA_LINES, "ja", [wrong])

    assert outcome.translations[1] == "타나카가 이거"
    assert "avoid_replaced" in _codes(outcome)
    assert 1 not in outcome.needs_review


def test_residual_source_marks_needs_review() -> None:
    residual = {**GOOD_JA, 3: "そろそろ 와 있었어."}  # M0 실측 사례 (Qwen)
    outcome, _ = _run(JA_LINES, "ja", [residual])

    assert "residual_source" in _codes(outcome)
    assert outcome.needs_review == {3}


def test_honorific_form_and_term_missing_warnings() -> None:
    answer = {1: "타나카 씨, 이거", 2: "그 사람 방에", 3: "와 있었어."}
    outcome, _ = _run(JA_LINES, "ja", [answer])
    warnings = {(i.code, i.detail) for i in outcome.issues if i.severity == "warning"}

    assert ("honorific_form", "田中さん → 타나카 상") in warnings  # M0: さん 을 씨로 옮김
    assert ("term_missing", "佐藤 → 사토") in warnings
    assert outcome.needs_review == set()


def test_line_warnings() -> None:
    long = {**GOOD_JA, 3: "아주아주아주아주아주아주 긴 한 줄짜리 번역문입니다\n둘째\n셋째"}
    outcome, _ = _run(JA_LINES, "ja", [long])

    assert {"line_too_long", "too_many_lines"} <= set(_codes(outcome))


def test_english_acronym_and_quoted_title_are_not_residual() -> None:
    answer = {
        1: "존 밀러가 그 이상한 빛을 봤어?",
        2: "뒷마당에서?",
        3: 'NASA는 아니래. ["Arie And Lee" 연주]',
    }
    outcome, _ = _run(EN_LINES, "en", [answer])

    assert "residual_source" not in _codes(outcome)


def test_english_residual_word_is_error() -> None:
    answer = {1: "존 밀러가 그 이상한 빛을 봤어?", 2: "뒷마당에서?", 3: "먹을 게 plenty 해."}
    outcome, _ = _run(EN_LINES, "en", [answer])

    assert outcome.needs_review == {3}


@pytest.mark.parametrize("answer", [{3: "와 있었어.", 2: "사토 상 방에", 1: "타나카 상"}])
def test_order_error_is_structural(answer: Answer) -> None:
    _, plan, validator = _setup(JA_LINES, "ja")
    output = Pass2Output.model_validate(
        {
            "units": [
                {"unit": "U2", "blocks": [{"idx": 3, "ko": answer[3]}, {"idx": 2, "ko": answer[2]}]}
            ]
        }
    )

    check = validator.check_unit(plan.units[1], output)

    assert "idx_order" in [issue.code for issue in check.errors]
