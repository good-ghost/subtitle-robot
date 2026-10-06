"""상태 DB `/data/state.db` (PROJECT-PLAN §21.8, §21.12, WI-5.005).

작업 큐와 처리 기록(ledger, WI-5.006)이 같은 SQLite 파일을 쓴다.
WAL 모드라 데몬이 쓰는 동안 CLI 가 읽을 수 있다.
스키마 버전은 `PRAGMA user_version` 으로 관리하고 올라갈 때마다 순서대로 적용한다.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

STATE_FILE = "state.db"


class StateSchemaError(RuntimeError):
    """상태 DB 가 이 프로그램보다 새 스키마다."""


# 다른 프로세스(데몬·CLI)가 쓰는 중이면 이만큼 기다린다
BUSY_TIMEOUT_S = 30.0

_MIGRATIONS: tuple[str, ...] = (
    # 1: 작업 큐 (WI-5.005)
    """
    CREATE TABLE jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        size INTEGER,
        mtime REAL,
        priority INTEGER NOT NULL,
        status TEXT NOT NULL,
        force INTEGER NOT NULL DEFAULT 0,
        series_key TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at REAL NOT NULL DEFAULT 0,
        detail TEXT,
        error TEXT,
        created_at REAL NOT NULL,
        updated_at REAL NOT NULL
    );
    CREATE INDEX jobs_pick ON jobs (status, priority, id);
    CREATE INDEX jobs_path ON jobs (path);
    CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    """,
    # 2: 처리 기록 ledger (WI-5.006). current=0 은 같은 경로의 이전 내용(이력)
    """
    CREATE TABLE media_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_id TEXT NOT NULL,
        path TEXT NOT NULL,
        size INTEGER NOT NULL,
        mtime_ns INTEGER NOT NULL,
        segment_uid TEXT,
        verdict TEXT NOT NULL,
        reason TEXT NOT NULL DEFAULT '',
        source TEXT,
        provider TEXT,
        model TEXT,
        sidecars TEXT NOT NULL DEFAULT '{}',
        archive TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        current INTEGER NOT NULL DEFAULT 1,
        processed_at REAL NOT NULL,
        updated_at REAL NOT NULL
    );
    CREATE INDEX ledger_content ON media_ledger (content_id, current);
    CREATE INDEX ledger_path ON media_ledger (path, current);
    """,
)
SCHEMA_VERSION = len(_MIGRATIONS)


def state_path(data_dir: Path) -> Path:
    """데이터 폴더의 상태 DB 경로."""
    return Path(data_dir) / STATE_FILE


def connect(path: Path) -> sqlite3.Connection:
    """상태 DB 를 열고 스키마를 최신으로 맞춘다. 폴더가 없으면 만든다.

    autocommit 연결이다. 여러 문장을 묶을 때는 호출자가 `BEGIN IMMEDIATE` 로 연다.
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(
        path, timeout=BUSY_TIMEOUT_S, isolation_level=None, check_same_thread=False
    )
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    _migrate(conn)
    return conn


def _migrate(conn: sqlite3.Connection) -> None:
    version = int(conn.execute("PRAGMA user_version").fetchone()[0])
    if version > SCHEMA_VERSION:
        raise StateSchemaError(
            f"상태 DB 스키마 {version} 이 이 프로그램({SCHEMA_VERSION})보다 새롭다. 갱신이 필요하다"
        )
    for number in range(version, SCHEMA_VERSION):
        script = "\n".join(
            (
                "BEGIN IMMEDIATE;",
                _MIGRATIONS[number],
                f"PRAGMA user_version = {number + 1};",
                "COMMIT;",
            )
        )
        try:
            conn.executescript(script)
        except sqlite3.Error:
            if conn.in_transaction:
                conn.rollback()
            raise
