"""LLM 호출 오류 계층 (PROJECT-PLAN §6.3, §6.5).

메시지에는 인증 정보(API 키, Authorization 헤더)를 절대 넣지 않는다 (NFR-002).
"""

from __future__ import annotations


class LlmError(Exception):
    """LLM 호출 오류의 공통 부모."""


class ProviderUnavailableError(LlmError):
    """연결 거부·타임아웃·429/5xx 가 재시도 상한을 넘었거나 로딩 대기가 너무 길 때.

    호출자는 공급자를 "불가" 상태로 보고 작업을 일시 정지한다 (WI-1.012).
    """


class LlmHttpError(LlmError):
    """재시도로 해결되지 않는 HTTP 오류 (4xx 등)."""

    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(f"HTTP {status_code}: {detail}")
        self.status_code = status_code
        self.detail = detail


class LlmAuthError(LlmHttpError):
    """401/403: API 키가 없거나 틀렸다."""


class StructuredOutputRejectedError(LlmHttpError):
    """공급자가 구조화 출력 요청(`response_format`)을 거부했다 (400/422)."""


class LlmResponseError(LlmError):
    """응답 형식이 기대와 다르다 (choices 없음, 본문 비어 있음 등)."""


class ReasoningOnlyResponseError(LlmResponseError):
    """content 가 비고 reasoning 필드에만 답이 왔다.

    M0 실측: thinking 이 켜진 채 구조화 출력을 요청하면 이렇게 온다. 설정에서 thinking 을 꺼야 한다.
    """


class NotLlamaServerError(LlmError):
    """설정한 주소에 llama-server 가 아닌 서비스가 응답했다.

    M0 에서 같은 포트를 Apache WebDAV 가 쓰고 있던 적이 있다.
    """
