import threading
import time
from pathlib import Path
from typing import Any

import httpx
import pytest

from subtitle_robot.cli import EXIT_RESTART, main
from subtitle_robot.config import AppConfig, WebConfig, load_config
from subtitle_robot.secret_store import SecretStore
from subtitle_robot.watch.daemon import run_daemon
from subtitle_robot.web.auth import AccountStore
from subtitle_robot.web.server import start_web_server
from tests.fake_llm import FakeAdapter
from tests.series.test_runner import _respond
from tests.web.conftest import TOKEN, WebEnv, make_env

CONFIG = """# 운영 설정 (사람이 쓴 주석)
[llm]
provider = "nim"

[providers.nim]
base_url = "https://integrate.api.nvidia.com/v1"
api_key_env = "NVIDIA_API_KEY"
model = "deepseek-ai/deepseek-v4.1-flash"
timeout = 300                      # 혼잡할 때 큰 요청이 120초를 넘는다
extra_body = { chat_template_kwargs = { enable_thinking = false } }

[watch]
stable_seconds = 60                # 복사 중 보호

[[watch.paths]]
path = "/media/movies"
kind = "movie"
"""


@pytest.fixture
def config_file(tmp_path: Path) -> Path:
    path = tmp_path / "config" / "config.toml"
    path.parent.mkdir()
    path.write_text(CONFIG, encoding="utf-8")
    return path


def _env(tmp_path: Path, config_file: Path | None, **kwargs: Any) -> WebEnv:
    config: AppConfig = load_config(config_file) if config_file else load_config(None)
    env = make_env(tmp_path, config=config, config_path=config_file, **kwargs)
    env.login()
    return env


def _put(env: WebEnv, values: dict[str, Any]) -> httpx.Response:
    response: httpx.Response = env.client.put("/api/settings", json={"values": values})
    return response


def test_get_settings(tmp_path: Path, config_file: Path) -> None:
    env = _env(tmp_path, config_file, started_at=time.time() + 10)

    body = env.client.get("/api/settings").json()

    assert body["path"] == str(config_file)
    assert (body["writable"], body["reason"], body["restart_pending"]) == (True, None, False)
    values = body["values"]
    assert values["watch"]["stable_seconds"] == 60
    assert values["watch"]["paths"] == [{"path": "/media/movies", "kind": "movie"}]
    assert values["watch"]["reconcile_interval"] == 900  # 기본값
    assert values["providers"]["nim"]["timeout"] == 300
    assert "api_key_env" not in values["providers"]["nim"]  # 키는 비밀 저장소 (§28.2)
    local = values["providers"]["local"]  # 파일에 없는 공급자: 기본값 + 빈 주소
    assert (local["base_url"], local["concurrency"]) == ("", "auto")
    assert "static_dir" not in values["web"]
    assert "extra_body" not in values["providers"]["nim"]


def test_save_keeps_comments_and_other_keys(tmp_path: Path, config_file: Path) -> None:
    env = _env(tmp_path, config_file)
    values = env.client.get("/api/settings").json()["values"]
    values["watch"]["stable_seconds"] = "30"  # 형은 검증 뒤 값으로 쓴다
    values["watch"]["paths"].append({"path": "/media/tv", "kind": "series"})
    values["queue"]["workers"] = 2
    values["providers"]["nim"]["api_key_env"] = "STOLEN"  # 보기 전용은 무시한다

    response = _put(env, values)

    assert response.status_code == 200
    assert response.json()["restart_pending"] is True
    text = config_file.read_text(encoding="utf-8")
    assert text.startswith("# 운영 설정 (사람이 쓴 주석)\n")
    assert "timeout = 300                      # 혼잡할 때 큰 요청이 120초를 넘는다" in text
    assert "extra_body = { chat_template_kwargs = { enable_thinking = false } }" in text
    assert "stable_seconds = 30" in text
    assert 'api_key_env = "NVIDIA_API_KEY"' in text
    saved = load_config(config_file)
    assert saved.watch.stable_seconds == 30
    assert [p.path for p in saved.watch.paths] == ["/media/movies", "/media/tv"]
    assert saved.queue.workers == 2
    assert saved.providers["nim"].extra_body == {"chat_template_kwargs": {"enable_thinking": False}}
    assert "reconcile_interval" not in text  # 바꾸지 않은 기본값은 쓰지 않는다
    assert "[providers.local]" not in text  # 주소를 비운 공급자는 만들지 않는다


