import logging
import threading
import time
from pathlib import Path
from typing import Any

import httpx
import pytest
from fastapi import APIRouter

from subtitle_robot.config import WebConfig, load_config
from subtitle_robot.secret_store import SecretStore
from subtitle_robot.watch.daemon import run_daemon
from subtitle_robot.web.auth import AccountStore
from subtitle_robot.web.auth import SESSION_COOKIE
from subtitle_robot.web.server import WebServer, start_web_server
from tests.fake_llm import FakeAdapter
from tests.series.test_runner import _respond
from tests.web.conftest import TOKEN, WebEnv, make_env

ping = APIRouter(prefix="/api")


@ping.get("/ping")
def _ping() -> dict[str, str]:
    return {"pong": "ok"}


@ping.post("/echo")
def _echo(body: dict[str, str]) -> dict[str, str]:
    return body


@pytest.fixture
def guarded(tmp_path: Path) -> WebEnv:
    return make_env(tmp_path, routers=(ping,))


def test_protected_api_needs_login(guarded: WebEnv) -> None:
    assert guarded.client.get("/api/ping").status_code == 401
    assert guarded.client.get("/api/session").json() == {"authenticated": False, "username": None, "setup_required": False}

    guarded.login()

    assert guarded.client.get("/api/ping").json() == {"pong": "ok"}
    assert guarded.client.get("/api/session").json() == {
        "authenticated": True,
        "username": "admin",
        "setup_required": False,
    }


def test_login_sets_strict_http_only_cookie(guarded: WebEnv) -> None:
    response = guarded.client.post("/api/session", json={"username": "admin", "password": TOKEN})

    cookie = response.headers["set-cookie"]
    assert cookie.startswith(f"{SESSION_COOKIE}=")
    assert "HttpOnly" in cookie
    assert "SameSite=strict" in cookie
    assert "Max-Age=3600" in cookie
    assert TOKEN not in cookie


def test_wrong_credentials_are_slow_401(guarded: WebEnv) -> None:
    for body in ({"username": "admin", "password": "wrong"}, {"username": "root", "password": TOKEN}):
        started = time.monotonic()
        response = guarded.client.post("/api/session", json=body)
        assert response.status_code == 401
        assert response.json() == {"detail": "invalid_credentials"}
        assert time.monotonic() - started >= 0.2
    assert guarded.client.get("/api/ping").status_code == 401


def test_logout_and_forged_cookie(guarded: WebEnv) -> None:
    guarded.login()
    assert guarded.client.request(
        "DELETE", "/api/session", headers={"content-type": "application/json"}
    ).json() == {"authenticated": False, "username": None, "setup_required": False}
    assert guarded.client.get("/api/ping").status_code == 401

    guarded.client.cookies.set(SESSION_COOKIE, f"{int(time.time())}.{'0' * 64}")
    assert guarded.client.get("/api/ping").status_code == 401


def test_writes_require_json(guarded: WebEnv) -> None:
    guarded.login()
    form = guarded.client.post("/api/echo", content="a=b", headers={"content-type": "text/plain"})
    assert form.status_code == 415
    assert form.json() == {"detail": "json_required"}
    assert guarded.client.post("/api/echo", json={"a": "b"}).json() == {"a": "b"}
    # 로그인도 쓰기 요청이다 (다른 사이트의 폼으로 로그인시키지 못한다)
    login_form = guarded.client.post(
        "/api/session", content=f"username=admin&password={TOKEN}",
        headers={"content-type": "application/x-www-form-urlencoded"},
    )  # fmt: skip
    assert login_form.status_code == 415


def test_static_index_and_security_headers(guarded: WebEnv) -> None:
    response = guarded.client.get("/")

    assert response.status_code == 200
    assert "<title>Subtitle Robot</title>" in response.text
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert guarded.client.get("/docs").status_code == 404  # API 문서는 열지 않는다


def test_missing_static_dir_serves_api_only(tmp_path: Path) -> None:
    env = make_env(tmp_path, static=tmp_path / "none")

    assert env.client.get("/").status_code == 404
    assert env.client.get("/api/session").status_code == 200


def _wait(predicate: object, timeout: float = 10.0) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if callable(predicate) and predicate():
            return
        time.sleep(0.05)
    raise AssertionError("timed out")


def test_web_server_thread_starts_and_stops(guarded: WebEnv) -> None:
    server = WebServer(guarded.client.app, host="127.0.0.1", port=0)  # type: ignore[arg-type]
    server.start()
    _wait(lambda: server.started)
    port = server.bound_port()

    assert httpx.get(f"http://127.0.0.1:{port}/api/session").status_code == 200

    server.stop()
    assert not server.alive


def test_port_in_use_does_not_raise(guarded: WebEnv, caplog: pytest.LogCaptureFixture) -> None:
    first = WebServer(guarded.client.app, host="127.0.0.1", port=0)  # type: ignore[arg-type]
    first.start()
    _wait(lambda: first.started)
    port = first.bound_port()
    assert port is not None

    second = WebServer(guarded.client.app, host="127.0.0.1", port=port)  # type: ignore[arg-type]
    second.start()
    _wait(lambda: not second.alive)

    assert "could not start" in caplog.text
    first.stop()


