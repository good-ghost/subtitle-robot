"""기존 외부 자막 이름 변경(`.orig`)과 revert (PROJECT-PLAN §21.11, WI-5.003).

이 도구가 쓸 사이드카와 이름이 같은(대소문자 무시) 외부 자막은 지우거나 덮어쓰지 않고 이름을 바꿔
보존한다. 쓴 파일과 이름 변경은 `SidecarRecord` 에 남겨 ledger(§21.12)가 저장하고, `media revert` 가
이 기록으로 원상 복구한다. 규칙은 docs/work-items/WI-5.003-sidecar-rename-revert.md.
"""

from __future__ import annotations

import hashlib
import os
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from subtitle_robot.io.atomic import default_file_mode
from subtitle_robot.media.naming import find_existing

RenameStyle = Literal["orig", "backup"]
ConflictPolicy = Literal["rename", "skip"]
ORIG_MARK = "orig"


class OutputFile(BaseModel):
    """이 도구가 쓴 파일."""

    path: str
    sha256: str


class Rename(BaseModel):
    """기존 파일 이름 변경."""

    original: str
    renamed: str


class SidecarRecord(BaseModel):
    """영상 하나의 사이드카 처리 기록 (ledger 에 저장)."""

    outputs: list[OutputFile] = Field(default_factory=list)
    renames: list[Rename] = Field(default_factory=list)

    def set_output(self, path: Path, sha256: str) -> None:
        """출력 파일 기록을 더하거나 바꾼다 (경로는 대소문자 무시)."""
        wanted = str(path).casefold()
        self.outputs = [o for o in self.outputs if o.path.casefold() != wanted]
        self.outputs.append(OutputFile(path=str(path), sha256=sha256))

    def output_hash(self, path: Path) -> str | None:
        """기록된 출력 파일의 해시 (경로는 대소문자 무시)."""
        wanted = str(path).casefold()
        return next((o.sha256 for o in self.outputs if o.path.casefold() == wanted), None)


def file_sha256(path: Path) -> str:
    """파일 해시 (사이드카는 작아서 전체를 읽는다)."""
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def preserved_name(path: Path, style: RenameStyle, number: int = 1) -> Path:
    """보존용 이름. orig: `Movie.en.orig.srt`, backup: `Movie.en.srt.orig` (2부터 순번)."""
    mark = ORIG_MARK if number == 1 else f"{ORIG_MARK}.{number}"
    if style == "backup" or not path.suffix:
        return path.with_name(f"{path.name}.{mark}")
    return path.with_name(f"{path.stem}.{mark}{path.suffix}")


def free_preserved_name(path: Path, style: RenameStyle) -> Path:
    """비어 있는 보존용 이름 (대소문자 무시로 겹치지 않을 때까지 순번을 올린다)."""
    number = 1
    while True:
        candidate = preserved_name(path, style, number)
        if find_existing(candidate) is None:
            return candidate
        number += 1


class SidecarWriter:
    """사이드카를 쓴다. 이름이 겹치는 외부 자막은 보존하고 기록을 남긴다 (WI-5.002 Installer).

    Args:
        style: 보존 이름 규칙.
        on_conflict: rename(보존 후 쓰기) 또는 skip(쓰지 않음).
        previous: 이전 처리 기록. 해시가 같은 파일은 이 도구의 출력이라 그대로 교체한다.
    """

    def __init__(
        self,
        *,
        style: RenameStyle = "orig",
        on_conflict: ConflictPolicy = "rename",
        previous: SidecarRecord | None = None,
    ) -> None:
        self._style = style
        self._on_conflict = on_conflict
        self._previous = previous or SidecarRecord()
        # 재처리해도 이전 이름 변경·출력은 revert 대상으로 남아야 한다
        self.record = self._previous.model_copy(deep=True)

    def __call__(self, temp: Path, target: Path) -> Path | None:
        """임시 파일을 대상 자리에 놓는다. 쓰지 않았으면 None (임시 파일 정리는 호출자)."""
        existing = find_existing(target)
        if existing is not None:
            # 이전 기록의 출력이거나 쓰려는 내용과 바이트가 같으면 이 도구가 쓴 것이다
            # (기록 전에 중단된 처리의 사이드카, 2026-10-03 컨테이너 테스트)
            if self._is_previous_output(existing) or file_sha256(existing) == file_sha256(temp):
                if existing != target:
                    existing.unlink()
            elif self._on_conflict == "skip":
                return None
            else:
                renamed = free_preserved_name(existing, self._style)
                existing.rename(renamed)
                self.record.renames.append(Rename(original=str(existing), renamed=str(renamed)))
        temp.replace(target)
        self.record.set_output(target, file_sha256(target))
        return target

    def write_text(self, target: Path, text: str) -> Path | None:
        """텍스트(번역 결과 `.ko.srt` 등)를 같은 규칙으로 원자적으로 쓴다."""
        target.parent.mkdir(parents=True, exist_ok=True)
        fd, temp_name = tempfile.mkstemp(
            dir=target.parent, prefix=f".{target.name}.", suffix=".tmp"
        )
        temp = Path(temp_name)
        try:
            os.fchmod(fd, default_file_mode())
            with os.fdopen(fd, "w", encoding="utf-8", newline="") as handle:
                handle.write(text)
                handle.flush()
                os.fsync(handle.fileno())
            return self(temp, target)
        finally:
            temp.unlink(missing_ok=True)

    def _is_previous_output(self, path: Path) -> bool:
        recorded = self._previous.output_hash(path)
        return recorded is not None and recorded == file_sha256(path)


@dataclass
class RevertResult:
    """revert 결과."""

    removed: list[Path] = field(default_factory=list)
    restored: list[Path] = field(default_factory=list)
    kept_modified: list[Path] = field(default_factory=list)
    not_restored: list[str] = field(default_factory=list)


def revert_sidecars(record: SidecarRecord) -> RevertResult:
    """기록대로 도구 출력을 지우고 이름을 바꾼 외부 자막을 원래 이름으로 되돌린다.

    사용자가 고친 출력(해시가 다름)은 지우지 않는다.
    원래 이름 자리에 다른 파일이 있으면 되돌리지 않는다.
    """
    result = RevertResult()
    for output in record.outputs:
        path = Path(output.path)
        if not path.exists():
            continue
        if file_sha256(path) == output.sha256:
            path.unlink()
            result.removed.append(path)
        else:
            result.kept_modified.append(path)
    for rename in reversed(record.renames):
        original, renamed = Path(rename.original), Path(rename.renamed)
        if not renamed.exists():
            result.not_restored.append(f"{renamed} 이 없다")
        elif find_existing(original) is not None:
            result.not_restored.append(f"{original} 자리에 다른 파일이 있다")
        else:
            renamed.rename(original)
            result.restored.append(original)
    return result