def test_save_adds_local_provider(tmp_path: Path, config_file: Path) -> None:
    env = _env(tmp_path, config_file)
    values = env.client.get("/api/settings").json()["values"]
    values["llm"]["provider"] = "local"
    values["providers"]["local"]["base_url"] = "http://llm:8080/v1"

    assert _put(env, values).status_code == 200

    saved = load_config(config_file)
    assert saved.active_provider()[0] == "local"
    assert saved.providers["local"].base_url == "http://llm:8080/v1"


def test_invalid_values_are_400_and_file_unchanged(tmp_path: Path, config_file: Path) -> None:
    env = _env(tmp_path, config_file)
    values = env.client.get("/api/settings").json()["values"]
    values["watch"]["stable_seconds"] = -1
    values["web"]["port"] = "eighty"

    response = _put(env, values)

    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["code"] == "invalid_settings"
    assert {e["loc"] for e in detail["errors"]} == {"watch.stable_seconds", "web.port"}
    stable = next(e for e in detail["errors"] if e["loc"] == "watch.stable_seconds")
    assert (stable["type"], stable["ctx"]) == ("greater_than_equal", {"ge": "0"})
    assert config_file.read_text(encoding="utf-8") == CONFIG

    values = env.client.get("/api/settings").json()["values"]
    values["llm"]["provider"] = "local"  # local 주소 없음
    missing = _put(env, values).json()["detail"]
    assert missing["errors"][0]["loc"] == "providers.local.base_url"
    assert missing["errors"][0]["type"] == "provider_missing"


def test_no_change_does_not_touch_file(tmp_path: Path, config_file: Path) -> None:
    env = _env(tmp_path, config_file, started_at=time.time() + 10)
    before = config_file.stat().st_mtime_ns
    values = env.client.get("/api/settings").json()["values"]

    assert _put(env, values).json()["restart_pending"] is False
    assert config_file.stat().st_mtime_ns == before


def test_read_only_and_missing_config(tmp_path: Path, config_file: Path) -> None:
    config_file.parent.chmod(0o555)
    try:
        env = _env(tmp_path, config_file)
        body = env.client.get("/api/settings").json()
        assert (body["writable"], body["reason"]) == (False, "read_only")
        response = _put(env, body["values"])
        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "read_only"
    finally:
        config_file.parent.chmod(0o755)

    none = _env(tmp_path / "none", None)
    body = none.client.get("/api/settings").json()
    assert (body["path"], body["writable"], body["reason"]) == (None, False, "no_config_file")
    assert body["values"]["watch"]["stable_seconds"] == 60
    assert _put(none, body["values"]).json()["detail"]["code"] == "no_config_file"


def test_restart_api(tmp_path: Path) -> None:
    calls: list[str] = []
    env = _env(tmp_path, None, request_restart=lambda: calls.append("restart"))

    response = env.client.post("/api/daemon/restart", json={})

    assert (response.status_code, response.json()) == (202, {"restarting": True})
    assert calls == ["restart"]
    without = _env(tmp_path / "other", None)
    assert without.client.post("/api/daemon/restart", json={}).status_code == 409


def test_daemon_restart_from_web(tmp_path: Path, config_file: Path) -> None:
    base = load_config(config_file)
    config = base.model_copy(
        update={
            "web": WebConfig(host="127.0.0.1", port=0, static_dir=str(tmp_path)),
            "watch": base.watch.model_copy(update={"enabled": False}),
        }
    )
    AccountStore(SecretStore.for_data_dir(tmp_path / "data")).create("admin", TOKEN)
    stop = threading.Event()
    result: list[bool] = []
    servers: list[Any] = []

    def spy(*args: Any, **kwargs: Any) -> Any:
        servers.append(start_web_server(*args, **kwargs))
        return servers[-1]

    with pytest.MonkeyPatch.context() as patch:
        patch.setattr("subtitle_robot.watch.daemon.start_web_server", spy)
        thread = threading.Thread(
            target=lambda: result.append(
                run_daemon(
                    config, data_dir=tmp_path / "data", adapter=FakeAdapter(_respond), stop=stop,
                    config_path=config_file, heartbeat_interval=0.1,
                    idle_wait=0.1,
                )
            )
        )  # fmt: skip
        thread.start()
        deadline = time.monotonic() + 10
        while not (servers and servers[0].started) and time.monotonic() < deadline:
            time.sleep(0.05)
        base_url = f"http://127.0.0.1:{servers[0].bound_port()}"
        with httpx.Client(base_url=base_url) as client:
            client.post("/api/session", json={"username": "admin", "password": TOKEN})
            assert client.get("/api/settings").json()["path"] == str(config_file)
            assert client.post("/api/daemon/restart", json={}).status_code == 202
        thread.join(10)

    assert result == [True]  # 재기동 요청으로 끝났다
    assert stop.is_set()


