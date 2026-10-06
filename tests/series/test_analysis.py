import json
from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.llm.base import ChatRequest
from subtitle_robot.series.analysis import analyze_episode
from subtitle_robot.series.state import SeriesState, load_state, save_state
from subtitle_robot.series.workspace import SeriesWorkspace, init_series
from tests.fake_llm import FakeAdapter

EP1 = (
    "1\n00:00:01,000 --> 00:00:02,000\n田中さん、おはよう\n\n"
    "2\n00:00:03,000 --> 00:00:04,000\n蓮が来た\n"
)
EP2 = "1\n00:00:01,000 --> 00:00:02,000\n田中君と佐藤さん\n"
TANAKA = {
    "tmp": "n1",
    "type": "person",
    "source": "田中",
    "reading": "たなか",
    "origin": "japanese",
    "ko_suggestion": "타나카",
    "seen_suffixes": ["さん"],
    "first_seen": 1,
    "count": 1,
}
REN = {
    "tmp": "n2",
    "type": "person",
    "source": "蓮",
    "reading": "れん",
    "reading_confidence": "low",
    "origin": "japanese",
    "ko_suggestion": "렌",
    "first_seen": 2,
    "count": 1,
}
SATO = {
    "tmp": "n1",
    "type": "person",
    "source": "佐藤",
    "reading": "さとう",
    "origin": "japanese",
    "ko_suggestion": "사토",
    "first_seen": 1,
    "count": 1,
}


def _respond(request: ChatRequest) -> str:
    user = request.messages[-1].content
    if "田中さん、おはよう" in user:
        payload: dict[str, Any] = {"new_entities": [TANAKA, REN]}
    else:
        payload = {
            "new_entities": [SATO],
            "conflicts": [
                {
                    "entity_id": "E0001",
                    "current_ko": "타나카",
                    "suggested_ko": "다나카",
                    "reason": "x",
                }
            ],
        }
    return json.dumps(payload, ensure_ascii=False)


def _series(tmp_path: Path, extra: str = "") -> SeriesWorkspace:
    root = tmp_path / "Show"
    (root / "S01").mkdir(parents=True)
    (root / "S01" / "Show.S01E01.srt").write_text(EP1, encoding="utf-8")
    (root / "S01" / "Show.S01E02.srt").write_text(EP2, encoding="utf-8")
    workspace, _ = init_series(root, "ja")
    if extra:
        workspace.settings_path.write_text(
            workspace.settings_path.read_text(encoding="utf-8").replace("review = false", extra),
            encoding="utf-8",
        )
    return workspace


def _analyze_all(workspace: SeriesWorkspace, adapter: FakeAdapter) -> SeriesState:
    state = load_state(workspace.state_path)
    settings = workspace.settings()
    for episode in workspace.scan().episodes:
        analyze_episode(workspace, episode, adapter, settings, state)
    save_state(state, workspace.state_path)
    return state


def test_delta_analysis_across_episodes(tmp_path: Path) -> None:
    workspace = _series(tmp_path)
    adapter = FakeAdapter(_respond)

    state = _analyze_all(workspace, adapter)
    glossary = load_glossary(workspace.glossary_path)

    tanaka = glossary.get("E0001")
    assert (tanaka.target, tanaka.scope, tanaka.first_seen, tanaka.status) == (
        "타나카",
        "episode:S01E01",
        "S01E01#1",
        "auto",
    )
    assert glossary.get("E0003").source == "佐藤"
    # 두 번째 에피소드 Pass 1 에 E0001 이 고정 ID 로 전달됐다
    assert "E0001 | 田中 = 타나카" in adapter.requests[1].messages[-1].content
    # 충돌은 표기를 바꾸지 않고 대기열에만
    assert tanaka.target == "타나카"
    kinds = {(item.kind, item.entity_id, item.blocking) for item in state.open_items()}
    assert ("conflict", "E0001", False) in kinds
    assert ("low_confidence", "E0002", False) in kinds  # on_low_confidence=warn
    assert ("promote", "E0001", False) in kinds  # 두 에피소드에 출현
    assert state.appearances["E0001"] == ["S01E01", "S01E02"]
    assert state.episodes["S01E02"].added == ["E0003"]
    delta = load_glossary(workspace.work_dir / "S01E02" / "glossary.delta.yaml")
    assert [e.id for e in delta.entries] == ["E0003"]


def test_reanalysis_is_skipped(tmp_path: Path) -> None:
    workspace = _series(tmp_path)
    _analyze_all(workspace, FakeAdapter(_respond))

    adapter = FakeAdapter(_respond)
    _analyze_all(workspace, adapter)

    assert adapter.requests == []


@pytest.mark.parametrize(
    ("extra", "low_blocks", "conflict_blocks", "proposed"),
    [
        ('review = false\non_low_confidence = "block"', True, False, False),
        ("review = true", True, True, True),
    ],
)
def test_blocking_policies(
    tmp_path: Path, extra: str, low_blocks: bool, conflict_blocks: bool, proposed: bool
) -> None:
    workspace = _series(tmp_path, extra.replace('\non_low_confidence = "block"', ""))
    if "block" in extra:
        path = workspace.settings_path
        path.write_text(
            path.read_text(encoding="utf-8").replace('"warn"', '"block"'), encoding="utf-8"
        )

    state = _analyze_all(workspace, FakeAdapter(_respond))
    items = {(i.kind, i.entity_id): i.blocking for i in state.open_items()}

    assert items[("low_confidence", "E0002")] is low_blocks
    assert items[("conflict", "E0001")] is conflict_blocks
    assert (("proposed", "E0001") in items) is proposed
    blocking = [i.entity_id for i in state.blocking_items("S01E01")]
    assert ("E0002" in blocking) is low_blocks
    if proposed:
        assert load_glossary(workspace.glossary_path).get("E0001").status == "proposed"


def test_state_round_trip_and_dedup(tmp_path: Path) -> None:
    from subtitle_robot.series.state import ReviewItem

    state = SeriesState()
    state.add_review(ReviewItem(kind="conflict", entity_id="E1", episode="S01E01"))
    state.add_review(ReviewItem(kind="conflict", entity_id="E1", episode="S01E02", blocking=True))
    path = tmp_path / "state.json"
    save_state(state, path)

    loaded = load_state(path)

    assert len(loaded.review_queue) == 1
    assert loaded.review_queue[0].blocking


def test_known_glossary_includes_entries_not_in_episode(tmp_path: Path) -> None:
    workspace = _series(tmp_path)
    adapter = FakeAdapter(_respond)

    _analyze_all(workspace, adapter)

    known = adapter.requests[1].messages[-1].content.split("</known_glossary>")[0]
    # 2화 원문에 없는 蓮(E0002)도 보내야 다른 표기를 변형으로 받을 수 있다. 매칭된 항목이 먼저
    assert known.index("E0001 | 田中") < known.index("E0002 | 蓮")


def test_known_glossary_is_capped(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("subtitle_robot.series.analysis.KNOWN_MAX_ENTRIES", 1)
    workspace = _series(tmp_path)
    adapter = FakeAdapter(_respond)

    _analyze_all(workspace, adapter)

    known = adapter.requests[1].messages[-1].content.split("</known_glossary>")[0]
    assert "E0001 | 田中" in known
    assert "E0002" not in known
