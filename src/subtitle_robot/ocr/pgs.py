"""블루레이 PGS(`.sup`, MKV `S_HDMV/PGS`) 해독 (WI-5.004c).

스트림은 세그먼트(`PG` + PTS + DTS + 종류 + 길이)의 나열이다. 화면 하나(display set)는
PCS(구성) → WDS(창) → PDS(팔레트) → ODS(객체) → END 순서로 오고, END 에서 화면이 바뀐다.
객체가 없는 PCS 는 화면을 지우는 표시다. 객체 그림은 팔레트 번호의 RLE 이고 팔레트는 YCrCb·알파다.
같은 그림을 다시 보내는 경우(acquisition point)는 이어진 한 자막으로 본다.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from subtitle_robot.ocr.bitmap import Bitmap, ImageEvent, ink_table, render, stack

_MAGIC = b"PG"
_HEADER = 13
_PDS, _ODS, _PCS, _WDS, _END = 0x14, 0x15, 0x16, 0x17, 0x80
_PTS_PER_MS = 90
_FIRST_FRAGMENT = 0x80
_CROPPED = 0x40
# 지우는 표시 없이 끝난 마지막 자막을 보여 줄 시간
_LAST_EVENT_MS = 3000
# PGS 밝기는 제한 범위(16~235)다
_Y_BLACK, _Y_RANGE = 16, 219


class PgsError(ValueError):
    """PGS 로 읽을 수 없다."""


@dataclass
class _Object:
    width: int = 0
    height: int = 0
    data: bytearray = field(default_factory=bytearray)


@dataclass
class _Shown:
    start_ms: int
    bitmap: Bitmap
    key: bytes


def read_pgs(data: bytes) -> list[ImageEvent]:
    """PGS 스트림을 자막 그림 목록으로 읽는다 (시간 순).

    Raises:
        PgsError: 세그먼트 머리가 맞지 않는다.
    """
    palettes: dict[int, list[tuple[int, int]]] = {}
    objects: dict[int, _Object] = {}
    composition: list[tuple[int, int, int]] = []  # (object_id, x, y)
    palette_id = 0
    pts = 0
    shown: _Shown | None = None
    events: list[ImageEvent] = []
    offset = 0
    while offset + _HEADER <= len(data):
        if data[offset : offset + 2] != _MAGIC:
            raise PgsError(f"PGS 세그먼트 머리가 아니다 (위치 {offset})")
        segment_pts = int.from_bytes(data[offset + 2 : offset + 6], "big")
        kind = data[offset + 10]
        size = int.from_bytes(data[offset + 11 : offset + 13], "big")
        body = data[offset + _HEADER : offset + _HEADER + size]
        offset += _HEADER + size
        if kind == _PCS:
            pts = segment_pts // _PTS_PER_MS
            palette_id, composition = _composition(body)
        elif kind == _PDS:
            _palette(body, palettes)
        elif kind == _ODS:
            _object(body, objects)
        elif kind == _END:
            shown = _end_display_set(
                pts, composition, objects, palettes.get(palette_id, []), shown, events
            )
    if shown is not None:
        events.append(ImageEvent(shown.start_ms, shown.start_ms + _LAST_EVENT_MS, shown.bitmap))
    return events


def _composition(body: bytes) -> tuple[int, list[tuple[int, int, int]]]:
    """PCS: (팔레트 번호, [(객체 번호, x, y)])."""
    palette_id, count = body[9], body[10]
    items = []
    position = 11
    for _ in range(count):
        object_id = int.from_bytes(body[position : position + 2], "big")
        flags = body[position + 3]
        x = int.from_bytes(body[position + 4 : position + 6], "big")
        y = int.from_bytes(body[position + 6 : position + 8], "big")
        items.append((object_id, x, y))
        position += 8 + (8 if flags & _CROPPED else 0)
    return palette_id, items


def _palette(body: bytes, palettes: dict[int, list[tuple[int, int]]]) -> None:
    """PDS: 팔레트 항목(번호, Y, Cr, Cb, 알파)을 (밝기, 알파)로 바꿔 둔다."""
    levels = palettes.setdefault(body[0], [(0, 0)] * 256)
    for position in range(2, len(body) - 4, 5):
        index, luma, alpha = body[position], body[position + 1], body[position + 4]
        scaled = max(0, min(255, (luma - _Y_BLACK) * 255 // _Y_RANGE))
        levels[index] = (scaled, alpha)


def _object(body: bytes, objects: dict[int, _Object]) -> None:
    """ODS: 객체 그림 조각을 모은다. 첫 조각에 길이·크기가 있다."""
    object_id = int.from_bytes(body[0:2], "big")
    if body[3] & _FIRST_FRAGMENT:
        width = int.from_bytes(body[7:9], "big")
        height = int.from_bytes(body[9:11], "big")
        objects[object_id] = _Object(width, height, bytearray(body[11:]))
    elif object_id in objects:
        objects[object_id].data += body[4:]


def _end_display_set(
    pts: int,
    composition: list[tuple[int, int, int]],
    objects: dict[int, _Object],
    levels: list[tuple[int, int]],
    shown: _Shown | None,
    events: list[ImageEvent],
) -> _Shown | None:
    """화면이 바뀐다: 보이던 자막을 닫고, 새 그림이 있으면 연다."""
    parts = [
        (y, objects[object_id])
        for object_id, _x, y in composition
        if object_id in objects and objects[object_id].width and objects[object_id].height
    ]
    key = b"".join(bytes(obj.data) for _y, obj in sorted(parts, key=lambda item: item[0]))
    if shown is not None and parts and key == shown.key:
        return shown  # 같은 그림을 다시 보냈다 (화면 그대로)
    if shown is not None and pts > shown.start_ms:
        events.append(ImageEvent(shown.start_ms, pts, shown.bitmap))
    if not parts:
        return None
    table = ink_table(levels)
    bitmaps = [
        render(obj.width, obj.height, decode_rle(bytes(obj.data), obj.width, obj.height), table)
        for _y, obj in sorted(parts, key=lambda item: item[0])
    ]
    return _Shown(pts, stack(bitmaps), key)


def decode_rle(data: bytes, width: int, height: int) -> bytes:
    """PGS RLE → 팔레트 번호 배열 (width × height).

    0 이 아닌 바이트는 그 색 한 픽셀이다. 0 다음 바이트 f: 0 이면 줄 끝, 아니면
    f 의 0x40(긴 길이: 14비트)·0x80(색 지정, 없으면 색 0) 표시에 따라 반복 픽셀이다.
    """
    out = bytearray()
    row = bytearray()
    position = 0
    while position < len(data) and len(out) < width * height:
        byte = data[position]
        position += 1
        if byte:
            row.append(byte)
            continue
        flag = data[position] if position < len(data) else 0
        position += 1
        if flag == 0:
            out += row[:width].ljust(width, b"\x00")
            row = bytearray()
            continue
        length = flag & 0x3F
        if flag & 0x40:
            length = (length << 8) | data[position]
            position += 1
        color = 0
        if flag & 0x80:
            color = data[position]
            position += 1
        row += bytes([color]) * length
    if row:
        out += row[:width].ljust(width, b"\x00")
    return bytes(out[: width * height]).ljust(width * height, b"\x00")
