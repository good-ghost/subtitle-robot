import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.cli import DAEMON_LOG_FORMAT, EXIT_OK, main
from subtitle_robot.config import AppConfig, ConfigError
from subtitle_robot.llm.base import LlmAdapter
from tests.fake_llm import FakeAdapter
from tests.series.test_runner import _respond


@pytest.fixture
def logging_calls(monkeypatch: pytest.MonkeyPatch) -> list[dict[str, Any]]:
    calls: list[dict[str, Any]] = []
    monkeypatch.setattr(logging, "basicConfig", lambda **kwargs: calls.append(kwargs))
    return calls


def test_watch_logs_info_with_time_without_verbose(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, logging_calls: list[dict[str, Any]]
) -> None:
    # 컨테이너 기본 명령은 `watch` 하나다. -v 가 없어도 진행 로그가 컨테이너 로그에 남아야 한다
    def fake_daemon(_config: AppConfig, **_kwargs: object) -> bool:
        logging.getLogger("subtitle_robot.watch.daemon").info("daemon started")
        return False

    def factory(_config: AppConfig) -> LlmAdapter:
        return FakeAdapter(_respond)

    monkeypatch.setattr("subtitle_robot.cli.run_daemon", fake_daemon)
    monkeypatch.setattr("subtitle_robot.cli.signal.signal", lambda *_args: None)

    assert main(["--data", str(tmp_path), "watch"], adapter_factory=factory) == EXIT_OK

    assert logging_calls[0]["level"] == logging.INFO
    assert logging_calls[0]["format"] == DAEMON_LOG_FORMAT
    assert logging.getLogger("httpx").level == logging.WARNING  # 요청마다 남는 로그는 -v 일 때만
    # 웹 Logs 화면이 읽는 회전 로그 파일 (§25.8)
    handlers = logging_calls[0]["handlers"]
    files = [h for h in handlers if isinstance(h, RotatingFileHandler)]
    assert [Path(h.baseFilename) for h in files] == [tmp_path / "logs" / "daemon.log"]
    assert (files[0].maxBytes, files[0].backupCount) == (5 * 1024 * 1024, 2)
    for handler in handlers:
        handler.close()


def test_watch_without_writable_data_dir_still_logs_to_stderr(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, logging_calls: list[dict[str, Any]]
) -> None:
    blocker = tmp_path / "data"
    blocker.write_text("파일이라 폴더를 만들 수 없다", "utf-8")
    monkeypatch.setattr("subtitle_robot.cli.run_daemon", lambda *_a, **_k: False)
    monkeypatch.setattr("subtitle_robot.cli.signal.signal", lambda *_args: None)

    main(["--data", str(blocker), "watch"], adapter_factory=lambda _c: FakeAdapter(_respond))

    handlers = logging_calls[0]["handlers"]
    assert [type(h) for h in handlers] == [logging.StreamHandler]


def test_other_commands_stay_quiet(tmp_path: Path, logging_calls: list[dict[str, Any]]) -> None:
    main(["--data", str(tmp_path), "health"])

    assert logging_calls[0]["level"] == logging.WARNING
    assert "asctime" not in logging_calls[0]["format"]
    assert [type(h) for h in logging_calls[0]["handlers"]] == [logging.StreamHandler]
    assert not (tmp_path / "logs").exists()  # 데몬만 로그 파일을 쓴다


def test_verbose_shows_info(tmp_path: Path, logging_calls: list[dict[str, Any]]) -> None:
    main(["-v", "--data", str(tmp_path), "health"])

    assert logging_calls[0]["level"] == logging.INFO


def test_watch_without_provider_key_starts_daemon_without_adapter(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, logging_calls: list[dict[str, Any]]
) -> None:
    # 키는 웹 Settings 로 넣으므로 키가 없어도 데몬(웹)은 떠야 한다 (§28.2)
    received: list[object] = []

    def fake_daemon(_config: AppConfig, **kwargs: object) -> bool:
        received.append(kwargs["adapter"])
        return False

    def factory(_config: AppConfig) -> LlmAdapter:
        raise ConfigError("nim 의 API 키가 없다. 웹 Settings 의 키 탭에서 넣는다")

    monkeypatch.setattr("subtitle_robot.cli.run_daemon", fake_daemon)
    monkeypatch.setattr("subtitle_robot.cli.signal.signal", lambda *_args: None)

    assert main(["--data", str(tmp_path), "watch"], adapter_factory=factory) == EXIT_OK

    assert received == [None]
    for handler in logging_calls[0]["handlers"]:
        handler.close()
