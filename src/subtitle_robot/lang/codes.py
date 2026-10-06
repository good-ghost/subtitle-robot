"""언어 코드 정규화·이름·문자 체계 (PROJECT-PLAN §26.1, WI-8.001).

언어는 ISO 639-1 코드로 다룬다. 트랙·파일 이름의 639-2(B·T) 코드, 지역 태그(`fr-FR`),
영어 이름(`French`)을 639-1 로 모은다. 표는 `codes_data.py`(생성 산출물)다.
"""

from __future__ import annotations

import itertools
import re
import unicodedata
from typing import Annotated

from pydantic import AfterValidator

from subtitle_robot.lang.codes_data import LANGUAGES
from subtitle_robot.lang.language_info import LanguageInfo

DEFAULT_TARGET = "ko"
_UNDETERMINED = frozenset({"", "und", "mul", "zxx", "mis"})
# 표 밖의 흔한 표기: 폐지된 639-1(iw·in·ji·jw·mo), 폐지된 639-2(scc·scr), TMDB 의 cn(광둥어),
# 자막 이름의 chs·cht·pob·jp
_ALIASES: dict[str, str] = {
    "jp": "ja",
    "iw": "he",
    "in": "id",
    "ji": "yi",
    "jw": "jv",
    "mo": "ro",
    "scc": "sr",
    "scr": "hr",
    "cn": "zh",
    "chs": "zh",
    "cht": "zh",
    "pob": "pt",
}
# 이름에서 언어로 찾을 별칭 (영어 이름 외)
_NAME_ALIASES: dict[str, str] = {
    "brazilian": "pt",
    "castilian": "es",
    "farsi": "fa",
    "mandarin": "zh",
    "cantonese": "zh",
    "flemish": "nl",
    "greek": "el",
    "bokmal": "nb",
    "français": "fr",
    "francais": "fr",
    "deutsch": "de",
    "español": "es",
    "espanol": "es",
    "italiano": "it",
    "português": "pt",
    "portugues": "pt",
    "nederlands": "nl",
    "polski": "pl",
    "svenska": "sv",
    "dansk": "da",
    "norsk": "no",
    "suomi": "fi",
    "türkçe": "tr",
    "русский": "ru",
    "українська": "uk",
    "ελληνικά": "el",
    "עברית": "he",
    "العربية": "ar",
    "ไทย": "th",
}
# 공백으로 단어를 나누지 않는 문자 체계의 이름 (포함 여부로 찾는다)
_SUBSTRING_HINTS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("en", re.compile(r"영어|英語")),
    ("ja", re.compile(r"日本語|일본어|日語|日文")),
    ("ko", re.compile(r"한국어|한글|韓国語|韓國語|韩语|韓文")),
    ("zh", re.compile(r"中文|简体|繁體|繁体|国语|國語|粵語|粤语|중국어")),
)
_WORD_RE = re.compile(r"[^\W\d_]+")
# 트랙 이름에서 639-2 코드로 보지 않을 영어 단어 (may=Malay, sun=Sundanese …)
_COMMON_WORDS = frozenset(
    {"may", "sun", "pan", "cat", "fin", "her", "ice", "per", "nor", "lit", "est"}
)
_TAG_SEPARATOR_RE = re.compile(r"[-_]")


def _name_index() -> dict[str, str]:
    index: dict[str, str] = {}
    for info in LANGUAGES.values():
        name = info.name.casefold()
        index.setdefault(name, info.code)
        if name.startswith("modern "):
            index.setdefault(name.removeprefix("modern "), info.code)
    index.update(_NAME_ALIASES)
    return index


_BY_NAME = _name_index()
_BY_CODE: dict[str, str] = {
    code: info.code
    for info in LANGUAGES.values()
    for code in (info.code, info.bibliographic, info.terminology)
}


def check_language_code(value: str) -> str:
    """pydantic 검증: 표에 있는 639-1 코드만 받는다.

    Raises:
        ValueError: 639-1 코드가 아니다.
    """
    if not is_language_code(value):
        raise ValueError(f"ISO 639-1 언어 코드가 아니다: {value!r} (예: ko, en, fr)")
    return value


# 설정·용어집의 언어 필드 (§26.1)
LanguageCodeField = Annotated[str, AfterValidator(check_language_code)]


def language_info(code: str) -> LanguageInfo | None:
    """639-1 코드의 항목. 없으면 None."""
    return LANGUAGES.get(code)


def is_language_code(code: str) -> bool:
    """표에 있는 639-1 코드인지."""
    return code in LANGUAGES


def language_name(code: str) -> str:
    """프롬프트에 쓰는 영어 이름 (`fr` → `French`). 표에 없으면 코드 그대로."""
    info = LANGUAGES.get(code)
    return info.name if info else code


def script_of(code: str) -> str | None:
    """주 문자 체계 (`latin`, `cyrillic`, `kana`, `hangul`, `han` …). 표에 없으면 None."""
    info = LANGUAGES.get(code)
    return info.script if info else None


def normalize_language(code: str | None) -> str | None:
    """언어 표시를 639-1 로 모은다 (`fre`·`fra`·`fr-FR`·`French` → `fr`).

    미지정(`und`, 빈 값)과 모르는 값은 None 이다 (그때는 내용으로 판별한다, §26.4).
    """
    if code is None:
        return None
    text = unicodedata.normalize("NFKC", code).strip().casefold()
    primary = _TAG_SEPARATOR_RE.split(text)[0]
    if primary in _UNDETERMINED:
        return None
    if primary in _BY_CODE:
        return _BY_CODE[primary]
    if primary in _ALIASES:
        return _ALIASES[primary]
    return _BY_NAME.get(text) or _BY_NAME.get(primary)


def language_tokens(code: str) -> frozenset[str]:
    """파일 이름에서 이 언어를 나타내는 표시 (`fr` → fr, fre, fra, french). 소문자."""
    info = LANGUAGES.get(code)
    tokens = {code}
    if info is not None:
        tokens |= {info.bibliographic, info.terminology, info.name.casefold()}
    tokens |= {alias for alias, target in _ALIASES.items() if target == code}
    tokens |= {name for name, target in _NAME_ALIASES.items() if target == code}
    return frozenset(tokens)


def language_from_name(name: str | None) -> str | None:
    """트랙 이름의 언어 힌트 (`English (SDH)` → en, `日本語` → ja).

    여러 언어가 걸리거나 없으면 None.
    """
    if not name:
        return None
    found = {code for code, pattern in _SUBSTRING_HINTS if pattern.search(name)}
    words = [word.casefold() for word in _WORD_RE.findall(name)]
    phrases = [*words, *(f"{a} {b}" for a, b in itertools.pairwise(words))]
    for phrase in phrases:
        code = _BY_NAME.get(phrase) or (
            _BY_CODE.get(phrase) if len(phrase) == 3 and phrase not in _COMMON_WORDS else None
        )
        if code is not None:
            found.add(code)
    return found.pop() if len(found) == 1 else None
