"""테스트용 PGS·VobSub 인코더와 가짜 Tesseract (WI-5.004c).

그림은 팔레트 번호 행 목록이다. 실제 글자 모양은 없고, 가짜 Tesseract 가 그림 폭으로 글자를 정한다.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from pathlib import Path

from subtitle_robot.media.commands import CommandResult

Rows = Sequence[bytes]


def glyph(width: int, height: int = 6, color: int = 1) -> list[bytes]:
    """가운데에 color 띠가 있는 그림 (나머지는 0 = 투명 바탕)."""
    band = bytes([0]) + bytes([color]) * (width - 2) + bytes([0])
    blank = bytes(width)
    return [blank, *([band] * (height - 2)), blank]


# ---------------------------------------------------------------- PGS


def _segment(kind: int, pts_ms: int, body: bytes) -> bytes:
    return (
        b"PG"
        + (pts_ms * 90).to_bytes(4, "big")
        + bytes(4)
        + bytes([kind])
        + len(body).to_bytes(2, "big")
        + body
    )


def pgs_rle(rows: Rows) -> bytes:
    out = bytearray()
    for row in rows:
        position = 0
        while position < len(row):
            color = row[position]
            length = 1
            while position + length < len(row) and row[position + length] == color:
                length += 1
            position += length
            while length:
                run = min(length, 0x3FFF)
                length -= run
                flag = (0x80 if color else 0) | (0x40 if run > 0x3F else 0)
                if run > 0x3F:
                    out += bytes([0, flag | (run >> 8), run & 0xFF])
                else:
                    out += bytes([0, flag | run])
                if color:
                    out.append(color)
        out += b"\x00\x00"
    return bytes(out)


def encode_pgs(
    events: Sequence[tuple[int, int, Sequence[Rows]]],
    *,
    repeat_first: bool = False,
    palette: Mapping[int, tuple[int, int]] | None = None,
) -> bytes:
    """(시작 ms, 끝 ms, [객체 그림 …]) 목록 → PGS 스트림.

    palette: 번호 → (Y, 알파). 기본은 1 흰 글자, 2 검은 테두리.
    repeat_first: 첫 화면을 같은 그림으로 한 번 더 보낸다 (acquisition point).
    """
    levels = palette or {1: (235, 255), 2: (16, 255)}
    pds = bytes([0, 0]) + b"".join(
        bytes([index, luma, 128, 128, alpha]) for index, (luma, alpha) in levels.items()
    )
    stream = bytearray()
    for start, end, objects in events:
        shows = [start, start + 1] if repeat_first and start == events[0][0] else [start]
        for pts in shows:
            pcs = bytes([0x10, 0, 1, 0x80, 0, 0, len(objects)])
            for object_id in range(len(objects)):
                pcs += object_id.to_bytes(2, "big") + bytes([0, 0])
                pcs += (100).to_bytes(2, "big") + (800 + object_id * 50).to_bytes(2, "big")
            stream += _segment(0x16, pts, bytes([0x07, 0x80, 0x04, 0x38]) + pcs)
            stream += _segment(0x14, pts, pds)
            for object_id, rows in enumerate(objects):
                data = pgs_rle(rows)
                body = object_id.to_bytes(2, "big") + bytes([0, 0xC0])
                body += (len(data) + 4).to_bytes(3, "big")
                body += len(rows[0]).to_bytes(2, "big") + len(rows).to_bytes(2, "big") + data
                stream += _segment(0x15, pts, body)
            stream += _segment(0x80, pts, b"")
        clear = bytes([0x07, 0x80, 0x04, 0x38, 0x10, 0, 2, 0, 0, 0, 0])
        stream += _segment(0x16, end, clear)
        stream += _segment(0x80, end, b"")
    return bytes(stream)


# ---------------------------------------------------------------- VobSub


class _NibbleWriter:
    def __init__(self) -> None:
        self.nibbles: list[int] = []

    def add(self, value: int, count: int) -> None:
        self.nibbles += [(value >> (4 * shift)) & 0xF for shift in reversed(range(count))]

    def align(self) -> None:
        if len(self.nibbles) % 2:
            self.nibbles.append(0)

    def bytes(self) -> bytes:
        self.align()
        return bytes(
            (self.nibbles[n] << 4) | self.nibbles[n + 1] for n in range(0, len(self.nibbles), 2)
        )


def _vobsub_field(rows: Rows) -> bytes:
    writer = _NibbleWriter()
    for row in rows:
        position = 0
        while position < len(row):
            color = row[position]
            length = 1
            while position + length < len(row) and row[position + length] == color:
                length += 1
            if position + length == len(row) and length > 0xFF:
                writer.add(color, 4)  # 줄 끝까지
                position += length
                continue
            position += length
            while length:
                run = min(length, 0xFF)
                length -= run
                code = (run << 2) | color
                writer.add(code, 1 if run < 4 else 2 if run < 16 else 3 if run < 64 else 4)
        writer.align()
    return writer.bytes()


def encode_spu(rows: Rows, stop_ms: int) -> bytes:
    """SPU 하나: 흰 글자(1)·검은 테두리(2)·투명 바탕(0)."""
    height, width = len(rows), len(rows[0])
    top = _vobsub_field(rows[0::2])
    bottom = _vobsub_field(rows[1::2])
    pixels_at = 4
    control = pixels_at + len(top) + len(bottom)
    x1, y1 = 100, 400
    x2, y2 = x1 + width - 1, y1 + height - 1
    area = bytes([x1 >> 4, ((x1 & 0xF) << 4) | (x2 >> 8), x2 & 0xFF,
                  y1 >> 4, ((y1 & 0xF) << 4) | (y2 >> 8), y2 & 0xFF])  # fmt: skip
    first_cmds = (
        bytes([0x01, 0x03, 0x00, 0x15, 0x04, 0x0F, 0xF0, 0x05]) + area + bytes([0x06])
        + pixels_at.to_bytes(2, "big") + (pixels_at + len(top)).to_bytes(2, "big") + b"\xff"
    )  # fmt: skip
    second = control + 4 + len(first_cmds)
    stop_delay = stop_ms * 90 // 1024
    seq1 = (0).to_bytes(2, "big") + second.to_bytes(2, "big") + first_cmds
    seq2 = stop_delay.to_bytes(2, "big") + second.to_bytes(2, "big") + b"\x02\xff"
    body = top + bottom + seq1 + seq2
    size = 4 + len(body)
    return size.to_bytes(2, "big") + control.to_bytes(2, "big") + body


# MPEG-2 pack 머리 (SCR 0, mux rate, stuffing 0)
_PACK_HEADER = bytes.fromhex("000001ba4400040004010189c3f8")


def _pts(value: int) -> bytes:
    """PES 머리의 PTS 5바이트 (표시 비트 포함)."""
    return bytes([
        0x21 | ((value >> 29) & 0x0E), (value >> 22) & 0xFF, 0x01 | ((value >> 14) & 0xFE),
        (value >> 7) & 0xFF, 0x01 | ((value << 1) & 0xFE),
    ])  # fmt: skip


def encode_vobsub(
    events: Sequence[tuple[int, int, Rows]], *, language: str = "en", chunk: int = 300
) -> tuple[str, bytes]:
    """(시작 ms, 끝 ms, 그림) 목록 → (`.idx` 내용, `.sub` 바이트).

    SPU 는 chunk 바이트씩 나눠 담는다.
    """
    palette = ["000000", "ffffff", "000000"] + ["808080"] * 13
    idx = [
        "# VobSub index file, v7 (do not modify this line!)\n",
        f"size: 720x480\npalette: {', '.join(palette)}\n",
        f"id: {language}, index: 0\n",
    ]
    sub = bytearray()
    for start, end, rows in events:
        position = len(sub)
        spu = encode_spu(rows, end - start)
        for offset in range(0, len(spu), chunk):
            part = bytes([0x20]) + spu[offset : offset + chunk]
            pes = bytes([0x81, 0x80, 5]) + _pts(start * 90) + part
            sub += _PACK_HEADER
            sub += b"\x00\x00\x01\xbd" + len(pes).to_bytes(2, "big") + pes
        hours, rest = divmod(start, 3_600_000)
        minutes, rest = divmod(rest, 60_000)
        seconds, millis = divmod(rest, 1000)
        idx.append(
            f"timestamp: {hours:02d}:{minutes:02d}:{seconds:02d}:{millis:03d}, "
            f"filepos: {position:09x}\n"
        )
    return "".join(idx), bytes(sub)


# ---------------------------------------------------------------- 가짜 Tesseract


class FakeTesseract:
    """`tesseract` 명령 흉내. 그림(PGM) 폭으로 글자를 정한다.

    Attributes:
        texts: 그림 폭(여백 제외) → 글자. 언어별로 다르게 하려면 by_language.
        calls: 받은 명령.
    """

    def __init__(
        self,
        texts: Mapping[int, str],
        *,
        languages: Sequence[str] = ("eng", "jpn", "kor", "fra"),
        by_language: Mapping[str, Mapping[int, str]] | None = None,
    ) -> None:
        self.texts = dict(texts)
        self.by_language = by_language or {}
        self.languages = list(languages)
        self.calls: list[list[str]] = []

    def __call__(self, args: Sequence[str]) -> CommandResult:
        self.calls.append(list(args))
        if "--list-langs" in args:
            listing = 'List of available languages in "/usr/share/tessdata/" (3):\n'
            return CommandResult(0, listing + "\n".join(self.languages) + "\n", "")
        listing_path = Path(args[1])
        language = args[args.index("-l") + 1]
        texts = self.by_language.get(language, self.texts)
        pages = []
        for line in listing_path.read_text(encoding="utf-8").splitlines():
            header = Path(line).read_bytes().split(b"\n", 2)
            width = int(header[1].split()[0]) - 20  # 둘레 여백 10 픽셀씩
            pages.append(texts.get(width, "") + "\n")
        return CommandResult(0, "\f".join(pages) + "\f", "")

    @property
    def ocr_calls(self) -> list[list[str]]:
        return [call for call in self.calls if "--list-langs" not in call]
