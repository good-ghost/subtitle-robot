"""시리즈 설정 `series.toml` (PROJECT-PLAN §14.3, WI-4.001).

공급자·모델·재시도는 전역 config.toml 에만 있다 (§6.1). 에피소드 인식이 실패한 파일은
`[[episodes]]` 매니페스트로 지정한다.
"""

from __future__ import annotations

import tomllib
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from subtitle_robot.glossary.honorifics import HonorificPolicy
from subtitle_robot.lang.codes import LanguageCodeField
from subtitle_robot.lang.ja_translit import Style
from subtitle_robot.pipeline.style import (
    CustomHonorific,
    LyricsPolicy,
    NameStyle,
    SdhPolicy,
    StylePolicy,
)
from subtitle_robot.pipeline.unitizer import UnitLimits

SeriesMode = Literal["prescan", "incremental"]
LowConfidencePolicy = Literal["warn", "block"]
SERIES_FILE = "series.toml"


class SeriesSettingsError(ValueError):
    """series.toml 을 읽을 수 없거나 값이 잘못됐다."""


class HonorificsSection(BaseModel):
    """`[honorifics]`."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    policy: HonorificPolicy = "transliterate"
    custom: dict[str, CustomHonorific] = Field(default_factory=dict)


class AssSection(BaseModel):
    """`[ass]` — ASS 입력 (WI-6.001)."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    exclude_styles: tuple[str, ...] = ()
    # ASS 출력 스타일 폰트를 바꿀 이름 (한글 글리프가 있는 폰트, WI-6.002)
    font: str | None = None


class StorySection(BaseModel):
    """`[story]` — 직전 에피소드 요약 (§24.3, WI-6.004)."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    # 기본 꺼짐 (사용자 결정 2026-10-03): 화자 없는 자막으로 만든 요약에 틀린 관계 서술이 남고,
    # 번역 품질을 높인다는 근거가 아직 없다 (WI-6.006 E2E)
    enabled: bool = False
    episodes: int = Field(default=2, ge=0)
    max_tokens: int = Field(default=600, gt=0)


class PhrasesSection(BaseModel):
    """`[phrases]` — 반복 대사 메모리 (§24.4, WI-6.005)."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    enabled: bool = True
    min_episodes: int = Field(default=2, ge=2)
    # 감탄사·지시어(あぁ, この)는 반복 대사가 아니다 (WI-6.006 실측)
    min_chars: int = Field(default=4, ge=1)
    max_chars: int = Field(default=40, ge=2)


class ManifestEntry(BaseModel):
    """`[[episodes]]`: 파일명으로 인식하지 못한 에피소드의 지정."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    id: str = Field(pattern=r"^S\d{2,}E\d{2,}$")
    file: str
    src_lang: LanguageCodeField | None = None


class SeriesSettings(BaseModel):
    """`series.toml` (§14.3 기본값)."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    title: str = ""
    src_lang: LanguageCodeField
    mode: SeriesMode = "prescan"
    name_style: NameStyle = "hangul"
    transliteration: Style = "common"
    review: bool = False
    on_low_confidence: LowConfidencePolicy = "warn"
    sdh: SdhPolicy = "translate"
    lyrics: LyricsPolicy = "translate"
    honorifics: HonorificsSection = Field(default_factory=HonorificsSection)
    unit: UnitLimits = Field(default_factory=UnitLimits)
    ass: AssSection = Field(default_factory=AssSection)
    story: StorySection = Field(default_factory=StorySection)
    phrases: PhrasesSection = Field(default_factory=PhrasesSection)
    episodes: tuple[ManifestEntry, ...] = ()

    def style(self) -> StylePolicy:
        """번역 스타일 정책."""
        return StylePolicy(
            name_style=self.name_style,
            transliteration=self.transliteration,
            sdh=self.sdh,
            lyrics=self.lyrics,
            honorifics_policy=self.honorifics.policy,
            honorifics_custom=self.honorifics.custom,
            ass_exclude_styles=self.ass.exclude_styles,
        )


def load_series_settings(root: Path) -> SeriesSettings:
    """시리즈 폴더의 series.toml 을 읽는다.

    Raises:
        SeriesSettingsError: 파일이 없거나 값이 잘못됐다 (위치 포함).
    """
    path = Path(root) / SERIES_FILE
    try:
        raw = tomllib.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SeriesSettingsError(f"{path} 이 없다. 먼저 series init 을 해야 한다") from exc
    except tomllib.TOMLDecodeError as exc:
        raise SeriesSettingsError(f"{path}: TOML 문법 오류: {exc}") from exc
    try:
        return SeriesSettings.model_validate(raw)
    except ValidationError as exc:
        details = "; ".join(
            f"{'.'.join(str(p) for p in error['loc'])}: {error['msg']}" for error in exc.errors()
        )
        raise SeriesSettingsError(f"{path}: 설정 값 오류 — {details}") from exc


def render_series_toml(src_lang: str, title: str = "") -> str:
    """series init 이 만드는 기본 series.toml (§14.3)."""
    return f'''# 시리즈 설정 (PROJECT-PLAN §14.3). 공급자·모델은 전역 config.toml 에서 정한다.
title = "{title}"
src_lang = "{src_lang}"
mode = "prescan"                 # prescan(기본: 전 에피소드 분석 후 번역) | incremental
name_style = "hangul"            # hangul | original
transliteration = "common"       # common(기본, 타나카) | standard(다나카)
review = false                   # true 면 새 항목을 검토(series review) 뒤 번역
on_low_confidence = "warn"       # warn | block (review=false 일 때 읽기 신뢰도 낮은 항목)
sdh = "translate"                # translate | keep | drop
lyrics = "translate"             # translate | keep

[honorifics]
policy = "transliterate"         # transliterate(기본, 상·쿤) | translate(씨·군) | drop
# [honorifics.custom]
# "先輩" = {{ ko = "선배", space = true }}

[unit]
max_blocks = 4
max_duration = 10.0
max_gap = 1.0

# 직전 에피소드 요약을 번역 문맥으로 (분석 직후 원문으로 한국어 요약을 만든다)
# 기본 꺼짐: 화자 없는 자막의 요약은 인물 관계를 틀리게 적을 수 있다
# 켜면 요약 요청이 화마다 1건 늘어난다
[story]
enabled = false
episodes = 2                     # 직전 몇 화의 요약을 넣을지
max_tokens = 600                 # 요약 합의 상한, 넘으면 오래된 화부터 뺀다

# 반복 대사 메모리: 여러 화에 반복된 짧은 대사의 첫 번역을 phrases.yaml 에 모아 참고로 넣는다
[phrases]
enabled = true
min_episodes = 2                 # 이만큼 다른 화에 나오면 기록
min_chars = 4                    # あぁ·この 같은 짧은 말은 빼고 인사·캐치프레이즈만
max_chars = 40

# ASS 입력: 번역하지 않을 스타일 (노래는 lyrics 정책, 원본 언어가 아닌 줄은 자동 제외)
# [ass]
# exclude_styles = ["Signs-Credit"]
# font = "Noto Sans CJK KR"     # ASS 출력의 스타일 폰트 (원본이 일본어 전용 폰트일 때)

# 파일명으로 에피소드를 인식하지 못한 파일은 여기에 지정한다
# [[episodes]]
# id = "S01E13"
# file = "S01/special.srt"
'''
