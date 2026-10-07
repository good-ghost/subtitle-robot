"""PGS·VobSub 해독과 그림 변환 (WI-5.004c). 그림은 테스트 인코더로 만든다."""

import pytest

from subtitle_robot.ocr.bitmap import Bitmap, ink_table, render, stack
from subtitle_robot.ocr.pgs import PgsError, decode_rle, read_pgs
from subtitle_robot.ocr.vobsub import VobSubError, read_vobsub
from tests.ocr.encoders import encode_pgs, encode_vobsub, glyph, pgs_rle


def test_pgs_rle_round_trip() -> None:
    rows = [bytes([0, 1, 1, 2] + [0] * 70 + [1] * 200), bytes([3] * 274)]

    assert decode_rle(pgs_rle(rows), 274, 2) == b"".join(rows)


def test_pgs_events_and_timing() -> None:
    data = encode_pgs([(1000, 2500, [glyph(40)]), (3000, 4000, [glyph(60)])])

    events = read_pgs(data)

    assert [(e.start_ms, e.end_ms, e.bitmap.width) for e in events] == [
        (1000, 2500, 40),
        (3000, 4000, 60),
    ]


def test_pgs_white_text_becomes_black_ink() -> None:
    """밝은 글자는 검은색, 투명 바탕은 흰색이 된다 (Tesseract 는 흰 바탕 검은 글자를 잘 읽는다)."""
    bitmap = read_pgs(encode_pgs([(0, 1000, [glyph(10)])]))[0].bitmap

    assert bitmap.pixels[0] == 255  # 투명 바탕
    assert bitmap.pixels[bitmap.width + 1] == 0  # 흰 글자 (Y 235 → 255)


def test_pgs_repeated_picture_is_one_event() -> None:
    """같은 그림을 다시 보낸 화면(acquisition point)은 이어진 한 자막이다."""
    events = read_pgs(encode_pgs([(1000, 2000, [glyph(30)])], repeat_first=True))

    assert [(e.start_ms, e.end_ms) for e in events] == [(1000, 2000)]


def test_pgs_objects_are_stacked_top_to_bottom() -> None:
    events = read_pgs(encode_pgs([(0, 1000, [glyph(30, 6), glyph(50, 8)])]))

    bitmap = events[0].bitmap
    assert (bitmap.width, bitmap.height) == (50, 6 + 8 + 8)  # 두 줄 사이 틈 8


def test_pgs_last_event_without_clear_lasts_three_seconds() -> None:
    data = encode_pgs([(1000, 2000, [glyph(30)])])
    without_clear = data[: data.rindex(b"PG", 0, data.rindex(b"PG"))]

    assert [(e.start_ms, e.end_ms) for e in read_pgs(without_clear)] == [(1000, 4000)]


def test_pgs_bad_header() -> None:
    with pytest.raises(PgsError):
        read_pgs(b"XX" + bytes(20))


def test_vobsub_events_language_and_scale() -> None:
    idx, sub = encode_vobsub([(1000, 3000, glyph(40, 8)), (5000, 6000, glyph(70, 10))])

    tracks = read_vobsub(idx, sub)

    assert len(tracks) == 1
    assert tracks[0].language == "en"
    events = tracks[0].events
    assert [e.start_ms for e in events] == [1000, 5000]
    assert events[0].end_ms == pytest.approx(3000, abs=12)  # 지연 단위 1024/90000 초
    assert (events[0].bitmap.width, events[0].bitmap.height) == (80, 16)  # 두 배로 늘린다
    middle = events[0].bitmap.pixels[2 * events[0].bitmap.width + 4]
    assert middle == 0  # 흰 글자 → 검은색
    assert events[0].bitmap.pixels[0] == 255  # 투명 바탕 → 흰색


def test_vobsub_wide_rows_and_split_packets() -> None:
    """한 줄이 255 픽셀보다 넓고 SPU 가 여러 PES 패킷에 나뉘어도 읽는다."""
    rows = glyph(400, 12)
    idx, sub = encode_vobsub([(0, 1000, rows)], chunk=40)

    bitmap = read_vobsub(idx, sub)[0].events[0].bitmap

    assert (bitmap.width, bitmap.height) == (800, 24)
    expected = render(400, 12, b"".join(rows), ink_table([(0, 0), (255, 255), (0, 255)]))
    assert bitmap == expected.scaled(2)


def test_vobsub_without_timestamps() -> None:
    with pytest.raises(VobSubError):
        read_vobsub("palette: 000000, ffffff\n", b"")


def test_bitmap_pgm_has_white_margin() -> None:
    pgm = Bitmap(2, 1, b"\x00\x00").to_pgm()

    header = b"P5\n22 21\n255\n"  # 둘레 여백 10 픽셀
    assert pgm.startswith(header)
    assert len(pgm) == len(header) + 22 * 21
    assert pgm.count(b"\x00") == 2


def test_stack_pads_narrow_rows() -> None:
    stacked = stack([Bitmap(1, 1, b"\x00"), Bitmap(3, 1, b"\x00\x00\x00")])

    assert (stacked.width, stacked.height) == (3, 10)
    assert stacked.pixels[:3] == b"\x00\xff\xff"
