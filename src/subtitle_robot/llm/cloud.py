"""OpenAI 호환 클라우드 공급자: OpenAI(ChatGPT), OpenRouter, Gemini (PROJECT-PLAN §27.1, WI-9.002).

세 공급자 모두 `/chat/completions`와 `response_format` json_schema 를 받는다.
공급자별 차이는 출력 상한 필드 이름(OpenAI 최신 모델은 `max_completion_tokens`)과
앱 표시 헤더(OpenRouter)뿐이다.
토큰 수를 셀 엔드포인트가 없어 NIM 과 같이 문자 수로 근사하고 응답 usage 로 보정한다.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import httpx

from subtitle_robot.llm.base import ChatRequest, ChatResult, ProviderInfo, ProviderSettings
from subtitle_robot.llm.limiter import RetryPolicy, Runtime
from subtitle_robot.llm.nim import TokenEstimator
from subtitle_robot.llm.openai_compat import OpenAICompatClient

_HTTP_OK = 200
# OpenRouter 가 요청을 보낸 앱을 표시하는 헤더 (선택, https://openrouter.ai/docs)
APP_TITLE = "Subtitle Robot"


@dataclass(frozen=True)
class CompatProfile:
    """공급자별 차이.

    Attributes:
        name: 공급자 이름 (`llm.provider`).
        max_tokens_field: 출력 상한 필드 이름.
        headers: 인증 외에 늘 보낼 헤더.
    """

    name: str
    max_tokens_field: str = "max_tokens"
    headers: dict[str, str] = field(default_factory=dict)


PROFILES: dict[str, CompatProfile] = {
    # OpenAI 최신 모델(o 시리즈·GPT-5 계열)은 max_tokens 를 거부한다
    "openai": CompatProfile("openai", max_tokens_field="max_completion_tokens"),
    "openrouter": CompatProfile("openrouter", headers={"X-Title": APP_TITLE}),
    "gemini": CompatProfile("gemini"),
}


class CloudCompatAdapter:
    """OpenAI 호환 클라우드 공급자 어댑터 (공급자 하나에 하나)."""

    def __init__(
        self,
        profile: CompatProfile,
        settings: ProviderSettings,
        *,
        http: httpx.Client | None = None,
        runtime: Runtime | None = None,
        policy: RetryPolicy | None = None,
    ) -> None:
        """어댑터를 만든다. 네트워크 호출은 하지 않는다."""
        self.provider = profile.name
        self._settings = settings
        self._client = OpenAICompatClient(
            settings,
            http=http,
            runtime=runtime,
            policy=policy,
            name=profile.name,
            max_tokens_field=profile.max_tokens_field,
            extra_headers=profile.headers,
        )
        self.estimator = TokenEstimator()

    def chat(self, request: ChatRequest) -> ChatResult:
        """요청을 보내고, 성공하면 usage 로 토큰 근사 비율을 보정한다."""
        result = self._client.chat(request)
        if result.prompt_tokens:
            prompt_chars = sum(len(message.content) for message in request.messages)
            self.estimator.observe(prompt_chars, result.prompt_tokens)
        return result

    def describe(self) -> ProviderInfo:
        """공급자 정보. 컨텍스트는 설정값(`context_tokens`)이고 없으면 모른다(기본값)."""
        model = self._client.model
        return ProviderInfo(
            provider=self.provider,
            base_url=self._client.base_url,
            model=model,
            model_label=model,
            context_tokens=self._settings.context_tokens,
        )

    def count_tokens(self, text: str) -> int:
        """근사 토큰 수."""
        return self.estimator.estimate(text)

    def health_check(self) -> bool:
        """`/models` 가 200 이면 요청을 받을 수 있다고 본다."""
        try:
            return self._client.get("models").status_code == _HTTP_OK
        except httpx.TransportError:
            return False

    def close(self) -> None:
        """HTTP 연결을 닫는다."""
        self._client.close()
