import pytest

from subtitle_robot.lang.base import get_profile, plain_text

EN = get_profile("en")
JA = get_profile("ja")


@pytest.mark.parametrize(
    ("line", "speaker", "rest"),
    [
        ("JOHN: Where are you?", "JOHN", "Where are you?"),
        ("- MR. SMITH: Sit down.", "MR. SMITH", "Sit down."),
        ("[Brian] Did anybody else see that?", "Brian", "Did anybody else see that?"),
        ("[chuckles] No.", None, "[chuckles] No."),  # 소문자 대괄호는 효과음
        ("No. [chuckles]", None, "No. [chuckles]"),
        ("Time: 10 minutes", None, "Time: 10 minutes"),  # 대문자 라벨 아님
    ],
)
def test_english_speaker(line: str, speaker: str | None, rest: str) -> None:
    assert EN.split_speaker(line) == (speaker, rest)


@pytest.mark.parametrize(
    ("line", "speaker", "rest"),
    [
        ("（太郎）早く来い", "太郎", "早く来い"),
        ("(花子) うん", "花子", "うん"),
        ("- （ヒロシ）待って", "ヒロシ", "待って"),
        ("（笑）", None, "（笑）"),  # 괄호만 있는 줄은 효과음
        ("しょうがないだろ（笑）", None, "しょうがないだろ（笑）"),
    ],
)
def test_japanese_speaker(line: str, speaker: str | None, rest: str) -> None:
    assert JA.split_speaker(line) == (speaker, rest)


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("[door slams]", True),
        ("<i>[intriguing music playing]</i>", True),
        ("- [gasps]\n- [screams]", True),
        ("(sighs) (laughs)", True),
        ("No. [chuckles]", False),
        ("Hello", False),
        ("", False),
    ],
)
def test_english_sdh_only(text: str, expected: bool) -> None:
    assert EN.is_sdh_only(text) is expected


@pytest.mark.parametrize(
    ("text", "expected"),
    [("（笑）", True), ("（ドアが閉まる音）", True), ("しょうがないだろ（笑）", False)],
)
def test_japanese_sdh_only(text: str, expected: bool) -> None:
    assert JA.is_sdh_only(text) is expected


def test_lyrics_marker() -> None:
    assert JA.has_lyrics("{\\an8}♪ 夜明けまで歌おう ♪")
    assert EN.has_lyrics("♪ Lyrics line ♪")
    assert not EN.has_lyrics("Hello")


def test_japanese_honorific_suffixes_cover_plan_table_longest_first() -> None:
    for suffix in ("さん", "様", "くん", "君", "ちゃん", "先輩", "先生"):
        assert suffix in JA.honorific_suffixes
    assert JA.suffix_at("田中さん", 2) == "さん"
    assert JA.suffix_at("田中先輩が", 2) == "先輩"
    assert JA.suffix_at("田中が", 2) is None
    lengths = [len(s) for s in JA.honorific_suffixes]
    assert lengths == sorted(lengths, reverse=True)


def test_encoding_candidates() -> None:
    assert JA.encoding_candidates == ("utf-8", "cp932", "euc_jp")
    assert "cp1252" in EN.encoding_candidates


def test_english_titles_and_no_suffixes() -> None:
    assert "Mr." in EN.titles
    assert EN.honorific_suffixes == ()


def test_unknown_language() -> None:
    with pytest.raises(ValueError, match="지원하지 않는"):
        get_profile("xx")


def test_generic_profile_for_other_languages() -> None:
    """전용 프로파일이 없는 언어는 문자 체계로 정한 공통 프로파일 (§26.2)."""
    fr, ru, zh, tr = (get_profile(code) for code in ("fr", "ru", "zh", "tr"))

    assert get_profile("en") is EN
    assert get_profile("ja") is JA
    assert fr.encoding_candidates == ("utf-8", "cp1252")
    assert ru.encoding_candidates == ("utf-8", "cp1251", "koi8_r")
    assert zh.encoding_candidates == ("utf-8", "gb18030", "big5")
    assert tr.encoding_candidates == ("utf-8", "cp1254")
    assert fr.honorific_suffixes == ()
    # 이어짐: 명시적인 부호, 또는 대소문자가 있는 문자 체계에서 소문자로 시작하는 다음 블록
    assert fr.continues("Je ne sais pas,", "Il est parti.")
    assert fr.continues("Je ne sais pas", "où il est.")
    assert not fr.continues("Je ne sais pas", "Il est parti.")
    assert ru.continues("Я не знаю", "где он.")
    assert zh.continues("我不知道，", "他去哪儿了")
    assert not zh.continues("我不知道", "他去哪儿了")
    # 화자·효과음
    assert fr.split_speaker("JEAN: Bonjour.") == ("JEAN", "Bonjour.")
    assert fr.split_speaker("[rires] Non.") == (None, "[rires] Non.")
    assert ru.split_speaker("ИВАН: Привет.") == ("ИВАН", "Привет.")
    assert zh.split_speaker("（笑）好") == (None, "（笑）好")
    assert fr.is_sdh_only("[musique]")
    assert zh.is_sdh_only("（笑声）")


def test_plain_text_removes_tags() -> None:
    assert plain_text("{\\an8}<i>Hi</i>") == "Hi"
