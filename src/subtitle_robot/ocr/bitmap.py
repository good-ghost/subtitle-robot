"""OCR 에 넘길 자막 그림 한 장 (WI-5.004c).

자막 그림은 팔레트 번호 배열이다. 팔레트마다 밝기·불투명도로 회색값을 정해
`bytes.translate`로 한 번에 바꾼다 (픽셀마다 파이썬 반복을 돌지 않는다).
Tesseract 는 흰 바탕의 검은 글자를 잘 읽으므로, 검은 바탕에 얹은 밝기를 뒤집는다:
밝은 글자 → 검은 글자, 어두운 테두리·투명한 바탕 → 흰색.
Tesseract(leptonica)가 바로 읽는 PGM(P5)으로 저장한다.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

_WHITE = 255
# 위·아래 여백: 글자가 그림 끝에 닿으면 Tesseract 가 줄을 놓친다
_MARGIN = 10
# 한 화면의 여러 객체(줄)를 붙일 때 사이 틈 (픽셀)
_LINE_GAP = 8


@dataclass(frozen=True)
class Bitmap:
    """회색조 그림 (0 검정 ~ 255 흰색, 행 우선).

    Attributes:
        width: 가로 픽셀.
        height: 세로 픽셀.
        pixels: width × height 바이트.
    """

    width: int
    height: int
    pixels: bytes

    def to_pgm(self) -> bytes:
        """PGM(P5) 파일 내용. 둘레에 흰 여백을 둔다."""
        width = self.width + 2 * _MARGIN
        blank = bytes([_WHITE]) * width
        side = bytes([_WHITE]) * _MARGIN
        rows = [
            side + self.pixels[row * self.width : (row + 1) * self.width] + side
            for row in range(self.height)
        ]
        body = blank * _MARGIN + b"".join(rows) + blank * _MARGIN
        return b"P5\n%d %d\n255\n" % (width, self.height + 2 * _MARGIN) + body

    def scaled(self, factor: int) -> Bitmap:
        """가로·세로를 factor 배로 늘린다 (가까운 픽셀).

        작은 DVD 글자를 Tesseract 가 잘 읽게 한다.
        """
        if factor <= 1:
            return self
        rows: list[bytes] = []
        for row in range(self.height):
            line = self.pixels[row * self.width : (row + 1) * self.width]
            wide = bytearray(self.width * factor)
            for shift in range(factor):
                wide[shift::factor] = line
            rows += [bytes(wide)] * factor
        return Bitmap(self.width * factor, self.height * factor, b"".join(rows))


def ink_table(levels: Sequence[tuple[int, int]]) -> bytes:
    """팔레트 번호 → 회색값 표 (256개). levels[i] = (밝기 0~255, 불투명도 0~255).

    검은 바탕에 얹은 밝기(밝기 × 불투명도)를 뒤집는다. 표에 없는 번호는 흰색(투명)이다.
    """
    table = bytearray([_WHITE]) * 256
    for index, (luma, alpha) in enumerate(levels[:256]):
        table[index] = _WHITE - (luma * alpha) // 255
    return bytes(table)


def render(width: int, height: int, indices: bytes, table: bytes) -> Bitmap:
    """팔레트 번호 배열을 회색 그림으로. 크기가 모자라면 흰색으로 채운다."""
    size = width * height
    data = indices[:size].translate(table)
    if len(data) < size:
        data += bytes([_WHITE]) * (size - len(data))
    return Bitmap(width, height, data)


def stack(bitmaps: Sequence[Bitmap]) -> Bitmap:
    """여러 그림(한 화면의 여러 줄 객체)을 위에서 아래로 붙인다. 폭은 가장 넓은 것에 맞춘다."""
    if len(bitmaps) == 1:
        return bitmaps[0]
    width = max(bitmap.width for bitmap in bitmaps)
    gap = bytes([_WHITE]) * width
    rows: list[bytes] = []
    for index, bitmap in enumerate(bitmaps):
        if index:
            rows += [gap] * _LINE_GAP
        pad = bytes([_WHITE]) * (width - bitmap.width)
        rows += [
            bitmap.pixels[row * bitmap.width : (row + 1) * bitmap.width] + pad
            for row in range(bitmap.height)
        ]
    return Bitmap(width, len(rows), b"".join(rows))


@dataclass(frozen=True)
class ImageEvent:
    """화면에 보이는 자막 그림 하나.

    Attributes:
        start_ms: 시작 시각.
        end_ms: 끝 시각.
        bitmap: 그 동안 보이는 그림 (여러 객체는 위에서 아래로 붙인 것).
    """

    start_ms: int
    end_ms: int
    bitmap: Bitmap
