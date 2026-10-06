"""M2 완료 기준: 설정 → 팩토리 → 어댑터 → 가드 전체 경로에 장애를 주입한다 (WI-1.013)."""

import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

import httpx
import pytest
from pydantic import BaseModel

from subtitle_robot.config import load_config
from subtitle_robot.llm.availability import AvailabilityPolicy, ProviderGuard
from subtitle_robot.llm.base import ChatMessage, ChatRequest, LlmAdapter
from subtitle_robot.llm.errors import ProviderUnavailableError, ReasoningOnlyResponseError
from subtitle_robot.llm.factory import create_adapter
from subtitle_robot.secret_store import SecretStore
from tests.llm.fakes import FakeTime


class Out(BaseModel):
    ko: str


REQUEST = ChatRequest(
    messages=[ChatMessage(role="user", content="Translate: Good boy.")],
    output_schema=Out.model_json_schema(),
)
OK_BODY = {
    "choices": [{"message": {"content": '{"ko": "착하지"}'}, "finish_reason": "stop"}],
    "usage": {"prompt_tokens": 12, "completion_tokens": 4},
}

Step = httpx.Response | Exception


def _script(steps: list[Step]) -> Callable[[httpx.Request], httpx.Response]:
    """chat 요청마다 다음 단계를 돌려준다. 그 밖의 엔드포인트는 정상 응답."""
    pending = list(steps)

    def handle(request: httpx.Request) -> httpx.Response:
        path = request.url.path
        if path.endswith("/chat/completions"):
            step = pending.pop(0) if pending else httpx.Response(200, json=OK_BODY)
            if isinstance(step, Exception):
                raise step
            return step
        if path == "/health":
            return httpx.Response(200, json={"status": "ok"})
        if path == "/props":
            return httpx.Response(
                200, json={"default_generation_settings": {"n_ctx": 8192}, "total_slots": 1}
            )
        return httpx.Response(200, json={"data": [{"id": "qwen"}]})

    return handle


def _adapter(provider: str, steps: list[Step], tmp_path: Path) -> tuple[LlmAdapter, FakeTime]:
    config_path = tmp_path / "config.toml"
    config_path.write_text(
        f'[llm]\nprovider = "{provider}"\n[providers.local]\nbase_url = "http://llm.test:8080/v1"\n',
        encoding="utf-8",
    )
    fake = FakeTime()
    adapter = create_adapter(
        load_config(config_path),
        secrets=SecretStore.in_memory({"providers": {"nim": {"api_key": "nvapi-test"}}}),
        http=httpx.Client(transport=httpx.MockTransport(_script(steps))),
        runtime=fake.runtime(),
    )
    return adapter, fake


def _refused() -> httpx.ConnectError:
    return httpx.ConnectError("Connection refused", request=httpx.Request("POST", "http://x"))


@pytest.mark.parametrize("provider", ["nim", "local"])
def test_rate_limited_then_success(provider: str, tmp_path: Path) -> None:
    adapter, _ = _adapter(
        provider, [httpx.Response(429, headers={"retry-after": "1"})] * 2, tmp_path
    )

    result = adapter.chat(REQUEST)

    assert json.loads(result.json_text) == {"ko": "착하지"}
    assert (result.attempts, result.retries) == (3, 2)


@pytest.mark.parametrize("provider", ["nim", "local"])
def test_timeout_then_success(provider: str, tmp_path: Path) -> None:
    timeout = httpx.ReadTimeout("timed out", request=httpx.Request("POST", "http://x"))
    adapter, _ = _adapter(provider, [timeout], tmp_path)

    assert adapter.chat(REQUEST).retries == 1


def test_local_loading_503_is_waited_without_attempts(tmp_path: Path) -> None:
    loading = httpx.Response(503, json={"error": {"message": "Loading model"}})
    adapter, fake = _adapter("local", [loading, loading], tmp_path)

    result = adapter.chat(REQUEST)

    assert result.attempts == 1
    assert fake.slept == [5.0, 5.0]


def test_nim_503_is_retried_and_counted(tmp_path: Path) -> None:
    adapter, _ = _adapter("nim", [httpx.Response(503)], tmp_path)

    assert adapter.chat(REQUEST).attempts == 2


@pytest.mark.parametrize("provider", ["nim", "local"])
def test_reasoning_only_response(provider: str, tmp_path: Path) -> None:
    body: dict[str, Any] = {
        "choices": [{"message": {"content": None, "reasoning_content": '{"ko": "x"}'}}]
    }
    adapter, _ = _adapter(provider, [httpx.Response(200, json=body)], tmp_path)

    with pytest.raises(ReasoningOnlyResponseError):
        adapter.chat(REQUEST)


@pytest.mark.parametrize("provider", ["nim", "local"])
def test_connection_refused_pauses_then_resumes(provider: str, tmp_path: Path) -> None:
    adapter, fake = _adapter(provider, [_refused()] * 4, tmp_path)
    guard = ProviderGuard(
        adapter, policy=AvailabilityPolicy(check_interval_s=30), runtime=fake.runtime()
    )
    job_attempts = 0

    def job() -> str:
        return adapter.chat(REQUEST).json_text

    job_attempts += 1
    result = guard.run(job)

    assert json.loads(result) == {"ko": "착하지"}
    assert job_attempts == 1
    assert 30 in fake.slept  # 불가 상태에서 상태 확인 간격만큼 기다렸다


@pytest.mark.parametrize("provider", ["nim", "local"])
def test_connection_refused_without_guard_raises(provider: str, tmp_path: Path) -> None:
    adapter, _ = _adapter(provider, [_refused()] * 4, tmp_path)

    with pytest.raises(ProviderUnavailableError, match="4회 연결 실패"):
        adapter.chat(REQUEST)
