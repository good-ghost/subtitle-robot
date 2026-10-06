"""파이프라인 테스트용 가짜 LLM 어댑터. 요청을 기록하고 미리 정한 응답을 돌려준다."""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import Any

from subtitle_robot.llm.base import ChatRequest, ChatResult, ProviderInfo

Responder = Callable[[ChatRequest], "str | tuple[str, str] | dict[str, Any]"]


class FakeAdapter:
    """LlmAdapter 를 흉내 낸다.

    응답 함수는 JSON 문자열, (JSON 문자열, finish_reason), 또는 dict(JSON 으로 바꿈)를 돌려준다.
    토큰 수는 문자 수 / chars_per_token 으로 센다.
    """

    provider = "fake"

    def __init__(
        self,
        respond: Responder,
        *,
        context_tokens: int | None = 100_000,
        chars_per_token: float = 1.0,
        model: str = "fake-model",
        summary: str | None = "요약",
    ) -> None:
        self._respond = respond
        self.context_tokens = context_tokens
        self.chars_per_token = chars_per_token
        self.model = model
        self.requests: list[ChatRequest] = []
        # story_so_far 요약 요청(WI-6.004)은 따로 기록하고 기본 응답을 준다. 기존 테스트의 요청
        # 순서·개수 검증을 그대로 두기 위해서다. summary=None 이면 응답 함수로 넘긴다
        self.summary = summary
        self.summary_requests: list[ChatRequest] = []

    def chat(self, request: ChatRequest) -> ChatResult:
        if request.schema_name == "summary_output" and self.summary is not None:
            self.summary_requests.append(request)
            reply: Any = {"summary": self.summary}
        else:
            self.requests.append(request)
            reply = self._respond(request)
        finish = "stop"
        if isinstance(reply, tuple):
            reply, finish = reply
        if isinstance(reply, dict):
            reply = json.dumps(reply, ensure_ascii=False)
        return ChatResult(
            content=reply,
            json_text=reply,
            finish_reason=finish,
            prompt_tokens=sum(len(m.content) for m in request.messages),
            completion_tokens=len(reply),
            reasoning_tokens=0,
            latency_s=0.1,
            model=self.model,
            attempts=1,
            retries=0,
        )

    def describe(self) -> ProviderInfo:
        return ProviderInfo(
            provider=self.provider,
            base_url="http://fake",
            model=self.model,
            model_label=self.model,
            context_tokens=self.context_tokens,
        )

    def count_tokens(self, text: str) -> int:
        return int(len(text) / self.chars_per_token)

    def health_check(self) -> bool:
        return True

    def close(self) -> None:
        return None

    def user_messages(self) -> list[str]:
        return [request.messages[-1].content for request in self.requests]
