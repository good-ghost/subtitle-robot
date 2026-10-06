import json
from collections.abc import Callable
from typing import Any

import httpx
import pytest
from pydantic import BaseModel, SecretStr

from subtitle_robot.llm.base import ChatMessage, ChatRequest, ProviderSettings
from subtitle_robot.llm.errors import (
    LlmAuthError,
    LlmHttpError,
    LlmResponseError,
    ReasoningOnlyResponseError,
    StructuredOutputRejectedError,
)
from subtitle_robot.llm.openai_compat import (
    OpenAICompatClient,
    extract_json_text,
    inline_schema_refs,
)
from tests.llm.fakes import FakeTime

SECRET = "nvapi-test-secret-value"


class OutBlock(BaseModel):
    idx: int
    ko: str


class Output(BaseModel):
    blocks: list[OutBlock]


REQUEST = ChatRequest(
    messages=[ChatMessage(role="system", content="sys"), ChatMessage(role="user", content="hi")],
    output_schema=Output.model_json_schema(),
    schema_name="pass2",
)


def _settings(**overrides: Any) -> ProviderSettings:
    values: dict[str, Any] = {
        "base_url": "https://nim.test/v1/",
        "model": "deepseek-ai/deepseek-v4.1-flash",
        "api_key": SecretStr(SECRET),
        "extra_body": {"chat_template_kwargs": {"enable_thinking": False}},
    }
    values.update(overrides)
    return ProviderSettings(**values)


def _ok(content: str | None, **message: Any) -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "choices": [{"message": {"content": content, **message}, "finish_reason": "stop"}],
            "usage": {
                "prompt_tokens": 120,
                "completion_tokens": 30,
                "completion_tokens_details": {"reasoning_tokens": 0},
            },
        },
    )


