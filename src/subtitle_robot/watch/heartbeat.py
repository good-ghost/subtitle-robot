"""워커 heartbeat 기록과 판정 (PROJECT-PLAN §21.9, WI-5.008·5.009).

데몬이 기록하고 healthcheck(`subtitle-robot health`)와 웹 상태 API 가 읽는다.
"""

from __future__ import annotations

import sqlite3
import time
from pathlib import Path

HEARTBEAT_KEY = "worker_heartbeat"
# heartbeat 기록 간격. healthcheck 는 이 몇 배가 지나도 갱신이 없으면 비정상으로 본다
HEARTBEAT_INTERVAL_S = 30.0
# healthcheck: heartbeat 가 이보다 오래되면 비정상 (기록 간격의 3배, 한두 번 늦어도 견딘다)
HEALTH_MAX_AGE_S = HEARTBEAT_INTERVAL_S * 3


def heartbeat_age(db_path: Path, now: float | None = None) -> float | None:
    """마지막 heartbeat 이후 지난 초. 기록이 없거나 DB 가 없으면 None.

    healthcheck 는 root 로 실행될 수 있으므로 DB 를 읽기 전용으로 연다
    (파일 소유권을 바꾸지 않는다).
    """
    if not Path(db_path).is_file():
        return None
    uri = f"{Path(db_path).absolute().as_uri()}?mode=ro"
    conn = sqlite3.connect(uri, uri=True, timeout=5)
    try:
        row = conn.execute("SELECT value FROM meta WHERE key = ?", (HEARTBEAT_KEY,)).fetchone()
    except sqlite3.OperationalError:
        return None
    finally:
        conn.close()
    if row is None:
        return None
    return (time.time() if now is None else now) - float(row[0])
