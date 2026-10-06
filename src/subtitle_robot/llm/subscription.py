"""구독 공급자 공통: 공식 CLI 를 요청마다 비대화형으로 실행한다 (PROJECT-PLAN §28.1, WI-10.005).

구독 로그인 토큰을 꺼내 회사 API 를 직접 부르지 않는다 (약관). 공급자별 어댑터(Claude Code·Codex)는
명령 인자와 출력 해석만 정하고, 실행·격리·오류 분류는 여기서 한다.

- 격리: CLI 마다 데이터 폴더 안 전용 폴더(`subscriptions/<공급자>/`)를 HOME 으로 쓴다. 환경 변수는
  허용한 것만 넘긴다: 이 프로세스의 다른 키(`ANTHROPIC_API_KEY` 등)가 CLI 에 들어가면 구독 대신
  API 과금으로 바뀔 수 있다
- 요청 하나가 프로세스 하나다. 제한 시간과 데몬 종료 요청(`bind_stop`) 때 프로세스를 끝낸다
- 오류 분류: 인증 실패는 재로그인할 때까지(재기동), 사용량 한도는 풀릴 때까지 상태 확인을 실패로
  돌려 큐를 일시 정지한다. 시간 초과·과부하는 공급자 불가(가드가 상태 확인 뒤 다시 시도), 그 밖의
  실패는 응답 오류(검증 재시도·폴백 규칙)다
"""

from __future__ import annotations

import json
import logging
import math
import os
import re
import shutil
import tempfile
import threading
import time
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path
from typing import Any

from subtitle_robot.llm.base import (
    ChatMessage,
    ChatRequest,
    ChatResult,
    ProviderInfo,
    ProviderSettings,
)
from subtitle_robot.llm.errors import LlmResponseError, ProviderUnavailableError
from subtitle_robot.llm.limiter import ConcurrencyGate, RateLimiter, Runtime
from subtitle_robot.llm.nim import TokenEstimator
from subtitle_robot.media.commands import (
    CommandCancelled,
    CommandResult,
    MediaToolError,
    run_command,
)
from subtitle_robot.watch.cancel import OperationCancelled

logger = logging.getLogger(__name__)

SUBSCRIPTIONS_DIR = "subscriptions"
# CLI 에 넘기는 환경 변수 (프록시·인증서·로캘, 이미지의 CLI 설정). 키·토큰은 어댑터가 넣는다
#   USE_BUILTIN_RIPGREP: Alpine 이미지에서 Claude Code 가 시스템 ripgrep 을 쓰게 한다 (Dockerfile)
PASSTHROUGH_ENV = (
    "PATH", "LANG", "LC_ALL", "TZ",
    "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "no_proxy",
    "SSL_CERT_FILE", "SSL_CERT_DIR", "NODE_EXTRA_CA_CERTS", "USE_BUILTIN_RIPGREP",
)  # fmt: skip
# 한도 메시지에 풀리는 시각이 없으면 이만큼 쉬고 다시 확인한다
LIMIT_BACKOFF_S = 15 * 60
# 오류 메시지에 남기는 CLI 출력 길이 (출력 전체는 프롬프트를 되풀이할 수 있다)
_ERROR_TAIL_CHARS = 300
_DIR_MODE = 0o700
_FILE_MODE = 0o600

_AUTH_RE = re.compile(
    r"authentication|unauthori[sz]ed|invalid api key|not logged in|please run /login|"
    r"oauth|login required|credentials?|account_on_hold|billing|unauthenticated|invalid_grant|"
    r"auth method|\b40[13]\b",
    re.IGNORECASE,
)
_LIMIT_RE = re.compile(
    r"usage limit|rate[ _-]?limit|limit reached|quota|too many requests|resource[ _]exhausted|"
    r"\b429\b",
    re.IGNORECASE,
)
_TRANSIENT_RE = re.compile(
    r"overloaded|\b5\d\d\b|timed? ?out|econnreset|econnrefused|network|socket hang up",
    re.IGNORECASE,
)
# Claude Code 의 한도 메시지는 `…limit reached|<풀리는 시각(유닉스 초)>` 형식이었다
_RESET_EPOCH_RE = re.compile(r"\|(\d{10})\b")


