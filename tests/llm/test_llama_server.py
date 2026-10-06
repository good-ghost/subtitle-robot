import json
from typing import Any

import httpx
import pytest

from subtitle_robot.llm.base import ChatMessage, ChatRequest, ProviderSettings
from subtitle_robot.llm.errors import NotLlamaServerError, ProviderUnavailableError
from subtitle_robot.llm.limiter import RetryPolicy
from subtitle_robot.llm.llama_server import LlamaServerAdapter
from tests.llm.fakes import FakeTime

GGUF = "/home/developer/llama-models/Qwen3.8-27B-UD-Q4_K_XL.gguf"
REQUEST = ChatRequest(messages=[ChatMessage(role="user", content="hi")])


class FakeLlamaServer:
    """llama-server 엔드포인트 흉내. M0 실측(b11345) 응답 형태를 따른다."""

    def __init__(self, *, loading: int = 0, alias: str | None = None, slots: int = 1) -> None:
        self.loading = loading
        self.model_id = alias or GGUF
        self.slots = slots
        self.chat_bodies: list[dict[str, Any]] = []
        self.chat_status: list[int] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        path = request.url.path
        if path == "/health":
            if self.loading:
                self.loading -= 1
                return httpx.Response(
                    503, json={"error": {"code": 503, "message": "Loading model"}}
                )
            return httpx.Response(200, json={"status": "ok"})
        if path == "/props":
            return httpx.Response(
                200,
                json={
                    "default_generation_settings": {"n_ctx": 262144},
                    "total_slots": self.slots,
                    "model_path": GGUF,
                },
            )
        if path == "/v1/models":
            return httpx.Response(200, json={"object": "list", "data": [{"id": self.model_id}]})
        if path == "/tokenize":
            content = json.loads(request.content)["content"]
            return httpx.Response(200, json={"tokens": list(range(len(content.split())))})
        if path == "/v1/chat/completions":
            self.chat_bodies.append(json.loads(request.content))
            status = self.chat_status.pop(0) if self.chat_status else 200
            if status != 200:
                return httpx.Response(status, json={"error": {"message": "Loading model"}})
            return httpx.Response(
                200,
                json={
                    "choices": [{"message": {"content": "{}"}, "finish_reason": "stop"}],
                    "usage": {"prompt_tokens": 10, "completion_tokens": 2},
                },
            )
        return httpx.Response(404)


def _adapter(
    server: Any, *, model: str = "Qwen3.8-27B-UD-Q4_K_XL", **settings: Any
) -> tuple[LlamaServerAdapter, FakeTime]:
    fake = FakeTime()
    adapter = LlamaServerAdapter(
        ProviderSettings(
            base_url="http://127.0.0.1:8080/v1",
            model=model,
            timeout_s=600,
            extra_body={"chat_template_kwargs": {"enable_thinking": False}},
            **settings,
        ),
        http=httpx.Client(transport=httpx.MockTransport(server)),
        runtime=fake.runtime(),
        policy=RetryPolicy(wait_poll_s=5.0, wait_max_s=30.0),
    )
    return adapter, fake


def test_connect_reads_props_and_uses_full_path_without_alias() -> None:
    adapter, _ = _adapter(FakeLlamaServer())

    info = adapter.connect()

    assert info.model == GGUF  # --alias 없는 서버는 전체 경로를 model 로 써야 한다
    assert info.model_label == "Qwen3.8-27B-UD-Q4_K_XL"
    assert (info.context_tokens, info.slots) == (262144, 1)
    assert info.notes == ()


def test_alias_is_used_when_served() -> None:
    adapter, _ = _adapter(FakeLlamaServer(alias="Qwen3.8-27B-UD-Q4_K_XL"))

    assert adapter.connect().model == "Qwen3.8-27B-UD-Q4_K_XL"


def test_model_mismatch_is_noted() -> None:
    adapter, _ = _adapter(FakeLlamaServer(), model="Other-Model-7B")

    info = adapter.connect()

    assert "Other-Model-7B" in info.notes[0]
    assert info.model == GGUF


def test_chat_sends_server_model_and_thinking_off() -> None:
    server = FakeLlamaServer()
    adapter, _ = _adapter(server)

    result = adapter.chat(REQUEST)

    assert server.chat_bodies[0]["model"] == GGUF
    assert server.chat_bodies[0]["chat_template_kwargs"] == {"enable_thinking": False}
    assert result.model == GGUF


def test_loading_503_on_health_waits_without_failing() -> None:
    adapter, fake = _adapter(FakeLlamaServer(loading=3))

    adapter.connect()

    assert fake.slept == [5.0, 5.0, 5.0]


def test_loading_beyond_wait_limit_raises() -> None:
    adapter, _ = _adapter(FakeLlamaServer(loading=100))

    with pytest.raises(ProviderUnavailableError, match="준비되지 않았다"):
        adapter.connect()


def test_loading_503_on_chat_does_not_count_attempts() -> None:
    server = FakeLlamaServer()
    server.chat_status = [503, 503, 503]
    adapter, _ = _adapter(server)

    result = adapter.chat(REQUEST)

    assert (result.attempts, result.retries) == (1, 0)
    assert len(server.chat_bodies) == 4


def test_non_llama_service_is_detected() -> None:
    # M0: 같은 포트를 Apache WebDAV 가 쓰고 있었다 (HTML 401)
    def apache(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, text="<html><title>401 Unauthorized</title></html>")

    adapter, _ = _adapter(apache)

    with pytest.raises(NotLlamaServerError, match="llama-server 형식이 아니다"):
        adapter.connect()


def test_connection_refused_raises_unavailable() -> None:
    def refuse(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("Connection refused", request=request)

    adapter, _ = _adapter(refuse)

    with pytest.raises(ProviderUnavailableError, match="연결할 수 없다"):
        adapter.connect()
    assert adapter.health_check() is False


def test_tokenize_counts_tokens() -> None:
    adapter, _ = _adapter(FakeLlamaServer())

    assert adapter.count_tokens("one two three") == 3
    assert adapter.count_tokens("") == 0


@pytest.mark.parametrize(("concurrency", "slots", "expected"), [("auto", 4, 4), (2, 4, 2)])
def test_concurrency_follows_slots_when_auto(
    concurrency: int | str, slots: int, expected: int
) -> None:
    adapter, _ = _adapter(FakeLlamaServer(slots=slots), concurrency=concurrency)

    adapter.connect()

    assert adapter._client.concurrency == expected


def test_health_check() -> None:
    adapter, _ = _adapter(FakeLlamaServer())

    assert adapter.health_check() is True
