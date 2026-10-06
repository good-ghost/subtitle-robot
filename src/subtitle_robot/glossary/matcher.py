"""용어 매처: 원문에서 용어집 항목이 나오는 위치를 찾는다 (PROJECT-PLAN §12.1, WI-2.003).

결과는 문맥 주입(배치에 나온 항목·경칭만 프롬프트에 넣음)과 검증(표기 준수)에 쓴다.
오탐은 문맥 주입에서 토큰만 늘리지만 검증에서는 잘못된 warning 이 되므로,
의심스러운 매치는 `ambiguous` 로 표시해 검증에서 뺀다.
"""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass
from typing import Literal

from subtitle_robot.glossary.model import GlossaryEntry
from subtitle_robot.lang.base import LanguageCode, LanguageProfile, get_profile

CharKind = Literal["katakana", "hiragana", "kanji", "latin", "digit", "other"]

# 영어 이름 뒤에 허용하는 꼬리: 소유격, 복수 (긴 것부터)
_EN_TAILS = ("'s", "’s", "es", "s")
# 문장 첫머리 판정 때 건너뛰는 문자
_SKIP_BACKWARD = set(" \t\n\"“”'‘’-—–")
_SENTENCE_END = set(".?!…:♪")
_LONG_VOWEL_MARK = "ー"
_ITERATION_MARK = "々"


def char_kind(ch: str) -> CharKind:
    """문자 종류 (일본어 경계 판정용)."""
    code = ord(ch)
    if 0x30A1 <= code <= 0x30FA or ch == _LONG_VOWEL_MARK:
        return "katakana"
    if 0x3041 <= code <= 0x309F:
        return "hiragana"
    if 0x4E00 <= code <= 0x9FFF or 0x3400 <= code <= 0x4DBF or ch == _ITERATION_MARK:
        return "kanji"
    if ch.isascii() and ch.isalpha():
        return "latin"
    if ch.isdigit():
        return "digit"
    return "other"


@dataclass(frozen=True)
class TermMatch:
    """원문 안의 매치 하나.

    Attributes:
        entity_ids: 매치된 항목 ID. 같은 문자열을 가진 항목이 여럿이면 모두.
        start: 시작 위치.
        end: 이름 본체 끝 (소유격·복수 꼬리와 경칭은 포함하지 않는다).
        surface: 매치된 문자열 (항목의 source 또는 variant).
        suffix: 바로 뒤의 경칭 접미사 (일본어).
        ambiguous: 오탐 가능성이 있어 검증에서 뺄 매치.
    """

    entity_ids: tuple[str, ...]
    start: int
    end: int
    surface: str
    suffix: str | None
    ambiguous: bool


@dataclass(frozen=True)
class _Target:
    surface: str
    entity_ids: tuple[str, ...]
    ambiguous: bool


class TermMatcher:
    """한 언어의 용어집 항목으로 만든 매처."""

    def __init__(self, entries: Iterable[GlossaryEntry], lang: LanguageCode) -> None:
        """매처를 만든다. `lang` 과 원본 언어가 다른 항목은 무시한다."""
        self._lang = lang
        self._profile: LanguageProfile = get_profile(lang)
        owners: dict[str, list[str]] = defaultdict(list)
        flagged: dict[str, bool] = defaultdict(bool)
        for entry in entries:
            if entry.src_lang != lang:
                continue
            for surface in dict.fromkeys(entry.surfaces()):
                if surface and entry.id not in owners[surface]:
                    owners[surface].append(entry.id)
                    flagged[surface] |= entry.ambiguous
        by_first: dict[str, list[_Target]] = defaultdict(list)
        for surface, ids in owners.items():
            ambiguous = flagged[surface] or len(ids) > 1
            by_first[surface[0]].append(_Target(surface, tuple(sorted(ids)), ambiguous))
        # 최장 일치: 같은 첫 글자 후보는 긴 것부터 본다
        self._by_first = {
            first: sorted(targets, key=lambda target: len(target.surface), reverse=True)
            for first, targets in by_first.items()
        }

    def find(self, text: str) -> list[TermMatch]:
        """텍스트의 매치 목록 (위치 순서, 겹치지 않음)."""
        matches: list[TermMatch] = []
        pos = 0
        while pos < len(text):
            match = self._match_at(text, pos)
            if match is None:
                pos += 1
                continue
            matches.append(match)
            pos = match.end
        return matches

    def _match_at(self, text: str, pos: int) -> TermMatch | None:
        for target in self._by_first.get(text[pos], ()):
            end = pos + len(target.surface)
            if not text.startswith(target.surface, pos):
                continue
            if self._lang == "en":
                match = self._english(text, pos, end, target)
            else:
                match = self._japanese(text, pos, end, target)
            if match is not None:
                return match
        return None

    # ---------------------------------------------------------------- 영어

    def _english(self, text: str, start: int, end: int, target: _Target) -> TermMatch | None:
        if start > 0 and text[start - 1].isalnum():
            return None
        if not _english_tail_ok(text, end):
            return None
        if target.ambiguous and _at_sentence_start(text, start):
            # 일반 단어와 같은 이름(Will, Grace …)은 문장 중간의 대문자일 때만 이름으로 본다
            return None
        return TermMatch(target.entity_ids, start, end, target.surface, None, target.ambiguous)

    # ---------------------------------------------------------------- 일본어

    def _japanese(self, text: str, start: int, end: int, target: _Target) -> TermMatch | None:
        surface = target.surface
        first_kind, last_kind = char_kind(surface[0]), char_kind(surface[-1])
        if len(surface) == 1 and first_kind == "hiragana":
            return None  # 경계를 판정할 수 없는 한 글자 히라가나는 매치하지 않는다
        before = char_kind(text[start - 1]) if start > 0 else "other"
        after = char_kind(text[end]) if end < len(text) else "other"
        suffix = self._profile.suffix_at(text, end)

        if first_kind in ("katakana", "kanji", "latin") and before == first_kind:
            return None
        if last_kind in ("katakana", "latin") and after == last_kind:
            return None
        if last_kind == "kanji" and after == "kanji" and suffix is None:
            return None  # 山田中学 안의 田中: 뒤가 한자 경칭(君·様·先輩·先生)일 때만 허용

        ambiguous = target.ambiguous or len(surface) == 1
        return TermMatch(target.entity_ids, start, end, surface, suffix, ambiguous)


def _english_tail_ok(text: str, end: int) -> bool:
    if end >= len(text) or not text[end].isalnum():
        return True
    for tail in _EN_TAILS:
        after = end + len(tail)
        if text.startswith(tail, end) and (after >= len(text) or not text[after].isalnum()):
            return True
    return False


def _at_sentence_start(text: str, start: int) -> bool:
    """블록 시작이거나 앞 문자가 문장 종결 부호인지. 공백·줄바꿈·따옴표·대시·태그는 건너뛴다."""
    pos = start - 1
    while pos >= 0:
        ch = text[pos]
        if ch in _SKIP_BACKWARD:
            pos -= 1
        elif ch == ">" and "<" in text[:pos]:
            pos = text.rindex("<", 0, pos) - 1
        elif ch == "}" and "{" in text[:pos]:
            pos = text.rindex("{", 0, pos) - 1
        else:
            return ch in _SENTENCE_END
    return True
