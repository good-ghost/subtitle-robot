"""원본 언어 감지 (PROJECT-PLAN §8.2, §26.4, WI-3.011, WI-8.004) 와 블록 언어 판정 (Q-02).

파일 판정은 문자 체계 비율로 한다: 한글 → ko, 가나 → ja, 한자만 → zh, 키릴 → ru·uk, 그리스 → el,
아랍 → ar·fa·ur, 히브리 → he, 태국 → th, 데바나가리 → hi. 라틴 문자는 언어별 기능어(서로 겹치지
않게 고른 단어) 빈도로 고르고, 확신이 없으면 영어로 본다 (0.6.0 전 동작).
블록 단위 판정은 원본 언어가 아닌 블록(자막 제작진 메모, 다른 언어 문장)을
번역에서 빼는 데 쓴다 (Q-02).
"""

from __future__ import annotations

import re
from collections import Counter
from collections.abc import Iterable
from dataclasses import dataclass, fields
from typing import Literal

from subtitle_robot.lang.base import LanguageCode, plain_text

BlockLanguage = Literal["en", "ja", "zh", "ko", "unknown"]
# 내용 언어: ISO 639-1 (§26.4)
ContentLanguage = str
# auto 또는 ISO 639-1 (§26.2)
SourceOption = str

# 파일 판정: 가나가 CJK·라틴 문자 중 이 비율 이상이면 일본어
JA_KANA_RATIO = 0.15
# 파일 판정: 라틴 문자가 이 비율 이상이면 라틴 문자 언어
EN_LATIN_RATIO = 0.6
# 파일 판정: 한글·한자·그 밖의 문자 체계가 이 비율 이상이면 그 언어.
# 한국어 자막에도 영문 이름·숫자가 섞인다
KO_HANGUL_RATIO = 0.3
SCRIPT_RATIO = 0.3
# 블록 판정: 가나 없이 한자만 이만큼 이상이면 중국어로 본다
# (짧은 한자 대사 全然·大丈夫 는 일본어로 둔다)
ZH_MIN_KANJI = 4
# 블록 판정: 한글이 이만큼 이상이면 한국어
KO_MIN_HANGUL = 2
# 라틴 문자 언어: 1위 기능어 수가 이만큼 이상이고 2위의 이 배수 이상일 때만 정한다
LATIN_MIN_HITS = 5
LATIN_MARGIN = 1.5
# 우크라이나어에만 있는 키릴 글자가 키릴 글자 중 이 비율 이상이면 uk
UK_LETTER_RATIO = 0.01

