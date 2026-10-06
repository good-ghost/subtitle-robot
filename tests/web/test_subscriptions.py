"""구독 로그인 API (PROJECT-PLAN §28.1, REQ-049, WI-10.008). 실제 CLI 를 실행하지 않는다."""

import json
import stat
import time
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.secret_store import SecretStore
from tests.llm.fake_cli import FakeCli, make_fake_cli
from tests.web.conftest import WebEnv, make_env
from tests.web.test_settings import CONFIG, _env, _put

CLAUDE_TOKEN = "sk-ant-oat01-subscription-token-abcd"
CODEX_AUTH = {"OPENAI_API_KEY": None, "tokens": {"id_token": "secret-id", "refresh_token": "r"}}


@pytest.fixture
def codex(tmp_path: Path) -> FakeCli:
    return make_fake_cli(tmp_path, "codex")


@pytest.fixture
def env(tmp_path: Path, codex: FakeCli) -> WebEnv:
    web = make_env(tmp_path, executables={"openai": str(codex.executable)})
    web.login()
    return web


def _wait(predicate: Callable[[], bool], timeout: float = 10.0) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if predicate():
            return
        time.sleep(0.05)
    raise AssertionError("timed out")


def _status(env: WebEnv) -> dict[str, Any]:
    return {row["provider"]: row for row in env.client.get("/api/subscriptions").json()}


def test_requires_login(tmp_path: Path) -> None:
    web = make_env(tmp_path)

    assert web.client.get("/api/subscriptions").status_code == 401
    assert web.client.post("/api/subscriptions/openai/device", json={}).status_code == 401


def test_claude_token_is_stored_and_only_hinted(env: WebEnv) -> None:
    assert {name: row["logged_in"] for name, row in _status(env).items()} == {
        "claude": False, "openai": False,
    }  # fmt: skip
    short = env.client.put("/api/subscriptions/claude", json={"credential": "short"})
    assert (short.status_code, short.json()) == (400, {"detail": "invalid_token"})

    saved = env.client.put("/api/subscriptions/claude", json={"credential": f"  {CLAUDE_TOKEN}\n"})

    body = saved.json()
    assert (body["provider"], body["logged_in"], body["hint"], body["updated_at"]) == (
        "claude", True, "…abcd", None,
    )  # fmt: skip
    assert CLAUDE_TOKEN not in env.client.get("/api/subscriptions").text
    store = SecretStore.for_data_dir(env.data)
    assert store.get("providers.claude.oauth_token") == CLAUDE_TOKEN
    cleared = env.client.delete(
        "/api/subscriptions/claude", headers={"content-type": "application/json"}
    )
    assert cleared.json()["logged_in"] is False
    assert store.get("providers.claude.oauth_token") is None


def test_codex_auth_json_is_written_private(env: WebEnv) -> None:
    bad = env.client.put("/api/subscriptions/openai", json={"credential": '{"no": "tokens"}'})
    assert (bad.status_code, bad.json()) == (400, {"detail": "invalid_codex_auth"})

    saved = env.client.put("/api/subscriptions/openai", json={"credential": json.dumps(CODEX_AUTH)})

    body = saved.json()
    assert body["logged_in"] is True
    assert body["updated_at"] is not None
    assert "secret-id" not in saved.text
    path = env.data / "subscriptions" / "openai" / "codex" / "auth.json"
    assert json.loads(path.read_text("utf-8")) == CODEX_AUTH
    assert stat.S_IMODE(path.stat().st_mode) == 0o600
    assert stat.S_IMODE(path.parent.stat().st_mode) == 0o700


def test_gemini_has_no_subscription_login(env: WebEnv) -> None:
    """Gemini 는 API 키만 쓴다 (WI-10.009g)."""
    response = env.client.put("/api/subscriptions/gemini", json={"credential": "{}"})

    assert response.status_code == 422


def test_codex_device_login_shows_url_and_code_then_done(env: WebEnv, codex: FakeCli) -> None:
    codex.scenario(
        early_stdout=(
            "Follow these steps to sign in with ChatGPT:\n"
            "1. Open this link in your browser\n   \x1b[94mhttps://auth.openai.com/codex/device\x1b[0m\n"
            "2. Enter this one-time code (expires in 15 minutes)\n   \x1b[1mABCD-12345\x1b[0m\n"
        ),
        sleep=0.5,
        write_env=[["CODEX_HOME", "auth.json", json.dumps(CODEX_AUTH)]],
        stdout="Successfully logged in\n",
    )

    started = env.client.post("/api/subscriptions/openai/device", json={})
    assert started.json()["state"] == "waiting"
    _wait(lambda: env.client.get("/api/subscriptions/openai/device").json()["code"] is not None)
    waiting = env.client.get("/api/subscriptions/openai/device").json()
    assert waiting["url"] == "https://auth.openai.com/codex/device"
    assert waiting["code"] == "ABCD-12345"
    _wait(lambda: env.client.get("/api/subscriptions/openai/device").json()["state"] == "done")

    assert _status(env)["openai"]["logged_in"] is True
    call = codex.calls()[0]
    assert call["argv"] == ["login", "--device-auth"]
    assert call["env"]["CODEX_HOME"] == str(env.data / "subscriptions" / "openai" / "codex")


