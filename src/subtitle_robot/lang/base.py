"""언어 프로파일 (PROJECT-PLAN §8.1, WI-2.001).

언어마다 다른 규칙(효과음·화자·가사 패턴, 경칭 접미사, 호칭, 인코딩 후보)을 코어 코드와 분리한다.
문장 이어짐 판정(`continues`)은 Unitizer(WI-3.004)가 쓴다.
"""

from __future__ import annotations

import re
import unicodedata
from collections.abc import Callable
from dataclasses import dataclass, field

# ISO 639-1 (§26.1). 전용 프로파일은 en·ja, 나머지는 공통 프로파일 (WI-8.003)
LanguageCode = str

_HTML_TAG_RE = re.compile(r"<[^>]*>")
_ASS_TAG_RE = re.compile(r"\{\\[^}]*\}")
_DIALOGUE_DASH_RE = re.compile(r"^\s*-\s*")


@dataclass(frozen=True)
class LanguageProfile:
    """언어별 규칙 묶음.

    Attributes:
        code: 언어 코드.
        encoding_candidates: 이 언어 자막에서 흔한 인코딩 (§8.1).
        honorific_suffixes: 이름 뒤에 붙는 경칭 접미사. 생성 시 긴 것부터 정렬한다.
        titles: 이름 앞에 붙는 호칭 (영어 Mr. 등). 번역은 LLM 이 문맥으로 판단한다 (§8.6).
        speaker_patterns: 줄 앞 화자 표기 정규식. 그룹 `name`, `rest`.
        sdh_line_pattern: 줄 전체가 효과음·청각 설명인지 판정하는 정규식.
        lyrics_marker: 가사 표시 기호.
        continues: (앞 블록 텍스트, 다음 블록 텍스트) → 문장이 다음 블록으로 이어지는지 (Unitizer).
            텍스트는 태그를 뺀 한 줄짜리다.
    """

    code: LanguageCode
    encoding_candidates: tuple[str, ...]
    honorific_suffixes: tuple[str, ...]
    titles: tuple[str, ...]
    speaker_patterns: tuple[re.Pattern[str], ...]
    sdh_line_pattern: re.Pattern[str]
    lyrics_marker: str = "♪"
    continues: Callable[[str, str], bool] = field(default=lambda _prev, _next: False)

    def __post_init__(self) -> None:
        # 매처가 앞에서부터 맞춰 보므로 긴 접미사가 먼저 와야 한다 (손으로 정렬하지 않는다)
        ordered = tuple(sorted(self.honorific_suffixes, key=len, reverse=True))
        object.__setattr__(self, "honorific_suffixes", ordered)

    def split_speaker(self, line: str) -> tuple[str | None, str]:
        """줄 앞 화자 표기를 떼어 (화자, 나머지)로 나눈다. 화자가 없으면 (None, 원래 줄)."""
        for pattern in self.speaker_patterns:
            match = pattern.match(line)
            if match:
                return match.group("name").strip(), match.group("rest")
        return None, line

    def is_sdh_only(self, text: str) -> bool:
        """블록의 모든 줄이 효과음·청각 설명뿐인지 (§8.8 SDH 정책 적용 대상)."""
        lines = [_DIALOGUE_DASH_RE.sub("", plain_text(line)) for line in text.split("\n")]
        lines = [line for line in lines if line.strip()]
        return bool(lines) and all(self.sdh_line_pattern.fullmatch(line) for line in lines)

    def has_lyrics(self, text: str) -> bool:
        """가사 표시가 있는지 (§8.8 가사 정책 적용 대상)."""
        return self.lyrics_marker in text

    def suffix_at(self, text: str, pos: int) -> str | None:
        """`pos` 에서 시작하는 경칭 접미사 (긴 것 우선). 없으면 None."""
        for suffix in self.honorific_suffixes:
            if text.startswith(suffix, pos):
                return suffix
        return None


def plain_text(text: str) -> str:
    """HTML·ASS 태그를 뺀 텍스트."""
    return _ASS_TAG_RE.sub("", _HTML_TAG_RE.sub("", text))


def get_profile(code: LanguageCode) -> LanguageProfile:
    """언어 코드의 프로파일. 영어·일본어는 전용 프로파일, 그 밖은 공통 프로파일 (§26.2).

    Raises:
        ValueError: ISO 639-1 코드가 아니다.
    """
    from subtitle_robot.lang.codes import is_language_code
    from subtitle_robot.lang.en import ENGLISH
    from subtitle_robot.lang.generic import generic_profile
    from subtitle_robot.lang.ja import JAPANESE

    profiles: dict[str, LanguageProfile] = {"en": ENGLISH, "ja": JAPANESE}
    if code in profiles:
        return profiles[code]
    if not is_language_code(code):
        raise ValueError(f"지원하지 않는 원본 언어: {code} (ISO 639-1 코드)")
    return generic_profile(code)


# 반복 대사 비교 (WI-6.005): 끝 문장부호·말줄임은 같은 대사로 본다 (いただきます！ = いただきます)
_LINE_TRAILING_RE = re.compile(r"[\s!！?？。、,.…~〜♪]+$")
_LINE_SPACE_RE = re.compile(r"\s+")


def normalize_line(text: str) -> str:
    """대사 비교 키: 태그 제거, NFKC, 공백 정리, 끝 문장부호 제거."""
    plain = unicodedata.normalize("NFKC", plain_text(text))
    return _LINE_TRAILING_RE.sub("", _LINE_SPACE_RE.sub(" ", plain).strip())
