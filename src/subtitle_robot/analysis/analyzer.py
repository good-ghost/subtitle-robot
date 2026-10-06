"""Pass 1 분석기: 번역 전에 작품 전체에서 인명·고유명사를 뽑는다 (PROJECT-PLAN §9, WI-3.002).

전체 자막을 한 번에 보내는 것이 기본이다. 토큰 예산을 넘으면 연속 구간으로 나누어 추출하고 코드로
병합한다 (§9.4). 출력이 잘리면(`finish_reason=length`) 구간을 반으로 나누어 다시 요청한다.
"""

from __future__ import annotations

import logging
import math
from collections.abc import Sequence
from dataclasses import dataclass, field

from pydantic import ValidationError

from subtitle_robot.analysis.schema import NewEntity, Pass1Output, request_schema
from subtitle_robot.glossary.model import GlossaryEntry
from subtitle_robot.io.normalize import NormalizedBlock, NormalizedDocument
from subtitle_robot.lang.base import LanguageCode, plain_text
from subtitle_robot.lang.codes import DEFAULT_TARGET, language_name
from subtitle_robot.llm.base import ChatMessage, ChatRequest, LlmAdapter
from subtitle_robot.llm.errors import LlmResponseError
from subtitle_robot.prompt import load_prompt

logger = logging.getLogger(__name__)

# 공급자가 컨텍스트 크기를 알려주지 않을 때(NIM) 쓰는 보수적인 값
DEFAULT_CONTEXT_TOKENS = 32768
_SEGMENT_SLACK = 1.1  # 구간 수를 정할 때 토큰 추정 오차 여유
_FINISH_TRUNCATED = "length"


class Pass1Error(LlmResponseError):
    """재시도 상한까지 유효한 Pass 1 응답을 얻지 못했다."""


@dataclass(frozen=True)
class AnalysisBudget:
    """Pass 1 요청 하나의 토큰 예산 (§6.4).

    Attributes:
        context_tokens: 요청 하나가 쓸 수 있는 컨텍스트.
            None 이면 공급자 정보, 그것도 없으면 기본값.
        max_output_tokens: 응답 토큰 상한.
        safety_margin: 추정 오차 여유.
        max_attempts: 응답 형식 오류 시 같은 구간을 다시 요청하는 횟수 상한 (첫 시도 포함).
        max_segment_blocks: 구간 하나의 블록 수 상한 (요청 시간을 줄인다).
    """

    context_tokens: int | None = None
    max_output_tokens: int = 8192
    safety_margin: int = 1024
    max_attempts: int = 3
    # 구간 하나의 블록 수 상한. 컨텍스트에 다 들어가도 응답(엔티티 JSON)이 길면 요청 시간이
    # 공급자 제한(NIM 120초)을 넘는다 (2026-10-03: 영화 1,314블록을 한 요청으로 보내 시간 초과)
    max_segment_blocks: int = 300


@dataclass
class SegmentRecord:
    """구간 하나의 처리 기록 (리포트·fingerprint 용)."""

    first_idx: int
    last_idx: int
    blocks: int
    attempts: int
    prompt_tokens: int | None
    completion_tokens: int | None


@dataclass
class Pass1Result:
    """Pass 1 결과."""

    output: Pass1Output
    prompt_version: str
    model: str
    segments: list[SegmentRecord] = field(default_factory=list)


