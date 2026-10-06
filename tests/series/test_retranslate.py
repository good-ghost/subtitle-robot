import json
import re
from pathlib import Path

import pytest

from subtitle_robot.checkpoint import StaleCheckpointError
from subtitle_robot.llm.base import ChatRequest
from subtitle_robot.series.retranslate import retranslate_series
from subtitle_robot.series.review import apply_review
from subtitle_robot.series.runner import run_series
from subtitle_robot.series.workspace import SeriesWorkspace
from tests.fake_llm import FakeAdapter
from tests.series.test_runner import _respond as base_respond
from tests.series.test_runner import _series


def _respond(request: ChatRequest) -> str:
    """Pass 2 번역문에 요청 용어집의 표기를 그대로 넣는다 (표기 변경이 출력에 반영되는지 보려고)."""
    if request.schema_name != "pass2_output":
        return base_respond(request)
    user = request.messages[-1].content
    forms = re.findall(r"^E\d+ \S+ = (\S+)", user.split("</glossary>")[0], re.MULTILINE)
    match = re.search(r"<translate>\n(.*)\n</translate>", user, re.DOTALL)
    assert match
    units = [
        {
            "unit": u["unit"],
            "blocks": [{"idx": b["idx"], "ko": " ".join(forms) or "번역"} for b in u["blocks"]],
        }
        for u in json.loads(match.group(1))["units"]
    ]
    return json.dumps({"units": units}, ensure_ascii=False)


def _translated(tmp_path: Path) -> SeriesWorkspace:
    workspace = _series(tmp_path)
    run_series(workspace, FakeAdapter(_respond))
    return workspace


def _pass2(adapter: FakeAdapter) -> list[ChatRequest]:
    return [r for r in adapter.requests if r.schema_name == "pass2_output"]


def test_changed_retranslates_only_units_with_changed_entity(tmp_path: Path) -> None:
    workspace = _translated(tmp_path)
    assert "타나카" in (workspace.out_dir / "S01E01.ko.srt").read_text(encoding="utf-8")
    apply_review(workspace, set_ko={"E0001": "다나카"})  # 田中: 타나카 → 다나카, rev+1

    adapter = FakeAdapter(_respond)
    result = retranslate_series(workspace, adapter)

    assert result.retranslated == {"S01E01": 1, "S01E03": 1}
    assert result.skipped == ["S01E02"]  # 田中 이 없는 에피소드는 요청 없음
    assert len(_pass2(adapter)) == 2
    for key in ("S01E01", "S01E03"):
        text = (workspace.out_dir / f"{key}.ko.srt").read_text(encoding="utf-8")
        assert "다나카" in text
        assert "타나카" not in text


def test_changed_without_changes_makes_no_requests(tmp_path: Path) -> None:
    workspace = _translated(tmp_path)

    adapter = FakeAdapter(_respond)
    result = retranslate_series(workspace, adapter)

    assert adapter.requests == []
    assert result.retranslated == {}


def test_entity_option_forces_only_that_entity(tmp_path: Path) -> None:
    workspace = _translated(tmp_path)

    adapter = FakeAdapter(_respond)
    result = retranslate_series(workspace, adapter, entities=frozenset({"E0002"}))  # バネッチィ

    assert result.retranslated == {"S01E02": 1}
    assert len(_pass2(adapter)) == 1
    assert "バネッチィ" in _pass2(adapter)[0].messages[-1].content


def test_settings_change_stops_by_default(tmp_path: Path) -> None:
    workspace = _translated(tmp_path)
    path = workspace.settings_path
    path.write_text(
        path.read_text(encoding="utf-8").replace(
            'policy = "transliterate"', 'policy = "translate"'
        ),
        encoding="utf-8",
    )

    with pytest.raises(StaleCheckpointError, match="settings"):
        retranslate_series(workspace, FakeAdapter(_respond))

    redo = retranslate_series(workspace, FakeAdapter(_respond), settings_resume="redo")
    assert set(redo.retranslated) == {"S01E01", "S01E02", "S01E03"}
