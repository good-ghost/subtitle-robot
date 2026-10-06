"""대상 언어별 차이 (PROJECT-PLAN §26.3, §26.5, WI-8.003).

한국어 대상은 전용 처리(한글 음역·경칭 표·조사 보정)와 0.6.0 전 LLM 스키마 필드 이름을 그대로 쓴다.
다른 대상은 필드 이름을 일반 이름으로 바꿔 보낸다 (응답 모델은 두 이름을 모두 받는다).
"""

from __future__ import annotations

import copy
import re
from typing import Any

from subtitle_robot.lang.codes import DEFAULT_TARGET, language_name, script_of

# LLM 스키마 필드: 0.6.0 전 이름(대상 ko) → 일반 이름
GENERIC_FIELDS: dict[str, str] = {
    "ko": "text",
    "ko_suggestion": "suggestion",
    "current_ko": "current",
    "suggested_ko": "suggested",
}
# pydantic 이 필드 이름으로 만든 제목
_GENERIC_TITLES = {
    "Ko": "Text",
    "Ko Suggestion": "Suggestion",
    "Current Ko": "Current",
    "Suggested Ko": "Suggested",
}
# 줄 길이 warning 기준: 한중일 대상은 글자가 넓어 짧게 (§26.3)
CJK_LINE_CHARS = 22
OTHER_LINE_CHARS = 42
_CJK_SCRIPTS = frozenset({"hangul", "kana", "han"})
_HANGUL_WORD_RE = re.compile(r"\bHangul\b")


def is_korean(target: str) -> bool:
    """한국어 전용 처리를 쓰는 대상인지."""
    return target == DEFAULT_TARGET


def max_line_chars(target: str) -> int:
    """대상 언어의 줄 길이 warning 기준."""
    return CJK_LINE_CHARS if script_of(target) in _CJK_SCRIPTS else OTHER_LINE_CHARS


def schema_for_target(schema: dict[str, Any], target: str) -> dict[str, Any]:
    """LLM 에 보낼 JSON schema. 대상 ko 는 그대로, 다른 대상은 필드 이름·설명을 바꾼 사본.

    속성 이름·제목과 `required` 목록의 `ko`·`ko_suggestion` 등을 일반 이름으로 바꾸고,
    설명의 "Hangul" 을 대상 언어 이름으로 바꾼다.
    """
    if is_korean(target):
        return schema
    renamed: dict[str, Any] = _rename(copy.deepcopy(schema), language_name(target))
    return renamed


def _rename(node: Any, language: str) -> Any:
    if isinstance(node, dict):
        renamed: dict[str, Any] = {}
        for key, value in node.items():
            if key == "properties" and isinstance(value, dict):
                renamed[key] = {
                    GENERIC_FIELDS.get(prop, prop): _rename(sub, language)
                    for prop, sub in value.items()
                }
            elif key == "required" and isinstance(value, list):
                renamed[key] = [GENERIC_FIELDS.get(item, item) for item in value]
            elif key == "title" and isinstance(value, str):
                renamed[key] = _GENERIC_TITLES.get(value, value)
            elif key == "description" and isinstance(value, str):
                renamed[key] = _HANGUL_WORD_RE.sub(language, value)
            else:
                renamed[key] = _rename(value, language)
        return renamed
    if isinstance(node, list):
        return [_rename(item, language) for item in node]
    return node
