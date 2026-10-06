"""일본어 고유명사의 한글 표기와 avoid 생성 (PROJECT-PLAN §8.5, WI-2.007).

표기 결정: 관용 지명 사전 → 없으면 읽기 음역(선택한 스타일). 둘 다 출처는 `generated`.
avoid: 두 스타일의 음역 결과 가운데 고른 표기와 다른 것 (예: common 의 타나카 → avoid 다나카).
번역 결과에 avoid 표기가 나오면 검증 error 로 잡는다 (§11.1).
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

from subtitle_robot.lang.ja_places import lookup_place
from subtitle_robot.lang.ja_translit import Style, transliterate

_STYLES: tuple[Style, ...] = ("common", "standard")


@dataclass(frozen=True)
class JapaneseKo:
    """한글 표기 결정 결과."""

    ko: str
    from_place_dictionary: bool


def japanese_ko(source: str, reading: str, style: Style = "common") -> JapaneseKo:
    """일본어 고유명사의 한글 표기.

    Args:
        source: 원문 표기 (한자·가나).
        reading: 가나 읽기 (Pass 1 이 판단).
        style: 음역 스타일.

    Raises:
        TransliterationError: 읽기에 가나가 아닌 문자가 있다.
    """
    place = lookup_place(source)
    if place is not None:
        return JapaneseKo(place.ko, from_place_dictionary=True)
    return JapaneseKo(transliterate(reading, style), from_place_dictionary=False)


def avoid_forms(pairs: Iterable[tuple[str, str]]) -> tuple[str, ...]:
    """표기 쌍들의 avoid 목록.

    Args:
        pairs: (가나 읽기, 고른 한글 표기). 항목 본체와 variants 를 함께 넘긴다.

    Returns:
        두 스타일 음역 결과 가운데 고른 표기와 다른 것 (단어 단위, 정렬, 중복 없음).
        고른 표기의 단어 수가 읽기와 다르면 전체 문자열로 비교한다.
    """
    avoid: set[str] = set()
    chosen_words: set[str] = set()
    for reading, chosen in pairs:
        chosen_words.update(chosen.split())
        variants = {style: transliterate(reading, style) for style in _STYLES}
        chosen_split = chosen.split()
        if all(len(form.split()) == len(chosen_split) for form in variants.values()):
            for form in variants.values():
                for candidate, picked in zip(form.split(), chosen_split, strict=True):
                    if candidate != picked:
                        avoid.add(candidate)
        else:
            avoid.update(form for form in variants.values() if form != chosen)
    # 다른 항목·변형에서 고른 표기는 avoid 로 막지 않는다
    return tuple(sorted(avoid - chosen_words))
