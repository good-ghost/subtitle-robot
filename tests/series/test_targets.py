"""대상 언어별 작업공간 (PROJECT-PLAN §26.5, WI-8.002)."""

import json
from pathlib import Path

from subtitle_robot.checkpoint import Checkpoint, load_checkpoint, save_checkpoint
from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.series.manifest import scan_episodes
from subtitle_robot.series.runner import run_series
from subtitle_robot.series.workspace import SeriesWorkspace, init_series
from tests.fake_llm import FakeAdapter
from tests.series.test_runner import _respond, _series


def test_paths_per_target(tmp_path: Path) -> None:
    ko = SeriesWorkspace(tmp_path)
    fr = SeriesWorkspace(tmp_path, "fr")

    assert (ko.glossary_path.name, ko.phrases_path.name, ko.work_dir.name) == (
        "glossary.yaml",
        "phrases.yaml",
        "work",
    )
    assert (fr.glossary_path.name, fr.phrases_path.name, fr.work_dir.name) == (
        "glossary.fr.yaml",
        "phrases.fr.yaml",
        "work-fr",
    )
    assert fr.out_dir == ko.out_dir
    assert fr.state_path.parent.name == "work-fr"


def test_other_target_keeps_korean_files(tmp_path: Path) -> None:
    korean = _series(tmp_path)
    run_series(korean, FakeAdapter(_respond))
    snapshot = {path: path.read_bytes() for path in korean.root.rglob("*") if path.is_file()}

    french, _ = init_series(korean.root, "ja", target="fr")
    run_series(french, FakeAdapter(_respond))

    assert french.glossary_path.exists()
    assert len(load_glossary(french.glossary_path).entries) == 3
    assert (french.out_dir / "S01E01.fr.srt").exists()
    assert (french.root / "work-fr" / "S01E01" / "checkpoint.json").exists()
    assert {p: p.read_bytes() for p in snapshot} == snapshot  # 한국어 파일은 그대로
    # 대상 언어별 작업 폴더·출력은 에피소드로 인식하지 않는다
    assert [e.key for e in scan_episodes(korean.root, korean.settings()).episodes] == [
        "S01E01",
        "S01E02",
        "S01E03",
    ]
    rerun = FakeAdapter(_respond)
    run_series(korean, rerun)
    assert rerun.requests == []  # 한국어 번역은 fresh


def test_checkpoint_target_change_is_discarded(tmp_path: Path) -> None:
    path = tmp_path / "checkpoint.json"
    save_checkpoint(Checkpoint(source_sha256="x", src_lang="ja"), path)
    raw = json.loads(path.read_text(encoding="utf-8"))
    del raw["target_lang"]  # 0.6.0 전 체크포인트
    path.write_text(json.dumps(raw), encoding="utf-8")

    kept, reason = load_checkpoint(path, source_sha256="x", src_lang="ja")
    assert reason is None
    assert kept.target_lang == "ko"
    _, reason = load_checkpoint(path, source_sha256="x", src_lang="ja", target_lang="en")
    assert reason is not None
    assert "대상 언어" in reason
