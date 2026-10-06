"""구독 로그인: 자격 저장·지우기·상태와 Codex 기기 코드 로그인 (PROJECT-PLAN §28.1, WI-10.008).

- Claude: 사용자가 자기 PC 에서 `claude setup-token`으로 만든 토큰 → 비밀 저장소
- Codex(openai): 데몬이 `codex login --device-auth`를 실행해 주소·코드를 보이고, 사용자가
  브라우저에서 승인하면 CLI 가 `CODEX_HOME/auth.json`을 쓴다. 다른 PC 의 `~/.codex/auth.json`
  붙여넣기도 받는다
자격 값은 상태·오류·로그에 넣지 않는다 (Claude 토큰은 끝 4자리 힌트만).
"""

from __future__ import annotations

import json
import logging
import re
import shutil
import subprocess
import threading
from collections.abc import Mapping
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Literal, get_args

from subtitle_robot.llm.claude_code import CLAUDE_EXECUTABLE, CLAUDE_TOKEN_SECRET
from subtitle_robot.llm.codex import CODEX_AUTH_FILE, CODEX_EXECUTABLE, codex_env, codex_home_dir
from subtitle_robot.llm.subscription import (
    isolated_environment,
    subscription_home,
    write_private_file,
)
from subtitle_robot.secret_store import SecretStore, mask

logger = logging.getLogger(__name__)

SubscriptionProvider = Literal["claude", "openai"]
SUBSCRIPTION_LOGIN_PROVIDERS: tuple[SubscriptionProvider, ...] = get_args(SubscriptionProvider)
DeviceState = Literal["idle", "waiting", "done", "failed"]
# 공급자별 CLI 실행 파일과, 그 CLI 를 넣은 이미지 태그 (CLI 는 태그마다 하나, WI-10.009c)
CLI_EXECUTABLES: dict[SubscriptionProvider, str] = {
    "claude": CLAUDE_EXECUTABLE,
    "openai": CODEX_EXECUTABLE,
}
IMAGE_TAGS: dict[SubscriptionProvider, str] = {"claude": "claude", "openai": "codex"}
# 기기 코드는 15분 뒤 만료된다 (Codex 안내). 그 뒤에도 남은 로그인 명령은 끝낸다
DEVICE_LOGIN_TIMEOUT_S = 15 * 60
# `claude setup-token` 토큰은 이보다 길다 (붙여넣기 실수로 잘린 값을 거른다)
_MIN_TOKEN_LENGTH = 20
_ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]")
_URL_RE = re.compile(r"https://[^\s\"'<>]+")
_DEVICE_CODE_RE = re.compile(r"\b[A-Z0-9]{4,}(?:-[A-Z0-9]{4,})+\b")
_TAIL_CHARS = 200


class LoginError(ValueError):
    """로그인 요청이 규칙에 맞지 않는다. code 는 화면이 문구로 바꾼다."""

    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


@dataclass(frozen=True)
class LoginStatus:
    """공급자 하나의 로그인 상태 (자격 값은 없다)."""

    provider: SubscriptionProvider
    logged_in: bool
    # Claude 토큰의 끝 4자리 (`…abcd`)
    hint: str | None = None
    # 자격 파일을 쓴 시각 (유닉스 초)
    updated_at: float | None = None
    # 이 이미지에 CLI 가 있는지 (없으면 그 공급자의 태그 이미지가 필요하다)
    cli_available: bool = True


@dataclass(frozen=True)
class DeviceLogin:
    """Codex 기기 코드 로그인 진행 상태."""

    state: DeviceState = "idle"
    url: str | None = None
    code: str | None = None
    error: str | None = None


