"""일본어 가나 읽기 → 한글 결정적 음역 (PROJECT-PLAN §8.5, WI-2.006).

LLM 은 읽기(가나)만 판단하고 한글 표기는 이 모듈이 만든다. 같은 읽기는 언제나 같은 한글이 된다.
스타일: `standard`(외래어 표기법 — か·た행 어두 평음, つ→쓰)
       `common`(국내 관용 — 어두 격음, つ→츠).
두 스타일 모두 장음은 표기하지 않는다. 규칙표는 docs/work-items/WI-2.006-ja-transliteration.md.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Style = Literal["standard", "common"]

_KATAKANA_FIRST = 0x30A1
_KATAKANA_LAST = 0x30F6
_KANA_OFFSET = 0x60  # 가타카나 → 히라가나
_HANGUL_FIRST = 0xAC00
_HANGUL_LAST = 0xD7A3
_JONG_COUNT = 28
_JONG_NIEUN = 4  # ㄴ
_JONG_SIOT = 19  # ㅅ
_WORD_SEPARATORS = {" ", "　", "・"}
_LONG_MARK = "ー"
_SOKUON = "っ"
_HATSUON = "ん"

# 두 스타일이 같은 음절
_COMMON_TABLE: dict[str, str] = {
    # 모음·청음·탁음·반탁음
    "あ": "아", "い": "이", "う": "우", "え": "에", "お": "오",
    "さ": "사", "し": "시", "す": "스", "せ": "세", "そ": "소",
    "ざ": "자", "じ": "지", "ず": "즈", "ぜ": "제", "ぞ": "조",
    "だ": "다", "ぢ": "지", "づ": "즈", "で": "데", "ど": "도",
    "な": "나", "に": "니", "ぬ": "누", "ね": "네", "の": "노",
    "は": "하", "ひ": "히", "ふ": "후", "へ": "헤", "ほ": "호",
    "ば": "바", "び": "비", "ぶ": "부", "べ": "베", "ぼ": "보",
    "ぱ": "파", "ぴ": "피", "ぷ": "푸", "ぺ": "페", "ぽ": "포",
    "ま": "마", "み": "미", "む": "무", "め": "메", "も": "모",
    "や": "야", "ゆ": "유", "よ": "요",
    "ら": "라", "り": "리", "る": "루", "れ": "레", "ろ": "로",
    "わ": "와", "ゐ": "이", "ゑ": "에", "を": "오",
    "が": "가", "ぎ": "기", "ぐ": "구", "げ": "게", "ご": "고",
    "ゔ": "부",
    # 단독 작은 가나
    "ぁ": "아", "ぃ": "이", "ぅ": "우", "ぇ": "에", "ぉ": "오",
    "ゃ": "야", "ゅ": "유", "ょ": "요",
    # 요음
    "しゃ": "샤", "しゅ": "슈", "しょ": "쇼", "じゃ": "자", "じゅ": "주", "じょ": "조",
    "ぢゃ": "자", "ぢゅ": "주", "ぢょ": "조", "にゃ": "냐", "にゅ": "뉴", "にょ": "뇨",
    "ひゃ": "햐", "ひゅ": "휴", "ひょ": "효", "びゃ": "뱌", "びゅ": "뷰", "びょ": "뵤",
    "ぴゃ": "퍄", "ぴゅ": "퓨", "ぴょ": "표", "みゃ": "먀", "みゅ": "뮤", "みょ": "묘",
    "りゃ": "랴", "りゅ": "류", "りょ": "료", "ぎゃ": "갸", "ぎゅ": "규", "ぎょ": "교",
    # 외래음 (가타카나 이름)
    "ふぁ": "파", "ふぃ": "피", "ふぇ": "페", "ふぉ": "포", "ふゅ": "퓨",
    "てぃ": "티", "でぃ": "디", "とぅ": "투", "どぅ": "두",
    "うぃ": "위", "うぇ": "웨", "うぉ": "워", "いぇ": "예",
    "しぇ": "셰", "じぇ": "제", "ちぇ": "체", "つぁ": "차",
    "ゔぁ": "바", "ゔぃ": "비", "ゔぇ": "베", "ゔぉ": "보",
    "くぁ": "콰", "ぐぁ": "과",
}  # fmt: skip

# 스타일마다 다른 음절: (standard 어두, standard 어중·어말, common)
_STYLED_TABLE: dict[str, tuple[str, str, str]] = {
    "か": ("가", "카", "카"), "き": ("기", "키", "키"), "く": ("구", "쿠", "쿠"),
    "け": ("게", "케", "케"), "こ": ("고", "코", "코"),
    "きゃ": ("갸", "캬", "캬"), "きゅ": ("규", "큐", "큐"), "きょ": ("교", "쿄", "쿄"),
    "た": ("다", "타", "타"), "て": ("데", "테", "테"), "と": ("도", "토", "토"),
    "ち": ("지", "치", "치"), "ちゃ": ("자", "차", "차"), "ちゅ": ("주", "추", "추"),
    "ちょ": ("조", "초", "초"),
    "つ": ("쓰", "쓰", "츠"),
}  # fmt: skip

_VOWEL_OF_LAST: dict[str, str] = {}
for _vowel, _chars in {
    "a": "あかさたなはまやらわがざだばぱぁゃゎ",
    "i": "いきしちにひみりぎじぢびぴぃゐ",
    "u": "うくすつぬふむゆるぐずづぶぷぅゅゔ",
    "e": "えけせてねへめれげぜでべぺぇゑ",
    "o": "おこそとのほもよろをごぞどぼぽぉょ",
}.items():
    for _char in _chars:
        _VOWEL_OF_LAST[_char] = _vowel
_PURE_VOWELS = {"あ": "a", "い": "i", "う": "u", "え": "e", "お": "o",
                "ぁ": "a", "ぃ": "i", "ぅ": "u", "ぇ": "e", "ぉ": "o"}  # fmt: skip
# (앞 음절 모음, 지금 모음 가나의 모음) 이면 장음으로 보고 쓰지 않는다.
# e+i 는 장음이 아니다 (明治 메이지)
_LONG_VOWEL_PAIRS = {("o", "u"), ("o", "o"), ("u", "u"), ("i", "i"), ("e", "e"), ("a", "a")}


class TransliterationError(ValueError):
    """읽기에 가나가 아닌 문자가 있다."""


@dataclass(frozen=True)
class _Mora:
    kana: str  # 히라가나 음절 (っ, ん 포함)
    vowel: str | None


def other_style(style: Style) -> Style:
    """다른 스타일 (avoid 생성용)."""
    return "standard" if style == "common" else "common"


def transliterate(reading: str, style: Style = "common") -> str:
    """가나 읽기를 한글로 바꾼다.

    Args:
        reading: 히라가나·가타카나 읽기. 공백·전각 공백·`・` 는 단어(성/이름) 경계.
        style: `common`(기본) 또는 `standard`.

    Returns:
        한글 표기. 단어는 공백 하나로 잇는다.

    Raises:
        TransliterationError: 가나가 아닌 문자(한자, 라틴 문자 등)가 있다.
    """
    words = _split_words(_to_hiragana(reading.strip()))
    return " ".join(_word_to_hangul(_morae(word, reading), style) for word in words if word)


def _to_hiragana(text: str) -> str:
    return "".join(
        chr(ord(ch) - _KANA_OFFSET) if _KATAKANA_FIRST <= ord(ch) <= _KATAKANA_LAST else ch
        for ch in text
    )


def _split_words(text: str) -> list[str]:
    words: list[str] = []
    current: list[str] = []
    for ch in text:
        if ch in _WORD_SEPARATORS:
            words.append("".join(current))
            current = []
        else:
            current.append(ch)
    words.append("".join(current))
    return words


def _morae(word: str, original: str) -> list[_Mora]:
    morae: list[_Mora] = []
    pos = 0
    while pos < len(word):
        pair = word[pos : pos + 2]
        if len(pair) == 2 and (pair in _COMMON_TABLE or pair in _STYLED_TABLE):
            morae.append(_Mora(pair, _VOWEL_OF_LAST.get(pair[1])))
            pos += 2
            continue
        ch = word[pos]
        if ch in (_SOKUON, _HATSUON, _LONG_MARK):
            morae.append(_Mora(ch, None))
        elif ch in _COMMON_TABLE or ch in _STYLED_TABLE:
            morae.append(_Mora(ch, _VOWEL_OF_LAST.get(ch)))
        else:
            raise TransliterationError(f"가나가 아닌 문자 {ch!r} 가 읽기에 있다: {original!r}")
        pos += 1
    return morae


def _word_to_hangul(morae: list[_Mora], style: Style) -> str:
    out: list[str] = []
    previous_vowel: str | None = None
    for mora in morae:
        kana = mora.kana
        if kana == _LONG_MARK:
            continue
        if kana in (_SOKUON, _HATSUON):
            _attach_final(out, _JONG_SIOT if kana == _SOKUON else _JONG_NIEUN, kana)
            previous_vowel = None  # ん·っ 뒤의 모음은 장음이 아니다 (しんいち → 신이치)
            continue
        pure = _PURE_VOWELS.get(kana)
        if (
            pure is not None
            and previous_vowel is not None
            and (previous_vowel, pure) in _LONG_VOWEL_PAIRS
        ):
            continue  # 장음 미표기 (さとう → 사토, にいがた → 니가타)
        out.append(_syllable(kana, style, word_initial=not out))
        previous_vowel = mora.vowel
    return "".join(out)


def _syllable(kana: str, style: Style, *, word_initial: bool) -> str:
    styled = _STYLED_TABLE.get(kana)
    if styled is None:
        return _COMMON_TABLE[kana]
    standard_initial, standard_medial, common = styled
    if style == "common":
        return common
    return standard_initial if word_initial else standard_medial


def _attach_final(out: list[str], jong: int, kana: str) -> None:
    """앞 음절에 받침을 단다. 앞 음절이 없으면 ん 은 '은', っ 은 버린다."""
    if not out:
        if kana == _HATSUON:
            out.append("은")
        return
    last = out[-1][-1]
    code = ord(last)
    if _HANGUL_FIRST <= code <= _HANGUL_LAST and (code - _HANGUL_FIRST) % _JONG_COUNT == 0:
        out[-1] = out[-1][:-1] + chr(code + jong)
