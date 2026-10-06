import pytest

from subtitle_robot.glossary.honorifics import HonorificForm, HonorificResolver

# §8.6 표: 접미사 → {정책: 조합 결과}
TABLE = {
    "さん": {"translate": "타나카 씨", "transliterate": "타나카 상", "drop": "타나카"},
    "様": {"translate": "타나카님", "transliterate": "타나카 사마", "drop": "타나카"},
    "くん": {"translate": "타나카 군", "transliterate": "타나카 쿤", "drop": "타나카"},
    "君": {"translate": "타나카 군", "transliterate": "타나카 쿤", "drop": "타나카"},
    "ちゃん": {"translate": "타나카", "transliterate": "타나카짱", "drop": "타나카"},
    "先輩": {"translate": "타나카 선배", "transliterate": "타나카 센파이", "drop": "타나카"},
    "先生": {"translate": "타나카 선생님", "transliterate": "타나카 센세", "drop": "타나카"},
}


@pytest.mark.parametrize("policy", ["translate", "transliterate", "drop"])
@pytest.mark.parametrize("suffix", list(TABLE))
def test_plan_table(suffix: str, policy: str) -> None:
    resolver = HonorificResolver(policy)  # type: ignore[arg-type]

    assert resolver.compose("타나카", suffix) == TABLE[suffix][policy]


def test_default_policy_is_transliterate() -> None:
    assert HonorificResolver().compose("타나카", "さん") == "타나카 상"


def test_custom_override_wins_over_policy() -> None:
    # §14.3 예시: 先輩만 번역
    resolver = HonorificResolver(custom={"先輩": HonorificForm("선배", space=True)})

    assert resolver.compose("사토", "先輩") == "사토 선배"
    assert resolver.compose("사토", "さん") == "사토 상"


def test_custom_on_canonical_applies_to_alias() -> None:
    resolver = HonorificResolver(custom={"くん": HonorificForm("군", space=True)})

    assert resolver.compose("히로시", "君") == "히로시 군"


def test_unknown_suffix_and_none() -> None:
    resolver = HonorificResolver()

    assert resolver.resolve("殿") is None
    assert resolver.compose("타나카", "殿") == "타나카"
    assert resolver.compose("타나카", None) == "타나카"


def test_prompt_map_only_contains_seen_suffixes() -> None:
    resolver = HonorificResolver()

    mapping = resolver.prompt_map(["さん", "君", "さん", "殿"])

    assert mapping == {
        "さん": HonorificForm("상", space=True),
        "君": HonorificForm("쿤", space=True),
    }
