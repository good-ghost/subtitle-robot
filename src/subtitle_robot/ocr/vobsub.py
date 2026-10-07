"""DVD VobSub(`.idx` + `.sub`, MKV `S_VOBSUB`) 해독 (WI-5.004c).

- `.idx`: 16색 팔레트(RGB), 언어(`id: en, index: 0`), 자막마다 시각과 `.sub` 안의 위치.
- `.sub`: MPEG-2 프로그램 스트림. 자막 하나(SPU)는 private stream 1(0xBD) PES 패킷 여러 개에
  나뉘어 있고, 첫 바이트가 하위 스트림 번호(0x20 + n)다.
- SPU: 크기·제어열 위치 → 그림(두 필드, 4색 니블 RLE) → 제어열(표시 시작·끝 지연,
  4색의 팔레트 번호와 불투명도, 좌표, 필드 위치).
DVD 그림은 작아서(720×480 화면) 두 배로 늘려 Tesseract 에 넘긴다.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from subtitle_robot.lang.codes import normalize_language
from subtitle_robot.ocr.bitmap import Bitmap, ImageEvent, ink_table, render

_PACK_START = b"\x00\x00\x01\xba"
_PRIVATE_STREAM_1 = 0xBD
_PADDING_STREAM = 0xBE
_SUBSTREAM_BASE = 0x20
# 제어열 지연 단위: 1024/90000 초
_DELAY_NUMERATOR, _DELAY_DENOMINATOR = 1024, 90
_CMD_FORCED_START, _CMD_START, _CMD_STOP = 0x00, 0x01, 0x02
_CMD_PALETTE, _CMD_ALPHA, _CMD_AREA, _CMD_OFFSETS, _CMD_END = 0x03, 0x04, 0x05, 0x06, 0xFF
_LAST_EVENT_MS = 3000
_SCALE = 2
_TIMESTAMP_RE = re.compile(
    r"^timestamp:\s*(\d+):(\d+):(\d+):(\d+),\s*filepos:\s*([0-9a-fA-F]+)", re.MULTILINE
)
_ID_RE = re.compile(r"^id:\s*([A-Za-z-]*)\s*,\s*index:\s*(\d+)", re.MULTILINE)
_PALETTE_RE = re.compile(r"^palette:\s*(.+)$", re.MULTILINE)


class VobSubError(ValueError):
    """VobSub 로 읽을 수 없다."""


@dataclass
class VobSubTrack:
    """`.idx`의 언어 하나 (보통 파일 하나에 하나).

    Attributes:
        language: ISO 639-1. 모르면 None.
        index: 하위 스트림 번호.
        events: 자막 그림 (시간 순).
    """

    language: str | None
    index: int
    events: list[ImageEvent] = field(default_factory=list)


def read_vobsub(idx_text: str, sub: bytes) -> list[VobSubTrack]:
    """`.idx` 내용과 `.sub` 바이트를 언어별 자막 그림으로 읽는다.

    Raises:
        VobSubError: 팔레트나 자막 위치가 없다.
    """
    palette = _palette(idx_text)
    ids = list(_ID_RE.finditer(idx_text))
    if not ids:
        ids_spans: list[tuple[str | None, int, int, int]] = [(None, 0, 0, len(idx_text))]
    else:
        ids_spans = [
            (
                match.group(1),
                int(match.group(2)),
                match.end(),
                ids[number + 1].start() if number + 1 < len(ids) else len(idx_text),
            )
            for number, match in enumerate(ids)
        ]
    tracks: list[VobSubTrack] = []
    for code, index, begin, end in ids_spans:
        track = VobSubTrack(normalize_language(code), index)
        entries = [
            (_timestamp_ms(match), int(match.group(5), 16))
            for match in _TIMESTAMP_RE.finditer(idx_text, begin, end)
        ]
        for number, (start_ms, position) in enumerate(entries):
            next_start = entries[number + 1][0] if number + 1 < len(entries) else None
            event = _event(sub, position, start_ms, next_start, palette)
            if event is not None:
                track.events.append(event)
        if entries:
            tracks.append(track)
    if not tracks:
        raise VobSubError(".idx 에 자막 위치(timestamp)가 없다")
    return tracks


def _palette(idx_text: str) -> list[int]:
    """`.idx` 팔레트 16색의 밝기 (0~255)."""
    match = _PALETTE_RE.search(idx_text)
    if match is None:
        raise VobSubError(".idx 에 palette 가 없다")
    lumas = []
    for item in match.group(1).split(","):
        rgb = int(item.strip(), 16)
        red, green, blue = (rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF
        lumas.append((299 * red + 587 * green + 114 * blue) // 1000)
    return (lumas + [0] * 16)[:16]


def _timestamp_ms(match: re.Match[str]) -> int:
    hours, minutes, seconds, millis = (int(match.group(n)) for n in range(1, 5))
    return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis


def _event(
    sub: bytes, position: int, start_ms: int, next_start: int | None, palette: list[int]
) -> ImageEvent | None:
    """`.sub`의 위치에서 SPU 하나를 읽어 자막 그림으로. 그림이 없으면 None."""
    spu = _spu_packet(sub, position)
    if len(spu) < 4:
        return None
    decoded = _decode_spu(spu, palette)
    if decoded is None:
        return None
    bitmap, show_ms, hide_ms = decoded
    start = start_ms + show_ms
    if hide_ms is not None and hide_ms > show_ms:
        end = start_ms + hide_ms
    else:
        end = (
            next_start if next_start is not None and next_start > start else start + _LAST_EVENT_MS
        )
    if next_start is not None and next_start > start:
        end = min(end, next_start)
    return ImageEvent(start, end, bitmap)


def _spu_packet(sub: bytes, position: int) -> bytes:
    """위치에서 시작하는 PES 패킷들의 private stream 1 내용을 SPU 크기만큼 모은다."""
    data = bytearray()
    size: int | None = None
    offset = position
    while offset + 4 <= len(sub) and (size is None or len(data) < size):
        if sub[offset : offset + 4] == _PACK_START:
            offset += 14 + (sub[offset + 13] & 0x07) if offset + 14 <= len(sub) else len(sub)
            continue
        if sub[offset : offset + 3] != b"\x00\x00\x01":
            break
        stream = sub[offset + 3]
        length = int.from_bytes(sub[offset + 4 : offset + 6], "big")
        body = sub[offset + 6 : offset + 6 + length]
        offset += 6 + length
        if stream == _PADDING_STREAM:
            continue
        if stream != _PRIVATE_STREAM_1 or len(body) < 3:
            break
        payload = body[3 + body[2] :]
        if not payload or payload[0] & 0xE0 != _SUBSTREAM_BASE:
            continue
        data += payload[1:]
        if size is None and len(data) >= 2:
            size = int.from_bytes(data[0:2], "big")
    return bytes(data[:size] if size else data)


def _decode_spu(spu: bytes, palette: list[int]) -> tuple[Bitmap, int, int | None] | None:
    """SPU → (그림, 표시 시작 지연 ms, 끝 지연 ms 또는 None). 좌표나 그림 위치가 없으면 None."""
    control = int.from_bytes(spu[2:4], "big")
    colors = [0, 0, 0, 0]
    alphas = [0, 0, 0, 0]
    area: tuple[int, int, int, int] | None = None
    offsets: tuple[int, int] | None = None
    show_ms, hide_ms = 0, None
    seen: set[int] = set()
    while control + 4 <= len(spu) and control not in seen:
        seen.add(control)
        delay_ms = int.from_bytes(spu[control : control + 2], "big") * _DELAY_NUMERATOR
        delay_ms //= _DELAY_DENOMINATOR
        following = int.from_bytes(spu[control + 2 : control + 4], "big")
        position = control + 4
        while position < len(spu):
            command = spu[position]
            position += 1
            if command in (_CMD_FORCED_START, _CMD_START):
                show_ms = delay_ms
            elif command == _CMD_STOP:
                hide_ms = delay_ms
            elif command in (_CMD_PALETTE, _CMD_ALPHA):
                nibbles = _nibbles(spu[position : position + 2])
                target = colors if command == _CMD_PALETTE else alphas
                target[:] = nibbles
                position += 2
            elif command == _CMD_AREA:
                raw = spu[position : position + 6]
                position += 6
                if len(raw) == 6:
                    x1 = (raw[0] << 4) | (raw[1] >> 4)
                    x2 = ((raw[1] & 0x0F) << 8) | raw[2]
                    y1 = (raw[3] << 4) | (raw[4] >> 4)
                    y2 = ((raw[4] & 0x0F) << 8) | raw[5]
                    area = (x1, x2, y1, y2)
            elif command == _CMD_OFFSETS:
                raw = spu[position : position + 4]
                position += 4
                if len(raw) == 4:
                    offsets = (int.from_bytes(raw[0:2], "big"), int.from_bytes(raw[2:4], "big"))
            else:  # 0xFF 또는 모르는 명령: 이 제어열 끝
                break
        if following == control:
            break
        control = following
    if area is None or offsets is None:
        return None
    x1, x2, y1, y2 = area
    width, height = x2 - x1 + 1, y2 - y1 + 1
    if width <= 0 or height <= 0:
        return None
    indices = decode_fields(spu, offsets, width, height)
    # 4색 번호(0 배경 ~ 3)의 밝기·불투명도. 니블 순서는 3, 2, 1, 0
    levels = [(palette[colors[3 - n]], alphas[3 - n] * 17) for n in range(4)]
    bitmap = render(width, height, indices, ink_table(levels))
    return bitmap.scaled(_SCALE), show_ms, hide_ms


def _nibbles(raw: bytes) -> list[int]:
    if len(raw) < 2:
        return [0, 0, 0, 0]
    return [raw[0] >> 4, raw[0] & 0x0F, raw[1] >> 4, raw[1] & 0x0F]


def decode_fields(spu: bytes, offsets: tuple[int, int], width: int, height: int) -> bytes:
    """두 필드(짝수 줄·홀수 줄)의 니블 RLE → 색 번호(0~3) 배열 (width × height)."""
    rows: list[bytes] = [b""] * height
    for field_number, start in enumerate(offsets):
        reader = _NibbleReader(spu, start)
        for row in range(field_number, height, 2):
            rows[row] = reader.line(width)
    return b"".join(rows)


class _NibbleReader:
    """4비트 단위로 읽는다. 줄이 끝나면 바이트 경계로 맞춘다."""

    def __init__(self, data: bytes, start: int) -> None:
        self._data = data
        self._nibble = start * 2

    def _next(self) -> int:
        index = self._nibble // 2
        self._nibble += 1
        if index >= len(self._data):
            return 0
        byte = self._data[index]
        return byte >> 4 if self._nibble % 2 else byte & 0x0F

    def line(self, width: int) -> bytes:
        out = bytearray()
        while len(out) < width:
            code = self._next()
            # 앞의 0 니블 개수로 길이가 정해진다: 1·2·3·4 니블 (값 ≥ 0x4, 0x10, 0x40)
            for threshold in (0x4, 0x10, 0x40):
                if code >= threshold:
                    break
                code = (code << 4) | self._next()
            length, color = code >> 2, code & 0x03
            if length == 0:  # 줄 끝까지
                length = width - len(out)
            out += bytes([color]) * length
        if self._nibble % 2:
            self._nibble += 1
        return bytes(out[:width])
