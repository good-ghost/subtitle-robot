import pytest

from subtitle_robot.lang.codes import (
    is_language_code,
    language_from_name,
    language_name,
    language_tokens,
    normalize_language,
    script_of,
)


@pytest.mark.parametrize(
    ("code", "expected"),
    [
        ("eng", "en"),
        ("en", "en"),
        ("en-US", "en"),
        ("en-GB", "en"),
        ("EN_us", "en"),
        ("jpn", "ja"),
        ("ja-JP", "ja"),
        ("kor", "ko"),
        ("ko-KR", "ko"),
        ("und", None),
        ("", None),
        ("  ", None),
        (None, None),
        ("fr-FR", "fr"),
        ("fre", "fr"),
        ("fra", "fr"),
        ("French", "fr"),
        ("chi", "zh"),
        ("zho", "zh"),
        ("zh-Hans", "zh"),
        ("cn", "zh"),
        ("iw", "he"),
        ("xyz", None),
        ("klingon", None),
    ],
)
def test_normalize_language(code: str | None, expected: str | None) -> None:
    assert normalize_language(code) == expected


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("English", "en"),
        ("English SDH", "en"),
        ("日本語", "ja"),
        ("Japanese (Signs)", "ja"),
        ("한국어", "ko"),
        ("Korean", "ko"),
        ("韓国語", "ko"),
        ("Bengali", "bn"),  # 'eng' 가 단어 안에 있어도 영어가 아니다
        ("French (Canada)", "fr"),
        ("Français", "fr"),
        ("Brazilian Portuguese", "pt"),
        ("Simplified Chinese", "zh"),
        ("简体中文", "zh"),
        ("ger", "de"),
        ("May contain spoilers", None),  # 영어 단어 may 는 말레이어가 아니다
        ("English / 日本語", None),  # 두 언어면 판단하지 않는다
        ("Signs & Songs", None),
        ("", None),
        (None, None),
    ],
)
def test_language_from_name(name: str | None, expected: str | None) -> None:
    assert language_from_name(name) == expected


def test_language_table_helpers() -> None:
    assert is_language_code("fr")
    assert not is_language_code("fre")
    assert language_name("fr") == "French"
    assert language_name("el") == "Modern Greek"
    assert language_name("xx") == "xx"
    assert script_of("ru") == "cyrillic"
    assert script_of("ja") == "kana"
    assert script_of("fr") == "latin"
    assert script_of("xx") is None
    assert {"fr", "fre", "fra", "french", "français"} <= language_tokens("fr")
    assert {"zh", "chi", "zho", "chinese", "chs", "cht"} <= language_tokens("zh")
