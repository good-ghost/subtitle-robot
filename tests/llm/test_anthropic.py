"""Claude 어댑터 (PROJECT-PLAN §27.1, WI-9.003). 실제 API 에 요청하지 않는다."""

import json
from typing import Any

import httpx
import pytest
from pydantic import BaseModel

from subtitle_robot.config import parse_config
from subtitle_robot.llm.anthropic import ANTHROPIC_VERSION, ClaudeAdapter, tool_name
from subtitle_robot.llm.base import ChatMessage, ChatRequest
from subtitle_robot.llm.errors import (
    LlmAuthError,
    LlmResponseError,
    ProviderUnavailableError,
    StructuredOutputRejectedError,
)
from subtitle_robot.llm.factory import create_adapter
from subtitle_robot.llm.limiter import RetryPolicy
from subtitle_robot.pipeline.schema import Pass2Output
from subtitle_robot.secret_store import SecretStore
from tests.llm.fakes import FakeTime

KEY = "sk-ant-test-secret"


class Out(BaseModel):
    text: str


REQUEST = ChatRequest(
    messages=[
        ChatMessage(role="system", content="You translate."),
        ChatMessage(role="user", content="hello"),
    ],
    output_schema=Out.model_json_schema(),
    schema_name="pass2_output",
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


def _message(
    tool_input: dict[str, Any] | None = None, *, text: str = "", stop: str = "tool_use"
) -> httpx.Response:
    content: list[dict[str, Any]] = []
    if text:
        content.append({"type": "text", "text": text})
    if tool_input is not None:
        content.append(
            {"type": "tool_use", "id": "t1", "name": "pass2_output", "input": tool_input}
        )
    return httpx.Response(
        200,
        json={
            "content": content,
            "stop_reason": stop,
            "usage": {"input_tokens": 30, "output_tokens": 7},
        },
    )


def _adapter(recorder: Recorder, **provider: Any) -> ClaudeAdapter:
    config = parse_config(
        {"llm": {"provider": "claude"}, "providers": {"claude": {"model": "claude-x", **provider}}},
        source="t",
    )
    adapter = create_adapter(
        config,
        secrets=SecretStore.in_memory({"providers": {"claude": {"api_key": KEY}}}),
        http=httpx.Client(transport=httpx.MockTransport(recorder)),
        runtime=FakeTime().runtime(),
    )
    assert isinstance(adapter, ClaudeAdapter)
    return adapter


def test_request_uses_messages_api_and_forced_tool() -> None:
    recorder = Recorder(_message({"text": "안녕"}))

    result = _adapter(recorder).chat(REQUEST)

    request = recorder.requests[0]
    assert str(request.url) == "https://api.anthropic.com/v1/messages"
    assert request.headers["x-api-key"] == KEY
    assert request.headers["anthropic-version"] == ANTHROPIC_VERSION
    assert "authorization" not in request.headers
    body = recorder.body()
    assert body["system"] == "You translate."
    assert body["messages"] == [{"role": "user", "content": "hello"}]
    assert (body["model"], body["max_tokens"], body["temperature"]) == ("claude-x", 8192, 0.2)
    assert body["tools"][0]["name"] == "pass2_output"
    assert body["tools"][0]["input_schema"]["properties"]["text"]["type"] == "string"
    assert body["tool_choice"] == {"type": "tool", "name": "pass2_output"}
    assert json.loads(result.json_text) == {"text": "안녕"}
    assert (result.finish_reason, result.prompt_tokens, result.completion_tokens) == (
        "stop",
        30,
        7,
    )


def test_pipeline_schema_refs_are_inlined_and_output_validates() -> None:
    reply = {"units": [{"unit": "U1", "blocks": [{"idx": 1, "ko": "번역"}]}], "new_terms": []}
    recorder = Recorder(_message(reply))
    request = REQUEST.model_copy(update={"output_schema": Pass2Output.model_json_schema()})

    result = _adapter(recorder).chat(request)

    assert "$defs" not in json.dumps(recorder.body()["tools"][0]["input_schema"])
    assert Pass2Output.model_validate_json(result.json_text).units[0].blocks[0].text == "번역"


def test_max_tokens_is_truncation_and_text_fallback() -> None:
    truncated = _adapter(Recorder(_message({"text": "x"}, stop="max_tokens"))).chat(REQUEST)
    assert truncated.finish_reason == "length"

    plain = REQUEST.model_copy(update={"output_schema": None})
    recorder = Recorder(_message(None, text='```json\n{"text": "y"}\n```', stop="end_turn"))
    result = _adapter(recorder).chat(plain)
    assert "tools" not in recorder.body()
    assert result.json_text == '{"text": "y"}'
    with pytest.raises(LlmResponseError):
        _adapter(Recorder(_message(None, stop="end_turn"))).chat(plain)


def test_errors_and_overload_retry() -> None:
    with pytest.raises(LlmAuthError):
        _adapter(Recorder(httpx.Response(401, json={"type": "error"}))).chat(REQUEST)
    with pytest.raises(StructuredOutputRejectedError):
        _adapter(Recorder(httpx.Response(400, text="tools invalid"))).chat(REQUEST)
    overloaded = Recorder(httpx.Response(529, json={"type": "overloaded_error"}))
    with pytest.raises(ProviderUnavailableError):
        _adapter(overloaded).chat(REQUEST)
    assert len(overloaded.requests) == RetryPolicy().max_attempts
    recovered = Recorder(httpx.Response(529), _message({"text": "ok"}))
    assert json.loads(_adapter(recovered).chat(REQUEST).json_text) == {"text": "ok"}


def test_base_url_with_v1_and_health() -> None:
    recorder = Recorder(httpx.Response(200, json={"data": []}))
    adapter = _adapter(recorder, base_url="https://api.anthropic.com/v1/", temperature=None)

    assert adapter.health_check()
    assert str(recorder.requests[0].url) == "https://api.anthropic.com/v1/models"
    assert adapter.describe().provider == "claude"
    assert tool_name("pass 1/output") == "pass_1_output"
