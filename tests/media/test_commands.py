import threading
import time

import pytest

from subtitle_robot.media.commands import (
    CommandCancelled,
    MediaToolError,
    low_priority_prefix,
    run_command,
    tool_runner,
)


def test_runs_command_and_returns_output() -> None:
    result = run_command(["sh", "-c", "echo out; echo err >&2; exit 3"], timeout=10)
    assert (result.returncode, result.stdout.strip(), result.stderr.strip()) == (3, "out", "err")


def test_low_priority_runs_with_nice_and_idle_io() -> None:
    # 다운로드 도구와 같은 디스크를 써도 양보하게 낮은 우선순위로 실행한다 (WI-5.009b)
    assert low_priority_prefix() == ("ionice", "-c", "3", "nice", "-n", "19")
    result = run_command(["sh", "-c", "nice; ionice"], timeout=10, low_priority=True)
    niceness, io_class = result.stdout.split()
    assert niceness == "19"
    assert io_class == "idle"
    normal = run_command(["sh", "-c", "nice"], timeout=10)
    assert normal.stdout.strip() == "0"


def test_stop_request_ends_running_tool_quickly() -> None:
    stop = threading.Event()
    threading.Timer(0.3, stop.set).start()
    started = time.monotonic()

    with pytest.raises(CommandCancelled, match="sleep"):
        run_command(["sleep", "30"], timeout=60, low_priority=True, should_stop=stop.is_set)

    assert time.monotonic() - started < 5


def test_timeout_and_missing_tool() -> None:
    with pytest.raises(MediaToolError, match="안에 끝나지 않았다"):
        run_command(["sleep", "5"], timeout=0.3, should_stop=lambda: False)
    with pytest.raises(MediaToolError, match="안에 끝나지 않았다"):
        run_command(["sleep", "5"], timeout=0.3)
    with pytest.raises(MediaToolError, match="mkvtoolnix"):
        run_command(["no-such-media-tool"], timeout=1, low_priority=True)


def test_tool_runner_binds_options() -> None:
    run = tool_runner(10, low_priority=True)
    assert run(["sh", "-c", "nice"]).stdout.strip() == "19"
