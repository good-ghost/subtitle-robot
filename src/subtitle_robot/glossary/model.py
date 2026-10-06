"""용어집 모델과 편집 규칙 (PROJECT-PLAN §8.5, §12.1, §12.2, WI-2.002).

- 엔티티 ID(`E0001`…)는 코드가 발급한다 (§3). LLM 은 임시 키나 기존 ID 만 쓴다
- 항목이 바뀌면 `rev` 가 1 오른다. fingerprint(§13)가 rev 를 보고 부분 재번역 대상을 고른다
- 파이프라인은 `locked`·`auto` 항목의 표기를 바꿀 수 없다 (일관성 우선, §12.1).
  사람의 수정은 허용한다
- 표기 필드는 대상 언어 일반 이름(`target`, `target_source`, `title_target`)이다. 대상 언어마다
  용어집 파일이 따로 있다. 0.6.0 전의 `ko`·`ko_source`·`title_ko` 도 읽는다 (§26.5, WI-8.002)
"""

from __future__ import annotations

import re
from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator, model_validator

from subtitle_robot.lang.codes import LanguageCodeField

EntityType = Literal["person", "place", "org", "term", "brand", "work"]
EntryStatus = Literal["locked", "proposed", "auto"]
TargetSource = Literal["manual", "official", "generated", "llm"]
TermPolicy = Literal["transliterate", "translate", "keep"]
ReadingConfidence = Literal["high", "medium", "low"]
SpeechLevel = Literal["하십시오체", "해요체", "해체", "해라체", "혼용"]
ChangeOrigin = Literal["pipeline", "user"]

GLOSSARY_SCHEMA_VERSION: Literal[2] = 2
_ID_RE = re.compile(r"^E\d{4,}$")
_SCOPE_RE = re.compile(r"^(series|season:\d+|episode:S\d{2,}E\d{2,})$")

# 파이프라인이 locked·auto 항목에서 바꿀 수 없는 필드 (표기에 영향)
PROTECTED_FIELDS = frozenset({"target", "variants", "title_target", "avoid", "policy", "reading"})
# 출처 우선순위: 큰 값이 우선 (§8.5)
TARGET_SOURCE_PRIORITY: dict[TargetSource, int] = {
    "llm": 0,
    "generated": 1,
    "official": 2,
    "manual": 3,
}


class GlossaryError(ValueError):
    """용어집 내용이 규칙에 맞지 않는다."""


class LockedEntryError(GlossaryError):
    """파이프라인이 locked·auto 항목의 표기를 바꾸려 했다."""


