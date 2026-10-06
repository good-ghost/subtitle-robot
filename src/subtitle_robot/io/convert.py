"""ASS·WebVTT → SRT 변환 (PROJECT-PLAN §21.4, §24.1, WI-5.002, WI-6.001).

ffmpeg 의 SRT 변환은 `<font size="20">` 같은 HTML 태그를 덧붙여서 코드로 변환한다. ASS override 태그
(`{\\an8}`)는 그대로 두고 파이프라인(Q-01)이 처리한다. 변환본은 작업 폴더에만 둔다.
"""

from __future__ import annotations

import re

from subtitle_robot.io.ass import (
    SKIPPED_ROLES,
    AssParseError,
    event_role,
    parse_ass,
    to_block_text,
)

_VTT_TIME_RE = re.compile(r"(?:(\d+):)?(\d{1,2}):(\d{2})\.(\d{3})")
_VTT_CUE_TIMING_RE = re.compile(
    r"^\s*((?:\d+:)?\d{1,2}:\d{2}\.\d{3})\s+-->\s+((?:\d+:)?\d{1,2}:\d{2}\.\d{3})"
)
# WebVTT 전용 태그: 음성·클래스·시각·루비 읽기는 버리고, <i>·<b>·<u> 는 SRT 에서도 쓰므로 남긴다
_VTT_RUBY_TEXT_RE = re.compile(r"<rt>.*?</rt>", re.DOTALL)
_VTT_TAG_RE = re.compile(r"</?(?:c|v|lang|ruby|rt)(?:[.\s][^>]*)?>|<\d{2}:[\d:.]+>")
_VTT_ENTITIES = {"&amp;": "&", "&lt;": "<", "&gt;": ">", "&nbsp;": " ", "&lrm;": "", "&rlm;": ""}
_VTT_SKIP_BLOCKS = ("NOTE", "STYLE", "REGION")


class SubtitleConversionError(ValueError):
    """자막을 SRT 로 바꿀 수 없다 (대사가 하나도 없음)."""


def ass_to_srt(text: str) -> str:
    """ASS/SSA 대사를 SRT 로 바꾼다 (Dialogue 만, 그림·빈 이벤트 제외, 시작 시각 순).

    Raises:
        SubtitleConversionError: 대사가 없거나 ASS 로 읽을 수 없다.
    """
    try:
        document = parse_ass(text)
    except AssParseError as exc:
        raise SubtitleConversionError(str(exc)) from exc
    # 블록 순서는 직접 입력(io/subtitle_input)과 같다: 시작 시각, 같으면 원본 순서
    rows = sorted(
        (
            event
            for event in document.events
            if event.kind == "Dialogue" and event_role(event) not in SKIPPED_ROLES
        ),
        key=lambda event: (event.start_ms, event.position),
    )
    events = [(event.start_ms, event.end_ms, to_block_text(event.text)) for event in rows]
    if not events:
        raise SubtitleConversionError("ASS 에 Dialogue 가 없다")
    return render_srt(events)


def vtt_to_srt(text: str) -> str:
    """WebVTT 큐를 SRT 로 바꾼다.

    Raises:
        SubtitleConversionError: 큐가 없다.
    """
    events: list[tuple[int, int, str]] = []
    blocks = re.split(r"\n\s*\n", text.lstrip("﻿").replace("\r\n", "\n").replace("\r", "\n"))
    for block in blocks:
        lines = block.strip("\n").split("\n")
        if not lines or lines[0].startswith(("WEBVTT", *_VTT_SKIP_BLOCKS)):
            continue
        cue = _find_cue_timing(lines)
        if cue is None:
            continue
        timing_at, match = cue
        body = _clean_vtt_text("\n".join(lines[timing_at + 1 :]))
        if body:
            events.append((_vtt_ms(match.group(1)), _vtt_ms(match.group(2)), body))
    if not events:
        raise SubtitleConversionError("WebVTT 에 큐가 없다")
    return render_srt(events)


def _find_cue_timing(lines: list[str]) -> tuple[int, re.Match[str]] | None:
    """큐 시각 줄 위치 (앞에 큐 ID 가 올 수 있다)."""
    for index, line in enumerate(lines):
        match = _VTT_CUE_TIMING_RE.match(line)
        if match is not None:
            return index, match
    return None


def _clean_vtt_text(text: str) -> str:
    text = _VTT_TAG_RE.sub("", _VTT_RUBY_TEXT_RE.sub("", text))
    for entity, char in _VTT_ENTITIES.items():
        text = text.replace(entity, char)
    return text.strip()


def _vtt_ms(value: str) -> int:
    match = _VTT_TIME_RE.fullmatch(value.strip())
    if match is None:
        raise SubtitleConversionError(f"WebVTT 시각 형식이 아니다: {value!r}")
    hours, minutes, seconds, millis = match.groups()
    return ((int(hours or 0) * 60 + int(minutes)) * 60 + int(seconds)) * 1000 + int(millis)


def render_srt(events: list[tuple[int, int, str]]) -> str:
    """(시작, 끝, 텍스트) 목록을 SRT 텍스트로."""
    blocks = [
        f"{number}\n{_srt_time(start)} --> {_srt_time(end)}\n{body}\n"
        for number, (start, end, body) in enumerate(events, start=1)
    ]
    return "\n".join(blocks)


def _srt_time(millis: int) -> str:
    hours, rest = divmod(millis, 3_600_000)
    minutes, rest = divmod(rest, 60_000)
    seconds, millis = divmod(rest, 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{millis:03d}"
