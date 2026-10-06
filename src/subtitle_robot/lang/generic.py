"""공통 언어 프로파일: 전용 프로파일(en·ja)이 없는 원본 언어 (PROJECT-PLAN §26.2, WI-8.003).

언어의 문자 체계로 정한다. 문장 이어짐은 명시적인 이어짐 부호나(대소문자가 있는 문자 체계에서)
소문자로 시작하는 다음 블록일 때만 본다. 확신이 없으면 이어지지 않는다고 본다 (잘못 묶으면
화자가 다른 대사가 한 unit 이 된다).
"""

from __future__ import annotations

import functools
import re

from subtitle_robot.lang.base import LanguageProfile
from subtitle_robot.lang.codes import script_of

# 문자 체계·언어별 흔한 레거시 인코딩 (UTF-8 다음에 시도한다)
_SCRIPT_ENCODINGS: dict[str, tuple[str, ...]] = {
    "cyrillic": ("cp1251", "koi8_r"),
    "greek": ("cp1253", "iso8859_7"),
    "arabic": ("cp1256",),
    "hebrew": ("cp1255",),
    "thai": ("cp874",),
    "han": ("gb18030", "big5"),
    "hangul": ("cp949",),
}
_LANGUAGE_ENCODINGS: dict[str, tuple[str, ...]] = {
    "tr": ("cp1254",),
    "vi": ("cp1258",),
    "pl": ("cp1250",),
    "cs": ("cp1250",),
    "sk": ("cp1250",),
    "hu": ("cp1250",),
    "ro": ("cp1250",),
    "hr": ("cp1250",),
    "sl": ("cp1250",),
    "bs": ("cp1250",),
    "et": ("cp1257",),
    "lv": ("cp1257",),
    "lt": ("cp1257",),
}
_LATIN_FALLBACK = ("cp1252",)
# 대소문자가 있는 문자 체계 (다음 블록이 소문자로 시작하면 문장이 이어진다)
_CASED_SCRIPTS = frozenset({"latin", "cyrillic", "greek", "armenian"})

# 화자: 대문자 이름 + 콜론, 대문자로 시작하는 대괄호 (영어 프로파일과 같은 모양, 라틴·키릴·그리스).
# 소문자로 시작하는 대괄호는 효과음이다
_UPPER = "A-ZÀ-ÖØ-ÞА-ЯЁΑ-Ω"
_CAPS_LABEL = re.compile(
    rf"^\s*(?:-\s*)?(?P<name>[{_UPPER}][{_UPPER}0-9 .'\-]*[{_UPPER}0-9.]):\s+(?P<rest>\S.*)$"
)
_BRACKET_LABEL = re.compile(rf"^\s*(?:-\s*)?\[(?P<name>[{_UPPER}][^\]]*)\]\s+(?P<rest>\S.*)$")
# 줄 전체가 반각·전각 괄호 하나 이상
_SDH_LINE = re.compile(r"\s*(?:[\[(（［【][^\])）］】]*[\])）］】]\s*)+")
_CONTINUATION_ENDINGS = (",", "，", "、", "...", "…", "-", "—", "،")


def _continues(cased: bool, previous: str, following: str) -> bool:
    prev, nxt = previous.strip(), following.strip()
    if not prev or prev.endswith("--"):
        return False
    if prev.endswith(_CONTINUATION_ENDINGS):
        return True
    return cased and nxt[:1].islower()


@functools.cache
def generic_profile(code: str) -> LanguageProfile:
    """전용 프로파일이 없는 언어의 프로파일."""
    script = script_of(code) or "latin"
    cased = script in _CASED_SCRIPTS
    encodings = (
        _LANGUAGE_ENCODINGS.get(code)
        or _SCRIPT_ENCODINGS.get(script)
        or (_LATIN_FALLBACK if script == "latin" else ())
    )
    return LanguageProfile(
        code=code,
        encoding_candidates=("utf-8", *encodings),
        honorific_suffixes=(),
        titles=(),
        speaker_patterns=(_CAPS_LABEL, _BRACKET_LABEL) if cased else (),
        sdh_line_pattern=_SDH_LINE,
        continues=functools.partial(_continues, cased),
    )
