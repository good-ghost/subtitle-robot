import pytest

from subtitle_robot.io.normalize import NormalizedDocument, normalize_srt
from subtitle_robot.lang.en import english_continues
from subtitle_robot.lang.ja import japanese_continues
from subtitle_robot.pipeline.unitizer import UnitLimits, unitize


def _doc(*blocks: tuple[float, float, str]) -> NormalizedDocument:
    def stamp(seconds: float) -> str:
        ms = round(seconds * 1000)
        return f"00:{ms // 60000:02}:{ms // 1000 % 60:02},{ms % 1000:03}"

    text = "".join(
        f"{n}\n{stamp(start)} --> {stamp(end)}\n{body}\n\n"
        for n, (start, end, body) in enumerate(blocks, start=1)
    )
    return normalize_srt(text.encode("utf-8"), source_path="t.srt")


def _groups(doc: NormalizedDocument, lang: str = "en", **limits: float) -> list[list[int]]:
    plan = unitize(doc, lang, UnitLimits(**limits))
    return [list(unit.idxs) for unit in plan.units]


# ---------------------------------------------------------------- 언어 규칙


@pytest.mark.parametrize(
    ("prev", "nxt", "expected"),
    [
        ("I don't know where it came from,", "but it was bright.", True),
        ("I would never have guessed", "that you could write.", True),  # 종결 부호 없음
        ("It was...", "Nothing.", True),
        ("Okay.", "and then we left", True),  # 다음 블록 소문자
        ("Okay.", "Then we left.", False),
        ("Due to this activ--", "Have you told him?", False),  # 말 끊김
        ("Look out!", "Run!", False),
    ],
)
def test_english_continues(prev: str, nxt: str, expected: bool) -> None:
    assert english_continues(prev, nxt) is expected


@pytest.mark.parametrize(
    ("prev", "expected"),
    [
        ("燃えてるのは芯じゃなくて", True),
        ("アンジェロ ラグサってあるけど", True),
        ("住所が、", True),
        ("この子を助けて", True),
        ("ケーキ美味しいのに", False),  # M0 오병합
        ("珍しいな うちに来るなんて", False),  # M0 오병합
        ("すみません いつも", False),  # M0 오병합
        ("本当によく降るわね", False),
    ],
)
def test_japanese_continues(prev: str, expected: bool) -> None:
    assert japanese_continues(prev, "次") is expected


# ---------------------------------------------------------------- 묶기


def test_cut_sentence_merges() -> None:
    doc = _doc(
        (1.0, 2.0, "I would never have guessed"),
        (2.1, 3.0, "that you could write something so intense."),
        (3.5, 4.0, "Thank you."),
    )

    assert _groups(doc) == [[1, 2], [3]]


@pytest.mark.parametrize(
    "second",
    [
        "- No way.",  # 화자 전환
        "[door slams]",  # 효과음
        "♪ la la ♪",  # 가사
        "<i>On the radio now.</i>",  # 이탤릭 전환
    ],
)
def test_standalone_blocks_do_not_merge(second: str) -> None:
    doc = _doc((1.0, 2.0, "And then I said"), (2.1, 3.0, second))

    assert _groups(doc) == [[1], [2]]


def test_m0_interruption_and_italic_cases() -> None:
    doc = _doc(
        (1.0, 2.0, "<i>Due to this activ--</i>"),
        (2.1, 3.0, "Have you told your husband"),
        (3.1, 4.0, "about your book?"),
        (4.1, 5.0, "<i>coming off an unprecedented wave</i>..."),
        (5.1, 6.0, "That is so sweet of you."),
    )

    assert _groups(doc) == [[1], [2, 3], [4], [5]]


def test_limits_max_blocks_gap_duration() -> None:
    chain = [(float(n), n + 0.9, "and then,") for n in range(1, 7)]
    assert _groups(_doc(*chain), max_blocks=4) == [[1, 2, 3, 4], [5, 6]]

    gap = _doc((1.0, 2.0, "and then,"), (3.5, 4.0, "it ended."))
    assert _groups(gap, max_gap=1.0) == [[1], [2]]

    long = _doc((0.0, 6.0, "and then,"), (6.1, 12.0, "it ended."))
    assert _groups(long, max_duration=10.0) == [[1], [2]]


def test_overlap_flag_blocks_merge() -> None:
    doc = _doc((1.0, 3.0, "and then,"), (2.5, 4.0, "it ended."))

    assert _groups(doc) == [[1], [2]]


def test_japanese_m0_cross_speaker_cases() -> None:
    doc = _doc(
        (1.0, 2.0, "ケーキ美味しいのに"),
        (2.1, 3.0, "しょうがないだろ"),
        (3.1, 4.0, "珍しいな うちに来るなんて"),
        (4.1, 5.0, "飲むか"),
        (5.1, 6.0, "燃えてるのは芯じゃなくて"),
        (6.1, 7.0, "パラフィンっていう蝋燭の成分だから"),
        (7.1, 8.0, "芯を摘まんでも..."),
    )

    # 5~7 은 한 문장이다 (…だから → 芯を摘まんでも…). M0 스파이크도 같은 unit 으로 묶었다
    assert _groups(doc, "ja") == [[1], [2], [3], [4], [5, 6, 7]]


def test_non_source_language_blocks_are_excluded_and_break_units() -> None:
    # Q-02: 일본어 원본의 중국어 제작진 메모
    doc = _doc(
        (1.0, 2.0, "Bathtub gin:美國禁酒時期,非法入口的酒無法滿足市場需求"),
        (2.0, 3.0, "本字幕由花語千夏字幕組共同製作"),
        (3.0, 4.0, "住所が、"),
        (4.1, 5.0, "本字幕由花語千夏字幕組共同製作"),
        (5.1, 6.0, "あんたの部屋で…"),
        (7.0, 8.0, ""),
    )
    plan = unitize(doc, "ja")

    assert plan.excluded == {1: "non_source_language", 2: "non_source_language",
                             4: "non_source_language", 6: "empty"}  # fmt: skip
    assert [list(u.idxs) for u in plan.units] == [[3], [5]]


def test_every_translatable_block_in_exactly_one_unit() -> None:
    doc = _doc(*[(float(n), n + 0.5, "line," if n % 3 else "line.") for n in range(1, 31)])
    plan = unitize(doc, "en")

    flat = [idx for unit in plan.units for idx in unit.idxs]
    assert flat == list(range(1, 31))
    assert [u.unit_id for u in plan.units] == [f"U{n}" for n in range(1, len(plan.units) + 1)]
    assert plan.unit_of()[1] == "U1"
