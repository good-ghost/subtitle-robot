"""LLM 어댑터 공통 타입과 인터페이스 (PROJECT-PLAN §6.1, WI-1.008).

어댑터는 설정 파일 형식과 무관한 `ProviderSettings` 를 받는다.
`config.toml` 을 이 형태로 바꾸는 일은 설정 모듈(WI-1.007)이 한다.
"""

from __future__ import annotations

from typing import Any, Literal, Protocol

from pydantic import BaseModel, ConfigDict, Field, SecretStr

ResponseFormatMode = Literal["json_schema", "json_object", "none"]


class ChatMessage(BaseModel):
    """대화 메시지 하나."""

    model_config = ConfigDict(frozen=True)

    role: Literal["system", "user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """chat 요청.

    Attributes:
        messages: 메시지 (시스템 → 사용자 순서, 프롬프트 캐시를 위해 순서 고정은 호출자 책임).
        output_schema: 구조화 출력용 JSON schema (pydantic `model_json_schema()`).
            None 이면 자유 출력.
        schema_name: `response_format.json_schema.name`.
        temperature: None 이면 공급자 설정값.
        max_tokens: None 이면 공급자 설정값.
    """

    model_config = ConfigDict(frozen=True)

    messages: list[ChatMessage]
    output_schema: dict[str, Any] | None = None
    schema_name: str = "output"
    temperature: float | None = None
    max_tokens: int | None = None


class ChatResult(BaseModel):
    """chat 결과.

    Attributes:
        content: 모델이 돌려준 본문 원문.
        json_text: `<think>`·코드펜스를 걷어 내 JSON 파싱 대상으로 정리한 문자열.
        finish_reason: `length` 면 출력이 잘린 것이다.
        model: 요청에 실제로 쓴 model 값 (fingerprint 기록용).
        attempts: 재시도를 포함한 시도 횟수.
    """

    model_config = ConfigDict(frozen=True)

    content: str
    json_text: str
    finish_reason: str | None
    prompt_tokens: int | None
    completion_tokens: int | None
    reasoning_tokens: int | None
    latency_s: float
    model: str
    attempts: int
    retries: int


class ProviderInfo(BaseModel):
    """공급자·모델 정보 (fingerprint §13.1, 배치 예산 §6.4 에 쓴다).

    Attributes:
        provider: `nim` | `local` | `ollama` | `openrouter` | `openai` | `claude` | `gemini`.
        model: 요청 `model` 필드에 쓰는 값.
        model_label: 사람이 읽는 모델 이름 (로컬은 GGUF 파일명).
        context_tokens: 요청 하나가 쓸 수 있는 컨텍스트 (로컬은 슬롯당). 모르면 None.
        slots: 동시 처리 슬롯 수 (로컬). 모르면 None.
        notes: 시작 시 확인한 경고 (예: 기대 모델과 실제 모델이 다름).
    """

    model_config = ConfigDict(frozen=True)

    provider: str
    base_url: str
    model: str
    model_label: str
    context_tokens: int | None = None
    slots: int | None = None
    notes: tuple[str, ...] = ()


class ProviderSettings(BaseModel):
    """어댑터 하나의 설정.

    Attributes:
        base_url: OpenAI-compatible API 기준 URL (`…/v1`).
        model: 요청할 모델.
        api_key: 인증 키. 로그·예외·덤프에 노출되지 않게 SecretStr 로 둔다.
        rpm: 분당 요청 상한 (0 = 제한 없음).
        concurrency: 동시 요청 수. `auto` 는 공급자가 알려준 값(llama-server 슬롯 수).
        timeout_s: 요청 하나의 타임아웃.
        temperature: 기본 temperature. None 이면 보내지 않는다 (OpenAI 추론 모델).
        max_output_tokens: 요청의 기본 max_tokens.
        context_tokens: 요청 하나의 컨텍스트 (설정값). 없으면 공급자가 알려준 값이나 기본값.
        response_format: 구조화 출력 방식 (M0 확정: json_schema).
        extra_body: 요청 본문에 덧붙일 필드 (예: thinking 끄기).
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    base_url: str
    model: str
    api_key: SecretStr | None = None
    rpm: int = Field(default=0, ge=0)
    concurrency: int | Literal["auto"] = 1
    timeout_s: float = Field(default=120.0, gt=0)
    temperature: float | None = 0.2
    max_output_tokens: int = Field(default=8192, gt=0)
    context_tokens: int | None = Field(default=None, gt=0)
    response_format: ResponseFormatMode = "json_schema"
    extra_body: dict[str, Any] = Field(default_factory=dict)


class LlmAdapter(Protocol):
    """공급자 어댑터 인터페이스."""

    provider: str

    def chat(self, request: ChatRequest) -> ChatResult:
        """요청 하나를 보내고 결과를 돌려준다."""
        ...

    def describe(self) -> ProviderInfo:
        """공급자·모델 정보."""
        ...

    def count_tokens(self, text: str) -> int:
        """토큰 수 (로컬은 정확, NIM 은 근사)."""
        ...

    def health_check(self) -> bool:
        """공급자가 지금 요청을 받을 수 있는지 (일시 정지 후 복구 확인용)."""
        ...

    def close(self) -> None:
        """HTTP 연결을 닫는다."""
        ...
