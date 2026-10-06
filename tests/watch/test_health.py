import time
from pathlib import Path

import pytest

from subtitle_robot.cli import EXIT_FAILED, EXIT_OK, main
from subtitle_robot.watch.heartbeat import HEALTH_MAX_AGE_S, HEARTBEAT_KEY, heartbeat_age
from subtitle_robot.watch.queue import JobQueue
from subtitle_robot.watch.state import state_path


def test_heartbeat_age(tmp_path: Path) -> None:
    db = state_path(tmp_path)
    assert heartbeat_age(db) is None  # DB 없음
    queue = JobQueue(db)
    assert heartbeat_age(db) is None  # 기록 없음

    queue.set_meta({HEARTBEAT_KEY: "1000.0"})

    assert heartbeat_age(db, now=1030.0) == 30.0


def test_health_command(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    base = ["--data", str(tmp_path), "health"]
    assert main(base) == EXIT_FAILED
    queue = JobQueue(state_path(tmp_path))

    queue.set_meta({HEARTBEAT_KEY: repr(time.time())})
    assert main(base) == EXIT_OK
    assert "정상" in capsys.readouterr().out

    queue.set_meta({HEARTBEAT_KEY: repr(time.time() - HEALTH_MAX_AGE_S - 5)})
    assert main(base) == EXIT_FAILED
