from pathlib import Path

import pytest

from subtitle_robot.glossary.model import (
    Glossary,
    GlossaryEntry,
    GlossaryError,
    LockedEntryError,
    Variant,
    add_entry,
    next_entity_id,
    update_entry,
)
from subtitle_robot.glossary.store import (
    dump_glossary,
    load_glossary,
    parse_glossary,
    save_glossary,
)

EXAMPLE = Path(__file__).parent.parent.parent / "examples" / "glossary.example.yaml"


@pytest.fixture
def glossary() -> Glossary:
    return load_glossary(EXAMPLE)


def test_example_loads_with_plan_fields(glossary: Glossary) -> None:
    john = glossary.get("E0003")
    tanaka = glossary.get("E0007")

    assert (john.status, john.rev, john.target, john.target_source) == (
        "locked",
        2,
        "존 밀러",
        "llm",
    )
    assert [v.src for v in john.variants] == ["John", "Johnny", "Miller"]
    assert tanaka.reading == "たなか ひろし"
    assert tanaka.avoid == ("다나카",)
    assert tanaka.variants[0] == Variant(src="田中", reading="たなか", target="타나카")
    assert tanaka.surfaces() == ("田中ヒロシ", "田中", "ヒロシ", "ヒロ")
    assert glossary.relations[0].from_id == "E0007"
    assert glossary.relations[0].address_name is not None
    assert glossary.relations[0].address_name.suffix == "さん"
    assert glossary.relations[1].address_term is not None
    assert glossary.relations[1].address_term.target == "오빠"
    assert [e.id for e in glossary.for_language("ja")] == ["E0007", "E0012"]


def test_save_and_load_round_trip(glossary: Glossary, tmp_path: Path) -> None:
    target = tmp_path / "glossary.yaml"

    save_glossary(glossary, target)

    assert load_glossary(target) == glossary
    text = target.read_text(encoding="utf-8")
    assert "타나카 히로시" in text  # 유니코드를 이스케이프하지 않는다
    assert "from: E0007" in text  # relations 는 'from' 키로 쓴다
    assert "null" not in text


def test_update_increments_rev_once(glossary: Glossary) -> None:
    updated = update_entry(glossary, "E0003", origin="user", note="lead", target="존 밀러 2세")

    assert updated.get("E0003").rev == 3
    assert updated.get("E0003").target == "존 밀러 2세"
    assert glossary.get("E0003").rev == 2  # 원본은 불변


def test_update_without_change_keeps_rev(glossary: Glossary) -> None:
    assert update_entry(glossary, "E0003", origin="user", target="존 밀러") is glossary


@pytest.mark.parametrize("entry_id", ["E0003", "E0007"])  # locked, auto
def test_pipeline_cannot_change_locked_or_auto_spelling(glossary: Glossary, entry_id: str) -> None:
    with pytest.raises(LockedEntryError, match="파이프라인이 바꿀 수 없다"):
        update_entry(glossary, entry_id, origin="pipeline", target="다른 표기")


def test_pipeline_may_update_non_spelling_fields(glossary: Glossary) -> None:
    updated = update_entry(
        glossary, "E0007", origin="pipeline", seen_suffixes=["さん", "くん", "様"]
    )

    assert updated.get("E0007").seen_suffixes == ("さん", "くん", "様")
    assert updated.get("E0007").rev == 2


def test_pipeline_may_change_proposed_entry(glossary: Glossary) -> None:
    proposed = GlossaryEntry(
        id=next_entity_id(glossary),
        type="person",
        status="proposed",
        src_lang="en",
        source="Kowalski",
        target="코왈스키",
        target_source="llm",
    )
    glossary = add_entry(glossary, proposed)

    updated = update_entry(glossary, proposed.id, origin="pipeline", target="코월스키")

    assert updated.get(proposed.id).target == "코월스키"


def test_update_rejects_unknown_field_and_id_change(glossary: Glossary) -> None:
    with pytest.raises(GlossaryError, match="없는 필드"):
        update_entry(glossary, "E0003", origin="user", nickname="J")
    with pytest.raises(GlossaryError, match="직접 바꿀 수 없다"):
        update_entry(glossary, "E0003", origin="user", rev=10)
    with pytest.raises(GlossaryError, match="변경 값 오류"):
        update_entry(glossary, "E0003", origin="user", status="frozen")


def test_next_entity_id_and_duplicate_add(glossary: Glossary) -> None:
    assert next_entity_id(glossary) == "E0013"
    assert next_entity_id(Glossary()) == "E0001"
    with pytest.raises(GlossaryError, match="이미 있다"):
        add_entry(glossary, glossary.get("E0003"))


def test_get_missing_entry(glossary: Glossary) -> None:
    with pytest.raises(GlossaryError, match="E9999"):
        glossary.get("E9999")


@pytest.mark.parametrize(
    ("change", "message"),
    [
        ({"id": "X1"}, "E0001"),
        ({"scope": "movie"}, "scope"),
        ({"type": "animal"}, "type"),
    ],
)
def test_invalid_entry_values(glossary: Glossary, change: dict[str, str], message: str) -> None:
    raw = glossary.model_dump(mode="json", by_alias=True)
    raw["entries"][0].update(change)

    with pytest.raises(GlossaryError, match=message):
        parse_glossary(raw, source="test.yaml")


def test_duplicate_ids_and_dangling_relation(glossary: Glossary) -> None:
    raw = glossary.model_dump(mode="json", by_alias=True)
    raw["entries"].append(raw["entries"][0])
    with pytest.raises(GlossaryError, match="ID 중복"):
        parse_glossary(raw, source="dup.yaml")

    raw = glossary.model_dump(mode="json", by_alias=True)
    raw["relations"][0]["to"] = "E0099"
    with pytest.raises(GlossaryError, match="E0099"):
        parse_glossary(raw, source="rel.yaml")


def test_schema_version_mismatch(tmp_path: Path) -> None:
    path = tmp_path / "glossary.yaml"
    path.write_text("schema_version: 1\nentries: []\n", encoding="utf-8")

    with pytest.raises(GlossaryError, match="schema_version 1"):
        load_glossary(path)


def test_yaml_syntax_error_and_missing_file(tmp_path: Path) -> None:
    path = tmp_path / "glossary.yaml"
    path.write_text("entries: [\n", encoding="utf-8")

    with pytest.raises(GlossaryError, match="YAML 문법 오류"):
        load_glossary(path)
    with pytest.raises(GlossaryError, match="파일이 없다"):
        load_glossary(tmp_path / "none.yaml")


def test_dump_of_empty_glossary() -> None:
    assert "entries: []" in dump_glossary(Glossary(series="Empty"))


LEGACY = Path(__file__).parent / "legacy_ko_fields.yaml"


def test_legacy_ko_fields_load_and_save_as_target(tmp_path: Path) -> None:
    """0.6.0 전 용어집(ko·ko_source·title_ko)을 읽고, 저장하면 새 이름으로 쓴다 (§26.5)."""
    legacy = load_glossary(LEGACY)

    assert legacy == load_glossary(EXAMPLE)
    assert legacy.get("E0003").target == "존 밀러"
    assert legacy.get("E0003").target_source == "llm"
    assert legacy.relations[1].address_term is not None
    assert legacy.relations[1].address_term.target == "오빠"
    path = tmp_path / "glossary.yaml"
    save_glossary(legacy, path)
    text = path.read_text(encoding="utf-8")
    assert "target: 존 밀러" in text
    assert "ko:" not in text
    assert "ko_source" not in text
    assert [entry.rev for entry in load_glossary(path).entries] == [2, 1, 1]
