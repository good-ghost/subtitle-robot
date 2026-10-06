import logging
from collections.abc import Iterator
from pathlib import Path

import pytest

from subtitle_robot.cli import DAEMON_LOG_DATEFMT, DAEMON_LOG_FORMAT
from subtitle_robot.watch import logfile
from subtitle_robot.watch.logfile import log_path, open_log_handler, read_log


@pytest.fixture
def daemon_log(tmp_path: Path) -> Iterator[logging.Logger]:
    handler = open_log_handler(tmp_path)
    handler.setFormatter(logging.Formatter(DAEMON_LOG_FORMAT, DAEMON_LOG_DATEFMT))
    logger = logging.getLogger("tests.logfile")
    logger.propagate = False
    logger.setLevel(logging.DEBUG)
    logger.handlers = [handler]
    yield logger
    handler.close()
    logger.handlers = []


def test_entries_levels_and_traceback(tmp_path: Path, daemon_log: logging.Logger) -> None:
    daemon_log.debug("probe details")
    daemon_log.info("queued (movie, new): /media/movies/A.mkv")
    try:
        raise ValueError("broken track")
    except ValueError:
        daemon_log.exception("job 3 failed")

    chunk = read_log(tmp_path)

    assert chunk.reset is True
    assert [e.level for e in chunk.entries] == ["DEBUG", "INFO", "ERROR"]
    first = chunk.entries[1]
    assert (first.thread, first.logger) == ("MainThread", "tests.logfile")
    assert first.message == "queued (movie, new): /media/movies/A.mkv"
    assert len(first.time) == 19
    assert first.time[:4].isdigit()
    error = chunk.entries[2]
    assert error.message.startswith("job 3 failed\nTraceback (most recent call last):")
    assert error.message.endswith("ValueError: broken track")

    warnings = read_log(tmp_path, level="WARNING").entries
    assert [e.message.split("\n")[0] for e in warnings] == ["job 3 failed"]
    assert [e.level for e in read_log(tmp_path, limit=1).entries] == ["ERROR"]


def test_cursor_reads_only_new_entries(tmp_path: Path, daemon_log: logging.Logger) -> None:
    daemon_log.info("one")
    first = read_log(tmp_path)

    assert read_log(tmp_path, cursor=first.cursor).entries == []
    daemon_log.info("two")
    later = read_log(tmp_path, cursor=first.cursor)

    assert later.reset is False
    assert [e.message for e in later.entries] == ["two"]
    stale = read_log(tmp_path, cursor="0-0:10")  # 다른 파일(회전·교체)
    assert stale.reset is True
    assert [e.message for e in stale.entries] == ["one", "two"]


def test_rotation_keeps_previous_file_visible(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    path = log_path(tmp_path)
    path.parent.mkdir(parents=True)
    line = "2026-10-03 10:00:0{n} INFO worker-1 subtitle_robot.watch.worker: entry {n}\n"
    path.with_name("daemon.log.1").write_text("".join(line.format(n=n) for n in (1, 2)), "utf-8")
    path.write_text(line.format(n=3), "utf-8")

    entries = read_log(tmp_path).entries
    assert [e.message for e in entries] == ["entry 1", "entry 2", "entry 3"]

    # 끝부분만 읽을 때 잘린 첫 줄과 앞 항목 없는 이어진 줄은 버린다
    monkeypatch.setattr(logfile, "TAIL_BYTES", len(line.format(n=3)) + 10)
    path.with_name("daemon.log.1").unlink()
    path.write_text('  File "x.py", line 1\n' + line.format(n=4) + line.format(n=5), "utf-8")
    assert [e.message for e in read_log(tmp_path).entries] == ["entry 5"]


def test_missing_log_file(tmp_path: Path) -> None:
    chunk = read_log(tmp_path)
    assert (chunk.entries, chunk.cursor, chunk.reset) == ([], "", True)
