"""Pass 1 LLM 출력 스키마 (PROJECT-PLAN §9.2). 모르는 필드는 무시한다 (LLM 이 덧붙이는 경우).

필드 설명은 JSON schema 에 실려 모델에 전달된다. E2E 에서 모델이 `source` 를
이름의 기원(japanese)으로 해석하고 이름을 variants 에만 넣은 일이 있어 설명을 붙였다.
응답 해석은 너그럽게 하고(빠진 필드는 기본값), 모델에 보내는 스키마에서만
type·ko_suggestion 을 필수로 표시한다 (`request_schema`).

필드 이름은 대상 ko 일 때 0.6.0 전 이름(`ko_suggestion`, `current_ko`)이고 다른 대상은 일반 이름
(`suggestion`, `current`)으로 보낸다 (`lang.target.schema_for_target`). 응답은 둘 다 받는다.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from subtitle_robot.glossary.model import EntityType, ReadingConfidence, TermPolicy
from subtitle_robot.lang.codes import DEFAULT_TARGET
from subtitle_robot.lang.target import schema_for_target

NameOrigin = Literal["japanese", "foreign"]


class _Lenient(BaseModel):
    model_config = ConfigDict(extra="ignore")


class Pass1Variant(_Lenient):
    """이름 변형. `ko_suggestion` 은 영어·서양계 이름의 변형 표기를 정할 때 쓴다 (WI-3.003)."""

    src: str = Field(description="The variant exactly as written in the subtitles.")
    reading: str | None = Field(default=None, description="Kana reading (Japanese only).")
    suggestion: str | None = Field(
        default=None,
        validation_alias=AliasChoices("ko_suggestion", "suggestion"),
        description="Hangul spelling of this variant.",
    )


class NewEntity(_Lenient):
    """새로 찾은 엔티티. ID 는 코드가 발급하므로 임시 키 `tmp` 만 쓴다."""

    tmp: str = Field(description="Temporary key: n1, n2, ...")
    type: EntityType = Field(
        default="person", description="person | place | org | term | brand | work"
    )
    source: str = Field(
        description="The base name exactly as written in the subtitles (e.g. 田中ヒロシ, "
        "アンジェロ, John Miller), without honorifics. NOT a language or origin."
    )
    reading: str | None = Field(default=None, description="Kana reading of source (Japanese only).")
    reading_confidence: ReadingConfidence | None = Field(
        default=None, description="high | medium | low"
    )
    origin: NameOrigin | None = Field(
        default=None,
        description="japanese | foreign (Japanese only: foreign = non-Japanese katakana name)",
    )
    suggestion: str = Field(
        default="",
        validation_alias=AliasChoices("ko_suggestion", "suggestion"),
        description="Suggested Hangul spelling of source.",
    )
    policy: TermPolicy = "transliterate"
    variants: list[Pass1Variant] = Field(default_factory=list)
    seen_suffixes: list[str] = Field(default_factory=list)
    first_seen: int | None = Field(
        default=None, description="idx of the first block mentioning it."
    )
    count: int | None = Field(default=None, description="Number of blocks mentioning it.")
    note: str | None = None


class NewVariant(_Lenient):
    """알려진 엔티티의 새 변형."""

    entity_id: str = Field(description="Id of a KNOWN_GLOSSARY entry (E0001 ...).")
    src: str
    reading: str | None = None
    suggestion: str | None = Field(
        default=None, validation_alias=AliasChoices("ko_suggestion", "suggestion")
    )
    same_name: bool = Field(
        default=False,
        description=(
            "true when src is the SAME name only spelled differently (long vowel, small kana,"
            " ヴ/バ, typo). false for a part of the name, a nickname or a title."
        ),
    )


class Conflict(_Lenient):
    """알려진 엔티티 표기가 틀렸다는 의심."""

    entity_id: str = Field(description="Id of a KNOWN_GLOSSARY entry (E0001 ...), never a tmp key.")
    current: str = Field(validation_alias=AliasChoices("current_ko", "current"))
    suggested: str = Field(validation_alias=AliasChoices("suggested_ko", "suggested"))
    reason: str = ""


class Pass1Output(_Lenient):
    """Pass 1 응답."""

    new_entities: list[NewEntity] = Field(default_factory=list)
    new_variants: list[NewVariant] = Field(default_factory=list)
    conflicts: list[Conflict] = Field(default_factory=list)


# 모델에 보내는 스키마에서 필수로 표시할 새 엔티티 필드
_REQUIRED_IN_REQUEST = ("tmp", "type", "source", "ko_suggestion")


def request_schema(target: str = DEFAULT_TARGET) -> dict[str, Any]:
    """모델에 보내는 Pass 1 JSON schema (해석용 모델보다 필수 필드가 많다)."""
    schema = Pass1Output.model_json_schema()
    entity = schema["$defs"]["NewEntity"]
    entity["required"] = sorted(set(entity.get("required", [])) | set(_REQUIRED_IN_REQUEST))
    # 표기 흔들림인지 모델이 꼭 판단하게 한다 (시리즈 E2E: ラグサ/ラグーザ 가 따로 등록됨)
    variant = schema["$defs"]["NewVariant"]
    variant["required"] = sorted(set(variant.get("required", [])) | {"same_name"})
    return schema_for_target(schema, target)
