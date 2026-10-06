"""Claude 구독: Claude Code CLI 어댑터와 구독 공통부 (PROJECT-PLAN §28.1, WI-10.005).

실제 `claude`를 실행하지 않는다. 가짜 실행 파일이 인자·환경·표준 입력을 기록한다.
"""

import json
import stat
import threading
import time
from pathlib import Path
from typing import Any

import pytest
from pydantic import BaseModel, SecretStr

from subtitle_robot.config import ConfigError, parse_config
from subtitle_robot.llm.base import ChatMessage, ChatRequest, ProviderSettings
from subtitle_robot.llm.claude_code import CLAUDE_TOKEN_SECRET, ClaudeCodeAdapter
from subtitle_robot.llm.errors import LlmResponseError, ProviderUnavailableError
from subtitle_robot.llm.factory import create_adapter
from subtitle_robot.llm.subscription import FailureKind, classify_failure, subscription_home
from subtitle_robot.secret_store import SecretStore
from subtitle_robot.watch.cancel import CancellableAdapter, OperationCancelled
from tests.llm.fake_cli import FakeCli, make_fake_cli

TOKEN = "sk-ant-oat01-test-subscription-token"


@pytest.fixture
def cli_installed(monkeypatch: pytest.MonkeyPatch) -> None:
    """구독 CLI 가 PATH 에 있다고 본다 (팩토리 테스트가 개발 환경의 설치 여부에 좌우되지 않게)."""
    monkeypatch.setattr("subtitle_robot.llm.logins.shutil.which", lambda name: f"/usr/bin/{name}")


class Out(BaseModel):
    text: str


REQUEST = ChatRequest(
    messages=[
        ChatMessage(role="system", content="자막 번역가다. JSON 으로 답한다."),
        ChatMessage(role="user", content="Hello → 한국어"),
    ],
    output_schema=Out.model_json_schema(),
    schema_name="Out",
)


def _result(**values: Any) -> str:
    base: dict[str, Any] = {
        "type": "result",
        "subtype": "success",
        "is_error": False,
        "result": "",
        "usage": {"input_tokens": 12, "cache_read_input_tokens": 30, "output_tokens": 7},
        "modelUsage": {
            "claude-haiku-x": {"outputTokens": 3},
            "claude-sonnet-x": {"outputTokens": 7},
        },
    }
    base.update(values)
    return json.dumps(base, ensure_ascii=False)


class Clock:
    def __init__(self) -> None:
        self.now = 1_800_000_000.0

    def __call__(self) -> float:
        return self.now


@pytest.fixture
def fake(tmp_path: Path) -> FakeCli:
    return make_fake_cli(tmp_path, "claude")


def _adapter(
    fake: FakeCli, tmp_path: Path, *, timeout: float = 30.0, clock: Clock | None = None
) -> ClaudeCodeAdapter:
    settings = ProviderSettings(
        base_url="https://api.anthropic.com", model="sonnet", timeout_s=timeout
    )
    return ClaudeCodeAdapter(
        settings,
        home=subscription_home(tmp_path / "data", "claude"),
        token=SecretStr(TOKEN),
        executable=str(fake.executable),
        wall_clock=clock or Clock(),
    )


