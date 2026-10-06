"""Ollama 어댑터 (PROJECT-PLAN §27.1, WI-9.004). 실제 서버에 요청하지 않는다."""

import json
from typing import Any

import httpx
import pytest
from pydantic import BaseModel

from subtitle_robot.config import parse_config
from subtitle_robot.llm.base import ChatMessage, ChatRequest
from subtitle_robot.llm.errors import (
    LlmHttpError,
    ProviderUnavailableError,
    ReasoningOnlyResponseError,
    StructuredOutputRejectedError,
)
from subtitle_robot.llm.factory import create_adapter
from subtitle_robot.llm.ollama import OllamaAdapter
from subtitle_robot.secret_store import SecretStore
from tests.llm.fakes import FakeTime


class Out(BaseModel):
    text: str


REQUEST = ChatRequest(
    messages=[ChatMessage(role="system", content="sys"), ChatMessage(role="user", content="hi")],
    output_schema=Out.model_json_schema(),
)


class Server:
    """`/api/show`·`/api/chat`·`/api/version` 을 흉내 낸다."""

    def __init__(self, *, context: int | None = 32768, chat: httpx.Response | None = None) -> None:
        self.context = context
        self.chat = chat or _reply('{"text": "x"}')
        self.requests: list[httpx.Request] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        path = request.url.path
        if path == "/api/show":
            info = {"general.architecture": "qwen3"}
            if self.context is not None:
                info["qwen3.context_length"] = self.context  # type: ignore[assignment]
            return httpx.Response(200, json={"model_info": info})
        if path == "/api/version":
            return httpx.Response(200, json={"version": "0.12.0"})
        return self.chat

    def chat_body(self) -> dict[str, Any]:
        request = next(r for r in self.requests if r.url.path == "/api/chat")
        data: dict[str, Any] = json.loads(request.content)
        return data


def _reply(content: str, done_reason: str = "stop", **message: Any) -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "model": "qwen3",
            "message": {"role": "assistant", "content": content, **message},
            "done": True,
            "done_reason": done_reason,
            "prompt_eval_count": 25,
            "eval_count": 6,
        },
    )


def _adapter(server: Server, **provider: Any) -> OllamaAdapter:
    config = parse_config(
        {"llm": {"provider": "ollama"}, "providers": {"ollama": {"model": "qwen3", **provider}}},
        source="t",
    )
    adapter = create_adapter(
        config,
        secrets=SecretStore.in_memory(),
        http=httpx.Client(transport=httpx.MockTransport(server)),
        runtime=FakeTime().runtime(),
    )
    assert isinstance(adapter, OllamaAdapter)
    return adapter


def test_native_chat_with_schema_and_context() -> None:
    server = Server()

    result = _adapter(server).chat(REQUEST)

    chat = next(r for r in server.requests if r.url.path == "/api/chat")
    assert str(chat.url) == "http://127.0.0.1:11434/api/chat"
    assert "authorization" not in chat.headers
    body = server.chat_body()
    assert body["model"] == "qwen3"
    assert body["stream"] is False
    assert body["format"]["properties"]["text"]["type"] == "string"
    assert body["options"] == {"num_ctx": 8192, "num_predict": 8192, "temperature": 0.2}
    assert "think" not in body
    assert body["messages"][0] == {"role": "system", "content": "sys"}
    assert (result.json_text, result.finish_reason) == ('{"text": "x"}', "stop")
    assert (result.prompt_tokens, result.completion_tokens) == (25, 6)


def test_context_is_capped_by_model_maximum_and_cached() -> None:
    server = Server(context=4096)
    adapter = _adapter(server, context_tokens=16384)

    adapter.chat(REQUEST)
    adapter.chat(REQUEST)

    assert server.chat_body()["options"]["num_ctx"] == 4096
    assert adapter.describe().context_tokens == 4096
    assert sum(1 for r in server.requests if r.url.path == "/api/show") == 1


def test_unknown_model_maximum_keeps_setting() -> None:
    server = Server(context=None)

    _adapter(server, context_tokens=12000).chat(REQUEST)

    assert server.chat_body()["options"]["num_ctx"] == 12000


def test_extra_body_think_and_json_mode_and_base_url() -> None:
    server = Server()
    adapter = _adapter(
        server,
        base_url="http://gpu:11434/v1",
        extra_body={"think": False},
        response_format="json_object",
    )

    adapter.chat(REQUEST)

    assert str(server.requests[-1].url) == "http://gpu:11434/api/chat"
    body = server.chat_body()
    assert (body["think"], body["format"]) == (False, "json")
    assert adapter.health_check()


def test_truncation_thinking_only_and_errors() -> None:
    truncated = _adapter(Server(chat=_reply('{"text": "x', "length"))).chat(REQUEST)
    assert truncated.finish_reason == "length"

    with pytest.raises(ReasoningOnlyResponseError):
        _adapter(Server(chat=_reply("", thinking="hmm"))).chat(REQUEST)
    with pytest.raises(StructuredOutputRejectedError):
        _adapter(Server(chat=httpx.Response(400, json={"error": "invalid format"}))).chat(REQUEST)
    with pytest.raises(LlmHttpError) as missing:
        _adapter(Server(chat=httpx.Response(404, json={"error": "model not found"}))).chat(
            REQUEST.model_copy(update={"output_schema": None})
        )
    assert missing.value.status_code == 404


def test_connection_refused_is_unavailable() -> None:
    def refuse(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("refused", request=request)

    config = parse_config(
        {"llm": {"provider": "ollama"}, "providers": {"ollama": {"model": "qwen3"}}}, source="t"
    )
    adapter = create_adapter(
        config,
        secrets=SecretStore.in_memory(),
        http=httpx.Client(transport=httpx.MockTransport(refuse)),
        runtime=FakeTime().runtime(),
    )
    with pytest.raises(ProviderUnavailableError):
        adapter.chat(REQUEST)
    assert not adapter.health_check()
