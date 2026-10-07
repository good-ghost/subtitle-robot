"""SAMI(.smi) 읽기와 SRT 변환 (WI-5.004b).

SAMI 는 HTML 비슷한 형식이다: `<SYNC Start=ms>` 마다 `<P Class=KRCC>` 처럼 언어별 클래스의
줄을 둔다.
한 SYNC 의 내용은 같은 클래스의 다음 SYNC 까지 보인다. `&nbsp;`만 있는 SYNC 는 화면을 지우는 표시다.
한국에서 흔한 SAMI 는 CP949(EUC-KR)로 저장된 경우가 많아 인코딩은 `decode_subtitle`로 판별한다.
클래스마다 언어를 정하고(내용 감지 → STYLE 의 `lang:` → 클래스 이름 순) SRT 로 바꾼다.
"""

from __future__ import annotations

import html
import re
from dataclasses import dataclass

from subtitle_robot.io.convert import render_srt
from subtitle_robot.io.encoding import decode_subtitle
from subtitle_robot.io.langdetect import detect_content_language
from subtitle_robot.lang.codes import normalize_language

SAMI_SUFFIXES = frozenset({".smi", ".sami"})
# 마지막 SYNC 처럼 끝 표시가 없는 줄을 보여 줄 시간
_LAST_EVENT_MS = 3000
_SYNC_RE = re.compile(r"<sync\b([^>]*)>(.*?)(?=<sync\b|</body\s*>|\Z)", re.IGNORECASE | re.DOTALL)
_START_RE = re.compile(r"\bstart\s*=\s*[\"']?(-?\d+)", re.IGNORECASE)
_P_RE = re.compile(r"<p\b([^>]*)>", re.IGNORECASE)
_CLASS_RE = re.compile(r"\bclass\s*=\s*[\"']?([\w-]+)", re.IGNORECASE)
_BR_RE = re.compile(r"<br\s*/?>", re.IGNORECASE)
_TAG_RE = re.compile(r"<[^>]+>")
_STYLE_RE = re.compile(r"<style\b[^>]*>(.*?)</style\s*>", re.IGNORECASE | re.DOTALL)
_CSS_CLASS_RE = re.compile(r"\.([\w-]+)\s*\{([^}]*)\}")
_CSS_LANG_RE = re.compile(r"\blang\s*:\s*([\w-]+)", re.IGNORECASE)
# STYLE 의 CSS 는 대개 `<!-- … -->` 안에 있다. 표시만 지우고 내용은 읽는다
_COMMENT_MARK_RE = re.compile(r"<!--|-->")
# STYLE 에 lang 이 없을 때 흔한 클래스 이름으로 짐작한다 (내용 감지가 우선)
_CLASS_LANGUAGES = {
    "krcc": "ko", "kocc": "ko", "kor": "ko", "encc": "en", "enuscc": "en", "engcc": "en",
    "jpcc": "ja", "jacc": "ja", "cncc": "zh", "zhcc": "zh",
}  # fmt: skip


class SamiError(ValueError):
    """SAMI 로 읽을 수 없다 (SYNC 가 없다)."""


@dataclass(frozen=True)
class SamiTrack:
    """SAMI 의 언어 클래스 하나.

    Attributes:
        css_class: 클래스 이름 (`KRCC`). 클래스 없는 줄은 빈 문자열.
        language: 정한 언어 (ISO 639-1). 정하지 못했으면 None.
        detected: 언어를 내용으로 정했다.
        events: (시작 ms, 끝 ms, 텍스트) 목록.
    """

    css_class: str
    language: str | None
    detected: bool
    events: tuple[tuple[int, int, str], ...]

    def to_srt(self) -> str:
        """SRT 텍스트."""
        return render_srt(list(self.events))


def read_sami(data: bytes) -> list[SamiTrack]:
    """SAMI 파일 내용을 언어 클래스별 트랙으로 읽는다. 내용이 없는 클래스는 뺀다.

    Raises:
        SamiError: SYNC 가 없다.
        EncodingDetectionError: 인코딩을 판별하지 못했다.
    """
    return parse_sami(decode_subtitle(data).text)


def parse_sami(text: str) -> list[SamiTrack]:
    """SAMI 텍스트를 언어 클래스별 트랙으로 나눈다.

    Raises:
        SamiError: SYNC 가 없다.
    """
    declared = _declared_languages(text)
    timelines: dict[str, list[tuple[int, str]]] = {}
    syncs = list(_SYNC_RE.finditer(text))
    if not syncs:
        raise SamiError("SAMI 의 SYNC 가 없다")
    for sync in syncs:
        start = _START_RE.search(sync.group(1))
        if start is None:
            continue
        for css_class, line in _paragraphs(sync.group(2)):
            timelines.setdefault(css_class, []).append((int(start.group(1)), line))
    tracks = []
    for css_class, timeline in timelines.items():
        events = _events(timeline)
        if events:
            language, detected = _language(css_class, events, declared)
            tracks.append(SamiTrack(css_class, language, detected, tuple(events)))
    return tracks


def _declared_languages(text: str) -> dict[str, str]:
    """STYLE 의 `.KRCC { lang: ko-KR; }` → {krcc: ko}."""
    found: dict[str, str] = {}
    for style in _STYLE_RE.finditer(text):
        for css in _CSS_CLASS_RE.finditer(_COMMENT_MARK_RE.sub(" ", style.group(1))):
            lang = _CSS_LANG_RE.search(css.group(2))
            code = normalize_language(lang.group(1).split("-")[0]) if lang else None
            if code:
                found[css.group(1).casefold()] = code
    return found


def _paragraphs(body: str) -> list[tuple[str, str]]:
    """SYNC 안의 `<P>` 마다 (클래스, 텍스트). P 가 없으면 클래스 없는 줄 하나."""
    starts = list(_P_RE.finditer(body))
    if not starts:
        return [("", _clean(body))]
    parts = []
    for index, match in enumerate(starts):
        end = starts[index + 1].start() if index + 1 < len(starts) else len(body)
        css = _CLASS_RE.search(match.group(1))
        parts.append((css.group(1) if css else "", _clean(body[match.end() : end])))
    return parts


def _clean(fragment: str) -> str:
    """태그를 지우고 줄바꿈·엔티티를 푼다. 빈 줄(`&nbsp;`)은 빈 문자열."""
    text = _TAG_RE.sub("", _BR_RE.sub("\n", fragment))
    text = html.unescape(text).replace("\xa0", " ")
    lines = [" ".join(line.split()) for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def _events(timeline: list[tuple[int, str]]) -> list[tuple[int, int, str]]:
    """같은 클래스의 다음 SYNC 까지 보이는 줄. 빈 줄은 지우는 표시라 사건이 아니다."""
    ordered = sorted(timeline, key=lambda item: item[0])
    events = []
    for index, (start, line) in enumerate(ordered):
        if not line:
            continue
        end = ordered[index + 1][0] if index + 1 < len(ordered) else start + _LAST_EVENT_MS
        if end > start:
            events.append((start, end, line))
    return events


def _language(
    css_class: str, events: list[tuple[int, int, str]], declared: dict[str, str]
) -> tuple[str | None, bool]:
    """클래스 언어: 내용 감지 → STYLE 의 lang → 흔한 클래스 이름. (언어, 내용 감지 여부)."""
    detected = detect_content_language(line for _, _, line in events)
    if detected:
        return detected, True
    key = css_class.casefold()
    return declared.get(key) or _CLASS_LANGUAGES.get(key), False