def test_runs_claude_print_mode_with_schema_and_isolated_env(
    fake: FakeCli, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    # 이 프로세스의 API 키가 CLI 에 들어가면 구독 대신 API 과금이 된다
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-api-should-not-leak")
    monkeypatch.setenv("NVIDIA_API_KEY", "nvapi-should-not-leak")
    fake.scenario(stdout=_result(structured_output={"text": "안녕"}))

    result = _adapter(fake, tmp_path).chat(REQUEST)

    call = fake.calls()[0]
    argv = call["argv"]
    assert argv[0] == "-p"
    assert argv[argv.index("--output-format") + 1] == "json"
    assert argv[argv.index("--model") + 1] == "sonnet"
    assert argv[argv.index("--tools") + 1] == ""  # 내장 도구를 모두 끈다
    assert {"--strict-mcp-config", "--disable-slash-commands", "--no-session-persistence"} <= set(
        argv
    )
    assert "--bare" not in argv  # bare 는 구독 로그인을 읽지 않는다
    assert (
        json.loads(argv[argv.index("--json-schema") + 1])["properties"]["text"]["type"] == "string"
    )
    assert call["files"]["system-prompt.md"] == "자막 번역가다. JSON 으로 답한다."
    assert call["stdin"] == "Hello → 한국어"
    home = tmp_path / "data" / "subscriptions" / "claude"
    env = call["env"]
    assert env["CLAUDE_CODE_OAUTH_TOKEN"] == TOKEN
    assert env["CLAUDE_CONFIG_DIR"] == str(home / "config")
    assert env["HOME"] == str(home / "home")
    assert env["DISABLE_AUTOUPDATER"] == "1"
    assert "ANTHROPIC_API_KEY" not in env
    assert "NVIDIA_API_KEY" not in env
    assert Path(call["cwd"]).parent == home / "work"
    assert not Path(call["cwd"]).exists()  # 요청마다 만든 작업 폴더는 지운다
    assert stat.S_IMODE((home / "config").stat().st_mode) == 0o700
    assert json.loads(result.json_text) == {"text": "안녕"}
    assert result.prompt_tokens == 42  # 캐시 토큰 포함
    assert result.completion_tokens == 7
    assert result.model == "claude-sonnet-x"  # 별칭이 실제로 된 모델
    assert result.finish_reason == "stop"


def test_text_result_is_parsed_as_json_when_no_structured_output(
    fake: FakeCli, tmp_path: Path
) -> None:
    fake.scenario(stdout="warning: something\n" + _result(result='```json\n{"text": "네"}\n```'))
    request = REQUEST.model_copy(update={"output_schema": None})

    result = _adapter(fake, tmp_path).chat(request)

    assert "--json-schema" not in fake.calls()[0]["argv"]
    assert json.loads(result.json_text) == {"text": "네"}


def test_large_prompt_goes_through_stdin_intact(fake: FakeCli, tmp_path: Path) -> None:
    # 파이프 버퍼(64KB)보다 큰 입력도 종료 확인 주기와 상관없이 끝까지 전달된다
    big = "가나다라마바사" * 40_000
    request = ChatRequest(messages=[ChatMessage(role="user", content=big)])
    fake.scenario(stdout=_result(result='{"text": "ok"}'))
    adapter = _adapter(fake, tmp_path)
    adapter.bind_stop(lambda: False)

    adapter.chat(request)

    call = fake.calls()[0]
    assert call["stdin"] == big
    assert "--system-prompt-file" not in call["argv"]


def test_auth_failure_pauses_until_relogin(fake: FakeCli, tmp_path: Path) -> None:
    fake.scenario(
        stdout=_result(
            is_error=True, subtype="success", result="Invalid API key · Please run /login"
        ),
        exit=1,
    )
    adapter = _adapter(fake, tmp_path)

    with pytest.raises(ProviderUnavailableError) as error:
        adapter.chat(REQUEST)

    assert TOKEN not in str(error.value)
    assert adapter.health_check() is False  # 재로그인(재기동) 전까지 큐는 멈춰 있다
    with pytest.raises(ProviderUnavailableError):
        adapter.chat(REQUEST)
    assert len(fake.calls()) == 1  # 다시 실행하지 않는다


def test_usage_limit_pauses_until_reset_time(fake: FakeCli, tmp_path: Path) -> None:
    clock = Clock()
    reset = int(clock.now) + 3600
    fake.scenario(
        stdout=_result(is_error=True, result=f"Claude AI usage limit reached|{reset}"), exit=1
    )
    adapter = _adapter(fake, tmp_path, clock=clock)

    with pytest.raises(ProviderUnavailableError):
        adapter.chat(REQUEST)

    assert adapter.health_check() is False
    clock.now = reset + 1
    assert adapter.health_check() is True


def test_limit_without_reset_time_backs_off(fake: FakeCli, tmp_path: Path) -> None:
    clock = Clock()
    fake.scenario(stdout="", stderr="429 Too Many Requests", exit=1)
    adapter = _adapter(fake, tmp_path, clock=clock)

    with pytest.raises(ProviderUnavailableError):
        adapter.chat(REQUEST)

    clock.now += 60
    assert adapter.health_check() is False
    clock.now += 15 * 60
    assert adapter.health_check() is True


def test_other_failure_is_response_error(fake: FakeCli, tmp_path: Path) -> None:
    fake.scenario(
        stdout=_result(is_error=True, subtype="error_max_structured_output_retries"), exit=1
    )
    adapter = _adapter(fake, tmp_path)

    with pytest.raises(LlmResponseError, match="error_max_structured_output_retries"):
        adapter.chat(REQUEST)
    assert adapter.health_check() is True  # 검증 재시도·폴백 규칙을 따른다 (큐는 멈추지 않는다)


def test_non_json_output_is_response_error(fake: FakeCli, tmp_path: Path) -> None:
    fake.scenario(stdout="not json at all")

    with pytest.raises(LlmResponseError, match="JSON"):
        _adapter(fake, tmp_path).chat(REQUEST)


def test_timeout_is_provider_unavailable(fake: FakeCli, tmp_path: Path) -> None:
    fake.scenario(stdout=_result(result="{}"), sleep=10)
    started = time.monotonic()

    with pytest.raises(ProviderUnavailableError, match="끝나지 않았다"):
        _adapter(fake, tmp_path, timeout=0.5).chat(REQUEST)
    assert time.monotonic() - started < 5


def test_daemon_stop_ends_running_cli(fake: FakeCli, tmp_path: Path) -> None:
    fake.scenario(stdout=_result(result="{}"), sleep=30)
    stop_requested = {"value": False}
    adapter = _adapter(fake, tmp_path)
    adapter.bind_stop(lambda: stop_requested["value"])
    stop_requested["value"] = True
    started = time.monotonic()

    with pytest.raises(OperationCancelled):
        adapter.chat(REQUEST)
    assert time.monotonic() - started < 10


def test_cancellable_adapter_binds_stop(fake: FakeCli, tmp_path: Path) -> None:
    stop = threading.Event()
    adapter = _adapter(fake, tmp_path)
    wrapped = CancellableAdapter(adapter, stop)
    fake.scenario(stdout=_result(result="{}"), sleep=30)

    def request_stop_soon() -> None:
        time.sleep(0.3)
        stop.set()

    threading.Thread(target=request_stop_soon).start()
    with pytest.raises(OperationCancelled):
        wrapped.chat(REQUEST)


def test_missing_executable_is_unavailable(tmp_path: Path) -> None:
    settings = ProviderSettings(base_url="https://api.anthropic.com", model="sonnet")
    adapter = ClaudeCodeAdapter(
        settings, home=tmp_path / "home", token=SecretStr(TOKEN), executable=str(tmp_path / "none")
    )

    with pytest.raises(ProviderUnavailableError, match="실행 파일이 없다"):
        adapter.chat(REQUEST)
    assert adapter.health_check() is False


def test_describe_marks_subscription(fake: FakeCli, tmp_path: Path) -> None:
    info = _adapter(fake, tmp_path).describe()

    assert (info.provider, info.base_url, info.model) == ("claude", "cli:claude", "sonnet")
    assert "subscription" in info.model_label


@pytest.mark.parametrize(
    ("text", "kind"),
    [
        ("Invalid API key · Please run /login", FailureKind.AUTH),
        ("OAuth token has expired", FailureKind.AUTH),
        ("Claude AI usage limit reached|1800000000", FailureKind.LIMIT),
        ("API Error: 429 rate_limit_error", FailureKind.LIMIT),
        ("API Error: 529 overloaded_error", FailureKind.TRANSIENT),
        ("error_max_structured_output_retries", FailureKind.OTHER),
    ],
)
def test_classify_failure(text: str, kind: FailureKind) -> None:
    assert classify_failure(text) is kind


def _config(**claude: Any) -> Any:
    return parse_config(
        {
            "llm": {"provider": "claude"},
            "providers": {"claude": {"model": "sonnet", "auth": "subscription", **claude}},
        },
        source="t",
    )


def test_factory_builds_cli_adapter_from_token_in_store(
    tmp_path: Path, cli_installed: None
) -> None:
    store = SecretStore.for_data_dir(tmp_path)
    store.set(CLAUDE_TOKEN_SECRET, TOKEN)

    adapter = create_adapter(_config(), secrets=store)

    assert isinstance(adapter, ClaudeCodeAdapter)
    assert adapter.home == tmp_path / "subscriptions" / "claude"
    assert adapter.has_credentials()


def test_factory_without_token_points_to_settings(tmp_path: Path, cli_installed: None) -> None:
    # API 키가 있어도 구독 방식이면 쓰지 않는다
    store = SecretStore.in_memory({"providers": {"claude": {"api_key": "sk-ant-api"}}})

    with pytest.raises(ConfigError, match="Settings"):
        create_adapter(_config(), secrets=store, data_dir=tmp_path)


@pytest.mark.parametrize("name", ["nim", "gemini"])
def test_subscription_only_for_supported_providers(name: str) -> None:
    """Gemini 는 API 키만 쓴다 (개인 계정 Gemini CLI 로그인 종료, WI-10.009g)."""
    config = parse_config(
        {
            "llm": {"provider": name},
            "providers": {name: {"auth": "subscription", "model": "m"}},
        },
        source="t",
    )

    with pytest.raises(ConfigError, match="claude·openai 만"):
        create_adapter(config, secrets=SecretStore.in_memory())