# 언어별 기능어. 두 언어 목록에 같은 단어를 두지 않고, 이웃 언어에서도 흔한 단어(독일어 was,
# 덴마크·노르웨이어 og·jeg·ikke, 포르투갈어 por)는 뺀다 (테스트로 확인)
LATIN_FUNCTION_WORDS: dict[str, frozenset[str]] = {
    "en": frozenset(
        [
            "the",
            "and",
            "you",
            "that",
            "what",
            "this",
            "are",
            "have",
            "with",
            "it's",
            "don't",
            "i'm",
            "of",
            "your",
        ]
    ),
    "fr": frozenset(
        [
            "le",
            "les",
            "et",
            "je",
            "tu",
            "vous",
            "pas",
            "qui",
            "une",
            "des",
            "c'est",
            "oui",
            "mais",
            "avec",
            "est",
            "ça",
        ]
    ),
    "de": frozenset(
        [
            "der",
            "das",
            "und",
            "ist",
            "ich",
            "nicht",
            "sie",
            "ein",
            "eine",
            "wir",
            "auf",
            "nein",
            "aber",
            "auch",
        ]
    ),
    "es": frozenset(
        ["el", "los", "las", "es", "qué", "sí", "yo", "muy", "aquí", "tengo", "ella", "pero", "eso"]
    ),
    "it": frozenset(
        [
            "che",
            "di",
            "è",
            "sono",
            "questo",
            "cosa",
            "perché",
            "sei",
            "ho",
            "hai",
            "anche",
            "lei",
            "gli",
        ]
    ),
    "pt": frozenset(
        [
            "não",
            "você",
            "eu",
            "isso",
            "sim",
            "ele",
            "ela",
            "muito",
            "aqui",
            "bem",
            "tenho",
            "os",
            "uma",
            "vai",
        ]
    ),
    "nl": frozenset(
        [
            "het",
            "een",
            "ik",
            "niet",
            "dat",
            "van",
            "wat",
            "zijn",
            "maar",
            "hij",
            "ze",
            "dit",
            "nee",
            "jij",
            "wel",
        ]
    ),
    "sv": frozenset(
        ["och", "jag", "inte", "är", "vad", "hon", "för", "också", "något", "inget", "varför"]
    ),
    "da": frozenset(["hvad", "nej", "af", "mig", "dig", "noget", "nogen", "efter", "blev"]),
    "no": frozenset(["hva", "nei", "av", "meg", "deg", "noe", "noen", "etter", "ble", "ikkje"]),
    "pl": frozenset(
        ["nie", "się", "jest", "że", "co", "tak", "ale", "jak", "czy", "już", "mnie", "tylko"]
    ),
    "tr": frozenset(
        ["bir", "ve", "bu", "için", "ben", "sen", "değil", "çok", "evet", "hayır", "ama", "şey"]
    ),
    "id": frozenset(
        [
            "yang",
            "dan",
            "ini",
            "itu",
            "tidak",
            "aku",
            "kamu",
            "ada",
            "apa",
            "saya",
            "dengan",
            "untuk",
            "akan",
            "kita",
        ]
    ),
    "vi": frozenset(
        [
            "không",
            "là",
            "và",
            "tôi",
            "có",
            "của",
            "anh",
            "này",
            "một",
            "được",
            "người",
            "đi",
            "gì",
            "đó",
        ]
    ),
}
_WORD_RE = re.compile(r"[^\W\d_]+(?:'[^\W\d_]+)?")
_UKRAINIAN_LETTERS = frozenset("іїєґІЇЄҐ")
_PERSIAN_LETTERS = frozenset("پچژگ")
_URDU_LETTERS = frozenset("ٹڈڑںے")


class LanguageDetectionError(ValueError):
    """원본 언어를 판단할 수 없다."""


@dataclass(frozen=True)
class ScriptCounts:
    """문자 체계별 글자 수."""

    latin: int = 0
    kana: int = 0
    kanji: int = 0
    hangul: int = 0
    cyrillic: int = 0
    greek: int = 0
    arabic: int = 0
    hebrew: int = 0
    thai: int = 0
    devanagari: int = 0

    @property
    def total(self) -> int:
        """판정에 쓰는 글자 수 합."""
        return sum(getattr(self, item.name) for item in fields(self))

    def __add__(self, other: ScriptCounts) -> ScriptCounts:
        return ScriptCounts(
            *(getattr(self, item.name) + getattr(other, item.name) for item in fields(self))
        )


# (문자 체계, 범위들). 라틴은 ASCII 와 라틴 확장(악센트)
_SCRIPT_RANGES: tuple[tuple[str, tuple[tuple[int, int], ...]], ...] = (
    ("kana", ((0x3041, 0x30FA),)),
    ("kanji", ((0x4E00, 0x9FFF), (0x3400, 0x4DBF))),
    ("hangul", ((0xAC00, 0xD7A3),)),
    ("cyrillic", ((0x0400, 0x04FF),)),
    ("greek", ((0x0370, 0x03FF),)),
    ("arabic", ((0x0600, 0x06FF),)),
    ("hebrew", ((0x0590, 0x05FF),)),
    ("thai", ((0x0E00, 0x0E7F),)),
    ("devanagari", ((0x0900, 0x097F),)),
)


def _script(ch: str) -> str | None:
    if ch == "ー":
        return "kana"
    if ch == "々":
        return "kanji"
    if not ch.isalpha():
        return None
    code = ord(ch)
    if ch.isascii() or 0x00C0 <= code <= 0x024F:
        return "latin"
    for name, ranges in _SCRIPT_RANGES:
        if any(low <= code <= high for low, high in ranges):
            return name
    return None


def script_counts(text: str) -> ScriptCounts:
    """태그를 뺀 텍스트의 문자 체계별 글자 수."""
    counter = Counter(_script(ch) for ch in plain_text(text))
    return ScriptCounts(**{item.name: counter.get(item.name, 0) for item in fields(ScriptCounts)})


