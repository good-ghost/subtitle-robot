"""영속 작업 큐 (PROJECT-PLAN §21.8, WI-5.005).

상태: `queued → probing → extracting → translating → done | skipped | failed`.
새 영상·`media` 명령이 백로그보다 먼저다. 같은 시리즈는 한 번에 하나만 처리한다 (순서 보장).
실패는 지수 백오프로 다시 시도하고 `max_attempts` 를 넘으면 `failed` 로 둔다.
공급자가 불가하면 새 작업을 꺼내지 않고, 되돌린 작업은 시도 횟수를 늘리지 않는다 (WI-1.012).
재시작하면 처리 중이던 작업을 다시 대기로 돌린다 (번역은 체크포인트로 이어서 한다).
"""

from __future__ import annotations

import json
import sqlite3
import threading
import time
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal, get_args

from subtitle_robot.watch.state import connect

JobStatus = Literal["queued", "probing", "extracting", "translating", "done", "skipped", "failed"]
JobPriority = Literal["new", "backlog"]
# SQL 문의 상태 목록은 문자열 조립 없이 리터럴로 적는다. 이 상수와 같아야 한다
ACTIVE_STATUSES: tuple[JobStatus, ...] = ("probing", "extracting", "translating")
PENDING_STATUSES: tuple[JobStatus, ...] = ("queued", *ACTIVE_STATUSES)
_PRIORITY_RANK: dict[JobPriority, int] = {"new": 0, "backlog": 1}
_RANK_PRIORITY = {rank: name for name, rank in _PRIORITY_RANK.items()}
# 실패 재시도 간격: 60초 · 2배씩 · 최대 1시간 (아직 복사 중인 파일, 일시적 도구 오류)
BACKOFF_BASE_S = 60.0
BACKOFF_MAX_S = 3600.0
DEFAULT_MAX_ATTEMPTS = 5
_PROVIDER_STATE_KEY = "provider_state"
_PROVIDER_REASON_KEY = "provider_reason"

Clock = Callable[[], float]


class JobError(ValueError):
    """없는 작업이거나 허용되지 않는 상태 전이."""


@dataclass(frozen=True)
class Job:
    """작업 하나."""

    id: int
    path: Path
    status: JobStatus
    priority: JobPriority
    force: bool
    series_key: str | None
    attempts: int
    next_attempt_at: float
    detail: dict[str, Any]
    error: str | None
    size: int | None
    mtime: float | None
    created_at: float
    updated_at: float


def backoff_seconds(attempts: int) -> float:
    """시도 횟수에 따른 재시도 대기 (1회 실패 → 60초, 2회 → 120초 …)."""
    return float(min(BACKOFF_BASE_S * 2 ** max(attempts - 1, 0), BACKOFF_MAX_S))


