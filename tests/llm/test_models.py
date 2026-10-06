"""공급자 모델 목록 (PROJECT-PLAN §27.3, WI-9.005). 실제 공급자에 요청하지 않는다."""

from typing import Any

import httpx
import pytest

from subtitle_robot.llm.models import ModelListError, list_models

KEY = "secret-key-value"


def _client(responses: dict[str, httpx.Response], seen: list[httpx.Request]) -> httpx.Client:
    def handle(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return responses.get(request.url.path, httpx.Response(404))

    return httpx.Client(transport=httpx.MockTransport(handle))


def _list(
    name: str, base_url: str, responses: dict[str, httpx.Response], **kwargs: Any
) -> list[str]:
    seen: list[httpx.Request] = []
    return list_models(
        name,
        base_url=base_url,
        api_key=KEY,
        http=_client(responses, seen),
        **kwargs,
    )


def test_openai_compatible_lists() -> None:
    data = {"data": [{"id": "b-model"}, {"id": "a-model"}, {"id": "a-model"}, {"x": 1}]}
    assert _list(
        "openai", "https://api.openai.com/v1", {"/v1/models": httpx.Response(200, json=data)}
    ) == [
        "a-model",
        "b-model",
    ]
    gemini = {"data": [{"id": "models/gemini-x"}]}
    assert _list(
        "gemini",
        "https://generativelanguage.googleapis.com/v1beta/openai",
        {"/v1beta/openai/models": httpx.Response(200, json=gemini)},
    ) == ["gemini-x"]


def test_claude_and_ollama_lists_and_headers() -> None:
    seen: list[httpx.Request] = []
    claude = list_models(
        "claude",
        base_url="https://api.anthropic.com",
        api_key=KEY,
        http=_client(
            {"/v1/models": httpx.Response(200, json={"data": [{"id": "claude-x"}]})}, seen
        ),
    )
    assert claude == ["claude-x"]
    assert seen[0].headers["x-api-key"] == KEY
    assert "authorization" not in seen[0].headers

    tags = {"models": [{"name": "qwen3:8b"}, {"name": "gemma3"}]}
    assert list_models(
        "ollama",
        base_url="http://gpu:11434/v1",
        api_key=None,
        http=_client({"/api/tags": httpx.Response(200, json=tags)}, []),
    ) == ["gemma3", "qwen3:8b"]


@pytest.mark.parametrize(
    ("kwargs", "code"),
    [
        ({"base_url": ""}, "no_base_url"),
        ({"api_key": None}, "no_key"),
        ({"status": 401}, "auth"),
        ({"status": 500}, "http_error"),
        ({"body": {"unexpected": True}}, "format"),
    ],
)
def test_errors(kwargs: dict[str, Any], code: str) -> None:
    status = kwargs.pop("status", 200)
    body = kwargs.pop("body", {"data": []})
    with pytest.raises(ModelListError) as error:
        list_models(
            "openrouter",
            base_url=kwargs.get("base_url", "https://openrouter.ai/api/v1"),
            api_key=kwargs.get("api_key", KEY),
            http=_client({"/api/v1/models": httpx.Response(status, json=body)}, []),
        )
    assert error.value.code == code
    assert KEY not in str(error.value)


def test_unreachable() -> None:
    def refuse(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("refused", request=request)

    with pytest.raises(ModelListError) as error:
        list_models(
            "local", base_url="http://127.0.0.1:8080/v1", api_key=None,
            http=httpx.Client(transport=httpx.MockTransport(refuse)),
        )  # fmt: skip
    assert error.value.code == "unreachable"