@dataclass(frozen=True)
class Detection:
    """파일 단위 판정 결과."""

    lang: LanguageCode | None
    counts: ScriptCounts


def detect_language(texts: Iterable[str]) -> Detection:
    """여러 블록 텍스트로 원본 언어를 판정한다. 판단할 수 없으면 lang=None."""
    lines = list(texts)
    counts = ScriptCounts()
    for text in lines:
        counts = counts + script_counts(text)
    total = counts.total
    if not total:
        return Detection(None, counts)
    if counts.hangul / total >= KO_HANGUL_RATIO:
        return Detection("ko", counts)
    if counts.kana / total >= JA_KANA_RATIO:
        return Detection("ja", counts)
    if counts.kanji / total >= SCRIPT_RATIO:
        return Detection("zh", counts)
    other = _other_script_language(counts, "".join(lines))
    if other is not None:
        return Detection(other, counts)
    if counts.latin / total >= EN_LATIN_RATIO:
        return Detection(latin_language(lines), counts)
    return Detection(None, counts)


def _other_script_language(counts: ScriptCounts, text: str) -> str | None:
    """한중일·라틴 밖의 문자 체계로 정하는 언어."""
    total = counts.total
    if counts.cyrillic / total >= SCRIPT_RATIO:
        ukrainian = sum(1 for ch in text if ch in _UKRAINIAN_LETTERS)
        return "uk" if ukrainian / counts.cyrillic >= UK_LETTER_RATIO else "ru"
    if counts.arabic / total >= SCRIPT_RATIO:
        if any(ch in _URDU_LETTERS for ch in text):
            return "ur"
        return "fa" if any(ch in _PERSIAN_LETTERS for ch in text) else "ar"
    single = (("greek", "el"), ("hebrew", "he"), ("thai", "th"), ("devanagari", "hi"))
    for script, lang in single:
        if getattr(counts, script) / total >= SCRIPT_RATIO:
            return lang
    return None


def latin_language(texts: Iterable[str]) -> str:
    """라틴 문자 텍스트의 언어. 기능어 빈도로 고르고 확신이 없으면 en."""
    words = Counter(
        word.casefold() for text in texts for word in _WORD_RE.findall(plain_text(text))
    )
    scores = sorted(
        ((sum(words[w] for w in vocab), lang) for lang, vocab in LATIN_FUNCTION_WORDS.items()),
        reverse=True,
    )
    (best, lang), (second, _) = scores[0], scores[1]
    if best >= LATIN_MIN_HITS and best >= second * LATIN_MARGIN:
        return lang
    return "en"


def detect_content_language(texts: Iterable[str]) -> ContentLanguage | None:
    """자막 내용의 언어 (ISO 639-1). 판단할 수 없으면 None.

    언어 표시가 없는 내장 트랙·외부 자막 판정에 쓴다 (PROJECT-PLAN §21.3, §21.5, §26.4).
    """
    return detect_language(texts).lang


def resolve_source_language(texts: Iterable[str], option: SourceOption) -> LanguageCode:
    """`--src` 값으로 원본 언어를 정한다. auto 면 감지한다.

    Raises:
        LanguageDetectionError: auto 인데 판단할 수 없다.
    """
    if option != "auto":
        return option
    detection = detect_language(texts)
    if detection.lang is None:
        counts = detection.counts
        raise LanguageDetectionError(
            "원본 언어를 판단할 수 없다 (라틴 "
            f"{counts.latin}, 가나 {counts.kana}, 한자 {counts.kanji}, 한글 {counts.hangul}자). "
            "--src <ISO 639-1 코드> 로 지정해야 한다"
        )
    return detection.lang


def block_language(text: str) -> BlockLanguage:
    """블록 하나의 언어 (Q-02 비원본 언어 판정용). 확신이 없으면 unknown."""
    counts = script_counts(text)
    if counts.hangul >= KO_MIN_HANGUL and counts.hangul >= counts.kana + counts.kanji:
        return "ko"
    if counts.kana:
        return "ja"
    if counts.kanji >= ZH_MIN_KANJI:
        return "zh"
    if counts.latin and counts.latin >= counts.total // 2:
        return "en"
    return "unknown"
