from pathlib import Path

import pytest

from subtitle_robot.prompt import PromptError, load_prompt


@pytest.mark.parametrize("pass_name", ["pass1", "pass2"])
@pytest.mark.parametrize("lang", ["en", "ja"])
def test_packaged_prompts_render(pass_name: str, lang: str) -> None:
    prompt = load_prompt(pass_name, lang)  # type: ignore[arg-type]

    text = prompt.render(src_lang="Japanese" if lang == "ja" else "English")

    assert "${" not in text
    assert prompt.version.startswith(f"{pass_name}.{lang}@")
    assert len(prompt.version.split("@")[1]) == 8


def test_japanese_pass1_asks_for_reading_and_origin() -> None:
    text = load_prompt("pass1", "ja").render(src_lang="Japanese")

    assert '"reading"' in text
    assert '"origin"' in text  # Q-03
    assert "전중" in text  # 한국식 한자음 금지 예시


def test_pass2_keeps_json_braces_and_rules() -> None:
    text = load_prompt("pass2", "en").render(src_lang="English")

    assert "Return one Korean text for EVERY input idx" in text
    assert "English rules:" in text


def _write(root: Path, base: str, rules: str) -> None:
    (root / "pass2.base.md").write_text(base, encoding="utf-8")
    (root / "pass2.ja.md").write_text(rules, encoding="utf-8")


def test_version_changes_with_content(tmp_path: Path) -> None:
    _write(tmp_path, 'Translate ${src_lang} {"units": []}\n${lang_rules}', "rule A")
    first = load_prompt("pass2", "ja", root=tmp_path)

    _write(tmp_path, 'Translate ${src_lang} {"units": []}\n${lang_rules}', "rule B")
    second = load_prompt("pass2", "ja", root=tmp_path)

    assert first.version != second.version
    assert second.render(src_lang="Japanese") == 'Translate Japanese {"units": []}\nrule B'


def test_same_content_same_version(tmp_path: Path) -> None:
    _write(tmp_path, "${lang_rules}", "x")

    assert (
        load_prompt("pass2", "ja", root=tmp_path).version
        == load_prompt("pass2", "ja", root=tmp_path).version
    )


def test_missing_value_and_missing_file(tmp_path: Path) -> None:
    _write(tmp_path, "${src_lang} ${lang_rules}", "x")
    prompt = load_prompt("pass2", "ja", root=tmp_path)

    with pytest.raises(PromptError, match="src_lang"):
        prompt.render()
    with pytest.raises(PromptError, match=r"pass1\.base\.md"):
        load_prompt("pass1", "ja", root=tmp_path)


@pytest.mark.parametrize("pass_name", ["pass1", "pass2", "summary"])
@pytest.mark.parametrize("lang", ["en", "ja", "fr"])
@pytest.mark.parametrize("target", ["ko", "en", "zh"])
def test_every_source_target_combination_renders(pass_name: str, lang: str, target: str) -> None:
    """원본·대상 조합마다 프롬프트 파일이 있고 자리표시자가 모두 채워진다 (§26.5)."""
    if lang == target:
        return
    prompt = load_prompt(pass_name, lang, target=target)  # type: ignore[arg-type]
    text = prompt.render(src_lang=lang, tgt_lang=target, max_chars="400")

    assert "${" not in text
    assert ("Hangul" in text) == (target == "ko")
    expected = f"{pass_name}.{lang}" if target == "ko" else f"{pass_name}.{lang}-{target}"
    assert prompt.version.startswith(f"{expected}@")
    # 일본어 원본은 대상과 관계없이 일본어 전용 규칙 (사용자 지시 2026-10-04)
    assert ("Japanese rules:" in text) == (lang == "ja")
