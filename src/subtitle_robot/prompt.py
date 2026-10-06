"""프롬프트 로드·조립·버전 (PROJECT-PLAN §5, §9.3, §10.5, WI-3.001).

프롬프트 원문은 패키지 안 `prompts/` 에 있다: `<pass>.base.md` + 언어별 `<pass>.<lang>.md`.
대상이 한국어가 아니면 `<pass>.multi.md` + `<pass>.multi.<lang>.md` 이고, 전용 규칙이 없는 원본
언어는 `any` 규칙 파일을 쓴다 (§26.5).
버전은 두 파일 내용의 해시다. fingerprint(§13)에 들어가므로 프롬프트를 고치면
이전 번역은 stale 이 된다.
자리표시자는 `${name}` 형식이다 (프롬프트 안 JSON 예시의 중괄호와 충돌하지 않게).
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from importlib import resources
from pathlib import Path
from string import Template
from typing import Literal

from subtitle_robot.lang.base import LanguageCode
from subtitle_robot.lang.codes import DEFAULT_TARGET
from subtitle_robot.lang.target import is_korean

PassName = Literal["pass1", "pass2", "summary"]
_VERSION_HASH_CHARS = 8
# 전용 프롬프트 규칙이 있는 원본 언어
DEDICATED_SOURCES = frozenset({"en", "ja"})


class PromptError(ValueError):
    """프롬프트 파일이 없거나 자리표시자 값이 빠졌다."""


@dataclass(frozen=True)
class PromptTemplate:
    """시스템 프롬프트 하나.

    Attributes:
        name: `pass2.ja` 같은 이름.
        text: base 에 언어 규칙을 넣은 원문 (`${src_lang}` 등 남은 자리표시자 포함).
        version: `pass2.ja@3f2a9c1d` — 내용 해시.
    """

    name: str
    text: str
    version: str

    def render(self, **values: str) -> str:
        """자리표시자를 채운다.

        Raises:
            PromptError: 값이 빠진 자리표시자가 있다.
        """
        try:
            return Template(self.text).substitute(values)
        except KeyError as exc:
            raise PromptError(f"{self.name}: 자리표시자 값이 없다: {exc}") from exc


def load_prompt(
    pass_name: PassName,
    lang: LanguageCode,
    *,
    target: str = DEFAULT_TARGET,
    root: Path | None = None,
) -> PromptTemplate:
    """프롬프트를 읽어 언어 규칙을 넣는다.

    Args:
        pass_name: `pass1`, `pass2`, `summary`.
        lang: 원본 언어.
        target: 대상 언어. ko 가 아니면 `${tgt_lang}` 자리표시자가 있는 공통 프롬프트다.
        root: 프롬프트 폴더 (테스트용). 없으면 패키지의 `prompts/`.

    Raises:
        PromptError: 파일이 없다.
    """
    # 전용 규칙(일본어·영어)이 있는 원본은 그 규칙을 쓴다 (사용자 지시 2026-10-04)
    rules_lang = lang if lang in DEDICATED_SOURCES else "any"
    if is_korean(target):
        base_file, rules_file, name = "base", rules_lang, f"{pass_name}.{lang}"
    else:
        base_file, rules_file = "multi", f"multi.{rules_lang}"
        name = f"{pass_name}.{lang}-{target}"
    base = _read(f"{pass_name}.{base_file}.md", root)
    rules = _read(f"{pass_name}.{rules_file}.md", root)
    digest = hashlib.sha256(f"{base}\0{rules}".encode()).hexdigest()[:_VERSION_HASH_CHARS]
    # 언어 규칙은 먼저 넣고, 나머지 자리표시자(src_lang 등)는 render 에서 채운다
    text = Template(base).safe_substitute(lang_rules=rules.strip())
    return PromptTemplate(name=name, text=text, version=f"{name}@{digest}")


def _read(filename: str, root: Path | None) -> str:
    try:
        if root is not None:
            return (root / filename).read_text(encoding="utf-8")
        return (
            resources.files("subtitle_robot.prompts").joinpath(filename).read_text(encoding="utf-8")
        )
    except FileNotFoundError as exc:
        raise PromptError(f"프롬프트 파일이 없다: {filename}") from exc