class SubscriptionLogins:
    """구독 로그인 관리 (웹 Settings 가 쓴다).

    Args:
        data_dir: 데이터 폴더 (`subscriptions/<공급자>/`).
        secrets: 비밀 저장소 (Claude 토큰).
        executables: CLI 실행 파일 (테스트는 가짜 스크립트).
        device_timeout_s: 기기 코드 로그인 제한 시간.
    """

    def __init__(
        self,
        data_dir: Path,
        secrets: SecretStore,
        *,
        executables: Mapping[str, str] | None = None,
        device_timeout_s: float = DEVICE_LOGIN_TIMEOUT_S,
    ) -> None:
        """관리자를 만든다. 명령은 실행하지 않는다."""
        self._data_dir = Path(data_dir)
        self._secrets = secrets
        self._executables = dict(executables or {})
        self._device_timeout_s = device_timeout_s
        self._device = DeviceLogin()
        self._process: subprocess.Popen[str] | None = None
        self._lock = threading.Lock()

    def home(self, provider: SubscriptionProvider) -> Path:
        """공급자 CLI 폴더."""
        return subscription_home(self._data_dir, provider)

    def _credential_file(self, provider: SubscriptionProvider) -> Path | None:
        if provider == "openai":
            return codex_home_dir(self.home(provider)) / CODEX_AUTH_FILE
        return None

    def status(self, provider: SubscriptionProvider) -> LoginStatus:
        """로그인 상태."""
        executable = self._executables.get(provider, CLI_EXECUTABLES[provider])
        available = shutil.which(executable) is not None
        path = self._credential_file(provider)
        if path is None:
            token = self._secrets.get(CLAUDE_TOKEN_SECRET)
            hint = mask(token) if token else None
            return LoginStatus(provider, bool(token), hint=hint, cli_available=available)
        if path.is_file():
            updated = path.stat().st_mtime
            return LoginStatus(provider, True, updated_at=updated, cli_available=available)
        return LoginStatus(provider, logged_in=False, cli_available=available)

    def save(self, provider: SubscriptionProvider, credential: str) -> LoginStatus:
        """붙여넣은 자격을 저장한다.

        Raises:
            LoginError: `invalid_token`(Claude), `invalid_codex_auth`.
        """
        text = credential.strip()
        path = self._credential_file(provider)
        if path is None:
            if len(text) < _MIN_TOKEN_LENGTH or any(ch.isspace() for ch in text):
                raise LoginError("invalid_token")
            self._secrets.set(CLAUDE_TOKEN_SECRET, text)
        else:
            _validate_codex_auth(text)
            write_private_file(path, text + "\n")
        logger.info("%s subscription login saved from the web Settings", provider)
        return self.status(provider)

    def clear(self, provider: SubscriptionProvider) -> LoginStatus:
        """로그아웃: 저장한 자격을 지운다 (CLI 쪽 세션 만료는 하지 않는다)."""
        path = self._credential_file(provider)
        if path is None:
            self._secrets.set(CLAUDE_TOKEN_SECRET, None)
        else:
            path.unlink(missing_ok=True)
        logger.info("%s subscription login cleared from the web Settings", provider)
        return self.status(provider)

    # --- Codex 기기 코드 로그인 ------------------------------------------------

    def device_login(self) -> DeviceLogin:
        """기기 코드 로그인 상태."""
        with self._lock:
            return self._device

    def start_device_login(self) -> DeviceLogin:
        """`codex login --device-auth`를 시작한다. 이미 진행 중이면 그 상태를 돌려준다.

        Raises:
            LoginError: `cli_missing` (Codex CLI 가 없다).
        """
        with self._lock:
            if self._process is not None and self._process.poll() is None:
                return self._device
            home = self.home("openai")
            command = [self._executables.get("openai", CODEX_EXECUTABLE), "login", "--device-auth"]
            try:
                self._process = subprocess.Popen(  # noqa: S603 — 인자 목록, 셸을 거치지 않는다
                    command,
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    env=isolated_environment(home, codex_env(home)),
                    cwd=home,
                )
            except FileNotFoundError as exc:
                raise LoginError("cli_missing") from exc
            self._device = DeviceLogin(state="waiting")
            process = self._process
        threading.Thread(
            target=self._follow, args=(process,), name="codex-device-login", daemon=True
        ).start()
        logger.info("codex device login started from the web Settings")
        return self.device_login()

    def cancel_device_login(self) -> DeviceLogin:
        """진행 중인 기기 코드 로그인을 끝낸다."""
        with self._lock:
            process = self._process
            if process is not None and process.poll() is None:
                process.terminate()
            self._device = DeviceLogin()
            return self._device

    def close(self) -> None:
        """웹 서버가 멈출 때: 진행 중인 로그인 명령을 끝낸다."""
        self.cancel_device_login()

    def _follow(self, process: subprocess.Popen[str]) -> None:
        timer = threading.Timer(self._device_timeout_s, self._expire, args=(process,))
        timer.daemon = True
        timer.start()
        last_line = ""
        try:
            assert process.stdout is not None  # noqa: S101 — stdout=PIPE 로 열었다
            for raw in process.stdout:
                line = _ANSI_RE.sub("", raw).strip()
                if line:
                    last_line = line
                self._update_from_line(process, line)
            code = process.wait()
        finally:
            timer.cancel()
        self._finish(process, code, last_line)

    def _update_from_line(self, process: subprocess.Popen[str], line: str) -> None:
        url = _URL_RE.search(line)
        code = _DEVICE_CODE_RE.search(line)
        with self._lock:
            if process is not self._process or self._device.state != "waiting":
                return
            if url and self._device.url is None:
                self._device = replace(self._device, url=url.group(0).rstrip(".,)"))
            if code and self._device.code is None:
                self._device = replace(self._device, code=code.group(0))

    def _expire(self, process: subprocess.Popen[str]) -> None:
        if process.poll() is None:
            process.terminate()
            with self._lock:
                if process is self._process:
                    self._device = replace(self._device, state="failed", error="timeout")

    def _finish(self, process: subprocess.Popen[str], code: int, last_line: str) -> None:
        auth = codex_home_dir(self.home("openai")) / CODEX_AUTH_FILE
        with self._lock:
            if process is not self._process or self._device.state != "waiting":
                return
            if code == 0 and auth.is_file():
                self._device = replace(self._device, state="done")
            else:
                tail = last_line[-_TAIL_CHARS:] or f"exit {code}"
                self._device = replace(self._device, state="failed", error=tail)
            state = self._device.state
        logger.info("codex device login finished: %s", state)


def _validate_codex_auth(text: str) -> None:
    """붙여넣은 Codex auth.json 의 모양을 확인한다 (값은 확인하지 않는다)."""
    try:
        data = json.loads(text)
    except ValueError as exc:
        raise LoginError("invalid_codex_auth") from exc
    if not isinstance(data, dict) or not data.get("tokens"):
        raise LoginError("invalid_codex_auth")


def cli_available(provider: str) -> bool:
    """구독 공급자의 CLI 가 PATH 에 있는지 (구독이 아닌 공급자는 참)."""
    executable = CLI_EXECUTABLES.get(provider)  # type: ignore[call-overload]
    return executable is None or shutil.which(executable) is not None


def available_subscription_clis() -> list[SubscriptionProvider]:
    """이 이미지(PATH)에 CLI 가 있는 구독 공급자 (Settings 가 인증 방식 선택지를 정한다)."""
    return [name for name in SUBSCRIPTION_LOGIN_PROVIDERS if cli_available(name)]
