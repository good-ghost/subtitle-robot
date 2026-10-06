"""처리 기록 ledger — 반복 작업 방지 (PROJECT-PLAN §21.12, WI-5.006).

이미 처리한 영상은 다시 검사·추출·번역하지 않는다. 경로가 바뀌어도 내용 식별값으로 같은 영상임을
알아보고, 새 위치에 사이드카가 없으면 `/data/outputs/<내용 식별값>/` 보관본에서 복원한다.
규칙은 docs/work-items/WI-5.006-ledger.md.
"""

from __future__ import annotations

import json
import shutil
import sqlite3
import threading
import time
from collections.abc import Callable, Iterator, Sequence
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal, get_args

from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.media.naming import find_existing
from subtitle_robot.media.sidecar import SidecarRecord, file_sha256
from subtitle_robot.watch.identity import DEFAULT_HASH_BYTES, content_id, quick_key
from subtitle_robot.watch.state import connect

# has_korean 은 0.6.0 전 기록의 값이다 (지금은 has_target 을 쓴다, §26.6)
Verdict = Literal[
    "translated", "has_target", "has_korean", "has_external", "no_source", "image_only", "failed"
]
LookupKind = Literal["new", "same", "moved", "copied", "changed"]
ARCHIVE_DIR = "outputs"
ARCHIVE_META = "meta.json"
# 판정이 이것이면 다시 검사하지 않는다 (파일이 바뀌거나 --force·forget 일 때만)
SETTLED_VERDICTS: frozenset[Verdict] = frozenset(
    {"translated", "has_target", "has_korean", "has_external", "no_source", "image_only"}
)
# 새 판정 값 → 같은 뜻의 0.6.0 전 값 (목록 필터가 함께 낸다)
LEGACY_VERDICTS: dict[str, tuple[str, ...]] = {"has_target": ("has_korean",)}
_COLUMNS = (
    "content_id", "path", "size", "mtime_ns", "segment_uid", "verdict", "reason", "source",
    "provider", "model", "sidecars", "archive", "attempts", "current", "processed_at",
    "updated_at",
)  # fmt: skip


class LedgerError(ValueError):
    """기록을 해석할 수 없거나 가져올 수 없다."""


@dataclass(frozen=True)
class LedgerEntry:
    """영상 하나의 처리 기록."""

    id: int
    content_id: str
    path: Path
    size: int
    mtime_ns: int
    segment_uid: str | None
    verdict: Verdict
    reason: str
    source: dict[str, Any]
    provider: str | None
    model: str | None
    sidecars: SidecarRecord
    archive: Path | None
    attempts: int
    current: bool
    processed_at: float
    updated_at: float

    @property
    def settled(self) -> bool:
        """다시 처리하지 않는 판정."""
        return self.verdict in SETTLED_VERDICTS


@dataclass(frozen=True)
class Lookup:
    """조회 결과.

    Attributes:
        kind: new | same | moved | copied | changed.
        content_id: 계산했으면 내용 식별값 (same 을 빠른 확인으로 판단했으면 기록의 값).
        entry: 관련 기록 (same·changed 는 이 경로의 기록, moved·copied 는 원래 기록).
    """

    kind: LookupKind
    content_id: str | None
    entry: LedgerEntry | None