def test_watch_exit_code_for_restart(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("subtitle_robot.cli.run_daemon", lambda *_a, **_k: True)
    monkeypatch.setattr("subtitle_robot.cli.signal.signal", lambda *_args: None)
    monkeypatch.setattr("subtitle_robot.cli._configure_logging", lambda _args: None)

    code = main(
        ["--data", str(tmp_path), "watch"], adapter_factory=lambda _c: FakeAdapter(_respond)
    )

    assert code == EXIT_RESTART == 4


def test_renamed_key_replaces_legacy_key(tmp_path: Path, config_file: Path) -> None:
    """0.6.0 전 이름(korean_image_counts)이 있는 파일에 새 이름으로 저장하면 옛 키를 지운다."""
    config_file.write_text(
        CONFIG + '\n[media]\nkorean_image_counts = false   # 옛 이름\nsource_langs = ["en"]\n',
        encoding="utf-8",
    )
    env = _env(tmp_path, config_file)
    values = env.client.get("/api/settings").json()["values"]
    assert values["media"]["target_image_counts"] is False  # 옛 이름도 읽는다
    assert "source_langs" not in values["media"]  # 쓰지 않는 설정은 화면에 없다

    values["media"]["target_image_counts"] = True
    assert _put(env, values).status_code == 200

    text = config_file.read_text(encoding="utf-8")
    assert "korean_image_counts" not in text
    assert "target_image_counts = true" in text
    assert 'source_langs = ["en"]' in text  # 다루지 않는 키는 그대로
    assert load_config(config_file).media.target_image_counts is True


def test_target_language_and_tmdb_settings(
    tmp_path: Path, config_file: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """번역 탭: 대상 언어 목록·저장·검증, TMDB 키는 이름만 (§26.7)."""
    monkeypatch.delenv("TMDB_API_KEY", raising=False)
    env = _env(tmp_path, config_file)
    body = env.client.get("/api/settings").json()
    values = body["values"]
    assert values["translation"] == {"target_language": "ko"}
    assert values["tmdb"] == {"enabled": True, "timeout": 10.0}
    languages = {item["code"]: item["name"] for item in body["languages"]}
    assert (languages["ko"], languages["fr"], len(languages)) == ("Korean", "French", 184)
    status = env.client.get("/api/status").json()
    assert (status["target_language"], status["tmdb_active"]) == ("ko", False)

    values["translation"]["target_language"] = "xx"
    response = _put(env, values)
    assert response.status_code == 400
    assert [e["loc"] for e in response.json()["detail"]["errors"]] == ["translation.target_language"]

    values["translation"]["target_language"] = "fr"
    values["tmdb"]["enabled"] = False
    assert _put(env, values).status_code == 200
    text = config_file.read_text(encoding="utf-8")
    assert '[translation]\ntarget_language = "fr"' in text
    assert "[tmdb]\nenabled = false" in text
    assert "# 운영 설정 (사람이 쓴 주석)" in text
    saved = load_config(config_file)
    assert (saved.translation.target_language, saved.tmdb.enabled) == ("fr", False)


def test_tmdb_active_needs_key(
    tmp_path: Path, config_file: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("TMDB_API_KEY", "env-value-ignored")
    env = _env(tmp_path, config_file)
    assert env.client.get("/api/status").json()["tmdb_active"] is False  # 환경 변수는 읽지 않는다

    SecretStore.for_data_dir(env.data).set("tmdb.api_key", "secret-value")
    assert env.client.get("/api/status").json()["tmdb_active"] is True
    assert "secret-value" not in env.client.get("/api/settings").text


def test_provider_models_api(
    tmp_path: Path, config_file: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """모델 목록 API (§27.3): 키는 비밀 저장소(환경 변수는 읽지 않는다), 실패는 400 과 이유 코드."""
    monkeypatch.setenv("ANTHROPIC_API_KEY", "from-env-ignored")
    env = _env(tmp_path, config_file)

    missing = env.client.get("/api/providers/claude/models")
    assert missing.status_code == 400
    assert missing.json()["detail"]["code"] == "no_key"
    assert env.client.get("/api/providers/unknown/models").status_code == 422

    calls: list[dict[str, object]] = []

    def fake_list(name: str, **kwargs: object) -> list[str]:
        calls.append({"name": name, **kwargs})
        return ["model-a", "model-b"]

    monkeypatch.setattr("subtitle_robot.web.settings.list_models", fake_list)
    body = env.client.get(
        "/api/providers/ollama/models", params={"base_url": "http://gpu:11434"}
    ).json()
    assert body == {"models": ["model-a", "model-b"]}
    assert (calls[0]["name"], calls[0]["base_url"], calls[0]["api_key"]) == (
        "ollama",
        "http://gpu:11434",
        None,
    )
    SecretStore.for_data_dir(env.data).set("providers.claude.api_key", "sk-ant-store")
    env.client.get("/api/providers/claude/models")
    assert calls[1]["base_url"] == "https://api.anthropic.com"  # 설정에 없으면 기본 주소
    assert calls[1]["api_key"] == "sk-ant-store"
    env.client.cookies.clear()
    assert env.client.get("/api/providers/claude/models").status_code == 401


def test_new_provider_saves_only_changed_values(tmp_path: Path, config_file: Path) -> None:
    """새 공급자(§27.3): 고르고 모델만 넣으면 그 값만 쓴다. 모델이 비면 모델 칸 오류."""
    env = _env(tmp_path, config_file)
    values = env.client.get("/api/settings").json()["values"]
    assert set(values["providers"]) == {
        "nim", "local", "ollama", "openrouter", "openai", "claude", "gemini",
    }  # fmt: skip
    claude = values["providers"]["claude"]
    assert (claude["base_url"], claude["model"]) == ("https://api.anthropic.com", "")
    assert values["providers"]["openai"]["temperature"] is None

    values["llm"]["provider"] = "claude"
    response = _put(env, values)
    assert response.status_code == 400
    errors = response.json()["detail"]["errors"]
    assert [(e["loc"], e["type"]) for e in errors] == [("providers.claude.model", "model_missing")]

    values["providers"]["claude"]["model"] = "claude-test"
    values["providers"]["ollama"]["context_tokens"] = 16384
    assert _put(env, values).status_code == 200
    text = config_file.read_text(encoding="utf-8")
    assert '[providers.claude]\nmodel = "claude-test"' in text
    assert "api.anthropic.com" not in text  # 기본값은 쓰지 않는다
    assert "[providers.ollama]\ncontext_tokens = 16384" in text
    assert "[providers.gemini]" not in text  # 바꾸지 않은 공급자는 표를 만들지 않는다
    saved = load_config(config_file)
    assert saved.active_provider()[1].model == "claude-test"


def test_secrets_api_masks_values(tmp_path: Path, config_file: Path) -> None:
    """키 관리 (§28.2): 넣고 지울 수 있고, 값은 응답에 없다. 계정·세션 키는 이 API 로 못 바꾼다."""
    env = _env(tmp_path, config_file)
    listing = env.client.get("/api/secrets").json()
    keys = [item["key"] for item in listing]
    assert "providers.claude.api_key" in keys
    assert "tmdb.api_key" in keys
    assert all(not item["set"] for item in listing)

    secret = "sk-ant-api03-very-secret-9876"
    saved = env.client.put("/api/secrets", json={"key": "providers.claude.api_key", "value": secret})
    assert saved.json() == {"key": "providers.claude.api_key", "set": True, "hint": "…9876"}
    assert secret not in env.client.get("/api/secrets").text
    assert SecretStore.for_data_dir(env.data).provider_key("claude") == secret

    cleared = env.client.put("/api/secrets", json={"key": "providers.claude.api_key", "value": ""})
    assert cleared.json()["set"] is False
    blocked = env.client.put("/api/secrets", json={"key": "account.password_hash", "value": "x"})
    assert (blocked.status_code, blocked.json()["detail"]) == (400, "unknown_secret")
    assert "Asia/Seoul" in env.client.get("/api/settings").json()["timezones"]
    env.client.cookies.clear()
    assert env.client.get("/api/secrets").status_code == 401
