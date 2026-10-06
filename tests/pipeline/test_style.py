import pytest

from subtitle_robot.io.normalize import NormalizedDocument, normalize_srt
from subtitle_robot.pipeline.style import (
    CustomHonorific,
    StylePolicy,
    apply_block_styles,
    excluded_output,
)
from subtitle_robot.pipeline.unitizer import unitize

TEXTS = ["Hello there.", "[door slams]", "♪ la la la ♪", "And then,", "it ended."]


def _doc(texts: list[str]) -> NormalizedDocument:
    body = "".join(
        f"{n}\n00:00:{n:02},000 --> 00:00:{n:02},900\n{text}\n\n"
        for n, text in enumerate(texts, start=1)
    )
    return normalize_srt(body.encode("utf-8"), source_path="t.srt")


def _apply(policy: StylePolicy) -> tuple[list[list[int]], dict[int, str]]:
    doc = _doc(TEXTS)
    plan = apply_block_styles(unitize(doc, "en"), doc, "en", policy)
    return [list(u.idxs) for u in plan.units], dict(plan.excluded)


def test_default_translates_everything() -> None:
    units, excluded = _apply(StylePolicy())

    assert units == [[1], [2], [3], [4, 5]]
    assert excluded == {}


@pytest.mark.parametrize(
    ("policy", "expected"),
    [
        (StylePolicy(sdh="keep"), {2: "sdh_keep"}),
        (StylePolicy(sdh="drop"), {2: "sdh_drop"}),
        (StylePolicy(lyrics="keep"), {3: "lyrics_keep"}),
        (StylePolicy(sdh="drop", lyrics="keep"), {2: "sdh_drop", 3: "lyrics_keep"}),
    ],
)
def test_block_policies(policy: StylePolicy, expected: dict[int, str]) -> None:
    units, excluded = _apply(policy)

    assert excluded == expected
    assert all(idx not in expected for unit in units for idx in unit)


def test_existing_exclusions_are_kept() -> None:
    doc = _doc(["Hello.", "", "[gasps]"])
    plan = apply_block_styles(unitize(doc, "en"), doc, "en", StylePolicy(sdh="keep"))

    assert plan.excluded == {2: "empty", 3: "sdh_keep"}


def test_excluded_output() -> None:
    assert excluded_output("[door slams]", "sdh_drop") == ""
    assert excluded_output("[door slams]", "sdh_keep") == "[door slams]"
    assert excluded_output("本字幕由…", "non_source_language") == "本字幕由…"


def test_style_hash_is_stable_and_sensitive() -> None:
    base = StylePolicy()

    assert base.style_hash() == StylePolicy().style_hash()
    assert len(base.style_hash()) == 12
    assert base.style_hash() != StylePolicy(transliteration="standard").style_hash()
    assert base.style_hash() != StylePolicy(honorifics_policy="translate").style_hash()
    custom = StylePolicy(honorifics_custom={"先輩": CustomHonorific(ko="선배")})
    assert base.style_hash() != custom.style_hash()


def test_prompt_block_reflects_policy() -> None:
    text = StylePolicy(sdh="drop", lyrics="keep", name_style="original").prompt_block()

    assert "remove sound descriptions" in text
    assert "keep lyrics" in text
    assert "original script" in text
    assert "SPEAKER LABELS" in text