class Ledger:
    """`state.db` 의 `media_ledger` 와 보관본 폴더.

    Args:
        db_path: 상태 DB.
        data_dir: 데이터 폴더 (보관본 `outputs/`).
        hash_bytes: 내용 식별에 읽을 앞·뒤 바이트 수.
        clock: 현재 시각 (테스트용).
    """

    def __init__(
        self,
        db_path: Path,
        data_dir: Path,
        *,
        hash_bytes: int = DEFAULT_HASH_BYTES,
        clock: Callable[[], float] = time.time,
    ) -> None:
        self._conn = connect(db_path)
        self._lock = threading.Lock()
        self._archive_root = Path(data_dir) / ARCHIVE_DIR
        self._hash_bytes = hash_bytes
        self._clock = clock

    def close(self) -> None:
        """연결을 닫는다."""
        self._conn.close()

    # ------------------------------------------------------------ 조회

    def lookup(self, path: Path) -> Lookup:
        """영상이 처리된 적이 있는지 확인한다 (빠른 확인 → 내용 식별값)."""
        path = Path(path)
        previous = self.find(path)
        key = quick_key(path)
        if previous is not None and (previous.size, previous.mtime_ns) == (key.size, key.mtime_ns):
            return Lookup("same", previous.content_id, previous)
        identity = content_id(path, hash_bytes=self._hash_bytes)
        if previous is not None:
            if previous.content_id == identity:
                self._update(previous.id, size=key.size, mtime_ns=key.mtime_ns)
                return Lookup("same", identity, self.find(path))
            return Lookup("changed", identity, previous)
        original = self._find_by_content(identity)
        if original is None:
            return Lookup("new", identity, None)
        kind: LookupKind = "copied" if original.path.exists() else "moved"
        return Lookup(kind, identity, original)

    def find(self, path: Path) -> LedgerEntry | None:
        """경로의 현재 기록."""
        with self._lock:
            row = self._conn.execute(
                "SELECT * FROM media_ledger WHERE path = ? AND current = 1 ORDER BY id DESC",
                (str(path),),
            ).fetchone()
        return _entry(row) if row else None

    def entries(
        self, verdict: Verdict | None = None, *, include_history: bool = False
    ) -> list[LedgerEntry]:
        """기록 목록 (처리 시각 순). has_target 은 0.6.0 전 값 has_korean 도 함께 낸다."""
        query = "SELECT * FROM media_ledger WHERE (current = 1 OR ?)"
        params: list[Any] = [int(include_history)]
        if verdict is not None:
            same = LEGACY_VERDICTS.get(verdict, ())
            query += f" AND verdict IN ({', '.join('?' * (1 + len(same)))})"
            params.extend((verdict, *same))
        with self._lock:
            rows = self._conn.execute(query + " ORDER BY processed_at, id", params).fetchall()
        return [_entry(row) for row in rows]

    # ------------------------------------------------------------ 기록

    def record(
        self,
        path: Path,
        *,
        verdict: Verdict,
        reason: str = "",
        identity: str | None = None,
        segment_uid: str | None = None,
        source: dict[str, Any] | None = None,
        provider: str | None = None,
        model: str | None = None,
        sidecars: SidecarRecord | None = None,
        attempts: int = 0,
    ) -> LedgerEntry:
        """처리 결과를 기록한다. 같은 경로의 이전 기록은 이력으로 돌린다.

        이 도구가 쓴 사이드카는 보관본으로 복사한다 (이동된 영상에 복원).
        """
        path = Path(path)
        identity = identity or content_id(path, hash_bytes=self._hash_bytes)
        key = quick_key(path)
        sidecars = sidecars or SidecarRecord()
        archive = self._archive(identity, path, sidecars, verdict, provider, model)
        now = self._clock()
        with self._transaction() as conn:
            conn.execute(
                "UPDATE media_ledger SET current = 0, updated_at = ? "
                "WHERE path = ? AND current = 1",
                (now, str(path)),
            )
            cursor = conn.execute(
                "INSERT INTO media_ledger (content_id, path, size, mtime_ns, segment_uid, verdict, "
                "reason, source, provider, model, sidecars, archive, attempts, current, "
                "processed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
                (
                    identity, str(path), key.size, key.mtime_ns, segment_uid, verdict, reason,
                    json.dumps(source or {}, ensure_ascii=False), provider, model,
                    sidecars.model_dump_json(), str(archive) if archive else None, attempts,
                    now, now,
                ),
            )  # fmt: skip
        return self._get(int(cursor.lastrowid or 0))

    def relocate(self, lookup: Lookup, new_path: Path, *, restore: bool = True) -> LedgerEntry:
        """이동(moved)·복사(copied)된 영상의 기록을 새 경로로 옮기고 없는 사이드카를 복원한다.

        Raises:
            LedgerError: moved·copied 조회 결과가 아니다.
        """
        original = lookup.entry
        if lookup.kind not in ("moved", "copied") or original is None:
            raise LedgerError(f"이동·복사된 영상이 아니다: {lookup.kind}")
        new_path = Path(new_path)
        sidecars = self.restore_outputs(original, new_path) if restore else SidecarRecord()
        key = quick_key(new_path)
        if lookup.kind == "moved":
            self._update(
                original.id,
                path=str(new_path),
                size=key.size,
                mtime_ns=key.mtime_ns,
                sidecars=sidecars.model_dump_json(),
            )
            return self._get(original.id)
        return self.record(
            new_path,
            verdict=original.verdict,
            reason=original.reason,
            identity=original.content_id,
            segment_uid=original.segment_uid,
            source=original.source,
            provider=original.provider,
            model=original.model,
            sidecars=sidecars,
            attempts=original.attempts,
        )

    def restore_outputs(self, entry: LedgerEntry, video: Path) -> SidecarRecord:
        """보관본의 사이드카를 영상 옆에 복원한다. 이미 있는 이름은 건드리지 않는다.

        Returns:
            새 위치의 사이드카 기록 (복원했거나 관리 도구가 함께 옮긴 같은 내용의 파일).
        """
        record = SidecarRecord()
        if entry.archive is None or not (entry.archive / ARCHIVE_META).is_file():
            return record
        meta = json.loads((entry.archive / ARCHIVE_META).read_text(encoding="utf-8"))
        for item in meta.get("files", []):
            suffix, sha256 = str(item["suffix"]), str(item["sha256"])
            target = video.parent / f"{video.stem}{suffix}"
            existing = find_existing(target)
            if existing is not None:
                if file_sha256(existing) == sha256:
                    record.set_output(existing, sha256)
                continue
            source = entry.archive / suffix.lstrip(".")
            if not source.is_file():
                continue
            temp = target.with_name(f".{target.name}.restore.tmp")
            shutil.copyfile(source, temp)
            temp.replace(target)
            record.set_output(target, sha256)
        return record

    def forget(self, path: Path) -> int:
        """경로의 기록(이력 포함)을 지운다 → 다음 이벤트·`media` 때 다시 처리. 지운 개수."""
        with self._transaction() as conn:
            cursor = conn.execute("DELETE FROM media_ledger WHERE path = ?", (str(path),))
        return int(cursor.rowcount)

    # ------------------------------------------------------------ 이관

    def export_rows(self) -> list[dict[str, Any]]:
        """모든 기록(이력 포함)을 JSON 으로 직렬화할 수 있는 형태로."""
        with self._lock:
            rows = self._conn.execute("SELECT * FROM media_ledger ORDER BY id").fetchall()
        return [{column: row[column] for column in _COLUMNS} for row in rows]

    def import_rows(self, rows: Sequence[dict[str, Any]]) -> int:
        """내보낸 기록을 가져온다. 같은 경로·내용의 현재 기록이 이미 있으면 건너뛴다. 가져온 개수.

        Raises:
            LedgerError: 필수 열이 없거나 판정 값이 잘못됐다.
        """
        imported = 0
        with self._transaction() as conn:
            for number, row in enumerate(rows, start=1):
                missing = [column for column in _COLUMNS if column not in row]
                if missing:
                    raise LedgerError(f"{number}번째 기록에 열이 없다: {', '.join(missing)}")
                if row["verdict"] not in get_args(Verdict):
                    raise LedgerError(f"{number}번째 기록의 판정 값이 잘못됐다: {row['verdict']}")
                exists = conn.execute(
                    "SELECT 1 FROM media_ledger WHERE path = ? AND content_id = ? AND current = ?",
                    (row["path"], row["content_id"], row["current"]),
                ).fetchone()
                if exists:
                    continue
                conn.execute(
                    "INSERT INTO media_ledger (content_id, path, size, mtime_ns, segment_uid, "
                    "verdict, reason, source, provider, model, sidecars, archive, attempts, "
                    "current, processed_at, updated_at) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    tuple(row[column] for column in _COLUMNS),
                )
                imported += 1
        return imported

    # ------------------------------------------------------------ 내부

    def _archive(
        self,
        identity: str,
        video: Path,
        sidecars: SidecarRecord,
        verdict: Verdict,
        provider: str | None,
        model: str | None,
    ) -> Path | None:
        """이 도구가 쓴 사이드카를 `outputs/<식별값>/` 에 영상 이름 뒷부분으로 복사한다."""
        files = []
        folder = self._archive_root / identity
        for output in sidecars.outputs:
            path = Path(output.path)
            if not path.is_file() or file_sha256(path) != output.sha256:
                continue  # 사용자가 고쳤거나 지웠다
            if not path.name.casefold().startswith(f"{video.stem}.".casefold()):
                continue
            suffix = path.name[len(video.stem) :]
            folder.mkdir(parents=True, exist_ok=True)
            temp = folder / f".{suffix.lstrip('.')}.tmp"
            shutil.copyfile(path, temp)
            temp.replace(folder / suffix.lstrip("."))
            files.append({"suffix": suffix, "sha256": output.sha256})
        if not files:
            return None
        meta = {
            "video": video.name,
            "verdict": verdict,
            "provider": provider,
            "model": model,
            "processed_at": self._clock(),
            "files": files,
        }
        atomic_write_text(folder / ARCHIVE_META, json.dumps(meta, ensure_ascii=False, indent=1))
        return folder

    def _find_by_content(self, identity: str) -> LedgerEntry | None:
        with self._lock:
            row = self._conn.execute(
                "SELECT * FROM media_ledger WHERE content_id = ? AND current = 1 ORDER BY id DESC",
                (identity,),
            ).fetchone()
        return _entry(row) if row else None

    def _get(self, entry_id: int) -> LedgerEntry:
        with self._lock:
            row = self._conn.execute(
                "SELECT * FROM media_ledger WHERE id = ?", (entry_id,)
            ).fetchone()
        if row is None:
            raise LedgerError(f"기록 {entry_id} 이 없다")
        return _entry(row)

    def _update(self, entry_id: int, **values: Any) -> None:
        # 열 이름은 이 모듈의 고정 목록에서만 온다 (값은 매개변수로 넘긴다)
        unknown = set(values) - set(_COLUMNS)
        if unknown:
            raise LedgerError(f"모르는 열: {', '.join(sorted(unknown))}")
        values["updated_at"] = self._clock()
        assignments = ", ".join(f"{column} = ?" for column in values)
        with self._transaction() as conn:
            conn.execute(
                "UPDATE media_ledger SET " + assignments + " WHERE id = ?",  # noqa: S608
                (*values.values(), entry_id),
            )

    @contextmanager
    def _transaction(self) -> Iterator[sqlite3.Connection]:
        with self._lock:
            self._conn.execute("BEGIN IMMEDIATE")
            try:
                yield self._conn
            except BaseException:
                self._conn.rollback()
                raise
            self._conn.commit()


def _entry(row: sqlite3.Row) -> LedgerEntry:
    verdict = row["verdict"]
    if verdict not in get_args(Verdict):
        raise LedgerError(f"모르는 판정: {verdict}")
    return LedgerEntry(
        id=int(row["id"]),
        content_id=str(row["content_id"]),
        path=Path(row["path"]),
        size=int(row["size"]),
        mtime_ns=int(row["mtime_ns"]),
        segment_uid=row["segment_uid"],
        verdict=verdict,
        reason=str(row["reason"]),
        source=json.loads(row["source"]) if row["source"] else {},
        provider=row["provider"],
        model=row["model"],
        sidecars=SidecarRecord.model_validate_json(row["sidecars"] or "{}"),
        archive=Path(row["archive"]) if row["archive"] else None,
        attempts=int(row["attempts"]),
        current=bool(row["current"]),
        processed_at=float(row["processed_at"]),
        updated_at=float(row["updated_at"]),
    )
