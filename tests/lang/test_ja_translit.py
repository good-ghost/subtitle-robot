import pytest

from subtitle_robot.lang.ja_translit import TransliterationError, other_style, transliterate

# WI-2.006 수락 기준 표: 읽기 → (common, standard)
CASES = {
    "たなか": ("타나카", "다나카"),
    "つき": ("츠키", "쓰키"),
    "かとう": ("카토", "가토"),
    "たなか ひろし": ("타나카 히로시", "다나카 히로시"),
    "さとう": ("사토", "사토"),
    "いとう": ("이토", "이토"),
    "おおさか": ("오사카", "오사카"),
    "きょうと": ("쿄토", "교토"),
    "とうきょう": ("토쿄", "도쿄"),
    "ちば": ("치바", "지바"),
    "さっぽろ": ("삿포로", "삿포로"),
    "はっとり": ("핫토리", "핫토리"),
    "しんいち": ("신이치", "신이치"),
    "けいこ": ("케이코", "게이코"),
    "めいじ": ("메이지", "메이지"),
    "ゆうき": ("유키", "유키"),
    "りょうま": ("료마", "료마"),
    "にいがた": ("니가타", "니가타"),
    "ちゅうや": ("추야", "주야"),
    "ヒロシ": ("히로시", "히로시"),
    "ティナ": ("티나", "티나"),
    "ファンゴ": ("판고", "판고"),
    "ジェシカ": ("제시카", "제시카"),
    "コーヒー": ("코히", "고히"),  # 장음 기호 ー
    "かつき": ("카츠키", "가쓰키"),
    "ちかこ": ("치카코", "지카코"),
    "たなか・はなこ": ("타나카 하나코", "다나카 하나코"),
    "まつもと　じゅん": ("마츠모토 준", "마쓰모토 준"),
}


@pytest.mark.parametrize(("reading", "expected"), CASES.items())
def test_common_and_standard(reading: str, expected: tuple[str, str]) -> None:
    common, standard = expected

    assert transliterate(reading, "common") == common
    assert transliterate(reading, "standard") == standard


def test_default_style_is_common() -> None:
    assert transliterate("たなか") == "타나카"


def test_katakana_western_names_follow_rules() -> None:
    # 관용 표기(안젤로, 브루노)와 다르다 — 적용 여부는 Q-03 (WI-3.003)
    assert transliterate("アンジェロ") == "안제로"
    assert transliterate("ブルノ") == "부루노"


@pytest.mark.parametrize("reading", ["田中", "tanaka", "たなか1"])
def test_non_kana_is_rejected(reading: str) -> None:
    with pytest.raises(TransliterationError, match="가나가 아닌 문자"):
        transliterate(reading)


def test_leading_hatsuon_and_sokuon() -> None:
    assert transliterate("んば") == "은바"
    assert transliterate("っか") == "카"


def test_same_reading_always_same_result() -> None:
    results = {transliterate("ふじわら ゆうこ") for _ in range(5)}

    assert results == {"후지와라 유코"}


def test_other_style() -> None:
    assert other_style("common") == "standard"
    assert other_style("standard") == "common"