class Pass1Analyzer:
    """Pass 1 분석기."""

    def __init__(
        self,
        adapter: LlmAdapter,
        lang: LanguageCode,
        budget: AnalysisBudget | None = None,
        *,
        target: str = DEFAULT_TARGET,
    ) -> None:
        """분석기를 만든다. target 은 번역 대상 언어 (표기 제안의 언어, §26.5)."""
        self._adapter = adapter
        self._lang = lang
        self._target = target
        self._budget = budget or AnalysisBudget()
        self._prompt = load_prompt("pass1", lang, target=target)
        self._system = self._prompt.render(
            src_lang=language_name(lang), tgt_lang=language_name(target)
        )

    @property
    def prompt_version(self) -> str:
        """Pass 1 프롬프트 버전 (이미 분석한 에피소드를 건너뛸지 판단)."""
        return self._prompt.version

    def analyze(self, doc: NormalizedDocument, known: Sequence[GlossaryEntry] = ()) -> Pass1Result:
        """문서 전체를 분석한다.

        Args:
            doc: 정규화 문서. 번역 대상(`translate`) 블록만 보낸다.
            known: 이미 아는 용어집 항목 (ID 고정, 새 엔티티로 다시 내지 않게).

        Raises:
            Pass1Error: 어떤 구간이 재시도 상한까지 유효한 응답을 얻지 못했다.
        """
        blocks = [block for block in doc.blocks if block.translate]
        known_text = format_known_glossary(known)
        result = Pass1Result(output=Pass1Output(), prompt_version=self._prompt.version, model="")
        outputs: list[tuple[int, Pass1Output]] = []
        for segment in self._plan_segments(blocks, known_text):
            self._analyze_segment(segment, known_text, result, outputs)
        result.output = merge_outputs(outputs)
        return result

    # ---------------------------------------------------------------- 구간 계획

    def _available_tokens(self, known_text: str) -> int:
        info = self._adapter.describe()
        context = self._budget.context_tokens or info.context_tokens or DEFAULT_CONTEXT_TOKENS
        fixed = self._adapter.count_tokens(self._system) + self._adapter.count_tokens(known_text)
        return context - fixed - self._budget.max_output_tokens - self._budget.safety_margin

    def _plan_segments(
        self, blocks: list[NormalizedBlock], known_text: str
    ) -> list[list[NormalizedBlock]]:
        if not blocks:
            return []
        available = self._available_tokens(known_text)
        if available <= 0:
            raise Pass1Error(
                "Pass 1 토큰 예산이 없다: 시스템 프롬프트·용어집·출력 예산이 컨텍스트보다 크다"
            )
        total = self._adapter.count_tokens(format_subtitles(blocks))
        by_tokens = math.ceil(total * _SEGMENT_SLACK / available)
        by_blocks = math.ceil(len(blocks) / self._budget.max_segment_blocks)
        count = max(1, by_tokens, by_blocks)
        size = math.ceil(len(blocks) / count)
        return [blocks[start : start + size] for start in range(0, len(blocks), size)]

    # ---------------------------------------------------------------- 요청

    def _analyze_segment(
        self,
        segment: list[NormalizedBlock],
        known_text: str,
        result: Pass1Result,
        outputs: list[tuple[int, Pass1Output]],
    ) -> None:
        last_error = ""
        for attempt in range(1, self._budget.max_attempts + 1):
            chat = self._adapter.chat(
                ChatRequest(
                    messages=[
                        ChatMessage(role="system", content=self._system),
                        ChatMessage(role="user", content=build_user_message(segment, known_text)),
                    ],
                    output_schema=request_schema(self._target),
                    schema_name="pass1_output",
                    max_tokens=self._budget.max_output_tokens,
                )
            )
            result.model = chat.model
            if chat.finish_reason == _FINISH_TRUNCATED and len(segment) > 1:
                # 엔티티가 많아 출력이 넘쳤다: 같은 요청을 다시 보내도 소용없으니 구간을 나눈다
                logger.info("pass1 output truncated, splitting %d blocks", len(segment))
                half = len(segment) // 2
                self._analyze_segment(segment[:half], known_text, result, outputs)
                self._analyze_segment(segment[half:], known_text, result, outputs)
                return
            try:
                output = Pass1Output.model_validate_json(chat.json_text)
            except ValidationError as exc:
                last_error = f"{exc.error_count()} validation errors"
                logger.warning("pass1 invalid response (attempt %d): %s", attempt, last_error)
                continue
            result.segments.append(
                SegmentRecord(
                    first_idx=segment[0].idx,
                    last_idx=segment[-1].idx,
                    blocks=len(segment),
                    attempts=attempt,
                    prompt_tokens=chat.prompt_tokens,
                    completion_tokens=chat.completion_tokens,
                )
            )
            outputs.append((len(outputs) + 1, output))
            return
        raise Pass1Error(
            f"Pass 1 블록 {segment[0].idx}~{segment[-1].idx}: {self._budget.max_attempts}회 시도 "
            f"모두 유효한 응답이 아니다 ({last_error})"
        )


def format_subtitles(blocks: Sequence[NormalizedBlock]) -> str:
    """LLM 에 보낼 자막: 한 줄에 `idx: 텍스트`. 태그는 빼고 블록 안 줄바꿈은 ` / ` 로 잇는다."""
    return "\n".join(
        f"{block.idx}: {' / '.join(line.strip() for line in plain_text(block.text).split(chr(10)))}"
        for block in blocks
    )


def format_known_glossary(entries: Sequence[GlossaryEntry]) -> str:
    """알려진 용어집: `ID | 원문 = 한글 | variants: …`."""
    lines = []
    for entry in entries:
        variants = ", ".join(variant.src for variant in entry.variants)
        suffix = f" | variants: {variants}" if variants else ""
        lines.append(f"{entry.id} | {entry.source} = {entry.target}{suffix}")
    return "\n".join(lines)


def build_user_message(blocks: Sequence[NormalizedBlock], known_text: str) -> str:
    """Pass 1 사용자 메시지."""
    return (
        f"<known_glossary>\n{known_text}\n</known_glossary>\n"
        f"<subtitles>\n{format_subtitles(blocks)}\n</subtitles>"
    )


def merge_outputs(outputs: Sequence[tuple[int, Pass1Output]]) -> Pass1Output:
    """구간별 출력을 합친다 (코드 병합, §9.4).

    같은 원문(source)의 새 엔티티는 하나로 합친다:
    변형·경칭은 합집합, count 는 합, first_seen 은 최솟값.
    임시 키는 구간 번호를 붙여 겹치지 않게 한다 (`s2.n1`). 구간이 하나면 키를 그대로 둔다.
    """
    if len(outputs) == 1:
        return outputs[0][1]
    merged: dict[str, NewEntity] = {}
    variants = []
    conflicts = []
    for segment_no, output in outputs:
        for entity in output.new_entities:
            existing = merged.get(entity.source)
            if existing is None:
                merged[entity.source] = entity.model_copy(
                    update={"tmp": f"s{segment_no}.{entity.tmp}"}
                )
            else:
                merged[entity.source] = _merge_entity(existing, entity)
        variants.extend(output.new_variants)
        conflicts.extend(output.conflicts)
    return Pass1Output(
        new_entities=list(merged.values()), new_variants=variants, conflicts=conflicts
    )


def _merge_entity(first: NewEntity, second: NewEntity) -> NewEntity:
    seen_variants = {variant.src for variant in first.variants}
    extra_variants = [variant for variant in second.variants if variant.src not in seen_variants]
    first_seen = [value for value in (first.first_seen, second.first_seen) if value is not None]
    counts = [value for value in (first.count, second.count) if value is not None]
    return first.model_copy(
        update={
            "variants": [*first.variants, *extra_variants],
            "seen_suffixes": list(dict.fromkeys([*first.seen_suffixes, *second.seen_suffixes])),
            "first_seen": min(first_seen) if first_seen else None,
            "count": sum(counts) if counts else None,
            "reading": first.reading or second.reading,
            "origin": first.origin or second.origin,
        }
    )
