"""한국어 조사 보정 (PROJECT-PLAN §11.1 avoid 자동 치환, WI-2.005).

`avoid` 표기를 지정 표기로 바꿀 때 받침이 달라지면 조사도 바꿔야 한다 (`조니가` → `존이`).
이름 경계를 지켜 다른 단어 안의 같은 글자(`존재`의 `존`)는 건드리지 않는다.
"""

from __future__ import annotations

import re

_HANGUL_FIRST = 0xAC00
_HANGUL_LAST = 0xD7A3
_JONG_COUNT = 28
_RIEUL = 8  # 종성 ㄹ
# 숫자를 한국어로 읽을 때 받침: 0 영, 1 일, 3 삼, 6 육, 7 칠, 8 팔 은 받침 있음
_DIGIT_BATCHIM = {"0": True, "1": True, "2": False, "3": True, "4": False,
                  "5": False, "6": True, "7": True, "8": True, "9": False}  # fmt: skip
_DIGIT_RIEUL = {"1", "7", "8"}

# (받침 있을 때, 받침 없을 때). 서술격 조사(이다/다, 이에요/예요 …)도 받침에 따라 바뀐다.
# 이름 뒤 '야'는 호격(존아)과 서술격(존이야)을 형태로 구분할 수 없어, 자막에서 흔한 호격으로 본다
PARTICLE_PAIRS: tuple[tuple[str, str], ...] = (
    ("이에요", "예요"),
    ("이라고", "라고"),
    ("이었", "였"),
    ("이다", "다"),
    ("이랑", "랑"),
    ("이나", "나"),
    ("으로", "로"),
    ("이", "가"),
    ("은", "는"),
    ("을", "를"),
    ("과", "와"),
    ("아", "야"),
)
_PAIR_OF: dict[str, tuple[str, str]] = {form: pair for pair in PARTICLE_PAIRS for form in pair}
# 받침과 무관한 조사와 붙여 쓰는 경칭: 이름 뒤에 바로 와도 이름 경계로 본다
_INVARIANT_FOLLOWERS = (
    "에게서", "에게", "에서", "한테", "께서", "까지", "부터", "처럼", "보다", "하고",
    "마저", "조차", "만큼", "의", "도", "만", "에", "께", "님", "짱",
)  # fmt: skip
# 어간 형태(이었/였)는 뒤에 어미가 바로 붙으므로 뒤 경계를 요구하지 않는다
_STEM_FORMS = ("이었", "였")
_STEM_ALTERNATION = "|".join(_STEM_FORMS)
_PARTICLE_ALTERNATION = "|".join(
    sorted(
        (form for pair in PARTICLE_PAIRS for form in pair if form not in _STEM_FORMS),
        key=len,
        reverse=True,
    )
)


def _final_jong(ch: str) -> int | None:
    code = ord(ch)
    if _HANGUL_FIRST <= code <= _HANGUL_LAST:
        return (code - _HANGUL_FIRST) % _JONG_COUNT
    return None


def _is_hangul(ch: str) -> bool:
    return _final_jong(ch) is not None


def batchim_of(word: str) -> tuple[bool, bool] | None:
    """마지막 글자의 (받침 있음, 받침이 ㄹ). 판단할 수 없으면(라틴 문자 등) None."""
    if not word:
        return None
    last = word[-1]
    jong = _final_jong(last)
    if jong is not None:
        return jong != 0, jong == _RIEUL
    if last in _DIGIT_BATCHIM:
        return _DIGIT_BATCHIM[last], last in _DIGIT_RIEUL
    return None


def particle_for(word: str, particle: str) -> str:
    """`word` 뒤에 맞는 조사 형태. 짝이 있는 조사가 아니거나 판단할 수 없으면 그대로."""
    pair = _PAIR_OF.get(particle)
    info = batchim_of(word)
    if pair is None or info is None:
        return particle
    has_batchim, is_rieul = info
    with_batchim, without_batchim = pair
    if pair == ("으로", "로"):
        return with_batchim if has_batchim and not is_rieul else without_batchim
    return with_batchim if has_batchim else without_batchim


def attach_particle(word: str, particle: str) -> str:
    """이름에 맞는 조사를 붙인다 (`존` + `가` → `존이`)."""
    return word + particle_for(word, particle)


def replace_with_particles(text: str, old: str, new: str) -> tuple[str, int]:
    """`old` 를 `new` 로 바꾸고 바로 뒤 조사를 받침에 맞게 고친다.

    `old` 앞이 한글이면 바꾸지 않는다. 뒤는 조사, 받침과 무관한 조사, 붙여 쓰는 경칭,
    한글이 아닌 문자 가운데 하나여야 한다 (그 밖이면 다른 단어의 일부일 수 있다).

    Returns:
        (바꾼 텍스트, 바꾼 횟수).
    """
    if not old:
        return text, 0
    pattern = re.compile(
        rf"(?<![가-힣]){re.escape(old)}"
        rf"(?:(?P<stem>{_STEM_ALTERNATION})|(?P<particle>{_PARTICLE_ALTERNATION})(?![가-힣]))?"
    )
    count = 0

    def substitute(match: re.Match[str]) -> str:
        nonlocal count
        particle = match.group("stem") or match.group("particle")
        if particle is None and not _followed_by_boundary(text, match.end()):
            return match.group(0)
        count += 1
        return new + (particle_for(new, particle) if particle else "")

    return pattern.sub(substitute, text), count


def _followed_by_boundary(text: str, pos: int) -> bool:
    if pos >= len(text) or not _is_hangul(text[pos]):
        return True
    return text.startswith(_INVARIANT_FOLLOWERS, pos)
