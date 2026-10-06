import pytest

from subtitle_robot.io.normalize import NormalizedDocument, normalize_srt
from subtitle_robot.pipeline.batcher import (
    OUTPUT_SAFETY_FACTOR,
    BatchBudget,
    BatchPlanError,
    output_ratio_for,
    plan_batches,
)
from subtitle_robot.pipeline.unitizer import unitize


def _doc(count: int, text: str = "This is line {n}.") -> NormalizedDocument:
    def stamp(n: int, ms: int) -> str:
        return f"00:{n // 60:02}:{n % 60:02},{ms:03}"

    body = "".join(
        f"{n}\n{stamp(n, 0)} --> {stamp(n, 500)}\n{text.format(n=n)}\n\n"
        for n in range(1, count + 1)
    )
    return normalize_srt(body.encode("utf-8"), source_path="t.srt")


def _budget(**overrides: float) -> BatchBudget:
    values: dict[str, float] = {
        "context_tokens": 100_000,
        "fixed_tokens": 2000,
        "output_tokens_per_char": 1.0,
        "max_output_tokens": 8192,
        "safety_margin": 1024,
        "max_blocks": 60,
    }
    values.update(overrides)
    return BatchBudget(**values)  # type: ignore[arg-type]


def chars(text: str) -> int:
    return len(text)


def test_output_ratios_from_m0() -> None:
    assert output_ratio_for("deepseek-ai/deepseek-v4.1-flash", "ja") == pytest.approx(
        3.92 * OUTPUT_SAFETY_FACTOR
    )
    assert output_ratio_for("/models/Qwen3.8-27B-UD-Q4_K_XL.gguf", "en") == pytest.approx(
        1.96 * OUTPUT_SAFETY_FACTOR
    )
    assert output_ratio_for("unknown-model", "ja") == pytest.approx(6.50 * OUTPUT_SAFETY_FACTOR)


def test_block_cap_splits_and_keeps_order() -> None:
    doc = _doc(150)
    plan = unitize(doc, "en")

    batches = plan_batches(plan, doc, _budget(max_blocks=60), chars)

    assert [len(b.idxs) for b in batches] == [60, 60, 30]
    assert [idx for b in batches for idx in b.idxs] == list(range(1, 151))
    assert [b.batch_id for b in batches] == ["B001", "B002", "B003"]


def test_output_budget_limits_batch() -> None:
    doc = _doc(40)  # 줄당 약 16자
    plan = unitize(doc, "en")

    batches = plan_batches(
        plan, doc, _budget(output_tokens_per_char=10.0, max_output_tokens=1000), chars
    )

    assert all(b.expected_output_tokens <= 1000 for b in batches)
    assert len(batches) > 1


def test_input_budget_limits_batch() -> None:
    doc = _doc(40)
    plan = unitize(doc, "en")
    # 입력 예산 = 3000 - 2000 - 500 - 100 = 400 토큰
    budget = _budget(context_tokens=3000, max_output_tokens=500, safety_margin=100)

    batches = plan_batches(plan, doc, budget, chars)

    assert all(b.input_tokens <= 400 for b in batches)
    assert [idx for b in batches for idx in b.idxs] == list(range(1, 41))


def test_units_are_never_split() -> None:
    body = "".join(
        f"{n}\n00:00:{n:02},000 --> 00:00:{n:02},900\nand then,\n\n" for n in range(1, 13)
    )
    doc = normalize_srt(body.encode("utf-8"), source_path="t.srt")
    plan = unitize(doc, "en")  # 4블록씩 unit 3개

    batches = plan_batches(plan, doc, _budget(max_blocks=6), chars)

    assert [len(b.idxs) for b in batches] == [4, 4, 4]


def test_no_budget_raises() -> None:
    doc = _doc(3)

    with pytest.raises(BatchPlanError, match="입력 예산"):
        plan_batches(unitize(doc, "en"), doc, _budget(context_tokens=3000), chars)


def test_token_counter_called_once() -> None:
    doc = _doc(100)
    calls: list[str] = []

    def counter(text: str) -> int:
        calls.append(text)
        return len(text) // 2

    plan_batches(unitize(doc, "en"), doc, _budget(), counter)

    assert len(calls) == 1


def test_empty_plan() -> None:
    doc = _doc(0)

    assert plan_batches(unitize(doc, "en"), doc, _budget(), chars) == []