class FailureKind(StrEnum):
    """CLI 실패 분류."""

    AUTH = "auth"
    LIMIT = "limit"
    TRANSIENT = "transient"
    OTHER = "other"


def classify_failure(text: str) -> FailureKind:
    """CLI 오류 문구를 분류한다. 한도를 인증보다 먼저 본다 (한도 문구에 계정이 섞일 수 있다)."""
    if _LIMIT_RE.search(text):
        return FailureKind.LIMIT
    if _AUTH_RE.search(text):
        return FailureKind.AUTH
    if _TRANSIENT_RE.search(text):
        return FailureKind.TRANSIENT
    return FailureKind.OTHER


def subscription_home(data_dir: Path, provider: str) -> Path:
    """공급자 CLI 전용 폴더 (`<데이터 폴더>/subscriptions/<공급자>`)."""
    return Path(data_dir) / SUBSCRIPTIONS_DIR / provider


def ensure_private_dir(path: Path) -> Path:
    """권한 700 폴더를 만든다 (CLI 자격 파일이 들어간다)."""
    path.mkdir(parents=True, exist_ok=True)
    path.chmod(_DIR_MODE)
    return path


def isolated_environment(home: Path, extra: Mapping[str, str]) -> dict[str, str]:
    """CLI 환경: 허용한 변수(PASSTHROUGH_ENV) + 격리 HOME(`home/home`) + extra."""
    env = {name: os.environ[name] for name in PASSTHROUGH_ENV if name in os.environ}
    env["HOME"] = str(ensure_private_dir(home / "home"))
    env.update(extra)
    return env


def write_private_file(path: Path, text: str) -> None:
    """권한 600 파일을 임시 파일 → rename 으로 쓴다 (CLI 자격 파일)."""
    ensure_private_dir(path.parent)
    descriptor, temp_name = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.")
    temp = Path(temp_name)
    try:
        os.fchmod(descriptor, _FILE_MODE)
        with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        temp.replace(path)
    except BaseException:
        temp.unlink(missing_ok=True)
        raise


@dataclass(frozen=True)
class CliInvocation:
    """CLI 실행 하나: 인자와 표준 입력. 작업 폴더는 요청마다 만든 임시 폴더다."""

    args: Sequence[str]
    stdin: str | None = None


@dataclass(frozen=True)
class CliOutput:
    """공급자 어댑터가 해석한 CLI 결과."""

    content: str
    json_text: str
    finish_reason: str | None = "stop"
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    model: str | None = None


class CliFailure(Exception):  # noqa: N818 — 공급자 어댑터가 해석 중 알린 실패 (오류 문구 포함)
    """CLI 가 실패를 알렸다. 문구로 분류한다."""

    def __init__(self, message: str, kind: FailureKind | None = None) -> None:
        super().__init__(message)
        self.kind = kind or classify_failure(message)


