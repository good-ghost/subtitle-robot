"""언어 코드 표의 항목 형식 (PROJECT-PLAN §26.1, WI-8.001)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class LanguageInfo:
    """언어 하나.

    Attributes:
        code: ISO 639-1 (`fr`).
        bibliographic: ISO 639-2/B (`fre`).
        terminology: ISO 639-2/T (`fra`).
        name: 영어 이름 (프롬프트용, `French`).
        script: 주 문자 체계 (latin, cyrillic, kana, hangul, han …).
    """

    code: str
    bibliographic: str
    terminology: str
    name: str
    script: str
