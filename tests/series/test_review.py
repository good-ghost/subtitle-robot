from pathlib import Path

import pytest

from subtitle_robot.glossary.model import GlossaryError, Variant, add_variants
from subtitle_robot.glossary.store import load_glossary, save_glossary
from subtitle_robot.series.review import apply_review, open_review_items
from subtitle_robot.series.workspace import SeriesWorkspace
from tests.fake_llm import FakeAdapter
from tests.series.test_analysis import _analyze_all, _respond, _series


@pytest.fixture
def workspace(tmp_path: Path) -> SeriesWorkspace:
    workspace = _series(tmp_path, "review = true")
    _analyze_all(workspace, FakeAdapter(_respond))
    return workspace


def _kinds(workspace: SeriesWorkspace) -> set[tuple[str, str]]:
    return {(item.kind, item.entity_id) for item in open_review_items(workspace)}


def test_set_spelling_locks_as_manual_and_bumps_rev(workspace: SeriesWorkspace) -> None:
    before = load_glossary(workspace.glossary_path).get("E0001")

    result = apply_review(workspace, set_ko={"E0001": "다나카"})

    entry = load_glossary(workspace.glossary_path).get("E0001")
    assert (entry.target, entry.target_source, entry.status) == ("다나카", "manual", "locked")
    assert entry.rev == before.rev + 1
    assert entry.avoid == ("타나카",)  # 이전 표기는 avoid, 새 표기는 avoid 에서 뺀다
    assert result.changed == {"E0001": "다나카"}
    remaining = _kinds(workspace)
    assert ("conflict", "E0001") not in remaining
    assert ("proposed", "E0001") not in remaining
    assert ("promote", "E0001") in remaining  # 승격 제안은 따로 다룬다


def test_accept_locks_without_spelling_change(workspace: SeriesWorkspace) -> None:
    apply_review(workspace, accept=["E0002"])

    entry = load_glossary(workspace.glossary_path).get("E0002")
    assert (entry.status, entry.target, entry.target_source) == ("locked", "렌", "generated")
    assert not any(e == "E0002" for _, e in _kinds(workspace))


def test_promote_changes_scope_without_rev(workspace: SeriesWorkspace) -> None:
    before = load_glossary(workspace.glossary_path).get("E0001")

    apply_review(workspace, promote=["E0001"])

    entry = load_glossary(workspace.glossary_path).get("E0001")
    assert entry.scope == "series"
    assert entry.rev == before.rev
    assert ("promote", "E0001") not in _kinds(workspace)


def test_accept_all_and_dismiss(workspace: SeriesWorkspace) -> None:
    result = apply_review(workspace, accept_all=True, dismiss=["E0001"])

    glossary = load_glossary(workspace.glossary_path)
    assert all(entry.status == "locked" for entry in glossary.entries)
    assert result.remaining == []
    assert "E0001" in result.dismissed


def test_unblocks_episodes(workspace: SeriesWorkspace) -> None:
    from subtitle_robot.series.state import load_state

    assert load_state(workspace.state_path).blocking_items("S01E01")

    apply_review(workspace, accept_all=True)

    assert load_state(workspace.state_path).blocking_items("S01E01") == []


def test_errors(workspace: SeriesWorkspace) -> None:
    with pytest.raises(GlossaryError, match="E0099"):
        apply_review(workspace, accept=["E0099"])
    with pytest.raises(GlossaryError, match="빈 표기"):
        apply_review(workspace, set_ko={"E0001": " "})


def test_set_spelling_respells_variants(workspace: SeriesWorkspace) -> None:
    glossary = load_glossary(workspace.glossary_path)
    variant = Variant(src="田中先生", target="타나카 선생")
    save_glossary(add_variants(glossary, "E0001", (variant,)), workspace.glossary_path)

    apply_review(workspace, set_ko={"E0001": "다나카"})

    entry = load_glossary(workspace.glossary_path).get("E0001")
    assert [v.target for v in entry.variants] == ["다나카 선생"]
