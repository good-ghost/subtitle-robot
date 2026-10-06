"""ChatGPT 구독: Codex CLI 비대화형 실행 (PROJECT-PLAN §28.1, WI-10.006).

`codex exec -`로 표준 입력의 프롬프트 하나를 처리한다. 응답 형식은 `--output-schema`(스키마 파일),
최종 메시지는 `--output-last-message`(파일)로 받는다. 세션을 남기지 않고(`--ephemeral`), 작업 폴더가
git 저장소가 아니어도 돌고(`--skip-git-repo-check`), 모델이 만든 명령은 읽기 전용 샌드박스에 둔다.
`--json` 이벤트에서 사용량(`turn.completed`)과 실패(`turn.failed`·`error`)를 읽는다.

Codex 에는 시스템 프롬프트를 바꾸는 인자가 없어 시스템 프롬프트를 사용자 프롬프트 앞에 붙인다.
출력 스키마는 OpenAI 구조화 출력의 엄격 규칙을 따르게 바꾼다: 모든 속성을 required 로,
`additionalProperties: false`, 지원하지 않는 `default`는 뺀다 (기본값 필드도 값을 채워 보낸다).

인증은 `CODEX_HOME`(데이터 폴더 안 전용 폴더)의 `auth.json`이다. Settings 의 기기 코드 로그인이나
다른 PC 의 `~/.codex/auth.json` 붙여넣기로 만든다 (WI-10.008).
temperature·max_tokens 는 CLI 에 넘기지 않는다.
"""

from __future__ import annotations

import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from subtitle_robot.llm.base import ChatRequest, ProviderSettings
from subtitle_robot.llm.errors import LlmResponseError
from subtitle_robot.llm.openai_compat import extract_json_text, inline_schema_refs
from subtitle_robot.llm.subscription import (
    CliFailure,
    CliInvocation,
    CliOutput,
    SubscriptionCliAdapter,
    ensure_private_dir,
    split_messages,
)
from subtitle_robot.media.commands import CommandResult

CODEX_EXECUTABLE = "codex"
CODEX_AUTH_FILE = "auth.json"
SCHEMA_FILE = "output-schema.json"
LAST_MESSAGE_FILE = "last-message.txt"
# 엄격 구조화 출력이 받지 않는 키워드
_UNSUPPORTED_KEYWORDS = frozenset({"default"})


class CodexAdapter(SubscriptionCliAdapter):
    """Codex CLI 어댑터 (LlmAdapter). 공급자 이름은 openai (ChatGPT 구독)."""

    provider = "openai"
    cli_name = "codex"

    def __init__(
        self,
        settings: ProviderSettings,
        *,
        home: Path,
        executable: str = CODEX_EXECUTABLE,
        **kwargs: Any,
    ) -> None:
        """어댑터를 만든다. 자격은 `codex_home/auth.json`이다."""
        super().__init__(settings, home=home, executable=executable, **kwargs)

    @property
    def codex_home(self) -> Path:
        """`CODEX_HOME` (auth.json 이 있는 폴더)."""
        return codex_home_dir(self.home)

    def credential_env(self) -> Mapping[str, str]:
        """격리한 `CODEX_HOME`. 이 프로세스의 OpenAI 키는 넘기지 않는다 (공통부의 허용 목록)."""
        return codex_env(self.home)

    def has_credentials(self) -> bool:
        """로그인 파일이 있는지."""
        return (self.codex_home / CODEX_AUTH_FILE).is_file()

    def build_invocation(self, request: ChatRequest, workdir: Path) -> CliInvocation:
        """`codex exec -` 인자와 표준 입력 프롬프트."""
        system, prompt = split_messages(request.messages)
        args = [
            "exec",
            "--model", self._settings.model,
            "--ephemeral",
            "--skip-git-repo-check",
            "--sandbox", "read-only",
            "--color", "never",
            "--json",
            "--output-last-message", str(workdir / LAST_MESSAGE_FILE),
        ]  # fmt: skip
        if request.output_schema is not None and self._settings.response_format != "none":
            path = workdir / SCHEMA_FILE
            schema = strict_json_schema(inline_schema_refs(request.output_schema))
            path.write_text(json.dumps(schema, ensure_ascii=False), "utf-8")
            args += ["--output-schema", str(path)]
        args.append("-")
        stdin = f"{system}\n\n{prompt}" if system else prompt
        return CliInvocation(args=args, stdin=stdin)

    def parse_output(self, result: CommandResult, workdir: Path) -> CliOutput:
        """JSON 이벤트와 마지막 메시지 파일을 해석한다.

        Raises:
            CliFailure: 실패 이벤트가 있거나 종료 코드가 0 이 아니다.
            LlmResponseError: 최종 메시지가 비어 있다.
        """
        events = _events(result.stdout)
        failure = _failure_message(events)
        if failure is not None or result.returncode != 0:
            detail = failure or result.stderr.strip() or "실패"
            raise CliFailure(f"{detail} (exit {result.returncode})")
        last = workdir / LAST_MESSAGE_FILE
        content = last.read_text("utf-8") if last.is_file() else ""
        if not content.strip():
            content = _last_agent_message(events)
        if not content.strip():
            raise LlmResponseError("codex: 최종 메시지가 비어 있다")
        usage = _usage(events)
        return CliOutput(
            content=content,
            json_text=extract_json_text(content),
            prompt_tokens=_int(usage.get("input_tokens")),
            completion_tokens=_int(usage.get("output_tokens")),
        )


