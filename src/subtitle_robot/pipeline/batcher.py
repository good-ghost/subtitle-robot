"""토큰 예산 기반 배처 (PROJECT-PLAN §6.4, WI-3.005).

unit 을 쪼개지 않고 배치에 담는다. 배치 하나는 다음을 모두 지킨다.
- 입력: 고정 요소 토큰(시스템·용어집·경칭·relations·직전 번역·lookahead)
  + 대상 토큰 + 출력 예산 + 여유 ≤ 컨텍스트
- 출력: 원문 문자 수 × 모델·언어별 출력 비율 ≤ max_output_tokens
- 블록 수 ≤ max_blocks (기본 60)
"""

from __future__ import annotations

import logging
import math
from collections.abc import Callable
from dataclasses import dataclass

from pydantic import BaseModel, ConfigDict

from subtitle_robot.io.normalize import NormalizedDocument
from subtitle_robot.lang.base import LanguageCode, plain_text
from subtitle_robot.lang.codes import script_of
from subtitle_robot.pipeline.unitizer import UnitPlan

logger = logging.getLogger(__name__)

# 원문 1자당 출력 토큰 (M0 실측, JSON 구조 포함).
# 모델 이름에 들어 있는 키로 찾는다
_OUTPUT_RATIOS: dict[str, dict[LanguageCode, float]] = {
    "deepseek": {"en": 1.25, "ja": 3.92},
    "qwen": {"en": 1.96, "ja": 6.50},
}
# 모르는 모델: 실측 중 가장 큰 값
_FALLBACK_RATIO: dict[LanguageCode, float] = {"en": 1.96, "ja": 6.50}
# 실측 비율 위에 두는 여유 (배치마다 출력 길이가 흔들린다)
OUTPUT_SAFETY_FACTOR = 1.2


# 실측이 없는 원본 언어: 글자가 넓은 문자 체계(한자·가나·한글)는 ja 값, 그 밖은 en 값 (§26.2)
_DENSE_SCRIPTS = frozenset({"kana", "han", "hangul"})


def output_ratio_for(model: str, lang: LanguageCode) -> float:
    """모델·언어의 원문 1자당 출력 토큰 (여유 포함)."""
    measured = lang if lang in _FALLBACK_RATIO else _ratio_language(lang)
    lowered = model.lower()
    for key, ratios in _OUTPUT_RATIOS.items():
        if key in lowered:
            return ratios[measured] * OUTPUT_SAFETY_FACTOR
    return _FALLBACK_RATIO[measured] * OUTPUT_SAFETY_FACTOR


def _ratio_language(lang: LanguageCode) -> str:
    return "ja" if script_of(lang) in _DENSE_SCRIPTS else "en"


@dataclass(frozen=True)
class BatchBudget:
    """배치 예산.

    Attributes:
        context_tokens: 요청 하나의 컨텍스트 (로컬은 슬롯당).
        fixed_tokens: 배치마다 붙는 고정 요소 토큰 추정 (WI-3.006 이 계산).
        output_tokens_per_char: 원문 1자당 출력 토큰 (`output_ratio_for`).
        max_output_tokens: 응답 토큰 상한.
        safety_margin: 입력 추정 오차 여유.
        max_blocks: 배치당 블록 수 상한 (§6.4 기본 60).
    """

    context_tokens: int
    fixed_tokens: int
    output_tokens_per_char: float
    max_output_tokens: int = 8192
    safety_margin: int = 1024
    max_blocks: int = 60

    @property
    def input_tokens(self) -> int:
        """대상 unit 에 쓸 수 있는 입력 토큰."""
        return self.context_tokens - self.fixed_tokens - self.max_output_tokens - self.safety_margin


class Batch(BaseModel):
    """배치 하나."""

    model_config = ConfigDict(frozen=True)

    batch_id: str
    unit_ids: tuple[str, ...]
    idxs: tuple[int, ...]
    input_tokens: int
    expected_output_tokens: int


class BatchPlanError(ValueError):
    """고정 요소만으로 예산을 넘는다."""


def plan_batches(
    plan: UnitPlan,
    doc: NormalizedDocument,
    budget: BatchBudget,
    count_tokens: Callable[[str], int],
) -> list[Batch]:
    """unit 을 배치로 나눈다.

    Args:
        plan: unit 구성.
        doc: 정규화 문서 (원문 텍스트).
        budget: 예산.
        count_tokens: 토큰 수 세기. 문서 전체에 한 번만 불러 문자/토큰 비율을 얻는다
            (llama-server `/tokenize` 를 unit 마다 부르지 않게).

    Raises:
        BatchPlanError: 고정 요소와 출력 예산만으로 컨텍스트를 넘는다.
    """
    if budget.input_tokens <= 0:
        raise BatchPlanError(
            f"배치 입력 예산이 없다: 컨텍스트 {budget.context_tokens}, 고정 {budget.fixed_tokens}, "
            f"출력 {budget.max_output_tokens}, 여유 {budget.safety_margin}"
        )
    texts = {block.idx: plain_text(block.text) for block in doc.blocks}
    unit_texts = {
        unit.unit_id: "\n".join(f"{idx}: {texts[idx]}" for idx in unit.idxs) for unit in plan.units
    }
    joined = "\n".join(unit_texts.values())
    tokens_per_char = count_tokens(joined) / len(joined) if joined else 0.0

    batches: list[Batch] = []
    current: list[str] = []
    current_idxs: list[int] = []
    in_tokens = 0
    out_tokens = 0
    for unit in plan.units:
        text = unit_texts[unit.unit_id]
        unit_in = math.ceil(len(text) * tokens_per_char)
        unit_out = math.ceil(sum(len(texts[i]) for i in unit.idxs) * budget.output_tokens_per_char)
        fits = (
            in_tokens + unit_in <= budget.input_tokens
            and out_tokens + unit_out <= budget.max_output_tokens
            and len(current_idxs) + len(unit.idxs) <= budget.max_blocks
        )
        if current and not fits:
            batches.append(_batch(len(batches) + 1, current, current_idxs, in_tokens, out_tokens))
            current, current_idxs, in_tokens, out_tokens = [], [], 0, 0
        if not current and (unit_in > budget.input_tokens or unit_out > budget.max_output_tokens):
            logger.warning("unit %s alone exceeds the batch budget", unit.unit_id)
        current.append(unit.unit_id)
        current_idxs.extend(unit.idxs)
        in_tokens += unit_in
        out_tokens += unit_out
    if current:
        batches.append(_batch(len(batches) + 1, current, current_idxs, in_tokens, out_tokens))
    return batches


def _batch(
    number: int, unit_ids: list[str], idxs: list[int], tokens_in: int, tokens_out: int
) -> Batch:
    return Batch(
        batch_id=f"B{number:03d}",
        unit_ids=tuple(unit_ids),
        idxs=tuple(idxs),
        input_tokens=tokens_in,
        expected_output_tokens=tokens_out,
    )
