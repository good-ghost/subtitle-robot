import json
import re
from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.llm.base import ChatRequest
from subtitle_robot.series.manifest import scan_episodes
from subtitle_robot.series.runner import analyze_series, run_series, select_episodes
from subtitle_robot.series.state import load_state
from subtitle_robot.series.workspace import SeriesWorkspace, init_series
from tests.fake_llm import FakeAdapter

EPISODES = {
    "S01E01": "田中さん、おはよう",
    "S01E02": "バネッチィが来た",
    "S01E03": "バネッティと田中",
}
ENTITIES = {
    "田中": {
        "source": "田中",
        "reading": "たなか",
        "origin": "japanese",
        "ko_suggestion": "타나카",
    },
    "バネッチィ": {"source": "バネッチィ", "origin": "foreign", "ko_suggestion": "바네치"},
    "バネッティ": {"source": "バネッティ", "origin": "foreign", "ko_suggestion": "바네티"},
}


def _respond(request: ChatRequest) -> str:
    user = request.messages[-1].content
    if request.schema_name == "pass1_output":
        known = set(re.findall(r"\| (\S+) = ", user))
        found = [
            {"tmp": f"n{n}", "type": "person", "first_seen": 1, "count": 1, **entity}
            for n, (name, entity) in enumerate(ENTITIES.items(), start=1)
            if name in user.split("<subtitles>")[1] and name not in known
        ]
        return json.dumps({"new_entities": found}, ensure_ascii=False)
    if request.schema_name == "reconcile_output":
        ids = re.findall(r"^(E\d+) \| (\S+)", user, re.MULTILINE)
        by_name = {name: eid for eid, name in ids}
        return json.dumps(
            {
                "same_entity": [
                    {
                        "keep": by_name["バネッチィ"],
                        "merge": [by_name["バネッティ"]],
                        "reason": "표기 흔들림",
                    }
                ]
            },
            ensure_ascii=False,
        )
    match = re.search(r"<translate>\n(.*)\n</translate>", user, re.DOTALL)
    assert match
    units = json.loads(match.group(1))["units"]
    reply: dict[str, Any] = {
        "units": [
            {"unit": u["unit"], "blocks": [{"idx": b["idx"], "ko": "번역"} for b in u["blocks"]]}
            for u in units
        ]
    }
    return json.dumps(reply, ensure_ascii=False)


def _series(tmp_path: Path, mode: str = "prescan") -> SeriesWorkspace:
    root = tmp_path / "Show"
    root.mkdir()
    for key, line in EPISODES.items():
        (root / f"Show.{key}.srt").write_text(
            f"1\n00:00:01,000 --> 00:00:02,000\n{line}\n", encoding="utf-8"
        )
    workspace, _ = init_series(root, "ja")
    path = workspace.settings_path
    path.write_text(
        path.read_text(encoding="utf-8").replace('mode = "prescan"', f'mode = "{mode}"'),
        encoding="utf-8",
    )
    return workspace


def _kinds(adapter: FakeAdapter) -> list[str]:
    return [str(r.schema_name).split("_")[0] for r in adapter.requests]


def test_prescan_analyzes_everything_before_translating(tmp_path: Path) -> None:
    workspace = _series(tmp_path)
    adapter = FakeAdapter(_respond)

    result = run_series(workspace, adapter)

    kinds = _kinds(adapter)
    assert kinds == ["pass1"] * 3 + ["reconcile"] + ["pass2"] * 3
    assert set(result.translated) == {"S01E01", "S01E02", "S01E03"}
    assert (workspace.out_dir / "S01E02.ko.srt").exists()
    state = load_state(workspace.state_path)
    assert all(ep.translated for ep in state.episodes.values())


def test_reconcile_only_queues_suggestions(tmp_path: Path) -> None:
    workspace = _series(tmp_path)

    analyze_series(workspace, FakeAdapter(_respond))

    glossary = load_glossary(workspace.glossary_path)
    assert {e.target for e in glossary.entries} == {"타나카", "바네치", "바네티"}  # 그대로
    merges = [i for i in load_state(workspace.state_path).open_items() if i.kind == "merge"]
    assert len(merges) == 1
    assert "표기 흔들림" in merges[0].detail


def test_incremental_alternates_per_episode(tmp_path: Path) -> None:
    workspace = _series(tmp_path, "incremental")
    adapter = FakeAdapter(_respond)

    run_series(workspace, adapter)

    assert _kinds(adapter) == ["pass1", "pass2"] * 3


def test_rerun_makes_no_requests(tmp_path: Path) -> None:
    workspace = _series(tmp_path)
    run_series(workspace, FakeAdapter(_respond))

    adapter = FakeAdapter(_respond)
    result = run_series(workspace, adapter)

    assert adapter.requests == []
    assert len(result.translated) == 3  # 체크포인트로 재사용


def test_blocked_episode_is_not_translated(tmp_path: Path) -> None:
    workspace = _series(tmp_path)
    path = workspace.settings_path
    path.write_text(
        path.read_text(encoding="utf-8").replace("review = false", "review = true"),
        encoding="utf-8",
    )
    adapter = FakeAdapter(_respond)

    result = run_series(workspace, adapter)

    assert result.translated == {}
    assert set(result.blocked) == {"S01E01", "S01E02", "S01E03"}
    assert "proposed" in result.blocked["S01E01"][0]
    assert "pass2" not in _kinds(adapter)


def test_episode_range(tmp_path: Path) -> None:
    workspace = _series(tmp_path)
    episodes = scan_episodes(workspace.root).episodes

    assert [e.key for e in select_episodes(episodes, "S01E02-S01E03")] == ["S01E02", "S01E03"]
    assert [e.key for e in select_episodes(episodes, "S01E01")] == ["S01E01"]
    with pytest.raises(ValueError, match="형식"):
        select_episodes(episodes, "1-3")

    adapter = FakeAdapter(_respond)
    result = run_series(workspace, adapter, episodes="S01E02")
    assert set(result.translated) == {"S01E02"}
