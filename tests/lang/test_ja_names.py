import pytest

from subtitle_robot.lang.ja_names import avoid_forms, japanese_ko
from subtitle_robot.lang.ja_places import CONVENTIONAL_PLACES, lookup_place
from subtitle_robot.lang.ja_translit import transliterate


def test_place_dictionary_overrides_style() -> None:
    result = japanese_ko("東京", "とうきょう", "common")

    assert result.ko == "도쿄"
    assert result.from_place_dictionary
    assert transliterate("とうきょう", "common") == "토쿄"  # 사전이 없으면 이렇게 된다


@pytest.mark.parametrize(
    ("source", "ko"), [("千葉", "지바"), ("京都", "교토"), ("北海道", "홋카이도")]
)
def test_conventional_places(source: str, ko: str) -> None:
    assert japanese_ko(source, "dummy-not-used", "common").ko == ko


def test_non_place_uses_transliteration() -> None:
    result = japanese_ko("田中ヒロシ", "たなか ひろし", "common")

    assert result.ko == "타나카 히로시"
    assert not result.from_place_dictionary


def test_avoid_contains_other_style_word_level() -> None:
    # §12.2 예시: 타나카 히로시(common) 항목의 avoid 는 ["다나카"]
    pairs = [("たなか ひろし", "타나카 히로시"), ("たなか", "타나카"), ("ひろし", "히로시")]

    assert avoid_forms(pairs) == ("다나카",)


def test_avoid_for_standard_choice() -> None:
    assert avoid_forms([("つき", "쓰키")]) == ("츠키",)


def test_avoid_for_place_dictionary_choice() -> None:
    # 사전 표기 도쿄를 고르면 common 음역 토쿄가 avoid
    assert avoid_forms([("とうきょう", "도쿄")]) == ("토쿄",)


def test_avoid_empty_when_styles_agree() -> None:
    assert avoid_forms([("さとう", "사토")]) == ()


def test_avoid_does_not_block_chosen_word_of_other_variant() -> None:
    # 어느 변형에서 고른 표기는 다른 변형의 avoid 로 막지 않는다
    # かとう 의 standard 음역 가토는 がとう 에서 고른 표기라 avoid 에 넣지 않는다
    pairs = [("かとう", "카토"), ("がとう", "가토")]
    assert avoid_forms(pairs) == ()


def test_avoid_with_word_count_mismatch_compares_whole() -> None:
    assert avoid_forms([("ふじさん", "후지 산")]) == ("후지산",)


def test_place_table_is_consistent() -> None:
    sources = [place.source for place in CONVENTIONAL_PLACES]
    assert len(sources) == len(set(sources))
    assert lookup_place(" 大阪 ") is not None
    assert lookup_place("田中") is None