def _client(
    handler: Callable[[httpx.Request], httpx.Response], **overrides: Any
) -> tuple[OpenAICompatClient, list[httpx.Request]]:
    seen: list[httpx.Request] = []

    def record(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return handler(request)

    client = OpenAICompatClient(
        _settings(**overrides),
        http=httpx.Client(transport=httpx.MockTransport(record)),
        runtime=FakeTime().runtime(),
        name="nim",
    )
    return client, seen


def test_request_body_uses_json_schema_and_extra_body() -> None:
    client, seen = _client(lambda _r: _ok('{"blocks": []}'))

    client.chat(REQUEST)

    body = json.loads(seen[0].content)
    assert seen[0].url == "https://nim.test/v1/chat/completions"
    assert seen[0].headers["authorization"] == f"Bearer {SECRET}"
    assert body["model"] == "deepseek-ai/deepseek-v4.1-flash"
    assert body["temperature"] == 0.2
    assert body["max_tokens"] == 8192
    assert body["stream"] is False
    assert body["chat_template_kwargs"] == {"enable_thinking": False}
    assert body["response_format"]["type"] == "json_schema"
    assert body["response_format"]["json_schema"]["name"] == "pass2"
    assert "$ref" not in json.dumps(body["response_format"])
    assert "nvext" not in body  # M0: NIM 은 guided_json 을 거부한다


def test_request_overrides_temperature_and_max_tokens() -> None:
    client, seen = _client(lambda _r: _ok("{}"))

    client.chat(REQUEST.model_copy(update={"temperature": 0.0, "max_tokens": 100}))

    body = json.loads(seen[0].content)
    assert (body["temperature"], body["max_tokens"]) == (0.0, 100)


@pytest.mark.parametrize(
    ("mode", "expected"), [("json_object", {"type": "json_object"}), ("none", None)]
)
def test_other_response_format_modes(mode: str, expected: dict[str, str] | None) -> None:
    client, seen = _client(lambda _r: _ok("{}"), response_format=mode)

    client.chat(REQUEST)

    assert json.loads(seen[0].content).get("response_format") == expected


def test_request_without_schema_has_no_response_format() -> None:
    client, seen = _client(lambda _r: _ok("plain"))

    client.chat(ChatRequest(messages=[ChatMessage(role="user", content="hi")]))

    assert "response_format" not in json.loads(seen[0].content)


def test_result_fields_and_usage() -> None:
    client, _ = _client(lambda _r: _ok('{"blocks": [{"idx": 1, "ko": "안녕"}]}'))

    result = client.chat(REQUEST)

    assert result.json_text == '{"blocks": [{"idx": 1, "ko": "안녕"}]}'
    assert (result.prompt_tokens, result.completion_tokens, result.reasoning_tokens) == (120, 30, 0)
    assert result.finish_reason == "stop"
    assert result.model == "deepseek-ai/deepseek-v4.1-flash"
    assert (result.attempts, result.retries) == (1, 0)


def test_reasoning_only_response_is_classified() -> None:
    # M0 실측: thinking 켜짐 + 구조화 출력 → content=null, JSON 은 reasoning_content
    client, _ = _client(lambda _r: _ok(None, reasoning_content='{"blocks": []}'))

    with pytest.raises(ReasoningOnlyResponseError, match="enable_thinking"):
        client.chat(REQUEST)


def test_empty_response_is_error() -> None:
    client, _ = _client(lambda _r: _ok(""))

    with pytest.raises(LlmResponseError, match="비어 있다"):
        client.chat(REQUEST)


def test_missing_choices_is_error() -> None:
    client, _ = _client(lambda _r: httpx.Response(200, json={"object": "error"}))

    with pytest.raises(LlmResponseError, match="choices"):
        client.chat(REQUEST)


def test_non_json_body_is_error() -> None:
    client, _ = _client(lambda _r: httpx.Response(200, text="<html>oops</html>"))

    with pytest.raises(LlmResponseError, match="JSON"):
        client.chat(REQUEST)


def test_structured_output_rejected() -> None:
    client, _ = _client(
        lambda _r: httpx.Response(400, text='{"message":"unknown field `guided_json`"}')
    )

    with pytest.raises(StructuredOutputRejectedError) as info:
        client.chat(REQUEST)
    assert info.value.status_code == 400


def test_auth_error_does_not_leak_key() -> None:
    client, _ = _client(lambda _r: httpx.Response(401, text="Unauthorized"))

    with pytest.raises(LlmAuthError) as info:
        client.chat(REQUEST)
    assert SECRET not in str(info.value)
    assert SECRET not in repr(info.value)


def test_other_client_error() -> None:
    client, _ = _client(lambda _r: httpx.Response(404, text="model not found"))

    with pytest.raises(LlmHttpError, match="404"):
        client.chat(ChatRequest(messages=[ChatMessage(role="user", content="x")]))


def test_settings_repr_hides_key() -> None:
    settings = _settings()

    assert SECRET not in repr(settings)
    assert SECRET not in settings.model_dump_json()


def test_retry_then_success_reports_attempts() -> None:
    responses = iter([httpx.Response(429, headers={"retry-after": "1"}), _ok("{}")])
    client, _ = _client(lambda _r: next(responses))

    result = client.chat(REQUEST)

    assert (result.attempts, result.retries) == (2, 1)


@pytest.mark.parametrize(
    ("content", "expected"),
    [
        ('{"a": 1}', '{"a": 1}'),
        ('<think>hmm</think>\n{"a": 1}', '{"a": 1}'),
        ('reasoning...</think>{"a": 1}', '{"a": 1}'),
        ('Here:\n```json\n{"a": 1}\n```\nDone', '{"a": 1}'),
        ('Sure! {"a": {"b": 2}} hope it helps', '{"a": {"b": 2}}'),
    ],
)
def test_extract_json_text(content: str, expected: str) -> None:
    assert extract_json_text(content) == expected


def test_inline_schema_refs_removes_defs() -> None:
    schema = inline_schema_refs(Output.model_json_schema())

    assert "$defs" not in schema
    assert schema["properties"]["blocks"]["items"]["properties"]["ko"]["type"] == "string"
