"""구독 CLI 테스트용 가짜 실행 파일 (Claude Code·Codex·Gemini CLI 대신, §28.1).

실행될 때마다 인자·환경·표준 입력·작업 폴더 파일을 `calls.jsonl`에 남기고, `scenario.json`대로
출력·종료 코드·지연·출력 파일을 만든다.
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

_SCRIPT = """#!{python}
import json, os, pathlib, sys, time
root = pathlib.Path({root!r})
stdin = sys.stdin.buffer.read().decode("utf-8") if not sys.stdin.isatty() else ""
cwd = pathlib.Path.cwd()
files = {{p.name: p.read_text("utf-8") for p in cwd.iterdir() if p.is_file()}}
record = {{"argv": sys.argv[1:], "env": dict(os.environ), "stdin": stdin, "cwd": str(cwd),
          "files": files}}
with open(root / "calls.jsonl", "a", encoding="utf-8") as log:
    log.write(json.dumps(record, ensure_ascii=False) + "\\n")
scenario = json.loads((root / "scenario.json").read_text("utf-8"))
sys.stdout.buffer.write(scenario.get("early_stdout", "").encode("utf-8"))
sys.stdout.flush()
time.sleep(scenario.get("sleep", 0))
for variable, name, content in scenario.get("write_env", []):
    target = pathlib.Path(os.environ[variable]) / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, "utf-8")
for flag, content in scenario.get("write_after", {{}}).items():
    path = pathlib.Path(sys.argv[sys.argv.index(flag) + 1])
    path.write_text(content, "utf-8")
sys.stdout.buffer.write(scenario.get("stdout", "").encode("utf-8"))
sys.stderr.buffer.write(scenario.get("stderr", "").encode("utf-8"))
sys.exit(scenario.get("exit", 0))
"""


@dataclass
class FakeCli:
    """가짜 CLI 하나."""

    root: Path
    executable: Path

    def scenario(self, **values: Any) -> None:
        """다음 실행의 동작.

        stdout·stderr·exit, sleep(초), early_stdout(대기 전에 내보낼 출력),
        write_after({인자: 내용}: 그 인자 다음 경로에 쓴다), write_env([[환경 변수, 이름, 내용]]).
        """
        (self.root / "scenario.json").write_text(json.dumps(values, ensure_ascii=False), "utf-8")

    def calls(self) -> list[dict[str, Any]]:
        """기록된 실행들."""
        log = self.root / "calls.jsonl"
        if not log.exists():
            return []
        return [json.loads(line) for line in log.read_text("utf-8").splitlines()]


def make_fake_cli(tmp_path: Path, name: str) -> FakeCli:
    """tmp_path/fake-<name>/<name> 실행 파일을 만든다."""
    root = tmp_path / f"fake-{name}"
    root.mkdir()
    executable = root / name
    executable.write_text(_SCRIPT.format(python=sys.executable, root=str(root)), "utf-8")
    executable.chmod(0o755)
    fake = FakeCli(root, executable)
    fake.scenario(stdout="")
    return fake