class SubscriptionCliAdapter:
    """구독 CLI 어댑터의 공통 부분 (LlmAdapter). 하위 클래스가 인자와 출력 해석을 정한다.

    Args:
        settings: 공급자 설정 (모델·제한 시간·동시 요청 수·RPM).
        home: CLI 전용 폴더 (`subscription_home`).
        executable: CLI 실행 파일 (테스트는 가짜 스크립트 경로).
        runtime: 시간 의존성.
        wall_clock: 한도가 풀리는 시각(유닉스 초) 비교용.
    """

    provider = "subscription"
    # 사람이 읽는 CLI 이름 (로그·오류)
    cli_name = "cli"

    def __init__(
        self,
        settings: ProviderSettings,
        *,
        home: Path,
        executable: str,
        runtime: Runtime | None = None,
        wall_clock: Callable[[], float] = time.time,
    ) -> None:
        """어댑터를 만든다. CLI 는 실행하지 않는다."""
        self._settings = settings
        self.home = home
        self._executable = executable
        self._runtime = runtime or Runtime()
        self._wall_clock = wall_clock
        slots = settings.concurrency if isinstance(settings.concurrency, int) else 1
        self._limiter = RateLimiter(settings.rpm, self._runtime)
        self._gate = ConcurrencyGate(slots)
        self._should_stop: Callable[[], bool] | None = None
        self._blocked_until = 0.0
        self._lock = threading.Lock()
        self.estimator = TokenEstimator()

    # --- 하위 클래스가 정한다 -------------------------------------------------

    def credential_env(self) -> Mapping[str, str]:
        """CLI 환경에 더할 인증 값 (토큰 등). 이 값은 로그·예외에 넣지 않는다."""
        return {}

    def has_credentials(self) -> bool:
        """로그인 자격이 준비됐는지 (없으면 상태 확인이 실패한다)."""
        return True

    def build_invocation(self, request: ChatRequest, workdir: Path) -> CliInvocation:
        """CLI 인자와 표준 입력. workdir 에 스키마·프롬프트 파일을 둘 수 있다."""
        raise NotImplementedError

    def parse_output(self, result: CommandResult, workdir: Path) -> CliOutput:
        """CLI 결과를 해석한다.

        Raises:
            CliFailure: CLI 가 실패를 알렸다.
            LlmResponseError: 출력 형식이 기대와 다르다.
        """
        raise NotImplementedError

    # --- 공통 ------------------------------------------------------------------

    def bind_stop(self, should_stop: Callable[[], bool]) -> None:
        """데몬 종료 요청 확인 함수. 실행 중인 CLI 를 끝내는 데 쓴다 (CancellableAdapter)."""
        self._should_stop = should_stop

    def environment(self) -> dict[str, str]:
        """CLI 환경: 허용한 변수 + 격리 HOME + 인증 값."""
        return isolated_environment(self.home, self.credential_env())

    def chat(self, request: ChatRequest) -> ChatResult:
        """CLI 를 한 번 실행하고 결과를 돌려준다.

        Raises:
            ProviderUnavailableError: CLI 없음·인증 실패·한도·시간 초과·일시 장애.
            LlmResponseError: 그 밖의 실패나 출력 형식 이상.
            OperationCancelled: 데몬 종료 요청으로 CLI 를 끝냈다.
        """
        self._check_blocked()
        if shutil.which(self._executable) is None:
            raise ProviderUnavailableError(
                f"{self.cli_name}: 실행 파일이 없다 ({self._executable})"
            )
        self._limiter.acquire()
        with self._gate.slot():
            started = self._runtime.clock()
            output = self._run(request)
            latency = self._runtime.clock() - started
        if output.prompt_tokens:
            self.estimator.observe(_prompt_chars(request.messages), output.prompt_tokens)
        return ChatResult(
            content=output.content,
            json_text=output.json_text,
            finish_reason=output.finish_reason,
            prompt_tokens=output.prompt_tokens,
            completion_tokens=output.completion_tokens,
            reasoning_tokens=None,
            latency_s=latency,
            model=output.model or self._settings.model,
            attempts=1,
            retries=0,
        )

    def _run(self, request: ChatRequest) -> CliOutput:
        work_root = ensure_private_dir(self.home / "work")
        with tempfile.TemporaryDirectory(dir=work_root) as tmp:
            workdir = Path(tmp)
            invocation = self.build_invocation(request, workdir)
            try:
                result = run_command(
                    [self._executable, *invocation.args],
                    timeout=self._settings.timeout_s,
                    should_stop=self._should_stop,
                    env=self.environment(),
                    stdin=invocation.stdin,
                    cwd=workdir,
                )
            except CommandCancelled as exc:
                raise OperationCancelled(str(exc)) from exc
            except MediaToolError as exc:
                # 시간 초과 (실행 파일 없음은 앞에서 확인했다)
                raise ProviderUnavailableError(f"{self.cli_name}: {exc}") from exc
            try:
                return self.parse_output(result, workdir)
            except CliFailure as failure:
                raise self._failure_error(failure) from failure

    def _failure_error(self, failure: CliFailure) -> Exception:
        message = f"{self.cli_name}: {_tail(str(failure))}"
        if failure.kind is FailureKind.AUTH:
            with self._lock:
                self._blocked_until = math.inf
            logger.error(
                "%s login failed or expired; sign in again in the web Settings and restart",
                self.cli_name,
            )
            return ProviderUnavailableError(message)
        if failure.kind is FailureKind.LIMIT:
            until = _reset_epoch(str(failure)) or self._wall_clock() + LIMIT_BACKOFF_S
            with self._lock:
                self._blocked_until = max(self._blocked_until, until)
            logger.warning(
                "%s usage limit reached; pausing until %s",
                self.cli_name,
                time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(until)),
            )
            return ProviderUnavailableError(message)
        if failure.kind is FailureKind.TRANSIENT:
            return ProviderUnavailableError(message)
        return LlmResponseError(message)

    def _check_blocked(self) -> None:
        with self._lock:
            blocked = self._blocked_until
        if blocked == math.inf:
            raise ProviderUnavailableError(f"{self.cli_name}: 로그인이 필요하다 (Settings)")
        if self._wall_clock() < blocked:
            raise ProviderUnavailableError(f"{self.cli_name}: 사용량 한도 대기 중")

    def describe(self) -> ProviderInfo:
        """공급자 정보. 컨텍스트는 설정값(`context_tokens`)이고 없으면 모른다(기본값)."""
        model = self._settings.model
        return ProviderInfo(
            provider=self.provider,
            base_url=f"cli:{self.cli_name}",
            model=model,
            model_label=f"{model} (subscription)",
            context_tokens=self._settings.context_tokens,
        )

    def count_tokens(self, text: str) -> int:
        """근사 토큰 수 (NIM 과 같은 방식, 응답 usage 로 보정)."""
        return self.estimator.estimate(text)

    def health_check(self) -> bool:
        """실행 파일과 자격이 있고, 인증 실패·한도 대기 중이 아니면 참. CLI 는 실행하지 않는다."""
        with self._lock:
            blocked = self._blocked_until
        return (
            shutil.which(self._executable) is not None
            and self.has_credentials()
            and self._wall_clock() >= blocked
        )

    def close(self) -> None:
        """닫을 연결이 없다 (요청마다 프로세스가 끝난다)."""


