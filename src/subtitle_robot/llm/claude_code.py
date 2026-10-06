"""Claude 구독: Claude Code CLI 비대화형 실행 (PROJECT-PLAN §28.1, WI-10.005).

`claude -p --output-format json --json-schema <스키마> --model <모델>`로 요청 하나를 처리한다.
시스템 프롬프트는 파일로 교체하고(`--system-prompt-file`), 내장 도구·MCP·슬래시 명령을 끄고, 세션을
디스크에 남기지 않는다. 사용자 프롬프트는 표준 입력으로 보낸다 (인자 길이 제한, 상한 10MB).

인증은 사용자가 자기 PC 에서 `claude setup-token`으로 만든 1년 토큰(Settings 에 붙여넣기)을
`CLAUDE_CODE_OAUTH_TOKEN`으로 넘긴다. `--bare`는 구독 로그인을 읽지 않으므로 쓰지 않고, 대신
설정 폴더(`CLAUDE_CONFIG_DIR`)와 HOME 을 데이터 폴더 안 전용 폴더로 둔다.
temperature·max_tokens 는 CLI 에 넘길 방법이 없어 쓰지 않는다.
결과는 `structured_output`(스키마 요청), 없으면 `result` 문자열에서 JSON 을 꺼낸다.
실패는 종료 코드가 0 이 아니고 `is_error`가 참이며 문구가 `result`에 들어 있다.
"""

from __future__ import annotations

import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from pydantic import SecretStr

from subtitle_robot.llm.base import ChatRequest, ProviderSettings
from subtitle_robot.llm.errors import LlmResponseError
from subtitle_robot.llm.openai_compat import extract_json_text, inline_schema_refs
from subtitle_robot.llm.subscription import (
    CliFailure,
    CliInvocation,
    CliOutput,
    SubscriptionCliAdapter,
    ensure_private_dir,
    load_json_object,
    split_messages,
)
from subtitle_robot.media.commands import CommandResult

CLAUDE_EXECUTABLE = "claude"
# 비밀 저장소 안 위치 (Settings 의 구독 로그인, WI-10.008)
CLAUDE_TOKEN_SECRET = "providers.claude.oauth_token"  # noqa: S105 — 저장소 안 위치 이름이다
SYSTEM_PROMPT_FILE = "system-prompt.md"
_STOP_REASONS = {"max_tokens": "length", "end_turn": "stop", "tool_use": "stop"}


class ClaudeCodeAdapter(SubscriptionCliAdapter):
    """Claude Code CLI 어댑터 (LlmAdapter)."""

    provider = "claude"
    cli_name = "claude"

    def __init__(
        self,
        settings: ProviderSettings,
        *,
        home: Path,
        token: SecretStr | None,
        executable: str = CLAUDE_EXECUTABLE,
        **kwargs: Any,
    ) -> None:
        """어댑터를 만든다. token 은 `claude setup-token` 으로 만든 값이다."""
        super().__init__(settings, home=home, executable=executable, **kwargs)
        self._token = token

    def credential_env(self) -> Mapping[str, str]:
        """토큰과 격리 설정 폴더. 자동 업데이트는 끈다 (이미지에 고정한 버전을 쓴다)."""
        env = {
            "CLAUDE_CONFIG_DIR": str(ensure_private_dir(self.home / "config")),
            "DISABLE_AUTOUPDATER": "1",
        }
        if self._token is not None:
            env["CLAUDE_CODE_OAUTH_TOKEN"] = self._token.get_secret_value()
        return env

    def has_credentials(self) -> bool:
        """토큰이 있는지."""
        return self._token is not None and bool(self._token.get_secret_value())

    def build_invocation(self, request: ChatRequest, workdir: Path) -> CliInvocation:
        """`claude -p` 인자. 시스템 프롬프트는 작업 폴더의 파일로 넘긴다."""
        system, prompt = split_messages(request.messages)
        args = [
            "-p",
            "--output-format", "json",
            "--model", self._settings.model,
            "--tools", "",
            "--strict-mcp-config",
            "--disable-slash-commands",
            "--no-session-persistence",
        ]  # fmt: skip
        if system:
            path = workdir / SYSTEM_PROMPT_FILE
            path.write_text(system, "utf-8")
            args += ["--system-prompt-file", str(path)]
        if request.output_schema is not None and self._settings.response_format != "none":
            schema = inline_schema_refs(request.output_schema)
            args += ["--json-schema", json.dumps(schema, ensure_ascii=False)]
        return CliInvocation(args=args, stdin=prompt)

    def parse_output(self, result: CommandResult, workdir: Path) -> CliOutput:
        """`--output-format json` 결과를 해석한다.

        Raises:
            CliFailure: `is_error` 이거나 종료 코드가 0 이 아니다.
            LlmResponseError: 출력이 JSON 이 아니거나 본문이 없다.
        """
        data = load_json_object(result.stdout)
        if data is None:
            if result.returncode != 0:
                raise CliFailure(result.stderr.strip() or result.stdout.strip() or "실패")
            raise LlmResponseError("claude: CLI 출력이 JSON 이 아니다")
        if data.get("is_error") or result.returncode != 0:
            detail = data.get("result") or data.get("subtype") or result.stderr.strip()
            raise CliFailure(f"{detail} (exit {result.returncode})")
        structured = data.get("structured_output")
        if structured is not None:
            content = json.dumps(structured, ensure_ascii=False)
            json_text = content
        else:
            content = str(data.get("result") or "")
            if not content.strip():
                raise LlmResponseError(f"claude: 결과가 비어 있다 (subtype={data.get('subtype')})")
            json_text = extract_json_text(content)
        raw_usage = data.get("usage")
        usage: Mapping[str, Any] = raw_usage if isinstance(raw_usage, dict) else {}
        stop_reason = data.get("stop_reason")
        return CliOutput(
            content=content,
            json_text=json_text,
            finish_reason=_STOP_REASONS.get(str(stop_reason), "stop"),
            prompt_tokens=_prompt_tokens(usage),
            completion_tokens=_int(usage.get("output_tokens")),
            model=_actual_model(data.get("modelUsage")),
        )


def _prompt_tokens(usage: Mapping[str, Any]) -> int | None:
    # 프롬프트 캐시에서 읽거나 만든 토큰도 프롬프트다
    parts = [
        _int(usage.get(key))
        for key in ("input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens")
    ]
    known = [part for part in parts if part is not None]
    return sum(known) if known else None


def _actual_model(model_usage: object) -> str | None:
    """실제로 쓴 모델 (fingerprint). 별칭(`sonnet`)이 어떤 모델이 됐는지 기록한다.

    보조 요청에 작은 모델이 섞일 수 있어 출력 토큰이 가장 많은 모델을 고른다.
    """
    if not isinstance(model_usage, dict) or not model_usage:
        return None

    def output_tokens(name: object) -> int:
        entry = model_usage.get(name)
        return (_int(entry.get("outputTokens")) or 0) if isinstance(entry, dict) else 0

    return str(max(model_usage, key=output_tokens))


def _int(value: object) -> int | None:
    return value if isinstance(value, int) and not isinstance(value, bool) else None
