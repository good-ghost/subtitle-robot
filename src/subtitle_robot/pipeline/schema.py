"""Pass 2 LLM 출력 스키마 (PROJECT-PLAN §10.2). 모르는 필드는 무시한다.

필드 이름은 대상 ko 일 때 0.6.0 전 이름(`ko`, `ko_suggestion`), 다른 대상은 일반 이름(`text`,
`suggestion`)으로 보낸다 (`request_schema`). 응답은 둘 다 받는다 (§26.5).
"""

from __future__ import annotations

from typing import Any

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from subtitle_robot.lang.codes import DEFAULT_TARGET
from subtitle_robot.lang.target import schema_for_target


class _Lenient(BaseModel):
    model_config = ConfigDict(extra="ignore")


class Pass2Block(_Lenient):
    """원래 블록 하나의 번역."""

    idx: int
    text: str = Field(validation_alias=AliasChoices("ko", "text"))


class Pass2Unit(_Lenient):
    """unit 하나의 번역 (원래 블록으로 재분리된 상태)."""

    unit: str
    blocks: list[Pass2Block]


class NewTerm(_Lenient):
    """용어집에 없던 이름·용어 (에피소드 뒤 델타 용어집에 proposed 로 들어간다)."""

    src: str
    type: str = "term"
    suggestion: str = Field(
        default="", validation_alias=AliasChoices("ko_suggestion", "suggestion")
    )


class Pass2Output(_Lenient):
    """Pass 2 응답."""

    units: list[Pass2Unit]
    new_terms: list[NewTerm] = Field(default_factory=list)


def request_schema(target: str = DEFAULT_TARGET) -> dict[str, Any]:
    """모델에 보내는 Pass 2 JSON schema (대상 언어별 필드 이름)."""
    return schema_for_target(Pass2Output.model_json_schema(), target)