def test_daemon_runs_web_with_account(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    static = tmp_path / "static"
    static.mkdir()
    (static / "index.html").write_text("<title>Subtitle Robot</title>", "utf-8")
    base = load_config(None)
    config = base.model_copy(
        update={
            "web": WebConfig(host="127.0.0.1", port=0, static_dir=str(static)),
            "watch": base.watch.model_copy(update={"enabled": False}),
        }
    )
    AccountStore(SecretStore.for_data_dir(tmp_path / "data")).create("admin", TOKEN)
    stop = threading.Event()
    started: list[WebServer] = []

    def spy(*args: Any, **kwargs: Any) -> WebServer:
        server = start_web_server(*args, **kwargs)
        started.append(server)
        return server

    monkeypatch.setattr("subtitle_robot.watch.daemon.start_web_server", spy)
    thread = threading.Thread(
        target=run_daemon,
        args=(config,),
        kwargs={
            "data_dir": tmp_path / "data",
            "adapter": FakeAdapter(_respond),
            "stop": stop,
            "heartbeat_interval": 0.1,
            "idle_wait": 0.1,
        },
    )
    thread.start()
    try:
        _wait(lambda: bool(started) and started[0].started)
        port = started[0].bound_port()
        response = httpx.post(
            f"http://127.0.0.1:{port}/api/session", json={"username": "admin", "password": TOKEN}
        )
        assert response.status_code == 200
        assert "<title>" in httpx.get(f"http://127.0.0.1:{port}/").text
    finally:
        stop.set()
        thread.join(10)
    assert not thread.is_alive()
    assert not started[0].alive  # 데몬 종료 때 웹도 멈춘다


def test_daemon_without_adapter_serves_web_only(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    """키가 없으면 어댑터 없이 웹만 띄우고 워커는 시작하지 않는다 (§28.2)."""
    caplog.set_level(logging.INFO)
    base = load_config(None)
    config = base.model_copy(
        update={
            "web": WebConfig(host="127.0.0.1", port=0, static_dir=str(tmp_path / "none")),
            "watch": base.watch.model_copy(update={"enabled": False}),
        }
    )
    stop = threading.Event()
    started: list[WebServer] = []

    def spy(*args: Any, **kwargs: Any) -> WebServer:
        server = start_web_server(*args, **kwargs)
        started.append(server)
        return server

    monkeypatch.setattr("subtitle_robot.watch.daemon.start_web_server", spy)
    thread = threading.Thread(
        target=run_daemon,
        args=(config,),
        kwargs={"data_dir": tmp_path / "data", "adapter": None, "stop": stop, "heartbeat_interval": 0.1},
    )
    thread.start()
    try:
        _wait(lambda: bool(started) and started[0].started)
        port = started[0].bound_port()
        session = httpx.get(f"http://127.0.0.1:{port}/api/session").json()
        assert session["setup_required"] is True  # 처음 설정부터 할 수 있다
        assert not [t for t in threading.enumerate() if t.name.startswith("worker-")]
    finally:
        stop.set()
        thread.join(10)
    assert not thread.is_alive()
    assert "translation workers are not started" in caplog.text
    assert "daemon started: 0 workers" in caplog.text


def test_first_run_setup_then_login(tmp_path: Path) -> None:
    """처음 설정 (§28.3, Q-25): 계정이 없으면 누구나 만들 수 있고, 생기면 다시 열리지 않는다."""
    env = make_env(tmp_path, account=False)
    client = env.client

    assert client.get("/api/session").json()["setup_required"] is True
    assert client.get("/api/status").status_code == 401
    login = client.post("/api/session", json={"username": "admin", "password": "whatever-1"})
    assert login.status_code == 409
    assert client.post(
        "/api/session/setup", json={"username": "boss", "password": "short"}
    ).json() == {"detail": "password_too_short"}

    created = client.post("/api/session/setup", json={"username": "boss", "password": "long enough"})
    assert created.status_code == 200
    assert created.json() == {"authenticated": True, "username": "boss", "setup_required": False}
    assert client.get("/api/status").status_code == 200  # 만들면 바로 로그인된다
    again = client.post("/api/session/setup", json={"username": "evil", "password": "long enough"})
    assert again.status_code == 409


def test_account_change_ends_sessions(web: WebEnv) -> None:
    web.login()
    assert web.client.get("/api/account").json() == {"username": "admin"}

    wrong = web.client.put(
        "/api/account", json={"current_password": "nope", "username": "admin", "new_password": "new-password-1"}
    )
    assert wrong.status_code == 403
    changed = web.client.put(
        "/api/account",
        json={"current_password": TOKEN, "username": "root", "new_password": "new-password-1"},
    )
    assert changed.json() == {"username": "root"}
    assert web.client.get("/api/status").status_code == 401  # 다시 로그인해야 한다
    ok = web.client.post("/api/session", json={"username": "root", "password": "new-password-1"})
    assert ok.status_code == 200
