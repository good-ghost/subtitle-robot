"""스타일 정책: 효과음(SDH)·가사·이름 표기 (PROJECT-PLAN §8.7, §8.8, WI-3.012).

블록 단위로 정할 수 있는 것은 코드로 처리한다: 효과음 전용 블록 keep(원문)·drop(텍스트 비움,
블록은 유지), 가사 블록 keep. 문장 안의 효과음·이름 표기·화자 표기는 프롬프트 STYLE 로 지시한다.
`style_hash` 는 출력에 영향을 주는 설정의 해시로 fingerprint(§13.1)에 들어간다.
"""

from __future__ import annotations

import hashlib
import json
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from subtitle_robot.glossary.honorifics import HonorificPolicy
from subtitle_robot.io.normalize import NormalizedDocument
from subtitle_robot.lang.base import LanguageCode, LanguageProfile, get_profile
from subtitle_robot.lang.codes import DEFAULT_TARGET
from subtitle_robot.lang.ja_translit import Style
from subtitle_robot.lang.target import is_korean
from subtitle_robot.pipeline.unitizer import ExclusionReason, UnitPlan

SdhPolicy = Literal["translate", "keep", "drop"]
LyricsPolicy = Literal["translate", "keep"]
NameStyle = Literal["hangul", "original"]
_HASH_CHARS = 12


class CustomHonorific(BaseModel):
    """`[honorifics.custom]` 항목."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    ko: str
    space: bool = True


class StylePolicy(BaseModel):
    """출력 스타일 설정 (`series.toml` 의 같은 이름 키, §14.3 기본값)."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    name_style: NameStyle = "hangul"
    transliteration: Style = "common"
    sdh: SdhPolicy = "translate"
    lyrics: LyricsPolicy = "translate"
    honorifics_policy: HonorificPolicy = "transliterate"
    honorifics_custom: dict[str, CustomHonorific] = Field(default_factory=dict)
    # ASS 입력에서 번역하지 않을 스타일 (`[ass] exclude_styles`, WI-6.001)
    ass_exclude_styles: tuple[str, ...] = ()
    # 번역 대상 언어 (§26.1). 실행 옵션(RunOptions.target)에서 채운다
    target_lang: str = DEFAULT_TARGET

    def style_hash(self) -> str:
        """출력에 영향을 주는 설정의 해시. 설정이 같으면 언제나 같다.

        나중에 더한 설정은 기본값일 때 해시에 넣지 않는다 (기존 작업공간이 설정 변경으로
        판정되지 않게).
        """
        data = self.model_dump(mode="json")
        if not data["ass_exclude_styles"]:
            del data["ass_exclude_styles"]
        if data["target_lang"] == DEFAULT_TARGET:
            del data["target_lang"]
        canonical = json.dumps(data, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(canonical.encode()).hexdigest()[:_HASH_CHARS]

    def prompt_block(self) -> str:
        """프롬프트 `<style>` 블록 내용."""
        sdh = {
            "translate": "SDH: translate sound descriptions and keep their brackets.",
            "keep": "SDH: keep sound descriptions in brackets exactly as in the source.",
            "drop": "SDH: remove sound descriptions in brackets; keep the dialogue.",
        }[self.sdh]
        lyrics = {
            "translate": "LYRICS: translate lyrics between ♪ marks and keep the marks.",
            "keep": "LYRICS: keep lyrics between ♪ marks exactly as in the source.",
        }[self.lyrics]
        names = {
            "hangul": "NAMES: write names in Hangul exactly as in GLOSSARY.",
            "original": "NAMES: keep names in their original script exactly as in GLOSSARY.",
        }[self.name_style]
        if self.name_style == "hangul" and not is_korean(self.target_lang):
            # hangul 은 "대상 언어 표기"로 읽는다 (값 이름은 series.toml 호환, §26.3)
            names = "NAMES: write names exactly as in GLOSSARY."
        speaker = (
            "SPEAKER LABELS: write a leading speaker label (JOHN:, （太郎）) "
            "with the GLOSSARY form."
        )
        return "\n".join((sdh, lyrics, names, speaker))


def apply_block_styles(
    plan: UnitPlan, doc: NormalizedDocument, src_lang: LanguageCode, policy: StylePolicy
) -> UnitPlan:
    """블록 단위 스타일을 적용한 unit 구성.

    효과음 전용·가사 블록은 Unitizer 가 단독 unit 으로 두므로 unit 을 통째로 뺀다.
    """
    profile = get_profile(src_lang)
    texts = {block.idx: block.text for block in doc.blocks}
    excluded: dict[int, ExclusionReason] = dict(plan.excluded)
    kept_units = []
    for unit in plan.units:
        reason = _unit_reason([texts[idx] for idx in unit.idxs], profile, policy)
        if reason is None:
            kept_units.append(unit)
            continue
        for idx in unit.idxs:
            excluded[idx] = reason
    return UnitPlan(units=tuple(kept_units), excluded=dict(sorted(excluded.items())))


def _unit_reason(
    texts: list[str], profile: LanguageProfile, policy: StylePolicy
) -> ExclusionReason | None:
    if all(profile.is_sdh_only(text) for text in texts):
        if policy.sdh == "keep":
            return "sdh_keep"
        if policy.sdh == "drop":
            return "sdh_drop"
    if policy.lyrics == "keep" and all(profile.has_lyrics(text) for text in texts):
        return "lyrics_keep"
    return None


def excluded_output(text: str, reason: ExclusionReason) -> str:
    """번역 제외 블록의 출력 텍스트: drop 은 비우고 나머지는 원문 그대로."""
    return "" if reason == "sdh_drop" else text
