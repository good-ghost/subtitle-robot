"""ASS/SSA 자막 모델 (PROJECT-PLAN §24.1, §24.2, WI-6.001).

원본 줄을 그대로 보존하고 `[Events]` 의 이벤트를 필드 단위로 읽는다. 번역 입력은 이벤트마다 블록
하나이고, 네이티브 출력(WI-6.002)은 번역한 이벤트의 `Text` 만 바꿔 원본 줄을 다시 쓴다.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

AssEventKind = Literal["Dialogue", "Comment"]
# 번역 판단용 분류 (Q-06): 대사, 간판(화면 글자), 노래(OP·ED·가라오케), 그림, 빈 이벤트
# effect: 가라오케·타이포 효과 레이어 (음절마다 잘라 움직이는 조각). 번역하지 않고 원본 그대로 둔다
EventRole = Literal["dialogue", "sign", "song", "effect", "drawing", "empty"]
# 번역 블록이 되지 않는 역할 (출력 ASS 에는 원본 그대로 남는다)
SKIPPED_ROLES: frozenset[EventRole] = frozenset({"effect", "drawing", "empty"})

_EVENT_KINDS: tuple[AssEventKind, ...] = ("Dialogue", "Comment")
_SECTION_RE = re.compile(r"^\s*\[(?P<name>[^\]]+)\]\s*$")
_TIME_RE = re.compile(r"(\d+):(\d{1,2}):(\d{1,2})[.:](\d{1,3})")
_OVERRIDE_RE = re.compile(r"\{[^}]*\}")
_DRAWING_RE = re.compile(r"\\p[1-9]")
# 효과 레이어 태그: 조각(\clip·\iclip), 움직임(\move), 애니메이션(\t), 가라오케(\k·\kf·\ko·\K).
# 실측 (High School of the Dead OP): 가사 한 줄을 음절마다 \clip·\move 로 자른 이벤트가 2,760개였다.
# 회전·위치(\frz·\org·\pos)만 있는 간판은 한 줄짜리 화면 글자라 번역한다
_EFFECT_RE = re.compile(r"\\(?:i?clip\(|move\(|t\(|k[fo]?\d|K\d)")
# 스타일·배우·효과 이름의 영문 토큰으로 역할을 정한다 (`OP_Romaji` → op, romaji)
_SONG_TOKENS = frozenset(
    {"op", "ed", "song", "songs", "karaoke", "kara", "lyric", "lyrics", "insert", "opening",
     "ending", "romaji", "kanji"}
)  # fmt: skip
_SIGN_TOKENS = frozenset(
    {"sign", "signs", "title", "titles", "screen", "note", "notes", "caption", "typeset", "ts",
     "card", "eyecatch"}
)  # fmt: skip
_SONG_WORDS = ("歌詞", "カラオケ", "主題歌", "歌")
_TOKEN_RE = re.compile(r"[a-z]+")


class AssParseError(ValueError):
    """ASS 로 읽을 수 없다 ([Events] Format 이 없음 등)."""


@dataclass(frozen=True)
class AssEvent:
    """`[Events]` 의 이벤트 한 줄.

    Attributes:
        position: 이벤트 순서 (Dialogue·Comment 를 함께 센다, 0부터).
        line_no: 원본 줄 번호 (0부터).
        kind: Dialogue | Comment.
        fields: Format 순서의 값. 마지막 Text 는 쉼표를 포함할 수 있다.
        names: Format 필드 이름 (소문자).
    """

    position: int
    line_no: int
    kind: AssEventKind
    fields: tuple[str, ...]
    names: tuple[str, ...]

    def field(self, name: str) -> str:
        """Text 외 필드 값 (앞뒤 공백 제거, 없으면 빈 문자열)."""
        if name not in self.names:
            return ""
        return self.fields[self.names.index(name)].strip()

    @property
    def text(self) -> str:
        """Text 필드 원문 (앞뒤 공백 포함 그대로)."""
        return self.fields[self.names.index("text")]

    @property
    def start_ms(self) -> int:
        """시작 시각."""
        return parse_ass_time(self.field("start"))

    @property
    def end_ms(self) -> int:
        """끝 시각."""
        return parse_ass_time(self.field("end"))

    @property
    def style(self) -> str:
        """스타일 이름."""
        return self.field("style")

    def with_text(self, text: str) -> str:
        """Text 만 바꾼 이벤트 줄."""
        values = list(self.fields)
        values[self.names.index("text")] = text
        return f"{self.kind}: " + ",".join(values)


@dataclass(frozen=True)
class AssDocument:
    """ASS 파일 전체.

    Attributes:
        lines: 원본 줄 (BOM·줄바꿈 제외).
        newline: 원본 줄바꿈 (`\\r\\n` 또는 `\\n`).
        events: 이벤트 (원본 순서).
    """

    lines: tuple[str, ...]
    newline: str
    events: tuple[AssEvent, ...]

    def styles(self) -> dict[str, str]:
        """스타일 이름 → 폰트 이름 ([V4+ Styles]·[V4 Styles])."""
        fonts: dict[str, str] = {}
        section = ""
        names: list[str] = []
        for line in self.lines:
            header = _SECTION_RE.match(line)
            if header:
                section = header.group("name").strip().lower()
                continue
            if "styles" not in section:
                continue
            if line.startswith("Format:"):
                names = [name.strip().lower() for name in line[len("Format:") :].split(",")]
            elif line.startswith("Style:") and names:
                values = [value.strip() for value in line[len("Style:") :].split(",")]
                row = dict(zip(names, values, strict=False))
                fonts[row.get("name", "")] = row.get("fontname", "")
        return fonts


def parse_ass_time(value: str) -> int:
    """`H:MM:SS.cc` → ms.

    Raises:
        AssParseError: 시각 형식이 아니다.
    """
    match = _TIME_RE.fullmatch(value.strip())
    if match is None:
        raise AssParseError(f"ASS 시각 형식이 아니다: {value!r}")
    hours, minutes, seconds, fraction = match.groups()
    # ASS 는 1/100 초가 표준이지만 자릿수가 다른 파일도 있다
    millis = int(fraction.ljust(3, "0")[:3])
    return ((int(hours) * 60 + int(minutes)) * 60 + int(seconds)) * 1000 + millis


def format_ass_time(millis: int) -> str:
    """ms → `H:MM:SS.cc`."""
    hours, rest = divmod(max(millis, 0), 3_600_000)
    minutes, rest = divmod(rest, 60_000)
    seconds, millis = divmod(rest, 1000)
    return f"{hours}:{minutes:02d}:{seconds:02d}.{millis // 10:02d}"


def parse_ass(text: str) -> AssDocument:
    """ASS/SSA 텍스트를 읽는다.

    Raises:
        AssParseError: `[Events]` 의 Format 줄이 없거나 Text 필드가 없다.
    """
    newline = "\r\n" if "\r\n" in text else "\n"
    lines = tuple(text.lstrip("\ufeff").splitlines())
    events: list[AssEvent] = []
    section = ""
    names: tuple[str, ...] = ()
    for line_no, line in enumerate(lines):
        header = _SECTION_RE.match(line)
        if header:
            section = header.group("name").strip().lower()
            continue
        if section != "events":
            continue
        stripped = line.strip()
        if stripped.startswith("Format:"):
            names = tuple(name.strip().lower() for name in stripped[len("Format:") :].split(","))
            if "text" not in names:
                raise AssParseError("[Events] Format 에 Text 가 없다")
            continue
        for kind in _EVENT_KINDS:
            prefix = f"{kind}:"
            if not line.startswith(prefix):
                continue
            if not names:
                raise AssParseError("[Events] Format 줄보다 이벤트가 먼저 나온다")
            values = line[len(prefix) :].lstrip().split(",", len(names) - 1)
            if len(values) < len(names):
                values += [""] * (len(names) - len(values))
            events.append(AssEvent(len(events), line_no, kind, tuple(values), names))
    if not names:
        raise AssParseError("[Events] Format 줄이 없다 (ASS 가 아니다)")
    return AssDocument(lines, newline, tuple(events))


def event_role(event: AssEvent) -> EventRole:
    """번역 판단용 역할 (Q-06). 원본 언어 판단은 블록 단계(Q-02)가 한다."""
    if _DRAWING_RE.search(event.text):
        return "drawing"
    if not to_plain_lines(event.text).strip():
        return "empty"
    if _EFFECT_RE.search(event.text):
        return "effect"
    labels = " ".join((event.style, event.field("name"), event.field("effect")))
    tokens = set(_TOKEN_RE.findall(labels.lower()))
    if tokens & _SONG_TOKENS or any(word in labels for word in _SONG_WORDS):
        return "song"
    if tokens & _SIGN_TOKENS:
        return "sign"
    return "dialogue"


def to_plain_lines(text: str) -> str:
    """override 태그를 뺀 글자 (빈 이벤트 판단용)."""
    return _OVERRIDE_RE.sub("", text).replace("\\N", "\n").replace("\\n", "\n").replace("\\h", " ")


def to_block_text(text: str) -> str:
    """ASS Text → 블록 텍스트 (`\\N` 줄바꿈, `\\h` 공백, override 태그는 그대로)."""
    return text.replace("\\N", "\n").replace("\\n", "\n").replace("\\h", " ").strip()


def to_ass_text(text: str) -> str:
    """블록 텍스트 → ASS Text (줄바꿈은 `\\N`)."""
    return "\\N".join(line.strip() for line in text.strip().splitlines())


TRANSLATED_NOTE = "; translated by Subtitle Robot"
# 한글 글리프가 없을 수 있는 일본어 전용 폰트로 보이는 이름 (경고만, WI-6.002)
_JAPANESE_FONT_RE = re.compile(
    r"[぀-ヿ]|mincho|gothic|meiryo|ms ui|^hg|hiragino|yu ?gothic|yu ?mincho|kyokasho"
    r"|ＤＦ|^df|^fot-|^a-otf|ipa[epx]?[gm]|takao|源ノ角|ヒラギノ|游",
    re.IGNORECASE,
)


def japanese_only_fonts(document: AssDocument) -> list[str]:
    """한글 글리프가 없을 수 있는 폰트 이름 (스타일에서 쓰는 것만, 중복 제거)."""
    used = {event.style for event in document.events}
    fonts = document.styles()
    return sorted(
        {font for style, font in fonts.items() if style in used and _JAPANESE_FONT_RE.search(font)}
    )


def render_ass(document: AssDocument, texts: dict[int, str], *, font: str | None = None) -> str:
    """원본을 그대로 두고 지정한 이벤트(position → ASS Text)의 Text 만 바꾼 ASS 텍스트.

    font 를 주면 모든 스타일의 폰트를 그 이름으로 바꾼다. [Script Info] 에 번역 표시 주석을 남긴다.
    """
    replaced = {
        document.events[position].line_no: document.events[position].with_text(text)
        for position, text in texts.items()
    }
    lines: list[str] = []
    section = ""
    style_names: list[str] = []
    for line_no, line in enumerate(document.lines):
        header = _SECTION_RE.match(line)
        if header:
            section = header.group("name").strip().lower()
            lines.append(line)
            if section == "script info" and TRANSLATED_NOTE not in document.lines:
                lines.append(TRANSLATED_NOTE)
            continue
        if line_no in replaced:
            lines.append(replaced[line_no])
            continue
        if font and "styles" in section:
            if line.startswith("Format:"):
                style_names = [name.strip().lower() for name in line[len("Format:") :].split(",")]
            elif line.startswith("Style:") and "fontname" in style_names:
                values = line[len("Style:") :].split(",")
                position = style_names.index("fontname")
                if position < len(values):
                    values[position] = font
                    line = "Style:" + ",".join(values)
        lines.append(line)
    return document.newline.join(lines) + document.newline
