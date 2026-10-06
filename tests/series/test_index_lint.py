from pathlib import Path

from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.series.index import load_index
from subtitle_robot.series.lint import lint_series
from subtitle_robot.series.runner import run_series
from subtitle_robot.series.workspace import SeriesWorkspace
from tests.fake_llm import FakeAdapter
from tests.series.test_runner import _respond, _series


def _translated(tmp_path: Path) -> SeriesWorkspace:
    workspace = _series(tmp_path)
    run_series(workspace, FakeAdapter(_respond))
    return workspace


def _rewrite_output(workspace: SeriesWorkspace, key: str, text: str) -> None:
    path = workspace.out_dir / f"{key}.ko.srt"
    path.write_text(f"1\n00:00:01,000 --> 00:00:02,000\n{text}\n", encoding="utf-8")


def test_index_records_episode_unit_and_idx(tmp_path: Path) -> None:
    workspace = _translated(tmp_path)

    lint_series(workspace)
    index = load_index(workspace.index_path)

    tanaka = index.entities["E0001"]
    assert [(o.episode, o.unit, o.idx) for o in tanaka] == [
        ("S01E01", "U1", 1),
        ("S01E03", "U1", 1),
    ]
    assert index.episodes_of("E0001") == ["S01E01", "S01E03"]


def test_clean_outputs_have_no_errors(tmp_path: Path) -> None:
    workspace = _translated(tmp_path)
    _rewrite_output(workspace, "S01E01", "타나카 상, 안녕")
    _rewrite_output(workspace, "S01E02", "바네치가 왔다")
    _rewrite_output(workspace, "S01E03", "바네티와 타나카")

    result = lint_series(workspace)

    assert result.episodes == ["S01E01", "S01E02", "S01E03"]
    assert result.errors == []
    assert result.issues == []


def test_avoid_spelling_is_error_and_missing_is_warning(tmp_path: Path) -> None:
    workspace = _translated(tmp_path)
    _rewrite_output(workspace, "S01E01", "다나카 상, 안녕")  # avoid 표기
    _rewrite_output(workspace, "S01E02", "그 사람이 왔다")  # 이름 생략

    result = lint_series(workspace)

    assert [(i.episode, i.entity_id, i.code) for i in result.errors] == [
        ("S01E01", "E0001", "avoid_used")
    ]
    warnings = {(i.episode, i.code) for i in result.issues if i.severity == "warning"}
    assert ("S01E02", "term_missing") in warnings


def test_untranslated_episodes_are_skipped(tmp_path: Path) -> None:
    workspace = _translated(tmp_path)
    (workspace.out_dir / "S01E03.ko.srt").unlink()

    assert lint_series(workspace).episodes == ["S01E01", "S01E02"]


def test_ass_episodes_output_ass_and_lint_reads_it(tmp_path: Path) -> None:
    from subtitle_robot.series.workspace import init_series
    from tests.series.test_runner import EPISODES

    root = tmp_path / "AssShow"
    root.mkdir()
    header = (
        "[Script Info]\nScriptType: v4.00+\n\n[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )
    for key, line in EPISODES.items():
        (root / f"AssShow.{key}.ass").write_text(
            header + f"Dialogue: 0,0:00:01.00,0:00:02.00,Default,,0,0,0,,{line}\n", encoding="utf-8"
        )
    workspace, _ = init_series(root, "ja")
    run_series(workspace, FakeAdapter(_respond))
    output = workspace.out_dir / "S01E01.ko.ass"
    assert output.exists()
    assert lint_series(workspace).errors == []

    from subtitle_robot.series.review import apply_review

    tanaka = next(
        e.id for e in load_glossary(workspace.glossary_path).entries if e.source == "田中"
    )
    apply_review(workspace, set_ko={tanaka: "다나카"})
    output.write_text(
        output.read_text(encoding="utf-8").replace(",,번역", ",,타나카 씨"), encoding="utf-8"
    )

    errors = lint_series(workspace).errors
    assert [(e.episode, e.code) for e in errors] == [("S01E01", "avoid_used")]