def test_codex_device_login_failure_reports_last_line(env: WebEnv, codex: FakeCli) -> None:
    codex.scenario(stdout="Error: device code request failed\n", exit=1)

    env.client.post("/api/subscriptions/openai/device", json={})
    _wait(lambda: env.client.get("/api/subscriptions/openai/device").json()["state"] == "failed")

    assert env.client.get("/api/subscriptions/openai/device").json()["error"] == (
        "Error: device code request failed"
    )


def test_codex_device_login_cancel(env: WebEnv, codex: FakeCli) -> None:
    codex.scenario(early_stdout="https://auth.openai.com/codex/device\nWXYZ-98765\n", sleep=30)
    env.client.post("/api/subscriptions/openai/device", json={})
    _wait(lambda: env.client.get("/api/subscriptions/openai/device").json()["code"] == "WXYZ-98765")
    # 진행 중에 다시 시작하면 같은 로그인을 돌려준다
    assert (
        env.client.post("/api/subscriptions/openai/device", json={}).json()["code"] == "WXYZ-98765"
    )

    cancelled = env.client.request(
        "DELETE", "/api/subscriptions/openai/device", headers={"content-type": "application/json"}
    )

    assert cancelled.json() == {"state": "idle", "url": None, "code": None, "error": None}
    assert len(codex.calls()) == 1


def test_codex_device_login_without_cli(tmp_path: Path) -> None:
    web = make_env(tmp_path, executables={"openai": str(tmp_path / "missing-codex")})
    web.login()

    response = web.client.post("/api/subscriptions/openai/device", json={})

    assert (response.status_code, response.json()) == (400, {"detail": "cli_missing"})


def test_subscription_models(env: WebEnv) -> None:
    claude = env.client.get("/api/providers/claude/models", params={"auth": "subscription"})
    assert claude.json() == {"models": ["sonnet", "opus", "haiku", "fable"]}

    codex = env.client.get("/api/providers/openai/models", params={"auth": "subscription"})
    assert codex.status_code == 400
    assert codex.json()["detail"]["code"] == "subscription_manual"


def test_settings_save_auth_mode(tmp_path: Path) -> None:
    config_file = tmp_path / "config" / "config.toml"
    config_file.parent.mkdir()
    config_file.write_text(CONFIG, encoding="utf-8")
    web = _env(tmp_path, config_file)
    values = web.client.get("/api/settings").json()["values"]
    assert values["providers"]["claude"]["auth"] == "api_key"

    values["llm"]["provider"] = "claude"
    values["providers"]["claude"]["model"] = "sonnet"
    values["providers"]["claude"]["auth"] = "subscription"
    saved = _put(web, values)

    assert saved.status_code == 200
    assert 'auth = "subscription"' in config_file.read_text("utf-8")

    values["llm"]["provider"] = "nim"
    values["providers"]["nim"]["auth"] = "subscription"
    rejected = _put(web, values)
    assert rejected.status_code == 400
    error = rejected.json()["detail"]["errors"][0]
    assert (error["loc"], error["type"]) == ("providers.nim.auth", "subscription_unsupported")


def test_status_reports_missing_cli(tmp_path: Path, codex: FakeCli) -> None:
    """이 이미지에 CLI 가 없으면 상태에 알린다 (화면이 이미지 태그를 안내한다, WI-10.009c)."""
    web = make_env(
        tmp_path,
        executables={"openai": str(codex.executable), "claude": str(tmp_path / "no-claude")},
    )
    web.login()

    rows = _status(web)

    assert rows["openai"]["cli_available"] is True
    assert rows["claude"]["cli_available"] is False


@pytest.mark.parametrize(
    ("installed", "expected"),
    [
        (set(), []),  # latest: 구독 CLI 없음
        ({"claude"}, ["claude"]),  # claude 태그
        ({"codex"}, ["openai"]),  # codex 태그 (공급자 이름은 openai)
        ({"gemini"}, []),  # Gemini CLI 가 있어도 구독 공급자가 아니다
    ],
)
def test_settings_lists_subscription_clis_in_this_image(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, installed: set[str], expected: list[str]
) -> None:
    """Settings 는 CLI 가 있는 공급자만 구독 선택지를 보인다 (WI-10.009e)."""
    monkeypatch.setattr(
        "subtitle_robot.llm.logins.shutil.which",
        lambda name: f"/usr/bin/{name}" if name in installed else None,
    )
    config_file = tmp_path / "config" / "config.toml"
    config_file.parent.mkdir()
    config_file.write_text(CONFIG, encoding="utf-8")
    web = _env(tmp_path, config_file)

    assert web.client.get("/api/settings").json()["subscription_clis"] == expected
