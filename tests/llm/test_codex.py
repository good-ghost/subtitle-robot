"""ChatGPT 구독: Codex CLI 어댑터 (PROJECT-PLAN §28.1, WI-10.006).

실제 `codex`를 실행하지 않는다.
"""

import json
from pathlib import Path
from typing import Any

import pytest
from pydantic import BaseModel

from subtitle_robot.config import ConfigError, parse_config
from subtitle_robot.llm.base import ChatMessage, ChatRequest, ProviderSettings
from subtitle_robot.llm.codex import CodexAdapter, strict_json_schema
from subtitle_robot.llm.errors import LlmResponseError, ProviderUnavailableError
from subtitle_robot.llm.factory import create_adapter
from subtitle_robot.llm.subscription import subscription_home
from subtitle_robot.secret_store import SecretStore
from tests.llm.fake_cli import FakeCli, make_fake_cli


@pytest.fixture
def cli_installed(monkeypatch: pytest.MonkeyPatch) -> None:
    """구독 CLI 가 PATH 에 있다고 본다 (팩토리 테스트가 개발 환경의 설치 여부에 좌우되지 않게)."""
    monkeypatch.setattr("subtitle_robot.llm.logins.shutil.which", lambda name: f"/usr/bin/{name}")


class Item(BaseModel):
    idx: int
    note: str | None = None


class Out(BaseModel):
    text: str
    items: list[Item] = []


REQUEST = ChatRequest(
    messages=[
        ChatMessage(role="system", content="자막 번역가다."),
        ChatMessage(role="user", content="Hello → 한국어"),
    ],
    output_schema=Out.model_json_schema(),
    schema_name="Out",
)


def _events(*extra: dict[str, Any], usage: bool = True) -> str:
    events: list[dict[str, Any]] = [
        {"type": "thread.started", "thread_id": "t-1"},
        {"type": "turn.started"},
        {"type": "item.completed", "item": {"type": "agent_message", "text": '{"text": "이벤트"}'}},
        *extra,
    ]
    if usage:
        events.append(
            {
                "type": "turn.completed",
                "usage": {"input_tokens": 120, "cached_input_tokens": 100, "output_tokens": 9},
            }
        )
    return "\n".join(json.dumps(e, ensure_ascii=False) for e in events) + "\n"


@pytest.fixture
def fake(tmp_path: Path) -> FakeCli:
    return make_fake_cli(tmp_path, "codex")


def _adapter(fake: FakeCli, tmp_path: Path) -> CodexAdapter:
    settings = ProviderSettings(base_url="https://api.openai.com/v1", model="gpt-5-codex")
    adapter = CodexAdapter(
        settings,
        home=subscription_home(tmp_path / "data", "openai"),
        executable=str(fake.executable),
    )
    adapter.codex_home.mkdir(parents=True)
    (adapter.codex_home / "auth.json").write_text('{"tokens": "x"}', "utf-8")
    return adapter


def test_runs_codex_exec_with_schema_file_and_last_message(
    fake: FakeCli, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "sk-should-not-leak")
    monkeypatch.setenv("CODEX_API_KEY", "sk-should-not-leak")
    fake.scenario(
        stdout=_events(), write_after={"--output-last-message": '{"text": "안녕", "items": []}'}
    )
    adapter = _adapter(fake, tmp_path)

    result = adapter.chat(REQUEST)

    call = fake.calls()[0]
    argv = call["argv"]
    assert argv[0] == "exec"
    assert argv[-1] == "-"  # 프롬프트는 표준 입력
    assert argv[argv.index("--model") + 1] == "gpt-5-codex"
    assert argv[argv.index("--sandbox") + 1] == "read-only"
    assert {"--ephemeral", "--skip-git-repo-check", "--json"} <= set(argv)
    assert Path(argv[argv.index("--output-last-message") + 1]).parent == Path(call["cwd"])
    schema = json.loads(call["files"]["output-schema.json"])
    assert schema["required"] == ["text", "items"]
    assert schema["additionalProperties"] is False
    assert call["stdin"] == "자막 번역가다.\n\nHello → 한국어"
    env = call["env"]
    assert env["CODEX_HOME"] == str(adapter.codex_home)
    assert "OPENAI_API_KEY" not in env
    assert "CODEX_API_KEY" not in env
    assert json.loads(result.json_text) == {"text": "안녕", "items": []}
    assert (result.prompt_tokens, result.completion_tokens) == (120, 9)
    assert result.model == "gpt-5-codex"