def split_messages(messages: Sequence[ChatMessage]) -> tuple[str, str]:
    """시스템 프롬프트와 사용자 프롬프트. 시스템 아닌 메시지가 여럿이면 역할을 붙여 잇는다."""
    system = "\n\n".join(m.content for m in messages if m.role == "system")
    rest = [m for m in messages if m.role != "system"]
    if len(rest) == 1:
        return system, rest[0].content
    return system, "\n\n".join(f"[{m.role}]\n{m.content}" for m in rest)


def load_json_object(stdout: str) -> dict[str, Any] | None:
    """CLI 표준 출력의 JSON 객체. 앞뒤에 경고 줄이 섞여도 찾는다 (한 줄·여러 줄 JSON 모두)."""
    text = stdout.strip()
    first, last = text.find("{"), text.rfind("}")
    # 전체 → 첫 `{`~마지막 `}` → 줄 단위 (안내 줄에 `{`가 섞인 한 줄 JSON) 순서
    candidates = [text]
    if first != -1 and last > first:
        candidates.append(text[first : last + 1])
    candidates.extend(reversed(text.splitlines()))
    for candidate in candidates:
        try:
            data = json.loads(candidate)
        except ValueError:
            continue
        if isinstance(data, dict):
            return data
    return None


def _prompt_chars(messages: Sequence[ChatMessage]) -> int:
    return sum(len(message.content) for message in messages)


def _tail(text: str) -> str:
    text = " ".join(text.split())
    return text if len(text) <= _ERROR_TAIL_CHARS else "…" + text[-_ERROR_TAIL_CHARS:]


def _reset_epoch(text: str) -> float | None:
    match = _RESET_EPOCH_RE.search(text)
    return float(match.group(1)) if match else None