def codex_home_dir(home: Path) -> Path:
    """`CODEX_HOME` (구독 CLI 폴더 안)."""
    return home / "codex"


def codex_env(home: Path) -> dict[str, str]:
    """Codex 전용 환경 값 (로그인 명령도 같은 값을 쓴다)."""
    return {"CODEX_HOME": str(ensure_private_dir(codex_home_dir(home)))}


def strict_json_schema(schema: dict[str, Any]) -> dict[str, Any]:
    """OpenAI 엄격 구조화 출력 규칙에 맞춘 스키마 (모든 속성 required, 추가 속성 금지)."""

    def walk(node: Any) -> Any:
        if isinstance(node, list):
            return [walk(item) for item in node]
        if not isinstance(node, dict):
            return node
        result: dict[str, Any] = {}
        for key, value in node.items():
            if key == "properties" and isinstance(value, dict):
                # 속성 이름(필드 이름)은 키워드가 아니다
                result[key] = {name: walk(sub) for name, sub in value.items()}
            elif key not in _UNSUPPORTED_KEYWORDS:
                result[key] = walk(value)
        if isinstance(result.get("properties"), dict):
            result["required"] = list(result["properties"])
            result["additionalProperties"] = False
        return result

    strict: dict[str, Any] = walk(schema)
    return strict


def _events(stdout: str) -> list[dict[str, Any]]:
    events = []
    for line in stdout.splitlines():
        try:
            event = json.loads(line)
        except ValueError:
            continue
        if isinstance(event, dict):
            events.append(event)
    return events


def _failure_message(events: list[dict[str, Any]]) -> str | None:
    for event in reversed(events):
        kind = event.get("type")
        if kind == "turn.failed":
            error = event.get("error")
            return str(error.get("message") if isinstance(error, dict) else error)
        if kind == "error":
            return str(event.get("message") or event)
    return None


def _last_agent_message(events: list[dict[str, Any]]) -> str:
    for event in reversed(events):
        item = event.get("item")
        is_message = isinstance(item, dict) and item.get("type") == "agent_message"
        if event.get("type") == "item.completed" and is_message:
            return str(item.get("text") or "")
    return ""


def _usage(events: list[dict[str, Any]]) -> Mapping[str, Any]:
    for event in reversed(events):
        usage = event.get("usage")
        if event.get("type") == "turn.completed" and isinstance(usage, dict):
            return usage
    return {}


def _int(value: object) -> int | None:
    return value if isinstance(value, int) and not isinstance(value, bool) else None
