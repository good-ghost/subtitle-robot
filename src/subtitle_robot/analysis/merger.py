"""Glossary Merger: Pass 1 출력을 용어집에 반영한다 (PROJECT-PLAN §9.1, WI-3.003).

ID 는 여기서 발급한다 (LLM 은 tmp 만). 표기 출처 규칙은 WI-3.003:
일본계 이름은 관용 지명 사전 → 코드 음역(`generated`),
서양계 가타카나 이름과 영어 이름은 LLM 제안(`llm`, Q-03).
코드 음역은 한글 표기라 대상이 한국어일 때만 쓴다. 다른 대상은 LLM 제안을 쓴다 (§26.3).
기존 항목의 표기는 바꾸지 않는다 (first-wins, §12.1). 충돌은 보고에만 남긴다.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from difflib import SequenceMatcher

from subtitle_robot.analysis.reconcile import fold_new_entities
from subtitle_robot.analysis.schema import (
    Conflict,
    NewEntity,
    NewVariant,
    Pass1Output,
    Pass1Variant,
)
from subtitle_robot.glossary.model import (
    EntryStatus,
    Glossary,
    GlossaryEntry,
    GlossaryError,
    TargetSource,
    Variant,
    add_entry,
    add_variants,
    next_entity_id,
)
from subtitle_robot.lang.base import LanguageCode
from subtitle_robot.lang.codes import DEFAULT_TARGET, script_of
from subtitle_robot.lang.ja_names import avoid_forms, japanese_ko
from subtitle_robot.lang.ja_translit import Style, TransliterationError
from subtitle_robot.lang.target import is_korean

logger = logging.getLogger(__name__)

# 일반 영어 단어와 같은 이름: 문장 첫머리에서는 매치하지 않고 검증에서도 뺀다 (§12.1)
COMMON_WORD_NAMES = frozenset(
    {
        "will", "grace", "hope", "mark", "may", "rose", "jack", "faith", "joy", "summer",
        "autumn", "april", "june", "august", "bill", "bob", "art", "rich", "frank", "earnest",
        "sky", "river", "dawn", "ivy", "lily", "daisy", "holly", "robin", "sunny", "chase",
        "hunter", "penny", "pat", "sue", "ray", "rocky", "max", "miles", "drew", "gene",
    }
)  # fmt: skip


@dataclass
class MergeReport:
    """병합 결과 보고 (리포트·검토용)."""

    added: dict[str, str] = field(default_factory=dict)
    variants_added: dict[str, list[str]] = field(default_factory=dict)
    folded: dict[str, str] = field(default_factory=dict)
    conflicts: list[Conflict] = field(default_factory=list)
    low_confidence: list[str] = field(default_factory=list)
    llm_fallbacks: list[str] = field(default_factory=list)
    rejected: list[str] = field(default_factory=list)
    salvaged: list[str] = field(default_factory=list)
    dirty_suggestions: list[str] = field(default_factory=list)
    # 다른 항목이 이미 쓰는 표기라 버린 변형 (`E0004:ヴァッティ`)
    duplicate_surfaces: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class MergeOptions:
    """병합 설정 (`series.toml` 에서 온다).

    Attributes:
        src_lang: 원본 언어.
        target: 번역 대상 언어. ko 일 때만 일본어 이름을 코드로 음역한다.
        style: 일본어 음역 스타일 (`transliteration`, 기본 common).
        review: True 면 새 항목을 `proposed` 로 (검토 후 locked), False 면 `auto`.
        scope: 새 항목의 scope (단일 작품 `series`, 시리즈 에피소드는 `episode:SxxExx`).
        scope_label: first_seen 앞에 붙일 표시 (`S01E01`, 영화는 빈 문자열).
    """

    src_lang: LanguageCode
    target: str = DEFAULT_TARGET
    style: Style = "common"
    review: bool = False
    scope: str = "series"
    scope_label: str = ""


def merge_pass1(
    glossary: Glossary, output: Pass1Output, options: MergeOptions
) -> tuple[Glossary, MergeReport]:
    """Pass 1 출력을 용어집에 반영한 새 용어집과 보고."""
    current_ko = {entry.id: entry.target for entry in glossary.entries}
    # 충돌은 기존 항목에 대한 것만 의미가 있다 (E2E: 모델이 같은 응답의 tmp 키를 가리킨 일이 있음).
    # 제안 표기가 지금 표기와 같으면 표기 충돌이 아니다 (시리즈 E2E: "같은 인물일 수 있음" 메모를
    # 충돌로 보낸 일이 있음). 같은 엔티티 판단은 전역 reconcile 이 맡는다.
    report = MergeReport(
        conflicts=[
            c
            for c in output.conflicts
            if c.entity_id in current_ko and c.suggested.strip() != current_ko[c.entity_id]
        ]
    )
    # 알려진 항목의 변형을 먼저 넣어야, 같은 표기를 새 엔티티로도 낸 경우 그 항목으로 접힌다
    # (시리즈 E2E: ヴァッティ 가 E0004 변형이자 새 항목으로 동시에 등록됨)
    for variant in output.new_variants:
        glossary = _merge_known_variant(glossary, variant, options, report)
    salvaged = [_salvage_source(entity, report) for entity in output.new_entities]
    entities, report.folded = fold_new_entities(salvaged)
    for entity in entities:
        glossary = _merge_entity(glossary, entity, options, report)
    return glossary, report


# ---------------------------------------------------------------- 새 엔티티

# 원문 자리에 이름 대신 들어온 언어·기원 값 (E2E: 모델이 source 를 origin 으로 해석)
_NOT_A_NAME = frozenset({"ja", "en", "japanese", "english", "foreign", "jpn", "eng"})


def _salvage_source(entity: NewEntity, report: MergeReport) -> NewEntity:
    """원문이 언어·기원 값이면 첫 변형을 원문으로 살린다. 살렸으면 보고에 남긴다."""
    if entity.source.strip().lower() not in _NOT_A_NAME or not entity.variants:
        return entity
    first, *rest = entity.variants
    logger.warning("pass1 entity source %r replaced by first variant %r", entity.source, first.src)
    report.salvaged.append(entity.tmp)
    return entity.model_copy(
        update={
            "source": first.src,
            "reading": entity.reading or first.reading,
            "suggestion": entity.suggestion or first.suggestion or "",
            "variants": rest,
        }
    )


def _merge_entity(
    glossary: Glossary, entity: NewEntity, options: MergeOptions, report: MergeReport
) -> Glossary:
    existing = _entry_with_surface(glossary, entity.source, options.src_lang)
    if existing is not None:
        # 이미 아는 표기: 새로 만들지 않고 나머지 변형만 덧붙인다
        report.folded[entity.tmp] = existing.id
        variants = tuple(
            _variant_for(existing, Pass1Variant.model_validate(v.model_dump()), options)
            for v in entity.variants
        )
        return _record_variants(glossary, existing.id, variants, report)

    spelling = _spelling(entity, options, report)
    if spelling is None:
        logger.warning("pass1 entity without usable spelling dropped: %s", entity.source)
        report.rejected.append(entity.tmp)
        return glossary
    ko, ko_source, generated = spelling
    entry_id = next_entity_id(glossary)
    variants = tuple(
        _new_variant(variant, options, generated=generated)
        for variant in entity.variants
        if variant.src != entity.source
        and not _owned_elsewhere(glossary, None, variant.src, options, report)
    )
    avoid: tuple[str, ...] = ()
    if generated and entity.reading:
        pairs = [(entity.reading, ko)] + [
            (v.reading, v.target) for v in variants if v.reading and v.target
        ]
        avoid = _safe_avoid(pairs)
    status: EntryStatus = "proposed" if options.review else "auto"
    entry = GlossaryEntry(
        id=entry_id,
        type=entity.type,
        status=status,
        scope=options.scope,
        src_lang=options.src_lang,
        source=entity.source,
        target=ko,
        target_source=ko_source,
        policy=entity.policy,
        reading=entity.reading,
        reading_confidence=entity.reading_confidence,
        variants=variants,
        avoid=avoid,
        ambiguous=_is_ambiguous(entity, options.src_lang),
        seen_suffixes=tuple(entity.seen_suffixes),
        first_seen=f"{options.scope_label}#{entity.first_seen}" if entity.first_seen else None,
        note=entity.note,
    )
    report.added[entity.tmp] = entry_id
    if entity.reading_confidence == "low":
        report.low_confidence.append(entry_id)
    if _translit(options) and not generated and entity.origin != "foreign":
        report.llm_fallbacks.append(entry_id)
    return add_entry(glossary, entry)


# 대상 표기에 섞이면 안 되는 문자: 가나·한자 (E2E: Qwen 이 オルコ 를 'オル코' 로 제안).
# 대상이 일본어면 둘 다, 중국어면 한자는 쓴다
_KANA_KANJI_RE = re.compile(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]")
_KANA_RE = re.compile(r"[\u3040-\u30ff]")


def usable_spelling(text: str | None, target: str = DEFAULT_TARGET) -> str | None:
    """LLM 이 제안한 대상 언어 표기를 쓸 수 있으면 정리해 돌려준다.

    대상 문자 체계가 아닌 가나·한자가 섞였으면 None.
    """
    clean = (text or "").strip()
    script = script_of(target)
    foreign = None if script == "kana" else _KANA_RE if script == "han" else _KANA_KANJI_RE
    if not clean or (foreign is not None and foreign.search(clean)):
        return None
    return clean


def _translit(options: MergeOptions) -> bool:
    """일본어 이름을 코드로 한글 음역하는지 (원본 ja, 대상 ko)."""
    return options.src_lang == "ja" and is_korean(options.target)


def _spelling(
    entity: NewEntity, options: MergeOptions, report: MergeReport
) -> tuple[str, TargetSource, bool] | None:
    """(대상 언어 표기, 출처, 코드 생성 여부). 정할 수 없으면 None."""
    if entity.policy == "keep":
        return entity.source, "llm", False
    if _translit(options) and entity.origin != "foreign" and entity.policy != "translate":
        generated = _generated_ko(entity.source, entity.reading, options.style)
        if generated is not None:
            return generated, "generated", True
    suggestion = usable_spelling(entity.suggestion, options.target)
    if suggestion is not None:
        return suggestion, "llm", False
    if entity.suggestion.strip():
        report.dirty_suggestions.append(entity.tmp)
    if _translit(options) and entity.policy != "translate":
        # 제안을 쓸 수 없으면 가나 원문·읽기를 코드로 음역한다 (서양계 이름도 관용 표기보다는 낫다)
        generated = _generated_ko(entity.source, entity.reading or entity.source, options.style)
        if generated is not None:
            return generated, "generated", True
    return None


def _generated_ko(source: str, reading: str | None, style: Style) -> str | None:
    try:
        result = japanese_ko(source, reading or "", style)
    except TransliterationError:
        return None
    return result.ko or None


def _new_variant(variant: Pass1Variant, options: MergeOptions, *, generated: bool) -> Variant:
    ko = None
    if generated and _translit(options):
        ko = _generated_ko(variant.src, variant.reading, options.style)
    if ko is None:
        ko = usable_spelling(variant.suggestion, options.target)
    if ko is None and _translit(options):
        ko = _generated_ko(variant.src, variant.reading or variant.src, options.style)
    return Variant(src=variant.src, reading=variant.reading, target=ko)


def _variant_for(entry: GlossaryEntry, variant: Pass1Variant, options: MergeOptions) -> Variant:
    return _new_variant(variant, options, generated=entry.target_source == "generated")


def _safe_avoid(pairs: list[tuple[str, str]]) -> tuple[str, ...]:
    try:
        return avoid_forms(pairs)
    except TransliterationError:
        return ()


def _is_ambiguous(entity: NewEntity, lang: LanguageCode) -> bool:
    surfaces = [entity.source, *(variant.src for variant in entity.variants)]
    if lang == "en":
        return any(" " not in s and s.lower() in COMMON_WORD_NAMES for s in surfaces)
    return len(entity.source) == 1


# ---------------------------------------------------------------- 알려진 엔티티의 새 변형


def _merge_known_variant(
    glossary: Glossary, variant: NewVariant, options: MergeOptions, report: MergeReport
) -> Glossary:
    try:
        entry = glossary.get(variant.entity_id)
    except GlossaryError:
        logger.warning("pass1 new_variant for unknown entity %s", variant.entity_id)
        report.rejected.append(variant.entity_id)
        return glossary
    if _owned_elsewhere(glossary, entry.id, variant.src, options, report):
        return glossary
    if variant.same_name and _plausibly_same_name(variant.src, entry.source):
        # 같은 이름의 다른 표기는 기존 한글을 그대로 쓴다 (모델 제안을 쓰면 라구사/라구자가 갈린다)
        converted = Variant(src=variant.src, reading=variant.reading, target=entry.target)
    else:
        converted = _variant_for(
            entry,
            Pass1Variant(src=variant.src, reading=variant.reading, suggestion=variant.suggestion),
            options,
        )
    return _record_variants(glossary, entry.id, (converted,), report)


def _record_variants(
    glossary: Glossary, entry_id: str, variants: tuple[Variant, ...], report: MergeReport
) -> Glossary:
    lang = glossary.get(entry_id).src_lang
    kept = []
    for variant in variants:
        owner = _entry_with_surface(glossary, variant.src, lang)
        if owner is not None and owner.id != entry_id:
            report.duplicate_surfaces.append(f"{owner.id}:{variant.src}")
            continue
        kept.append(variant)
    updated = add_variants(glossary, entry_id, tuple(kept))
    if updated is not glossary:
        before = set(glossary.get(entry_id).surfaces())
        added = [v.src for v in updated.get(entry_id).variants if v.src not in before]
        report.variants_added.setdefault(entry_id, []).extend(added)
    return updated


def _owned_elsewhere(
    glossary: Glossary,
    entry_id: str | None,
    surface: str,
    options: MergeOptions,
    report: MergeReport,
) -> bool:
    """다른 항목이 이미 쓰는 표기면 True (한 표기가 두 항목에 있으면 매처가 모호해진다)."""
    owner = _entry_with_surface(glossary, surface, options.src_lang)
    if owner is None or owner.id == entry_id:
        return False
    report.duplicate_surfaces.append(f"{owner.id}:{surface}")
    return True


# 표기 흔들림으로 보는 덧붙음 (テスタ / テスター). 이것만 다르면 합성 이름이 아니다
_SPELLING_MARKS = "ー・ ッっ"


# same_name 을 믿는 최소 유사도. 91 Days E2E 측정: 같은 이름의 다른 표기는 0.67 이상
# (ラグサ/ラグーザ, バネッチィ/ヴァネッティ), 다른 이름은 0.5 이하 (ヴィンセント/ネロ, ヴィンス)
SAME_NAME_MIN_RATIO = 0.6


def _plausibly_same_name(variant: str, source: str) -> bool:
    """모델의 same_name 판단을 코드로 확인한다.

    본체 이름과만 비교한다 (변형 Miller 는 Jon Miller 안에 있어도 합성 이름의 근거가 아니다).
    시리즈 E2E: 모델이 Nero 를 ヴィンセント 의 same_name 으로 내 다른 인물 이름이 될 뻔했다.
    """
    if _is_compound(variant, source):
        return False
    ratio = SequenceMatcher(None, _name_key(variant), _name_key(source)).ratio()
    return ratio >= SAME_NAME_MIN_RATIO


def _name_key(name: str) -> str:
    """표기 흔들림을 줄인 비교용 문자열 (장음·가운뎃점·공백 제거, ヴ 행 → バ 행)."""
    key = name.lower()
    for mark in _SPELLING_MARKS:
        if mark not in "ッっ":
            key = key.replace(mark, "")
    for src, dst in (("ヴァ", "バ"), ("ヴィ", "ビ"), ("ヴェ", "ベ"), ("ヴォ", "ボ"), ("ヴ", "ブ")):
        key = key.replace(src, dst)
    return key


def _is_compound(surface: str, other: str) -> bool:
    """한쪽이 다른 쪽을 품고 두 글자 이상 더 있으면 성+이름 같은 합성 이름이다.

    시리즈 E2E: 모델이 ヴィンセントヴァネッティ 를 ヴィンセント 의 same_name 으로 내 성이 빠졌다.
    """
    longer, shorter = (surface, other) if len(surface) >= len(other) else (other, surface)
    if shorter == longer or shorter not in longer:
        return False
    extra = longer.replace(shorter, "", 1).strip(_SPELLING_MARKS)
    return len(extra) >= 2


def _entry_with_surface(glossary: Glossary, surface: str, lang: str) -> GlossaryEntry | None:
    for entry in glossary.for_language(lang):
        if surface in entry.surfaces():
            return entry
    return None
