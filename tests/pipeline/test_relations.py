import re
from pathlib import Path

from subtitle_robot.glossary.model import AddressName, Relation
from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.io.normalize import normalize_srt
from subtitle_robot.pipeline.context import ContextBuilder
from subtitle_robot.pipeline.style import StylePolicy
from subtitle_robot.pipeline.unitizer import unitize

EXAMPLE = Path(__file__).parent.parent.parent / "examples" / "glossary.example.yaml"
SRT = (
    "1\n00:00:01,000 --> 00:00:02,000\n田中、佐藤さんが呼んでる\n\n"
    "2\n00:00:05,000 --> 00:00:06,000\nヒロシだけ\n"
)


def _builder(
    episode: str | None = "S01E02", relations: list[Relation] | None = None
) -> ContextBuilder:
    doc = normalize_srt(SRT.encode("utf-8"), source_path="t.srt")
    glossary = load_glossary(EXAMPLE)
    return ContextBuilder(
        doc,
        unitize(doc, "ja"),
        glossary.entries,
        "ja",
        StylePolicy(),
        relations=glossary.relations if relations is None else relations,
        episode=episode,
    )


def _relations_section(builder: ContextBuilder, unit_id: str) -> list[str]:
    message = builder.build("B001", [unit_id]).user_message
    match = re.search(r"<relations>\n(.*?)\n</relations>", message, re.DOTALL)
    assert match
    return [line for line in match.group(1).splitlines() if line]


def test_relations_between_present_characters() -> None:
    lines = _relations_section(_builder(), "U1")

    assert lines == [
        "E0007 → E0012: calls 사토 상; speech 해요체",
        "E0012 → E0007: calls 오빠 (for お兄ちゃん); speech 해체",
    ]


def test_relation_needs_both_characters_in_batch() -> None:
    assert _relations_section(_builder(), "U2") == []  # ヒロシ(E0007)만 나온다


def test_valid_from_filters_earlier_episodes() -> None:
    later = Relation.model_validate(
        {"from": "E0007", "to": "E0012", "speech_level": "해체", "valid_from": "S01E05"}
    )

    assert _relations_section(_builder("S01E04", [later]), "U1") == []
    assert _relations_section(_builder("S01E05", [later]), "U1") == ["E0007 → E0012: speech 해체"]
    assert _relations_section(_builder(None, [later]), "U1") == ["E0007 → E0012: speech 해체"]


def test_relation_suffix_is_added_to_honorifics() -> None:
    relation = Relation.model_validate(
        {"from": "E0007", "to": "E0012", "address_name": {"variant": "佐藤", "suffix": "先輩"}}
    )
    message = _builder(relations=[relation]).build("B001", ["U1"]).user_message

    assert "E0007 → E0012: calls 사토 센파이" in message
    assert "先輩 = 센파이 (space)" in message


def test_relation_change_changes_fingerprint() -> None:
    base = _builder().entity_revs((1,))
    glossary = load_glossary(EXAMPLE)
    changed = [
        r.model_copy(update={"speech_level": "해체"}) if r.from_id == "E0007" else r
        for r in glossary.relations
    ]

    after = _builder(relations=changed).entity_revs((1,))

    assert "REL:E0007>E0012" in base
    assert base["REL:E0007>E0012"] != after["REL:E0007>E0012"]
    assert base["E0007"] == after["E0007"]
    assert AddressName(variant="x").suffix is None
