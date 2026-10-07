"""자막 트랙 모델과 코덱 분류 (PROJECT-PLAN §21.3, WI-5.001).

트랙 번호 체계는 도구마다 다르다 (mkvmerge 트랙 ID ≠ ffmpeg 스트림 인덱스).
그래서 트랙은 검사한 도구의 번호(`track_id`)와 자막 트랙 사이 순서
(`order`, ffmpeg `-map 0:s:<n>` 의 n)를 함께 갖는다.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

from subtitle_robot.lang.codes import language_from_name

Container = Literal["mkv", "mp4"]
SubtitleKind = Literal["srt", "ass", "webvtt", "mov_text", "image", "unknown"]
TEXT_KINDS: frozenset[SubtitleKind] = frozenset({"srt", "ass", "webvtt", "mov_text"})

# §21.3 코덱 분류 표
_MKV_CODECS: dict[str, SubtitleKind] = {
    "S_TEXT/UTF8": "srt",
    "S_TEXT/ASCII": "srt",
    "S_TEXT/ASS": "ass",
    "S_TEXT/SSA": "ass",
    "S_ASS": "ass",
    "S_SSA": "ass",
    "S_TEXT/WEBVTT": "webvtt",
    "S_HDMV/PGS": "image",
    "S_VOBSUB": "image",
    "S_DVBSUB": "image",
}
_FFPROBE_CODECS: dict[str, SubtitleKind] = {
    "subrip": "srt",
    "srt": "srt",
    "ass": "ass",
    "ssa": "ass",
    "webvtt": "webvtt",
    "mov_text": "mov_text",
    "hdmv_pgs_subtitle": "image",
    "dvd_subtitle": "image",
    "dvb_subtitle": "image",
    "xsub": "image",
}
_SDH_NAME_RE = re.compile(r"\bSDH\b", re.IGNORECASE)


def classify_mkv_codec(codec_id: str) -> SubtitleKind:
    """mkvmerge codec_id 분류."""
    return _MKV_CODECS.get(codec_id.upper(), "unknown")


def classify_ffprobe_codec(codec_name: str) -> SubtitleKind:
    """ffprobe codec_name 분류."""
    return _FFPROBE_CODECS.get(codec_name.lower(), "unknown")


@dataclass(frozen=True)
class SubtitleTrack:
    """컨테이너 안의 자막 트랙 하나.

    Attributes:
        order: 자막 트랙 사이 순서 (0부터, 컨테이너 순서).
        track_id: 검사 도구의 트랙 번호 (mkvmerge 트랙 ID / ffprobe 스트림 인덱스).
        codec: 도구가 준 코덱 식별자 그대로.
        kind: 코덱 분류.
        language: 정규화한 언어 (`en`·`ja`·`ko`·기타). 미지정이면 None.
        language_raw: 도구가 준 언어 값 그대로.
        name: 트랙 이름.
        forced: forced 플래그.
        default: default 플래그.
        hearing_impaired: 청각장애인용 플래그.
    """

    order: int
    track_id: int
    codec: str
    kind: SubtitleKind
    language: str | None
    language_raw: str
    name: str
    forced: bool
    default: bool
    hearing_impaired: bool

    @property
    def is_text(self) -> bool:
        """텍스트 자막 (추출·번역 소스 가능)."""
        return self.kind in TEXT_KINDS

    @property
    def is_image(self) -> bool:
        """이미지 자막 (텍스트로 추출하지 않는다. OCR 은 `media.ocr_source`, WI-5.004c)."""
        return self.kind == "image"

    @property
    def is_sdh(self) -> bool:
        """청각장애인용: 플래그 또는 트랙 이름의 SDH (§21.4)."""
        return self.hearing_impaired or bool(_SDH_NAME_RE.search(self.name))

    @property
    def name_language(self) -> str | None:
        """트랙 이름에서 얻은 언어 힌트."""
        return language_from_name(self.name)

    @property
    def effective_language(self) -> str | None:
        """언어 값, 없으면 트랙 이름 힌트. 둘 다 없으면 추출 뒤 내용으로 감지한다."""
        return self.language or self.name_language