def test_falls_back_to_last_agent_message_event(fake: FakeCli, tmp_path: Path) -> None:
    fake.scenario(stdout=_events())

    result = _adapter(fake, tmp_path).chat(REQUEST)

    assert json.loads(result.json_text) == {"text": "이벤트"}


def test_turn_failed_usage_limit_pauses(fake: FakeCli, tmp_path: Path) -> None:
    failed = {"type": "turn.failed", "error": {"message": "You've hit your usage limit."}}
    fake.scenario(stdout=_events(failed, usage=False), exit=1)
    adapter = _adapter(fake, tmp_path)

    with pytest.raises(ProviderUnavailableError, match="usage limit"):
        adapter.chat(REQUEST)
    assert adapter.health_check() is False


def test_unauthorized_error_event_needs_relogin(fake: FakeCli, tmp_path: Path) -> None:
    error = {"type": "error", "message": "unexpected status 401 Unauthorized"}
    fake.scenario(stdout=_events(error, usage=False), exit=1)
    adapter = _adapter(fake, tmp_path)

    with pytest.raises(ProviderUnavailableError):
        adapter.chat(REQUEST)
    assert adapter.health_check() is False


def test_empty_final_message_is_response_error(fake: FakeCli, tmp_path: Path) -> None:
    fake.scenario(stdout='{"type": "turn.completed", "usage": {}}\n')

    with pytest.raises(LlmResponseError, match="비어 있다"):
        _adapter(fake, tmp_path).chat(REQUEST)


def test_health_needs_auth_file(fake: FakeCli, tmp_path: Path) -> None:
    adapter = _adapter(fake, tmp_path)
    assert adapter.health_check() is True

    (adapter.codex_home / "auth.json").unlink()

    assert adapter.health_check() is False


def test_strict_schema_requires_every_property_and_drops_default() -> None:
    schema = strict_json_schema(
        {
            "type": "object",
            "properties": {
                "default": {"type": "string", "default": "x"},  # 필드 이름은 그대로 둔다
                "nested": {
                    "type": "object",
                    "properties": {"a": {"anyOf": [{"type": "string"}, {"type": "null"}]}},
                },
            },
            "required": [],
        }
    )

    assert schema["required"] == ["default", "nested"]
    assert schema["properties"]["default"] == {"type": "string"}
    assert schema["properties"]["nested"]["required"] == ["a"]
    assert schema["properties"]["nested"]["additionalProperties"] is False


def _config() -> Any:
    return parse_config(
        {
            "llm": {"provider": "openai"},
            "providers": {"openai": {"model": "gpt-5-codex", "auth": "subscription"}},
        },
        source="t",
    )


def test_factory_needs_codex_login(tmp_path: Path, cli_installed: None) -> None:
    with pytest.raises(ConfigError, match="Settings"):
        create_adapter(_config(), secrets=SecretStore.in_memory(), data_dir=tmp_path)

    auth = subscription_home(tmp_path, "openai") / "codex" / "auth.json"
    auth.parent.mkdir(parents=True)
    auth.write_text("{}", "utf-8")
    adapter = create_adapter(_config(), secrets=SecretStore.in_memory(), data_dir=tmp_path)

    assert isinstance(adapter, CodexAdapter)


def test_factory_without_cli_names_the_image_tag(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """CLI 가 없는 이미지(latest)에서 구독을 고르면 그 공급자의 태그를 알려 준다 (WI-10.009c)."""
    monkeypatch.setattr("subtitle_robot.llm.logins.shutil.which", lambda _name: None)

    with pytest.raises(ConfigError, match="subtitle-robot:codex"):
        create_adapter(_config(), secrets=SecretStore.in_memory(), data_dir=tmp_path)
