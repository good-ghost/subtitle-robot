from typing import Literal

import pytest

from subtitle_robot.glossary.matcher import TermMatch, TermMatcher, char_kind
from subtitle_robot.glossary.model import GlossaryEntry, Variant


def _entry(
    entry_id: str,
    lang: Literal["en", "ja"],
    source: str,
    *variants: str,
    ambiguous: bool = False,
) -> GlossaryEntry:
    return GlossaryEntry(
        id=entry_id,
        type="person",
        status="auto",
        src_lang=lang,
        source=source,
        target="x",
        target_source="generated",
        variants=tuple(Variant(src=v) for v in variants),
        ambiguous=ambiguous,
    )


EN = TermMatcher(
    [
        _entry("E0001", "en", "John Miller", "John", "Miller", "Johnny"),
        _entry("E0002", "en", "Will", ambiguous=True),
        _entry("E0099", "ja", "田中"),  # 다른 언어 항목은 무시
    ],
    "en",
)
JA = TermMatcher(
    [
        _entry("E0007", "ja", "田中ヒロシ", "田中", "ヒロシ", "ヒロ"),
        _entry("E0012", "ja", "佐藤"),
        _entry("E0020", "ja", "ネロ"),
        _entry("E0021", "ja", "蓮"),
        _entry("E0022", "ja", "あや"),
    ],
    "ja",
)


def _spans(matches: list[TermMatch], text: str) -> list[str]:
    return [text[m.start : m.end] for m in matches]


# ---------------------------------------------------------------- 영어


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("John's car is red.", ["John"]),
        ("I met the Millers.", ["Miller"]),
        ("Johns and Johnny", ["John", "Johnny"]),  # 복수 꼬리, 최장 일치
        ("Johnson called.", []),  # 단어 안의 John
        ("John Miller is here, Miller.", ["John Miller", "Miller"]),
        ("MyJohn", []),
    ],
)
def test_english_word_boundaries(text: str, expected: list[str]) -> None:
    assert _spans(EN.find(text), text) == expected


@pytest.mark.parametrize(
    ("text", "matched"),
    [
        ("Will you come?", False),  # 문장 첫머리
        ("I told Will about it.", True),
        ("Okay. Will said no.", False),  # 종결 부호 뒤
        ("I told\nWill about it.", True),  # 줄바꿈은 문장이 이어진다
        ("Where?\n- Will, come here.", False),  # 앞 줄이 끝난 뒤 화자 대시
        ("<i>Will</i> did it.", False),  # 태그만 앞에 있음
        ("I will go.", False),  # 소문자
    ],
)
def test_english_ambiguous_name_only_mid_sentence(text: str, matched: bool) -> None:
    matches = EN.find(text)

    assert bool(matches) is matched
    if matched:
        assert matches[0].ambiguous
        assert matches[0].entity_ids == ("E0002",)


def test_english_match_fields() -> None:
    (match,) = EN.find("Call Johnny now")

    assert (match.entity_ids, match.surface, match.suffix, match.ambiguous) == (
        ("E0001",),
        "Johnny",
        None,
        False,
    )


# ---------------------------------------------------------------- 일본어


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("田中さん、これ", [("田中", "さん")]),
        ("田中君が来た", [("田中", "君")]),
        ("田中先輩！", [("田中", "先輩")]),
        ("田中ヒロシです", [("田中ヒロシ", None)]),  # 최장 일치
        ("ヒロシくん", [("ヒロシ", "くん")]),
        ("ヒロ、待って", [("ヒロ", None)]),
        ("山田中学に行く", []),  # 한자 단어 안
        ("田中村", []),  # 뒤가 경칭이 아닌 한자
        ("ヒロインだ", []),  # 가타카나 단어 안
        ("スネロ", []),
        ("ネロ バネッティは", [("ネロ", None)]),
        ("佐藤さんと田中さま", [("佐藤", "さん"), ("田中", "さま")]),
    ],
)
def test_japanese_matches(text: str, expected: list[tuple[str, str | None]]) -> None:
    assert [(m.surface, m.suffix) for m in JA.find(text)] == expected


def test_single_kanji_name_is_ambiguous_and_single_hiragana_is_ignored() -> None:
    (match,) = JA.find("蓮が来た")
    assert match.ambiguous
    assert JA.find("蓮華") == []  # 뒤가 한자 (경칭 아님)
    assert [m.surface for m in JA.find("あやちゃん")] == ["あや"]


def test_same_surface_two_entities_is_ambiguous() -> None:
    matcher = TermMatcher(
        [_entry("E0001", "ja", "田中ヒロシ", "田中"), _entry("E0002", "ja", "田中ユキ", "田中")],
        "ja",
    )

    (match,) = matcher.find("田中さん")

    assert match.entity_ids == ("E0001", "E0002")
    assert match.ambiguous


def test_char_kind() -> None:
    assert [char_kind(c) for c in "アーあ漢々a1、"] == [
        "katakana",
        "katakana",
        "hiragana",
        "kanji",
        "kanji",
        "latin",
        "digit",
        "other",
    ]
