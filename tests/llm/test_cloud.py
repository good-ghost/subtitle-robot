"""OpenAI 호환 클라우드 공급자 (PROJECT-PLAN §27.1, WI-9.002). 실제 공급자에 요청하지 않는다."""

import json
from typing import Any

import httpx
import pytest
from pydantic import BaseModel

from subtitle_robot.config import parse_config
from subtitle_robot.llm.base import ChatMessage, ChatRequest
from subtitle_robot.llm.cloud import CloudCompatAdapter
from subtitle_robot.llm.errors import (
    LlmAuthError,
    ProviderUnavailableError,
    StructuredOutputRejectedError,
)
from subtitle_robot.llm.factory import create_adapter
from subtitle_robot.llm.limiter import RetryPolicy
from subtitle_robot.secret_store import SecretStore
from tests.llm.fakes import FakeTime

KEY = "sk-test-secret-value"


class Out(BaseModel):
    text: str


REQUEST = ChatRequest(
    messages=[ChatMessage(role="system", content="sys"), ChatMessage(role="user", content="hello")],
    output_schema=Out.model_json_schema(),
    schema_name="out",
)


class Recorder:
    def __init__(self, *responses: httpx.Response) -> None:
        self.responses = list(responses)
        self.requests: list[httpx.Request] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        return self.responses.pop(0) if len(self.responses) > 1 else self.responses[0]

    def body(self, index: int = 0) -> dict[str, Any]:
        data: dict[str, Any] = json.loads(self.requests[index].content)
        return data


def _ok(content: str = '{"text": "x"}', finish: str = "stop") -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "choices": [{"message": {"content": content}, "finish_reason": finish}],
            "usage": {"prompt_tokens": 40, "completion_tokens": 5},
        },
    )


def _adapter(name: str, recorder: Recorder, **provider: Any) -> CloudCompatAdapter:
    config = parse_config(
        {"llm": {"provider": name}, "providers": {name: {"model": "some-model", **provider}}},
        source="t",
    )
    adapter = create_adapter(
        config,
        secrets=SecretStore.in_memory({"providers": {name: {"api_key": KEY}}}),
        http=httpx.Client(transport=httpx.MockTransport(recorder)),
        runtime=FakeTime().runtime(),
    )
    assert isinstance(adapter, CloudCompatAdapter)
    return adapter


@pytest.mark.parametrize(
    ("name", "url"),
    [
        ("openai", "https://api.openai.com/v1/chat/completions"),
        ("openrouter", "https://openrouter.ai/api/v1/chat/completions"),
        ("gemini", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"),
    ],
)
def test_request_url_auth_and_schema(name: str, url: str) -> None:
    recorder = Recorder(_ok())
    adapter = _adapter(name, recorder)

    result = adapter.chat(REQUEST)

    request = recorder.requests[0]
    assert str(request.url) == url
    assert request.headers["authorization"] == f"Bearer {KEY}"
    body = recorder.body()
    assert body["model"] == "some-model"
    assert body["response_format"]["type"] == "json_schema"
    assert body["response_format"]["json_schema"]["name"] == "out"
    assert result.json_text == '{"text": "x"}'
    assert result.prompt_tokens == 40
    assert adapter.describe().provider == name


def test_openai_uses_max_completion_tokens_and_omits_temperature() -> None:
    recorder = Recorder(_ok())

    _adapter("openai", recorder, max_output_tokens=4000).chat(REQUEST)

    body = recorder.body()
    assert body["max_completion_tokens"] == 4000
    assert "max_tokens" not in body
    assert "temperature" not in body  # openai 기본은 temperature 없음


def test_openai_temperature_when_configured() -> None:
    recorder = Recorder(_ok())

    _adapter("openai", recorder, temperature=0.3).chat(REQUEST)

    assert recorder.body()["temperature"] == 0.3


def test_openrouter_and_gemini_send_max_tokens_and_temperature() -> None:
    for name in ("openrouter", "gemini"):
        recorder = Recorder(_ok())
        _adapter(name, recorder).chat(REQUEST)
        body = recorder.body()
        assert (body["max_tokens"], body["temperature"]) == (8192, 0.2)
        assert ("x-title" in recorder.requests[0].headers) == (name == "openrouter")


def test_truncation_and_errors() -> None:
    truncated = _adapter("gemini", Recorder(_ok('{"text": "x', finish="length"))).chat(REQUEST)
    assert truncated.finish_reason == "length"

    with pytest.raises(LlmAuthError):
        _adapter("openai", Recorder(httpx.Response(401, json={"error": "bad key"}))).chat(REQUEST)
    with pytest.raises(StructuredOutputRejectedError):
        _adapter("openrouter", Recorder(httpx.Response(400, text="json_schema unsupported"))).chat(
            REQUEST
        )


def test_rate_limit_retries_then_unavailable() -> None:
    recorder = Recorder(httpx.Response(429, json={"error": "rate"}))
    adapter = _adapter("openai", recorder)

    with pytest.raises(ProviderUnavailableError):
        adapter.chat(REQUEST)
    assert len(recorder.requests) == RetryPolicy().max_attempts


def test_estimator_health_and_context() -> None:
    recorder = Recorder(_ok(), httpx.Response(200, json={"data": []}))
    adapter = _adapter("gemini", recorder, context_tokens=100000)

    adapter.chat(REQUEST)

    assert adapter.count_tokens("x" * 80) > 0
    assert adapter.health_check()
    assert str(recorder.requests[1].url).endswith("/v1beta/openai/models")
    assert adapter.describe().context_tokens == 100000
