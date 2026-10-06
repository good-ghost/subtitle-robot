"""Unitizer: 문장 중간에서 잘린 블록을 문장 단위(unit)로 묶는다 (PROJECT-PLAN §10.1, WI-3.004).

번역 제외 블록(빈 블록, 원본 언어가 아닌 블록 — Q-02)은 unit 에 넣지 않고 원문 그대로 출력한다.
규칙표는 WI-3.004.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from subtitle_robot.io.langdetect import block_language
from subtitle_robot.io.normalize import BlockFlag, NormalizedBlock, NormalizedDocument
from subtitle_robot.lang.base import LanguageCode, LanguageProfile, get_profile, plain_text

# 번역 제외 사유: 빈 블록, 비원본 언어(Q-02), 스타일 정책(효과음·가사 keep/drop, WI-3.012)
ExclusionReason = Literal[
    "empty", "non_source_language", "sdh_keep", "sdh_drop", "lyrics_keep", "style_excluded"
]

# 번역에서 뺄 블록 언어 (Q-02): 한중일 중 원본이 아닌 것 (en: ja·zh·ko, ja: zh·ko, §26.2).
# 블록 판정은 문자 체계로만 하므로 라틴 문자 언어끼리는 가리지 않는다. unknown 은 번역한다
_CJK_BLOCK_LANGUAGES = frozenset({"ja", "zh", "ko"})
_STANDALONE_FLAGS = frozenset({BlockFlag.OVERLAP, BlockFlag.TIME_REVERSED, BlockFlag.BAD_TIMING})
_MS = 1000


class UnitLimits(BaseModel):
    """unit 상한 (`series.toml [unit]`, §10.1 기본값)."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    max_blocks: int = Field(default=4, ge=1)
    max_duration: float = Field(default=10.0, gt=0)
    max_gap: float = Field(default=1.0, ge=0)


class Unit(BaseModel):
    """문장 단위 하나."""

    model_config = ConfigDict(frozen=True)

    unit_id: str
    idxs: tuple[int, ...]


class UnitPlan(BaseModel):
    """문서 전체의 unit 구성 (`units.json`)."""

    model_config = ConfigDict(frozen=True)

    units: tuple[Unit, ...]
    excluded: dict[int, ExclusionReason]

    def unit_of(self) -> dict[int, str]:
        """idx → unit_id."""
        return {idx: unit.unit_id for unit in self.units for idx in unit.idxs}


def unitize(
    doc: NormalizedDocument,
    src_lang: LanguageCode,
    limits: UnitLimits | None = None,
    *,
    preset: Mapping[int, ExclusionReason] | None = None,
) -> UnitPlan:
    """문서를 unit 으로 묶는다.

    preset 은 입력 형식이 미리 정한 번역 제외다 (ASS 노래·제외 스타일 이벤트, WI-6.001).
    """
    limits = limits or UnitLimits()
    preset = preset or {}
    profile = get_profile(src_lang)
    excluded: dict[int, ExclusionReason] = {}
    groups: list[list[NormalizedBlock]] = []
    current: list[NormalizedBlock] = []

    for block in doc.blocks:
        reason = preset.get(block.idx) or _exclusion(block, src_lang)
        if reason is not None:
            excluded[block.idx] = reason
            if current:
                groups.append(current)
                current = []
            continue
        if current and _joins(current, block, profile, limits):
            current.append(block)
            continue
        if current:
            groups.append(current)
        current = [block]
    if current:
        groups.append(current)

    units = tuple(
        Unit(unit_id=f"U{number}", idxs=tuple(block.idx for block in group))
        for number, group in enumerate(groups, start=1)
    )
    return UnitPlan(units=units, excluded=excluded)


def _exclusion(block: NormalizedBlock, src_lang: LanguageCode) -> ExclusionReason | None:
    if not block.translate:
        return "empty"
    if block_language(block.text) in _CJK_BLOCK_LANGUAGES - {src_lang}:
        return "non_source_language"
    return None


def _joins(
    current: Sequence[NormalizedBlock],
    block: NormalizedBlock,
    profile: LanguageProfile,
    limits: UnitLimits,
) -> bool:
    previous = current[-1]
    if len(current) >= limits.max_blocks:
        return False
    if _standalone(previous, profile) or _standalone(block, profile):
        return False
    if previous.end_ms is None or block.start_ms is None or current[0].start_ms is None:
        return False
    if block.end_ms is None:
        return False
    if (block.start_ms - previous.end_ms) / _MS > limits.max_gap:
        return False
    if (block.end_ms - current[0].start_ms) / _MS > limits.max_duration:
        return False
    if _is_italic(previous.text) != _is_italic(block.text):
        return False  # 화면 밖 음성(TV·전화)과 현장 대사가 갈린 것 (M0)
    return profile.continues(_one_line(previous.text), _one_line(block.text))


def _standalone(block: NormalizedBlock, profile: LanguageProfile) -> bool:
    """다른 블록과 합치지 않는 블록."""
    if _STANDALONE_FLAGS & set(block.flags):
        return True
    plain = plain_text(block.text).strip()
    return plain.startswith("-") or profile.is_sdh_only(block.text) or profile.has_lyrics(plain)


def _is_italic(text: str) -> bool:
    stripped = text.lstrip()
    if stripped.startswith("{\\"):
        stripped = stripped[stripped.find("}") + 1 :].lstrip()
    return stripped.lower().startswith("<i>")


def _one_line(text: str) -> str:
    return " ".join(line.strip() for line in plain_text(text).split("\n"))
