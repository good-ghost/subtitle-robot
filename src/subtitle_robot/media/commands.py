"""외부 미디어 도구 실행 (mkvtoolnix·ffmpeg, PROJECT-PLAN §21.3·§21.4).

인자 목록으로 실행하고 셸을 거치지 않는다. 동영상 파일은 읽기만 한다.

추출은 동영상 파일 전체를 읽는다 (자막 블록이 영상 전체에 흩어져 있다). 다운로드 도구(SABnzbd 등)와
같은 디스크를 쓰면 서버 전체가 느려지므로 낮은 우선순위(`ionice` idle, `nice` 19)로 실행하고,
데몬 종료 요청이 오면 기다리지 않고 끝낸다 (WI-5.009b, 2026-10-03 실사용: 백로그 100여 개 처리 중
시스템이 멈추고 종료가 오래 걸렸다).
구독 공급자 CLI(Claude Code 등, §28.1)도 같은 실행부를 쓴다: 환경·표준 입력·작업 폴더를 넘긴다.
"""

from __future__ import annotations

import functools
import shutil
import subprocess
import tempfile
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import IO

# 종료 요청을 확인하는 간격과, 종료 신호 뒤 강제 종료까지 기다리는 시간
CANCEL_POLL_S = 0.5
TERMINATE_GRACE_S = 5.0


class MediaToolError(RuntimeError):
    """미디어 도구 실행 실패 (도구 없음, 시간 초과, 오류 종료)."""


class CommandCancelled(Exception):  # noqa: N818 — 오류가 아니라 종료 요청으로 멈춘 것이다
    """종료 요청으로 실행 중인 도구를 끝냈다 (작업은 다음 기동 때 다시 처리한다)."""


@dataclass(frozen=True)
class CommandResult:
    """외부 명령 결과."""

    returncode: int
    stdout: str
    stderr: str

    def tail(self) -> str:
        """오류 보고용 마지막 출력 줄."""
        lines = (self.stderr or self.stdout).strip().splitlines()
        return lines[-1] if lines else f"종료 코드 {self.returncode}"


Runner = Callable[[Sequence[str]], CommandResult]
StopCheck = Callable[[], bool]


@functools.cache
def low_priority_prefix() -> tuple[str, ...]:
    """낮은 우선순위로 실행하는 앞 명령. 없는 도구는 빼고 쓴다 (둘 다 없으면 그대로 실행).

    `ionice -c 3`(idle)은 디스크가 한가할 때만 읽는다. 스케줄러가 우선순위를 다루지 않으면
    (`none` 등) 효과가 없고, `nice`는 CPU 우선순위만 낮춘다.
    """
    prefix: list[str] = []
    if shutil.which("ionice"):
        prefix += ["ionice", "-c", "3"]
    if shutil.which("nice"):
        prefix += ["nice", "-n", "19"]
    return tuple(prefix)


def run_command(
    args: Sequence[str],
    *,
    timeout: float,
    low_priority: bool = False,
    should_stop: StopCheck | None = None,
    env: Mapping[str, str] | None = None,
    stdin: str | None = None,
    cwd: Path | None = None,
) -> CommandResult:
    """외부 명령을 실행한다. 입출력은 UTF-8 이다 (C 로캘 컨테이너에서도 한글·일본어를 넘긴다).

    Args:
        args: 명령과 인자.
        timeout: 제한 시간(초).
        low_priority: `ionice`·`nice`로 낮은 우선순위로 실행한다.
        should_stop: 참을 돌려주면 명령을 끝내고 CommandCancelled.
        env: 명령의 환경 변수 전체. None 이면 이 프로세스의 환경을 물려준다.
        stdin: 표준 입력으로 보낼 문자열. None 이면 표준 입력을 물려준다.
        cwd: 작업 폴더.

    Raises:
        MediaToolError: 명령이 없거나 시간 안에 끝나지 않았다.
        CommandCancelled: 종료 요청으로 명령을 끝냈다.
    """
    if shutil.which(args[0]) is None:
        raise MediaToolError(f"{args[0]} 이 없다 (mkvtoolnix·ffmpeg 설치 필요)")
    command = [*(low_priority_prefix() if low_priority else ()), *args]
    # 표준 입력은 임시 파일로 넘긴다. 파이프로 넘기면 communicate 를 나눠 부를 때(종료 확인)
    # 첫 호출에서 다 쓰지 못한 나머지를 다시 보낼 수 없다
    if stdin is None:
        return _run(args, command, timeout, should_stop, env, None, cwd)
    with tempfile.TemporaryFile() as input_file:
        input_file.write(stdin.encode("utf-8"))
        input_file.seek(0)
        return _run(args, command, timeout, should_stop, env, input_file, cwd)


def _run(
    args: Sequence[str],
    command: list[str],
    timeout: float,
    should_stop: StopCheck | None,
    env: Mapping[str, str] | None,
    stdin: IO[bytes] | None,
    cwd: Path | None,
) -> CommandResult:
    try:
        process = subprocess.Popen(  # noqa: S603 — 인자 목록으로 실행, 셸을 거치지 않는다
            command,
            stdin=stdin,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            env=dict(env) if env is not None else None,
            cwd=cwd,
        )
    except FileNotFoundError as exc:
        raise MediaToolError(f"{args[0]} 이 없다 (mkvtoolnix·ffmpeg 설치 필요)") from exc
    waited = 0.0
    while True:
        step = min(CANCEL_POLL_S, timeout - waited) if should_stop else timeout - waited
        try:
            stdout, stderr = process.communicate(timeout=max(step, 0.0))
            return CommandResult(process.returncode, stdout, stderr)
        except subprocess.TimeoutExpired:
            waited += step
        if should_stop is not None and should_stop():
            _terminate(process)
            raise CommandCancelled(f"종료 요청으로 {args[0]} 을 멈춤")
        if waited >= timeout:
            process.kill()
            process.communicate()
            raise MediaToolError(f"{args[0]} 이 {timeout:.0f}초 안에 끝나지 않았다")


def _terminate(process: subprocess.Popen[str]) -> None:
    """종료 신호를 보내고 잠깐 기다린 뒤에도 남아 있으면 강제로 끝낸다."""
    process.terminate()
    try:
        process.communicate(timeout=TERMINATE_GRACE_S)
    except subprocess.TimeoutExpired:
        process.kill()
        process.communicate()


def tool_runner(
    timeout: float, *, low_priority: bool, should_stop: StopCheck | None = None
) -> Runner:
    """설정(우선순위·종료 확인)을 묶은 실행기."""

    def run(args: Sequence[str]) -> CommandResult:
        return run_command(
            args, timeout=timeout, low_priority=low_priority, should_stop=should_stop
        )

    return run
