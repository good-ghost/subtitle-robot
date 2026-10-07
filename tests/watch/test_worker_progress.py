"""번역 중 진행을 작업 detail 에 남긴다 (WI-7.004c)."""

import sqlite3
from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.watch.worker import PROGRESS_KEY
from tests.media.test_external import ENGLISH_SRT
from tests.watch.test_worker_external import Env


def _recorded(env: Env, monkeypatch: pytest.MonkeyPatch) -> list[Any]:
    values: list[Any] = []
    original = env.queue.update_detail

    def spy(job_id: int, detail: dict[str, Any]) -> Any:
        if PROGRESS_KEY in detail:
            values.append(detail[PROGRESS_KEY])
        return original(job_id, detail)

    monkeypatch.setattr(env.queue, "update_detail", spy)
    return values


def test_progress_is_recorded_while_translating(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    env = Env(tmp_path, monkeypatch)
    video = env.video()
    (env.movies / "Sea Lark (2026).en.srt").write_text(ENGLISH_SRT, encoding="utf-8")
    values = _recorded(env, monkeypatch)

    assert env.run(video).verdict == "translated"

    assert values[0] is None  # 번역 단계에 들어가면 이전 시도의 진행을 지운다
    assert values[1] == {"done": 0, "total": 2}
    assert values[-1] == {"done": 2, "total": 2}


def test_progress_write_failure_does_not_stop_translation(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    env = Env(tmp_path, monkeypatch)
    video = env.video()
    (env.movies / "Sea Lark (2026).en.srt").write_text(ENGLISH_SRT, encoding="utf-8")
    original = env.queue.update_detail

    def locked(job_id: int, detail: dict[str, Any]) -> Any:
        if detail.get(PROGRESS_KEY):
            raise sqlite3.OperationalError("database is locked")
        return original(job_id, detail)

    monkeypatch.setattr(env.queue, "update_detail", locked)

    assert env.run(video).verdict == "translated"
