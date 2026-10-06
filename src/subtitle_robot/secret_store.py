"""비밀 저장소: 데이터 폴더의 `secrets.toml` (PROJECT-PLAN §28.2, REQ-046, NFR-010, WI-10.001).

공급자 키, TMDB 키, 구독 로그인, 관리 계정, 세션 서명 키를 둔다. 웹 Settings 가 넣고 바꾼다.
환경 변수의 키는 읽지 않는다 (Q-24). 파일은 권한 600 으로 임시 파일에 쓴 뒤 rename 한다.
값은 화면·API·로그·예외 메시지에 넣지 않는다 (`mask`로 끝 4자리만).

```toml
[providers.claude]
api_key = "…"
[tmdb]
api_key = "…"
```
"""

from __future__ import annotations

import os
import re
import tempfile
import threading
import tomllib
from collections.abc import Mapping
from pathlib import Path
from typing import Any

import tomlkit

SECRETS_FILE = "secrets.toml"
# TOML 오류 메시지에서 줄 번호만 꺼낸다 (메시지에 비밀 값 일부가 섞일 수 있다)
_LINE_RE = re.compile(r"at line (\d+)")
_FILE_MODE = 0o600
_MASK_VISIBLE = 4
# 마스킹해도 끝자리를 보이지 않을 만큼 짧은 값
_MASK_MIN_LENGTH = 12


class SecretStoreError(RuntimeError):
    """비밀 파일을 읽거나 쓸 수 없다 (값은 메시지에 넣지 않는다)."""


class SecretStore:
    """비밀 값 저장소. 점 경로(`providers.claude.api_key`)로 읽고 쓴다.

    Args:
        path: 파일 경로. None 이면 메모리에만 둔다 (테스트용).
        values: 메모리 저장소의 처음 값.
    """

    def __init__(self, path: Path | None, values: Mapping[str, Any] | None = None) -> None:
        self._path = Path(path) if path is not None else None
        self._memory: dict[str, Any] = _copy(values or {})
        self._lock = threading.Lock()

    @classmethod
    def for_data_dir(cls, data_dir: Path) -> SecretStore:
        """데이터 폴더의 비밀 저장소."""
        return cls(Path(data_dir) / SECRETS_FILE)

    @classmethod
    def in_memory(cls, values: Mapping[str, Any] | None = None) -> SecretStore:
        """파일 없이 메모리에만 두는 저장소 (테스트·일회성 명령)."""
        return cls(None, values)

    @property
    def path(self) -> Path | None:
        """파일 경로 (메모리 저장소는 None)."""
        return self._path

    def get(self, key: str) -> str | None:
        """값 하나. 없거나 빈 문자열이면 None."""
        node: Any = self._read()
        for part in key.split("."):
            if not isinstance(node, dict) or part not in node:
                return None
            node = node[part]
        return node if isinstance(node, str) and node else None

    def set(self, key: str, value: str | None) -> None:
        """값 하나를 바꾼다. None·빈 문자열이면 지운다.

        Raises:
            SecretStoreError: 파일을 쓸 수 없다.
        """
        with self._lock:
            data = self._read()
            parts = key.split(".")
            node = data
            for part in parts[:-1]:
                child = node.get(part)
                if not isinstance(child, dict):
                    child = {}
                    node[part] = child
                node = child
            if value:
                node[parts[-1]] = value
            else:
                node.pop(parts[-1], None)
            self._write(_prune(data))

    def provider_key(self, provider: str) -> str | None:
        """공급자 API 키."""
        return self.get(f"providers.{provider}.api_key")

    def _read(self) -> dict[str, Any]:
        if self._path is None:
            return _copy(self._memory)
        try:
            text = self._path.read_text(encoding="utf-8")
        except FileNotFoundError:
            return {}
        except OSError as exc:
            raise SecretStoreError(
                f"비밀 파일을 읽을 수 없다: {self._path} ({exc.strerror})"
            ) from exc
        try:
            return tomllib.loads(text)
        except tomllib.TOMLDecodeError as exc:
            # 내용(비밀)이 메시지에 섞이지 않게 위치만 남긴다
            line = _LINE_RE.search(str(exc))
            where = f" (줄 {line.group(1)})" if line else ""
            raise SecretStoreError(f"비밀 파일 형식 오류: {self._path}{where}") from None

    def _write(self, data: dict[str, Any]) -> None:
        if self._path is None:
            self._memory = data
            return
        self._path.parent.mkdir(parents=True, exist_ok=True)
        fd, temp_name = tempfile.mkstemp(
            dir=self._path.parent, prefix=f".{self._path.name}.", suffix=".tmp"
        )
        temp = Path(temp_name)
        try:
            os.fchmod(fd, _FILE_MODE)
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                handle.write(tomlkit.dumps(data))
                handle.flush()
                os.fsync(handle.fileno())
            temp.replace(self._path)
        except OSError as exc:
            temp.unlink(missing_ok=True)
            raise SecretStoreError(
                f"비밀 파일을 쓸 수 없다: {self._path} ({exc.strerror})"
            ) from exc


def mask(value: str | None) -> str | None:
    """화면에 보일 표시: 끝 4자리만 (`…abcd`). 짧은 값은 끝자리도 숨긴다. 없으면 None."""
    if not value:
        return None
    return f"…{value[-_MASK_VISIBLE:]}" if len(value) >= _MASK_MIN_LENGTH else "…"


def _copy(data: Mapping[str, Any]) -> dict[str, Any]:
    return {k: _copy(v) if isinstance(v, Mapping) else v for k, v in data.items()}


def _prune(data: dict[str, Any]) -> dict[str, Any]:
    """빈 표를 지운다."""
    pruned: dict[str, Any] = {}
    for key, value in data.items():
        if isinstance(value, dict):
            value = _prune(value)
            if not value:
                continue
        pruned[key] = value
    return pruned
