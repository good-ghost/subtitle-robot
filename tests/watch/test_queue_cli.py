from pathlib import Path

import pytest

from subtitle_robot.cli import EXIT_OK, EXIT_USAGE, main
from subtitle_robot.watch.queue import JobQueue
from subtitle_robot.watch.state import state_path


def test_queue_commands(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    queue = JobQueue(state_path(tmp_path), max_attempts=1)
    queue.enqueue(Path("/m/new.mkv"))
    queue.enqueue(Path("/m/old.mkv"), priority="backlog")
    job = queue.claim()
    assert job is not None
    queue.fail(job.id, "mkvmerge 실패")
    queue.on_unavailable("429 Too Many Requests")

    assert main(["--data", str(tmp_path), "queue", "list"]) == EXIT_OK
    printed = capsys.readouterr().out
    assert "공급자: unavailable (429 Too Many Requests)" in printed
    assert "failed      new     /m/new.mkv — mkvmerge 실패" in printed
    assert "queued      backlog /m/old.mkv" in printed

    assert main(["--data", str(tmp_path), "queue", "list", "--status", "failed"]) == EXIT_OK
    assert "작업 1건" in capsys.readouterr().out

    assert main(["--data", str(tmp_path), "queue", "retry", str(job.id)]) == EXIT_OK
    assert queue.get(job.id).status == "queued"
    assert main(["--data", str(tmp_path), "queue", "retry", "999"]) == EXIT_USAGE

    queue.on_available()  # 공급자 불가 동안에는 작업을 꺼내지 않는다
    failed = queue.claim()
    assert failed is not None
    queue.fail(failed.id, "x")
    assert main(["--data", str(tmp_path), "queue", "clear-failed"]) == EXIT_OK
    assert "지운 실패 작업: 1건" in capsys.readouterr().out


def test_data_dir_from_environment(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setenv("SUBTITLE_ROBOT_DATA", str(tmp_path / "env-data"))

    assert main(["queue", "list"]) == EXIT_OK
    assert "작업 0건" in capsys.readouterr().out
    assert (tmp_path / "env-data" / "state.db").exists()
