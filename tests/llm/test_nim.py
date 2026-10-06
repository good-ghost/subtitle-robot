import json

import httpx
import pytest
from pydantic import SecretStr

from subtitle_robot.llm.base import ChatMessage, ChatRequest
from subtitle_robot.llm.nim import (
    NIM_BASE_URL,
    NIM_DEFAULT_MODEL,
    NimAdapter,
    TokenEstimator,
    nim_default_settings,
)
from tests.llm.fakes import FakeTime


def _adapter(handler: httpx.MockTransport) -> NimAdapter:
    return NimAdapter(
        nim_default_settings(SecretStr("nvapi-x")),
        http=httpx.Client(transport=handler),
        runtime=FakeTime().runtime(),
    )


def test_defaults_match_plan_v5_4() -> None:
    settings = nim_default_settings()

    assert settings.base_url == NIM_BASE_URL == "https://integrate.api.nvidia.com/v1"
    assert settings.model == NIM_DEFAULT_MODEL == "deepseek-ai/deepseek-v4.1-flash"
    assert settings.rpm == 30
    assert settings.timeout_s == 300.0
    assert settings.temperature == 0.2
    assert settings.response_format == "json_schema"
    assert settings.extra_body == {"chat_template_kwargs": {"enable_thinking": False}}


def test_chat_sends_thinking_off_and_updates_estimator() -> None:
    seen: list[dict[str, object]] = []

    def handle(request: httpx.Request) -> httpx.Response:
        seen.append(json.loads(request.content))
        return httpx.Response(
            200,
            json={
                "choices": [{"message": {"content": "{}"}, "finish_reason": "stop"}],
                "usage": {"prompt_tokens": 100, "completion_tokens": 5},
            },
        )

    adapter = _adapter(httpx.MockTransport(handle))
    request = ChatRequest(messages=[ChatMessage(role="user", content="x" * 300)])

    adapter.chat(request)

    assert seen[0]["chat_template_kwargs"] == {"enable_thinking": False}
    assert adapter.estimator.chars_per_token == pytest.approx(3.0)
    assert adapter.count_tokens("y" * 30) == 10


def test_describe() -> None:
    info = _adapter(httpx.MockTransport(lambda _r: httpx.Response(200))).describe()

    assert (info.provider, info.model, info.base_url) == ("nim", NIM_DEFAULT_MODEL, NIM_BASE_URL)
    assert info.context_tokens is None


@pytest.mark.parametrize(("status", "expected"), [(200, True), (503, False)])
def test_health_check_status(status: int, expected: bool) -> None:
    seen: list[str] = []

    def handle(request: httpx.Request) -> httpx.Response:
        seen.append(str(request.url))
        return httpx.Response(status)

    assert _adapter(httpx.MockTransport(handle)).health_check() is expected
    assert seen == [f"{NIM_BASE_URL}/models"]


def test_health_check_connection_error() -> None:
    def refuse(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("refused", request=request)

    assert _adapter(httpx.MockTransport(refuse)).health_check() is False


def test_token_estimator_defaults_and_ignores_empty() -> None:
    estimator = TokenEstimator(default_chars_per_token=2.5)

    estimator.observe(0, 10)
    estimator.observe(10, 0)

    assert estimator.chars_per_token == 2.5
    assert estimator.estimate("") == 0
    assert estimator.estimate("abcde") == 2