class JobQueue:
    """SQLite 작업 큐. 스레드 사이에 공유할 수 있다 (연결 하나를 잠금으로 보호).

    Args:
        path: 상태 DB 경로.
        max_attempts: 실패 재시도 상한.
        clock: 현재 시각 (테스트용).
    """

    def __init__(
        self, path: Path, *, max_attempts: int = DEFAULT_MAX_ATTEMPTS, clock: Clock = time.time
    ) -> None:
        self._conn = connect(path)
        self._lock = threading.Lock()
        self._max_attempts = max_attempts
        self._clock = clock

    def close(self) -> None:
        """연결을 닫는다."""
        self._conn.close()

    # ------------------------------------------------------------ 등록·꺼내기

    def enqueue(
        self,
        path: Path,
        *,
        priority: JobPriority = "new",
        force: bool = False,
        series_key: str | None = None,
        size: int | None = None,
        mtime: float | None = None,
        detail: dict[str, Any] | None = None,
        not_before: float | None = None,
    ) -> Job:
        """작업을 등록한다. 같은 경로의 미완료 작업이 있으면 그것을 돌려준다.

        not_before 를 주면 그 시각 전에는 꺼내지 않는다 (시리즈 배치 창, §21.6).

        detail 은 워커에게 넘길 값이다 (예: 시리즈 배치 창의 `series_mode`).

        이미 있는 작업은 우선순위가 더 높으면(백로그 → 새 영상) 올리고 force 를 합친다.
        """
        now = self._clock()
        rank = _PRIORITY_RANK[priority]
        with self._transaction() as conn:
            row = conn.execute(
                "SELECT * FROM jobs WHERE path = ? AND status IN "
                "('queued', 'probing', 'extracting', 'translating')",
                (str(path),),
            ).fetchone()
            if row is not None:
                conn.execute(
                    "UPDATE jobs SET priority = MIN(priority, ?), force = MAX(force, ?), "
                    "updated_at = ? WHERE id = ?",
                    (rank, int(force), now, row["id"]),
                )
                job_id = int(row["id"])
            else:
                cursor = conn.execute(
                    "INSERT INTO jobs (path, size, mtime, priority, status, force, series_key, "
                    "detail, next_attempt_at, created_at, updated_at) "
                    "VALUES (?, ?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?)",
                    (
                        str(path), size, mtime, rank, int(force), series_key,
                        json.dumps(detail, ensure_ascii=False) if detail else None,
                        not_before or 0, now, now,
                    ),
                )  # fmt: skip
                job_id = int(cursor.lastrowid or 0)
        return self.get(job_id)

    def open_window(self, series_key: str) -> float | None:
        """같은 시리즈의 열려 있는 배치 창 끝 시각.

        대기 중이고 처리 가능 시각이 미래인 작업의 시각이다. 없으면 None.
        """
        now = self._clock()
        with self._lock:
            row = self._conn.execute(
                "SELECT next_attempt_at FROM jobs WHERE series_key = ? AND status = 'queued' "
                "AND attempts = 0 AND next_attempt_at > ? ORDER BY id LIMIT 1",
                (series_key, now),
            ).fetchone()
        return float(row["next_attempt_at"]) if row else None

    def queued_siblings(self, job: Job) -> list[Job]:
        """같은 시리즈의 다른 대기 작업 (prescan 묶음 판단·준비)."""
        if job.series_key is None:
            return []
        return [
            other
            for other in self.jobs("queued")
            if other.series_key == job.series_key and other.id != job.id
        ]

    def claim(self, job_id: int | None = None) -> Job | None:
        """처리할 작업 하나를 꺼내 `probing` 으로 바꾼다. 없으면 None.

        공급자가 불가 상태면 꺼내지 않는다. 같은 시리즈가 처리 중이면 그 시리즈는 건너뛴다.
        job_id 를 주면 그 작업만 꺼낸다 (`media --foreground`, 재시도 대기는 무시).
        """
        if self.provider_state() == "unavailable":
            return None
        now = self._clock()
        with self._transaction() as conn:
            if job_id is not None:
                row = conn.execute(
                    "SELECT * FROM jobs WHERE id = ? AND status = 'queued'", (job_id,)
                ).fetchone()
            else:
                row = conn.execute(
                    "SELECT * FROM jobs WHERE status = 'queued' AND next_attempt_at <= ? "
                    "AND (series_key IS NULL OR series_key NOT IN ("
                    "SELECT series_key FROM jobs WHERE series_key IS NOT NULL "
                    "AND status IN ('probing', 'extracting', 'translating'))) "
                    "ORDER BY priority, id LIMIT 1",
                    (now,),
                ).fetchone()
            if row is None:
                return None
            conn.execute(
                "UPDATE jobs SET status = 'probing', updated_at = ? WHERE id = ?",
                (now, row["id"]),
            )
        return self.get(int(row["id"]))

    # ------------------------------------------------------------ 진행·종료

    def advance(self, job_id: int, status: Literal["extracting", "translating"]) -> Job:
        """처리 단계를 기록한다.

        Raises:
            JobError: 처리 중인 작업이 아니다.
        """
        return self._transition(job_id, status, ACTIVE_STATUSES)

    def complete(
        self, job_id: int, status: Literal["done", "skipped"], detail: dict[str, Any] | None = None
    ) -> Job:
        """작업을 끝낸다 (detail: 판정·소스 트랙·생성 파일 등).

        Raises:
            JobError: 처리 중인 작업이 아니다.
        """
        return self._transition(job_id, status, ACTIVE_STATUSES, detail=detail, error=None)

    def update_detail(self, job_id: int, values: dict[str, Any]) -> Job:
        """처리 중 진행 정보를 detail 에 합친다 (상태는 그대로, 재시작 뒤에도 남는다).

        Raises:
            JobError: 없는 작업.
        """
        now = self._clock()
        with self._transaction() as conn:
            row = conn.execute("SELECT detail FROM jobs WHERE id = ?", (job_id,)).fetchone()
            if row is None:
                raise JobError(f"작업 {job_id} 이 없다")
            detail = {**(json.loads(row["detail"]) if row["detail"] else {}), **values}
            conn.execute(
                "UPDATE jobs SET detail = ?, updated_at = ? WHERE id = ?",
                (json.dumps(detail, ensure_ascii=False), now, job_id),
            )
        return self.get(job_id)

    def fail(self, job_id: int, error: str) -> Job:
        """실패를 기록한다. 상한 안이면 백오프 뒤 다시 대기, 넘으면 `failed`.

        Raises:
            JobError: 처리 중인 작업이 아니다.
        """
        now = self._clock()
        with self._transaction() as conn:
            row = self._require(conn, job_id, ACTIVE_STATUSES)
            attempts = int(row["attempts"]) + 1
            if attempts < self._max_attempts:
                conn.execute(
                    "UPDATE jobs SET status = 'queued', attempts = ?, next_attempt_at = ?, "
                    "error = ?, updated_at = ? WHERE id = ?",
                    (attempts, now + backoff_seconds(attempts), error, now, job_id),
                )
            else:
                conn.execute(
                    "UPDATE jobs SET status = 'failed', attempts = ?, error = ?, updated_at = ? "
                    "WHERE id = ?",
                    (attempts, error, now, job_id),
                )
        return self.get(job_id)

    def defer(self, job_id: int, reason: str) -> Job:
        """시도 횟수를 늘리지 않고 다시 대기로 돌린다 (공급자 불가로 멈춘 작업).

        Raises:
            JobError: 처리 중인 작업이 아니다.
        """
        return self._transition(job_id, "queued", ACTIVE_STATUSES, error=reason)

    def cancel(self, path: Path, reason: str) -> int:
        """대기 중인 같은 경로의 작업을 `skipped` 로 닫는다 (파일 삭제). 닫은 개수."""
        now = self._clock()
        with self._transaction() as conn:
            cursor = conn.execute(
                "UPDATE jobs SET status = 'skipped', error = ?, updated_at = ? "
                "WHERE path = ? AND status = 'queued'",
                (reason, now, str(path)),
            )
        return int(cursor.rowcount)

    def recover_interrupted(self) -> int:
        """처리 중이던 작업을 대기로 돌린다 (재시작 직후, 시도 횟수 유지). 돌린 개수."""
        now = self._clock()
        with self._transaction() as conn:
            cursor = conn.execute(
                "UPDATE jobs SET status = 'queued', next_attempt_at = 0, updated_at = ? "
                "WHERE status IN ('probing', 'extracting', 'translating')",
                (now,),
            )
        return int(cursor.rowcount)

    # ------------------------------------------------------------ 운영 (queue CLI)

    def is_pending(self, path: Path) -> bool:
        """같은 경로의 미완료 작업이 있는지."""
        with self._lock:
            row = self._conn.execute(
                "SELECT 1 FROM jobs WHERE path = ? AND status IN "
                "('queued', 'probing', 'extracting', 'translating')",
                (str(path),),
            ).fetchone()
        return row is not None

    def get(self, job_id: int) -> Job:
        """작업 하나.

        Raises:
            JobError: 없는 작업.
        """
        with self._lock:
            row = self._conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if row is None:
            raise JobError(f"작업 {job_id} 이 없다")
        return _job(row)

    def jobs(self, status: JobStatus | None = None) -> list[Job]:
        """작업 목록 (처리 순서: 우선순위, 등록 순)."""
        query = "SELECT * FROM jobs"
        params: tuple[Any, ...] = ()
        if status is not None:
            query += " WHERE status = ?"
            params = (status,)
        with self._lock:
            rows = self._conn.execute(query + " ORDER BY priority, id", params).fetchall()
        return [_job(row) for row in rows]

    def retry(self, job_id: int | None = None) -> int:
        """실패했거나 재시도를 기다리는 작업(없으면 전부)을 시도 횟수 0 으로 바로 대기시킨다.

        재시도 대기는 실패한 적이 있어 백오프 시각까지 기다리는 `queued` 작업이다. 설정을 고친 뒤
        기다리지 않고 다시 처리하려고 쓴다 (WI-10.004c). 바꾼 개수.
        """
        now = self._clock()
        query = (
            "UPDATE jobs SET status = 'queued', attempts = 0, next_attempt_at = 0, "
            "updated_at = ? WHERE (status = 'failed' OR (status = 'queued' AND attempts > 0))"
        )
        params: tuple[Any, ...] = (now,)
        if job_id is not None:
            query += " AND id = ?"
            params = (now, job_id)
        with self._transaction() as conn:
            cursor = conn.execute(query, params)
        return int(cursor.rowcount)

    def clear_failed(self) -> int:
        """실패한 작업 기록을 지운다. 지운 개수."""
        with self._transaction() as conn:
            cursor = conn.execute("DELETE FROM jobs WHERE status = 'failed'")
        return int(cursor.rowcount)

    # ------------------------------------------------------------ 공급자 가용성 (WI-1.012)

    def on_unavailable(self, reason: str) -> None:
        """공급자 불가: 새 작업을 꺼내지 않는다 (AvailabilityListener)."""
        self.set_meta({_PROVIDER_STATE_KEY: "unavailable", _PROVIDER_REASON_KEY: reason})

    def on_available(self) -> None:
        """공급자 복구: 작업을 재개한다 (AvailabilityListener)."""
        self.set_meta({_PROVIDER_STATE_KEY: "available", _PROVIDER_REASON_KEY: ""})

    def provider_state(self) -> str:
        """`available` | `unavailable` (다른 프로세스의 `queue list` 에서도 보인다)."""
        return self.meta(_PROVIDER_STATE_KEY) or "available"

    def provider_reason(self) -> str:
        """마지막 불가 사유."""
        return self.meta(_PROVIDER_REASON_KEY) or ""

    # ------------------------------------------------------------ 내부

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

    def _transition(
        self,
        job_id: int,
        status: JobStatus,
        allowed_from: tuple[JobStatus, ...],
        *,
        detail: dict[str, Any] | None = None,
        error: str | None = None,
    ) -> Job:
        now = self._clock()
        with self._transaction() as conn:
            self._require(conn, job_id, allowed_from)
            conn.execute(
                "UPDATE jobs SET status = ?, detail = COALESCE(?, detail), error = ?, "
                "updated_at = ? WHERE id = ?",
                (
                    status,
                    json.dumps(detail, ensure_ascii=False) if detail is not None else None,
                    error,
                    now,
                    job_id,
                ),
            )
        return self.get(job_id)

    @staticmethod
    def _require(
        conn: sqlite3.Connection, job_id: int, allowed_from: tuple[JobStatus, ...]
    ) -> sqlite3.Row:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if row is None:
            raise JobError(f"작업 {job_id} 이 없다")
        if row["status"] not in allowed_from:
            raise JobError(f"작업 {job_id} 은 {row['status']} 상태라 바꿀 수 없다")
        found: sqlite3.Row = row
        return found

    def set_meta(self, values: dict[str, str]) -> None:
        """운영 값 저장 (공급자 상태, 감시 기준점 등)."""
        with self._transaction() as conn:
            conn.executemany(
                "INSERT INTO meta (key, value) VALUES (?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                list(values.items()),
            )

    def meta(self, key: str) -> str | None:
        """운영 값."""
        with self._lock:
            row = self._conn.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
        return str(row["value"]) if row else None


def _job(row: sqlite3.Row) -> Job:
    status = row["status"]
    if status not in get_args(JobStatus):
        raise JobError(f"모르는 작업 상태: {status}")
    return Job(
        id=int(row["id"]),
        path=Path(row["path"]),
        status=status,
        priority=_RANK_PRIORITY[int(row["priority"])],
        force=bool(row["force"]),
        series_key=row["series_key"],
        attempts=int(row["attempts"]),
        next_attempt_at=float(row["next_attempt_at"]),
        detail=json.loads(row["detail"]) if row["detail"] else {},
        error=row["error"],
        size=row["size"],
        mtime=row["mtime"],
        created_at=float(row["created_at"]),
        updated_at=float(row["updated_at"]),
    )
