"""경칭 정책 맵과 이름 조합 (PROJECT-PLAN §8.6, WI-2.004).

용어집에는 이름 본체만 두고(`田中` → 타나카), 접미사(`さん`)는 이 정책 맵으로 런타임에 조합한다
(`타나카 상`). 정책을 바꿔도 용어집은 고치지 않고 재번역만 하면 된다 (§17).
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Literal

HonorificPolicy = Literal["transliterate", "translate", "drop"]


@dataclass(frozen=True)
class HonorificForm:
    """접미사의 한국어 형태.

    Attributes:
        ko: 한국어 표기. 빈 문자열이면 생략(말투로 표현).
        space: 이름과 띄어 쓰는지.
    """

    ko: str
    space: bool

    def attach(self, name_ko: str) -> str:
        """이름에 붙인 결과."""
        if not self.ko:
            return name_ko
        return f"{name_ko} {self.ko}" if self.space else f"{name_ko}{self.ko}"


_OMIT = HonorificForm("", space=False)

# §8.6 표: 접미사 → (translate, transliterate)
_DEFAULT_TABLE: dict[str, tuple[HonorificForm, HonorificForm]] = {
    "さん": (HonorificForm("씨", space=True), HonorificForm("상", space=True)),
    "様": (HonorificForm("님", space=False), HonorificForm("사마", space=True)),
    "くん": (HonorificForm("군", space=True), HonorificForm("쿤", space=True)),
    "ちゃん": (_OMIT, HonorificForm("짱", space=False)),
    "先輩": (HonorificForm("선배", space=True), HonorificForm("센파이", space=True)),
    "先生": (HonorificForm("선생님", space=True), HonorificForm("센세", space=True)),
}
# 표기 변형 → 표의 접미사
_ALIASES: dict[str, str] = {"君": "くん", "さま": "様"}


class HonorificResolver:
    """정책과 개별 지정(`[honorifics.custom]`)으로 접미사의 한국어 형태를 정한다."""

    def __init__(
        self,
        policy: HonorificPolicy = "transliterate",
        custom: Mapping[str, HonorificForm] | None = None,
    ) -> None:
        """리졸버를 만든다.

        Args:
            policy: 기본 정책 (`series.toml` 의 `honorifics.policy`, 기본 transliterate).
            custom: 접미사별 개별 지정. 정책보다 우선한다.
        """
        self.policy = policy
        self._custom = dict(custom or {})

    def resolve(self, suffix: str) -> HonorificForm | None:
        """접미사의 형태. 표에도 개별 지정에도 없으면 None (LLM 이 문맥으로 판단)."""
        if suffix in self._custom:
            return self._custom[suffix]
        canonical = _ALIASES.get(suffix, suffix)
        if canonical in self._custom:
            return self._custom[canonical]
        if canonical not in _DEFAULT_TABLE:
            return None
        if self.policy == "drop":
            return _OMIT
        translate, transliterate = _DEFAULT_TABLE[canonical]
        return translate if self.policy == "translate" else transliterate

    def compose(self, name_ko: str, suffix: str | None) -> str:
        """이름 + 접미사의 한국어 (`타나카` + `さん` → `타나카 상`). 모르는 접미사는 이름만."""
        if suffix is None:
            return name_ko
        form = self.resolve(suffix)
        return form.attach(name_ko) if form else name_ko

    def prompt_map(self, suffixes: Iterable[str]) -> dict[str, HonorificForm]:
        """배치에 등장한 접미사만 담은 맵 (§10.4: 프롬프트에는 등장한 것만 넣는다)."""
        result: dict[str, HonorificForm] = {}
        for suffix in dict.fromkeys(suffixes):
            form = self.resolve(suffix)
            if form is not None:
                result[suffix] = form
        return result
