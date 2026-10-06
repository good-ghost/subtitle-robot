"""재분리 결과 결합, 폴백 분리, 원본 타임스탬프 결합 (PROJECT-PLAN §10.2, §10.3, WI-3.007).

- LLM 이 unit 을 원래 블록으로 나눈 결과를 idx → 번역문으로 모은다
- 검증 error 가 재시도 뒤에도 남으면 unit 전체 번역문을 원본 블록 글자 수 비율로 어절 단위 분할한다
- 출력 블록은 원본 번호·타이밍 줄을 그대로 쓰고, 블록 앞 ASS 태그를 번역문 앞에 복원한다 (Q-01)
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass

from subtitle_robot.io.normalize import NormalizedDocument
from subtitle_robot.pipeline.context import SourceBlock
from subtitle_robot.pipeline.schema import Pass2Output
from subtitle_robot.pipeline.style import excluded_output
from subtitle_robot.pipeline.unitizer import ExclusionReason


@dataclass(frozen=True)
class OutputBlock:
    """출력 SRT 블록 (writer 의 SrtBlock 프로토콜)."""

    number: str | None
    timing_line: str
    text: str


def collect_translations(output: Pass2Output) -> dict[int, list[str]]:
    """응답의 idx → 번역문 목록 (같은 idx 가 여러 번 오면 모두 담는다 — 검증이 중복을 잡는다)."""
    collected: dict[int, list[str]] = {}
    for unit in output.units:
        for block in unit.blocks:
            collected.setdefault(block.idx, []).append(block.text)
    return collected


def unit_text(output: Pass2Output, idxs: Sequence[int]) -> str:
    """unit 에 속한 블록 번역문을 순서대로 이은 문장 (폴백 분리 입력)."""
    wanted = set(idxs)
    parts = [
        block.text.strip()
        for unit in output.units
        for block in unit.blocks
        if block.idx in wanted and block.text.strip()
    ]
    return " ".join(" ".join(part.split()) for part in parts)


def fallback_split(text: str, weights: Sequence[int]) -> list[str]:
    """번역문을 블록 수만큼 나눈다. 원본 블록 길이(weights) 비율로 어절 경계에서 자른다 (§10.3).

    각 경계는 누적 목표 글자 수에 가장 가까운 어절 위치로 정하고,
    남은 블록마다 어절이 최소 하나 남게 한다. 어절이 블록보다 적으면 글자 단위로 나눈다.
    텍스트가 블록 수보다 짧으면 뒤 블록이 빈다 (검증이 잡는다).

    Args:
        text: unit 전체 번역문.
        weights: 원본 블록별 글자 수 (0 이하는 1로 본다).
    """
    count = len(weights)
    if count <= 1:
        return [text.strip()]
    tokens, joiner = text.split(), " "
    if len(tokens) < count:
        tokens, joiner = list("".join(tokens)), ""
    if len(tokens) < count:
        return [*tokens, *[""] * (count - len(tokens))]

    safe = [max(1, weight) for weight in weights]
    sizes = [len(token) for token in tokens]
    total_chars, total_weight = sum(sizes), sum(safe)
    boundaries: list[int] = []
    position = accumulated = cumulative_weight = 0
    for block_no in range(count - 1):
        cumulative_weight += safe[block_no]
        target = total_chars * cumulative_weight / total_weight
        last_allowed = len(tokens) - (count - 1 - block_no)  # 뒤 블록들에 어절을 하나씩 남긴다
        accumulated += sizes[position]
        position += 1
        while position < last_allowed and abs(accumulated + sizes[position] - target) <= abs(
            accumulated - target
        ):
            accumulated += sizes[position]
            position += 1
        boundaries.append(position)
    pieces: list[str] = []
    begin = 0
    for boundary in [*boundaries, len(tokens)]:
        pieces.append(joiner.join(tokens[begin:boundary]))
        begin = boundary
    return pieces


def restore_leading_tags(ko: str, source: SourceBlock | None) -> str:
    """블록 앞 ASS 태그를 번역문 앞에 복원한다 (Q-01)."""
    if source is None or not source.leading_tags:
        return ko
    return f"{source.leading_tags}{ko}"


def clean_text(ko: str) -> str:
    """출력 SRT 에 쓸 수 있게 정리: 줄 끝 공백 제거, 빈 줄 제거 (빈 줄은 블록 경계로 오인된다)."""
    return "\n".join(line.rstrip() for line in ko.split("\n") if line.strip())


def assemble_output(
    doc: NormalizedDocument,
    translations: Mapping[int, str],
    excluded: Mapping[int, ExclusionReason],
    sources: Mapping[int, SourceBlock],
) -> list[OutputBlock]:
    """원본 블록 순서·번호·타이밍 줄 위에 번역문을 얹는다.

    번역 제외 블록은 사유에 따라 원문 그대로(drop 은 비움), 번역이 없는 블록은 원문을 그대로 쓴다
    (Validator 가 폴백까지 거친 뒤라 정상이면 없어야 한다 — 리포트가 needs_review 로 잡는다).
    """
    blocks: list[OutputBlock] = []
    for block in doc.blocks:
        if block.idx in excluded:
            text = excluded_output(block.text, excluded[block.idx])
        elif block.idx in translations:
            text = restore_leading_tags(clean_text(translations[block.idx]), sources.get(block.idx))
        else:
            text = block.text
        blocks.append(OutputBlock(block.number, block.timing_line, text))
    return blocks
