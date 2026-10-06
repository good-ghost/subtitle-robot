"""영어 프로파일 (PROJECT-PLAN §8.3)."""

from __future__ import annotations

import re

from subtitle_robot.lang.base import LanguageProfile

# 화자: "JOHN: text" (대문자 이름), "[Brian] text" (대문자로 시작하는 대괄호).
# 소문자로 시작하는 대괄호("[chuckles] No.")는 효과음이라 화자로 보지 않는다
_CAPS_LABEL = re.compile(r"^\s*(?:-\s*)?(?P<name>[A-Z][A-Z0-9 .'\-]*[A-Z0-9.]):\s+(?P<rest>\S.*)$")
_BRACKET_LABEL = re.compile(r"^\s*(?:-\s*)?\[(?P<name>[A-Z][^\]]*)\]\s+(?P<rest>\S.*)$")
# 줄 전체가 [..] 또는 (..) 하나 이상
_SDH_LINE = re.compile(r"\s*(?:[\[(][^\])]*[\])]\s*)+")

_TERMINAL_RE = re.compile(r"[.!?♪\"”\]]$")
_CONTINUATION_ENDINGS = ("...", "…", ",", "-", "—")


def english_continues(previous: str, following: str) -> bool:
    """영어 문장이 다음 블록으로 이어지는지 (§8.3).

    이어짐: `...` `…` `,` `-` `—` 로 끝남, 종결 부호 없음, 다음 블록이 소문자·`...` 로 시작.
    `--` 로 끝나면 말이 끊긴 것이지 이어지는 것이 아니다 (M0 관찰).
    """
    prev, nxt = previous.strip(), following.strip()
    if not prev or prev.endswith("--"):
        return False
    if prev.endswith(_CONTINUATION_ENDINGS) or not _TERMINAL_RE.search(prev):
        return True
    return nxt[:1].islower() or nxt.startswith(("...", "…"))


ENGLISH = LanguageProfile(
    code="en",
    encoding_candidates=("utf-8", "cp1252"),
    honorific_suffixes=(),
    titles=(
        "Mr.",
        "Mrs.",
        "Ms.",
        "Miss",
        "Dr.",
        "Doctor",
        "Prof.",
        "Professor",
        "Captain",
        "Capt.",
        "Officer",
        "Detective",
        "Sergeant",
        "Sgt.",
        "Lieutenant",
        "Lt.",
        "Colonel",
        "General",
        "Major",
        "Agent",
        "Sir",
        "Lady",
        "Lord",
    ),
    speaker_patterns=(_CAPS_LABEL, _BRACKET_LABEL),
    sdh_line_pattern=_SDH_LINE,
    continues=english_continues,
)
