"""Pass 2 번역기: 배치 요청을 보내고 응답을 해석한다 (PROJECT-PLAN §10, WI-3.006).

검증·재시도·폴백은 Validator(WI-3.008)가 맡는다. 여기서는 응답 형식 문제(JSON·스키마·잘림)를
구분해 돌려준다. 공급자 오류(ProviderUnavailableError 등)는 그대로 올린다 (가드가 처리).
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Literal

from pydantic import ValidationError

from subtitle_robot.lang.base import LanguageCode
from subtitle_robot.lang.codes import DEFAULT_TARGET, language_name
from subtitle_robot.llm.base import ChatMessage, ChatRequest, LlmAdapter
from subtitle_robot.pipeline.context import BatchRequest
from subtitle_robot.pipeline.schema import Pass2Output, request_schema
from subtitle_robot.prompt import load_prompt

ResponseErrorKind = Literal["json", "schema", "truncated"]
_FINISH_TRUNCATED = "length"


@dataclass(frozen=True)
class BatchResponse:
    """배치 요청 하나의 결과.

    Attributes:
        output: 해석된 출력. 형식 오류면 None.
        error_kind: 형식 오류 종류 (json | schema | truncated).
        error: 오류 설명.
        model: 요청에 쓴 모델.
        prompt_tokens, completion_tokens, latency_s, attempts: 응답 메타.
    """

    output: Pass2Output | None
    error_kind: ResponseErrorKind | None
    error: str
    model: str
    prompt_tokens: int | None
    completion_tokens: int | None
    latency_s: float
    attempts: int


class Pass2Translator:
    """Pass 2 번역기 (문서 하나에 하나)."""

    def __init__(
        self,
        adapter: LlmAdapter,
        lang: LanguageCode,
        *,
        target: str = DEFAULT_TARGET,
        max_output_tokens: int = 8192,
    ) -> None:
        """번역기를 만든다. target 은 번역 대상 언어 (프롬프트·스키마 필드 이름, §26.5)."""
        self._adapter = adapter
        self._prompt = load_prompt("pass2", lang, target=target)
        self.system_prompt = self._prompt.render(
            src_lang=language_name(lang), tgt_lang=language_name(target)
        )
        self._schema = request_schema(target)
        self._max_output_tokens = max_output_tokens

    @property
    def prompt_version(self) -> str:
        """프롬프트 버전 (fingerprint)."""
        return self._prompt.version

    def translate(self, request: BatchRequest) -> BatchResponse:
        """요청을 보내고 응답을 해석한다."""
        chat = self._adapter.chat(
            ChatRequest(
                messages=[
                    ChatMessage(role="system", content=self.system_prompt),
                    ChatMessage(role="user", content=request.user_message),
                ],
                output_schema=self._schema,
                schema_name="pass2_output",
                max_tokens=self._max_output_tokens,
            )
        )

        def response(
            output: Pass2Output | None, kind: ResponseErrorKind | None, error: str
        ) -> BatchResponse:
            return BatchResponse(
                output=output,
                error_kind=kind,
                error=error,
                model=chat.model,
                prompt_tokens=chat.prompt_tokens,
                completion_tokens=chat.completion_tokens,
                latency_s=chat.latency_s,
                attempts=chat.attempts,
            )

        if chat.finish_reason == _FINISH_TRUNCATED:
            return response(None, "truncated", "출력이 max_tokens 에서 잘렸다")
        try:
            raw = json.loads(chat.json_text)
        except json.JSONDecodeError as exc:
            return response(None, "json", f"JSON 파싱 실패: {exc}")
        try:
            output = Pass2Output.model_validate(raw)
        except ValidationError as exc:
            return response(None, "schema", f"스키마 불일치: {exc.error_count()}건")
        return response(output, None, "")