class _Model(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", populate_by_name=True)


class Variant(_Model):
    """이름 변형 (성만, 이름만, 애칭 등)."""

    src: str
    target: str | None = Field(default=None, validation_alias=AliasChoices("target", "ko"))
    reading: str | None = None


class GlossaryEntry(_Model):
    """용어집 항목 하나. 필드는 §12.2 예시를 따른다."""

    id: str
    rev: int = Field(default=1, ge=1)
    type: EntityType
    status: EntryStatus
    scope: str = "series"
    src_lang: LanguageCodeField
    source: str
    target: str = Field(validation_alias=AliasChoices("target", "ko"))
    target_source: TargetSource = Field(validation_alias=AliasChoices("target_source", "ko_source"))
    policy: TermPolicy = "transliterate"
    reading: str | None = None
    reading_confidence: ReadingConfidence | None = None
    variants: tuple[Variant, ...] = ()
    title_target: str | None = Field(
        default=None, validation_alias=AliasChoices("title_target", "title_ko")
    )
    avoid: tuple[str, ...] = ()
    ambiguous: bool = False
    seen_suffixes: tuple[str, ...] = ()
    first_seen: str | None = None
    valid_from: str | None = None
    note: str | None = None

    @field_validator("id")
    @classmethod
    def _check_id(cls, value: str) -> str:
        if not _ID_RE.match(value):
            raise ValueError(f"엔티티 ID 형식은 E0001 이다: {value!r}")
        return value

    @field_validator("scope")
    @classmethod
    def _check_scope(cls, value: str) -> str:
        if not _SCOPE_RE.match(value):
            raise ValueError(f"scope 는 series | season:N | episode:SxxExx 이다: {value!r}")
        return value

    def surfaces(self) -> tuple[str, ...]:
        """원문에서 찾을 문자열: 이름 본체와 변형."""
        return (self.source, *(variant.src for variant in self.variants))


class AddressName(_Model):
    """관계의 호칭이 상대 이름 + 경칭일 때 (런타임 조합)."""

    variant: str
    suffix: str | None = None


class AddressTerm(_Model):
    """관계 고유 호칭 (お兄ちゃん → 오빠 같은 고정 텍스트)."""

    src: str
    target: str = Field(validation_alias=AliasChoices("target", "ko"))


class Relation(_Model):
    """인물 쌍의 호칭·말투 (§12.2)."""

    from_id: str = Field(alias="from")
    to: str
    address_name: AddressName | None = None
    address_term: AddressTerm | None = None
    speech_level: SpeechLevel | None = None
    valid_from: str | None = None


class Glossary(_Model):
    """시리즈 마스터 용어집."""

    series: str | None = None
    schema_version: Literal[2] = GLOSSARY_SCHEMA_VERSION
    entries: tuple[GlossaryEntry, ...] = ()
    relations: tuple[Relation, ...] = ()

    @model_validator(mode="after")
    def _check_integrity(self) -> Glossary:
        ids = [entry.id for entry in self.entries]
        duplicates = sorted({entry_id for entry_id in ids if ids.count(entry_id) > 1})
        if duplicates:
            raise ValueError(f"엔티티 ID 중복: {', '.join(duplicates)}")
        known = set(ids)
        for relation in self.relations:
            missing = [ref for ref in (relation.from_id, relation.to) if ref not in known]
            if missing:
                raise ValueError(f"relations 가 없는 엔티티를 가리킨다: {', '.join(missing)}")
        return self

    def get(self, entry_id: str) -> GlossaryEntry:
        """ID 로 항목을 찾는다.

        Raises:
            GlossaryError: 없는 ID.
        """
        for entry in self.entries:
            if entry.id == entry_id:
                return entry
        raise GlossaryError(f"용어집에 {entry_id} 가 없다")

    def for_language(self, lang: str) -> tuple[GlossaryEntry, ...]:
        """원본 언어가 같은 항목들."""
        return tuple(entry for entry in self.entries if entry.src_lang == lang)


def next_entity_id(glossary: Glossary) -> str:
    """다음에 발급할 엔티티 ID (기존 최댓값 + 1)."""
    numbers = [int(entry.id[1:]) for entry in glossary.entries]
    return f"E{(max(numbers) + 1 if numbers else 1):04d}"


def add_entry(glossary: Glossary, entry: GlossaryEntry) -> Glossary:
    """항목을 더한 새 용어집.

    Raises:
        GlossaryError: 같은 ID 가 이미 있다.
    """
    if any(existing.id == entry.id for existing in glossary.entries):
        raise GlossaryError(f"엔티티 ID 가 이미 있다: {entry.id}")
    return glossary.model_copy(update={"entries": (*glossary.entries, entry)})


def update_entry(
    glossary: Glossary, entry_id: str, *, origin: ChangeOrigin, **changes: Any
) -> Glossary:
    """항목 필드를 바꾼 새 용어집. 실제로 바뀐 것이 있으면 `rev` 를 1 올린다.

    Args:
        glossary: 원래 용어집.
        entry_id: 바꿀 항목.
        origin: `pipeline`(자동 처리) 또는 `user`(사람 수정·가져오기).
        **changes: 바꿀 필드와 값.

    Raises:
        LockedEntryError: 파이프라인이 locked·auto 항목의 표기 필드를 바꾸려 했다.
        GlossaryError: 없는 필드, `id`·`rev` 변경 시도, 또는 검증 실패.
    """
    entry = glossary.get(entry_id)
    unknown = set(changes) - set(GlossaryEntry.model_fields)
    if unknown:
        raise GlossaryError(f"없는 필드: {', '.join(sorted(unknown))}")
    if {"id", "rev"} & set(changes):
        raise GlossaryError("id 와 rev 는 직접 바꿀 수 없다")
    protected = PROTECTED_FIELDS & set(changes)
    if origin == "pipeline" and entry.status in ("locked", "auto") and protected:
        raise LockedEntryError(
            f"{entry_id}({entry.status})의 {', '.join(sorted(protected))} 은 "
            "파이프라인이 바꿀 수 없다. "
            "사람이 고치거나 retranslate 를 거쳐야 한다"
        )

    merged = {**entry.model_dump(by_alias=True), **changes}
    try:
        updated = GlossaryEntry.model_validate(merged)
    except ValueError as exc:
        raise GlossaryError(f"{entry_id} 변경 값 오류: {exc}") from exc
    if updated == entry:
        return glossary
    updated = updated.model_copy(update={"rev": entry.rev + 1})
    entries = tuple(updated if item.id == entry_id else item for item in glossary.entries)
    return glossary.model_copy(update={"entries": entries})


def add_variants(glossary: Glossary, entry_id: str, variants: tuple[Variant, ...]) -> Glossary:
    """항목에 새 변형을 덧붙인다. 이미 있는 원문(src)은 건너뛴다.

    기존 표기를 바꾸지 않으므로 파이프라인도 `locked`·`auto` 항목에 쓸 수 있다 (§9.1 신규 변형).
    rev 는 올리지 않는다: 새 변형은 이미 번역된 블록에 나오지 않았으므로(나왔다면 Pass 1 이 찾았다)
    rev 를 올리면 부분 재번역(§12.4)이 영향 없는 unit 까지 다시 번역한다.
    """
    entry = glossary.get(entry_id)
    known = set(entry.surfaces())
    fresh = []
    for variant in variants:
        if variant.src and variant.src not in known:
            fresh.append(variant)
            known.add(variant.src)
    if not fresh:
        return glossary
    updated = entry.model_copy(update={"variants": (*entry.variants, *fresh)})
    entries = tuple(updated if item.id == entry_id else item for item in glossary.entries)
    return glossary.model_copy(update={"entries": entries})


# 출력(번역)에 영향을 주지 않는 메타데이터: 바꿔도 rev 를 올리지 않는다 (부분 재번역 대상이 아님)
METADATA_FIELDS = frozenset({"scope", "note", "first_seen"})


def set_metadata(glossary: Glossary, entry_id: str, **changes: Any) -> Glossary:
    """메타데이터 필드(scope·note·first_seen)만 바꾼다. rev 는 그대로 둔다.

    scope 승격(§12.1)처럼 번역 결과와 무관한 변경이 부분 재번역(§12.4)을 일으키지 않게 한다.

    Raises:
        GlossaryError: 메타데이터가 아닌 필드이거나 값이 잘못됐다.
    """
    entry = glossary.get(entry_id)
    others = set(changes) - METADATA_FIELDS
    if others:
        raise GlossaryError(
            f"메타데이터가 아닌 필드는 update_entry 로 바꿔야 한다: {', '.join(sorted(others))}"
        )
    try:
        updated = GlossaryEntry.model_validate({**entry.model_dump(by_alias=True), **changes})
    except ValueError as exc:
        raise GlossaryError(f"{entry_id} 변경 값 오류: {exc}") from exc
    entries = tuple(updated if item.id == entry_id else item for item in glossary.entries)
    return glossary.model_copy(update={"entries": entries})


def respell_variants(
    variants: tuple[Variant, ...], *, old: str | None, new: str
) -> tuple[Variant, ...]:
    """본체 표기를 바꿀 때 변형 표기 속 이전 표기도 바꾼다.

    avoid_with_old 와 같은 단위(바뀐 단어, 단어 수가 다르면 전체)로 바꾼다.
    변형에 이전 표기가 남으면 avoid 와 모순되어 번역이 이전 표기를 쓰고 lint 가 error 를 낸다
    (시리즈 E2E: ガラッシア=가라시아).
    """
    if not old or old == new:
        return variants
    old_split, new_split = old.split(), new.split()
    if len(old_split) == len(new_split):
        pairs = [(o, n) for o, n in zip(old_split, new_split, strict=True) if o != n]
    else:
        pairs = [(old, new)]
    respelled = []
    for variant in variants:
        target = variant.target
        if target:
            for before, after in pairs:
                target = target.replace(before, after)
        respelled.append(
            variant if target == variant.target else variant.model_copy(update={"target": target})
        )
    return tuple(respelled)


def avoid_with_old(avoid: tuple[str, ...], *, old: str | None, new: str) -> tuple[str, ...]:
    """표기를 바꿀 때의 avoid: 이전 표기를 더하고 새 표기와 그 단어는 뺀다.

    avoid 는 단어 단위다 (WI-2.007). 단어 수가 같으면 바뀐 단어만, 다르면 이전 표기 전체를 더한다.
    새 표기에 쓰인 단어가 avoid 에 남으면 새 표기대로 번역한 결과를 검증이 잘못 잡는다.
    """
    new_words = set(new.split()) | {new}
    items = [item for item in avoid if item not in new_words]
    if old and old != new:
        old_split, new_split = old.split(), new.split()
        if len(old_split) == len(new_split):
            added = [o for o, n in zip(old_split, new_split, strict=True) if o != n]
        else:
            added = [old]
        items.extend(word for word in added if word not in items and word not in new_words)
    return tuple(items)
