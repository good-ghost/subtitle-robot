"""언어 코드 표 생성 (PROJECT-PLAN §26.1, WI-8.001).

ISO 639-1 코드가 있는 언어의 639-2(B·T) 코드와 영어 이름을 pycountry 데이터에서 뽑아
`src/subtitle_robot/lang/codes_data.py` 를 만든다. 문자 체계는 ISO 데이터에 없어 아래 표로 정한다
(없으면 latin). 생성 결과는 손으로 고치지 않는다.

사용 (pycountry 는 이 스크립트를 돌릴 때만 받는다):
    uv run --with pycountry python scripts/gen_language_codes.py
"""

from __future__ import annotations

import re
from pathlib import Path

import pycountry  # type: ignore[import-not-found, unused-ignore]

OUTPUT = Path(__file__).resolve().parent.parent / "src/subtitle_robot/lang/codes_data.py"

# 라틴 문자가 아닌 언어의 주 문자 체계 (자막에서 흔히 쓰는 표기)
SCRIPTS: dict[str, tuple[str, ...]] = {
    "cyrillic": (
        "ru", "uk", "be", "bg", "mk", "sr", "kk", "ky", "tg", "mn", "ba", "cv", "os", "tt",
        "ce", "kv", "av", "cu",
    ),
    "greek": ("el",),
    "arabic": ("ar", "fa", "ur", "ps", "ug", "sd", "ks"),
    "hebrew": ("he", "yi"),
    "devanagari": ("hi", "mr", "ne", "sa"),
    "bengali": ("bn", "as"),
    "thai": ("th",),
    "lao": ("lo",),
    "khmer": ("km",),
    "myanmar": ("my",),
    "tamil": ("ta",),
    "telugu": ("te",),
    "kannada": ("kn",),
    "malayalam": ("ml",),
    "gujarati": ("gu",),
    "gurmukhi": ("pa",),
    "sinhala": ("si",),
    "ethiopic": ("am", "ti"),
    "georgian": ("ka",),
    "armenian": ("hy",),
    "tibetan": ("bo", "dz"),
    "thaana": ("dv",),
    "kana": ("ja",),
    "hangul": ("ko",),
    "han": ("zh",),
}  # fmt: skip


def _english_name(name: str) -> str:
    """프롬프트에 쓰는 짧은 이름 (`Greek, Modern (1453-)` → `Greek`)."""
    return re.split(r"[,;(]", name)[0].strip()


def main() -> None:
    """표를 생성한다."""
    script_of = {code: script for script, codes in SCRIPTS.items() for code in codes}
    rows = []
    for language in sorted(pycountry.languages, key=lambda item: getattr(item, "alpha_2", "")):
        alpha2 = getattr(language, "alpha_2", None)
        if alpha2 is None:
            continue
        terminology = language.alpha_3
        bibliographic = getattr(language, "bibliographic", terminology)
        rows.append(
            f'    "{alpha2}": LanguageInfo("{alpha2}", "{bibliographic}", "{terminology}", '
            f'"{_english_name(language.name)}", "{script_of.get(alpha2, "latin")}"),'
        )
    OUTPUT.write_text(
        '"""언어 코드 표 — scripts/gen_language_codes.py 가 생성한다. 손으로 고치지 않는다."""\n\n'
        "from __future__ import annotations\n\n"
        "from subtitle_robot.lang.language_info import LanguageInfo\n\n"
        "LANGUAGES: dict[str, LanguageInfo] = {\n" + "\n".join(rows) + "\n}\n",
        encoding="utf-8",
    )
    print(f"{OUTPUT}: {len(rows)}개 언어")


if __name__ == "__main__":
    main()
