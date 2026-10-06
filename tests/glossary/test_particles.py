import pytest

from subtitle_robot.glossary.particles import (
    attach_particle,
    batchim_of,
    particle_for,
    replace_with_particles,
)


@pytest.mark.parametrize(
    ("word", "particle", "expected"),
    [
        ("타나카", "이", "가"),
        ("존", "가", "이"),
        ("밀러", "은", "는"),
        ("존", "는", "은"),
        ("밀러", "을", "를"),
        ("존", "와", "과"),
        ("존", "야", "아"),
        ("히로시", "아", "야"),
        ("부산", "로", "으로"),
        ("서울", "으로", "로"),  # ㄹ 받침은 '로'
        ("타나카", "으로", "로"),
        ("존", "랑", "이랑"),
        ("타나카", "이나", "나"),
        ("3", "가", "이"),  # 삼
        ("2", "이", "가"),  # 이
        ("7", "으로", "로"),  # 칠 (ㄹ)
        ("John", "가", "가"),  # 판단 불가 → 그대로
        ("존", "에게", "에게"),  # 짝 없는 조사
    ],
)
def test_particle_for(word: str, particle: str, expected: str) -> None:
    assert particle_for(word, particle) == expected


def test_attach_and_batchim() -> None:
    assert attach_particle("존", "가") == "존이"
    assert batchim_of("서울") == (True, True)
    assert batchim_of("타나카") == (False, False)
    assert batchim_of("") is None


@pytest.mark.parametrize(
    ("text", "old", "new", "expected", "count"),
    [
        ("다나카가 왔다.", "다나카", "타나카", "타나카가 왔다.", 1),
        ("조니가 웃었다.", "조니", "존", "존이 웃었다.", 1),
        ("조니는 몰라", "조니", "존", "존은 몰라", 1),
        ("조니를 봤어", "조니", "존", "존을 봤어", 1),
        ("조니와 나", "조니", "존", "존과 나", 1),
        ("조니로 정했다", "조니", "존", "존으로 정했다", 1),
        ("조니야, 이리 와", "조니", "존", "존아, 이리 와", 1),
        ("다나카에게 줘", "다나카", "타나카", "타나카에게 줘", 1),
        ("다나카의 집", "다나카", "타나카", "타나카의 집", 1),
        ("다나카님", "다나카", "타나카", "타나카님", 1),
        ("다나카 상!", "다나카", "타나카", "타나카 상!", 1),
        ("<i>다나카</i>", "다나카", "타나카", "<i>타나카</i>", 1),
        ("존재한다", "존", "조니", "존재한다", 0),  # 다른 단어의 일부
        ("미스터존이", "존", "조니", "미스터존이", 0),  # 앞이 한글
        ("다나카다.", "다나카", "타나카", "타나카다.", 1),  # 서술격 조사
        ("조니다.", "조니", "존", "존이다.", 1),
        ("존이에요.", "존", "조니", "조니예요.", 1),
        ("조니였어", "조니", "존", "존이었어", 1),
        ("조니라고 했어", "조니", "존", "존이라고 했어", 1),
        ("다나카가, 다나카를", "다나카", "타나카", "타나카가, 타나카를", 2),
    ],
)
def test_replace_with_particles(text: str, old: str, new: str, expected: str, count: int) -> None:
    assert replace_with_particles(text, old, new) == (expected, count)


def test_replace_empty_old_is_noop() -> None:
    assert replace_with_particles("abc", "", "x") == ("abc", 0)
