from pathlib import Path

from subtitle_robot.watch.logfile import log_path
from tests.web.conftest import make_env

LINES = (
    "2026-10-03 10:00:01 INFO MainThread subtitle_robot.watch.daemon: daemon started\n"
    "2026-10-03 10:00:02 WARNING worker-1 subtitle_robot.watch.worker: job 1 failed: x\n"
)


def test_logs_api(tmp_path: Path) -> None:
    env = make_env(tmp_path)
    assert env.client.get("/api/logs").status_code == 401
    env.login()
    path = log_path(env.data)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(LINES, "utf-8")

    body = env.client.get("/api/logs").json()
    assert body["reset"] is True
    assert body["entries"][0] == {
        "time": "2026-10-03 10:00:01",
        "level": "INFO",
        "thread": "MainThread",
        "logger": "subtitle_robot.watch.daemon",
        "message": "daemon started",
    }
    warnings = env.client.get("/api/logs", params={"level": "WARNING"}).json()["entries"]
    assert [e["message"] for e in warnings] == ["job 1 failed: x"]

    with path.open("a", encoding="utf-8") as handle:
        handle.write(
            "2026-10-03 10:00:03 INFO worker-1 subtitle_robot.watch.worker: job 2 started\n"
        )
    later = env.client.get("/api/logs", params={"after": body["cursor"]}).json()
    assert later["reset"] is False
    assert [e["message"] for e in later["entries"]] == ["job 2 started"]

    assert env.client.get("/api/logs", params={"level": "LOUD"}).status_code == 422
    assert env.client.get("/api/logs", params={"limit": 0}).status_code == 422
