"""감시 데몬 `subtitle-robot watch` (PROJECT-PLAN §21.1, §21.8, §21.9, WI-5.008).

워커 스레드(`[queue] workers` 개)가 큐의 작업을 처리하고, 감시 스레드가 새 영상을 등록한다.
공급자가 불가하면 가드가 일시 정지하고 큐는 새 작업을 꺼내지 않는다 (복구될 때까지 기다린다).
heartbeat 를 state.db 에 남겨 컨테이너 healthcheck 가 확인한다 (WI-5.009, `heartbeat.py`).
"""

from __future__ import annotations

import logging
import threading
import time
from collections.abc import Callable
from pathlib import Path

from subtitle_robot.config import AppConfig
from subtitle_robot.llm.availability import AvailabilityPolicy, ProviderGuard
from subtitle_robot.llm.base import LlmAdapter
from subtitle_robot.llm.limiter import Runtime
from subtitle_robot.media.tmdb import create_origin_resolver
from subtitle_robot.watch.cancel import CancellableAdapter, stop_aware_sleep
from subtitle_robot.watch.heartbeat import HEARTBEAT_INTERVAL_S, HEARTBEAT_KEY
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.queue import JobQueue
from subtitle_robot.watch.state import state_path
from subtitle_robot.watch.watcher import MediaWatcher
from subtitle_robot.watch.worker import MediaWorker
from subtitle_robot.web.server import WebServer, start_web_server

logger = logging.getLogger(__name__)

# 꺼낼 작업이 없을 때 다시 보기까지 기다리는 시간
IDLE_WAIT_S = 5.0


def run_daemon(
    config: AppConfig,
    *,
    data_dir: Path,
    adapter: LlmAdapter | None,
    stop: threading.Event,
    heartbeat_interval: float = HEARTBEAT_INTERVAL_S,
    idle_wait: float = IDLE_WAIT_S,
    clock: Callable[[], float] = time.time,
    config_path: Path | None = None,
) -> bool:
    """stop 이 설정될 때까지 감시·처리한다. 웹에서 재기동을 요청했으면 참을 돌려준다.

    `[web] enabled`면 웹 운영 화면도 함께 띄운다 (§25.2, §28.3). 웹 스레드는 heartbeat 판정에
    넣지 않는다: 웹이 실패해도 감시·번역은 정상이다. config_path 는 웹 Settings 가 고치는
    파일이다 (§25.9). adapter 가 None 이면(키·공급자 설정이 아직 없다) 웹과 감시만 띄우고
    번역 워커는 시작하지 않는다: 키는 웹 Settings 에서 넣고 재기동해 적용한다 (§28.2).
    """
    started_at = clock()
    restart = threading.Event()

    def request_restart() -> None:
        logger.info("restart requested from the web UI")
        restart.set()
        stop.set()

    db = state_path(data_dir)
    queue = JobQueue(db, max_attempts=config.queue.max_attempts)
    ledger = Ledger(db, data_dir, hash_bytes=config.ledger.hash_bytes)
    recovered = queue.recover_interrupted()
    if recovered:
        logger.info("recovered %d interrupted jobs", recovered)
    # 이전 실행이 공급자 불가 상태에서 끝났을 수 있다. 가드는 새로 시작하므로 상태를 맞춘다
    queue.on_available()
    threads: list[threading.Thread] = []
    if adapter is None:
        logger.warning(
            "LLM provider %r is not ready (API key or settings missing); translation workers "
            "are not started. Save the key in the web Settings and restart",
            config.llm.provider,
        )
    else:
        threads.extend(_worker_threads(config, queue, ledger, data_dir, adapter, stop, idle_wait))
    if config.watch.enabled:
        watcher = MediaWatcher(
            config.watch,
            queue=queue,
            ledger=ledger,
            data_dir=data_dir,
            series_window=config.media.series_window,
            ledger_config=config.ledger,
        )
        threads.append(
            threading.Thread(target=watcher.run, args=(stop,), name="watcher", daemon=True)
        )
    for thread in threads:
        thread.start()
    web: WebServer | None = None
    if config.web.enabled:
        web = start_web_server(
            config,
            queue=queue,
            ledger=ledger,
            data_dir=data_dir,
            config_path=config_path,
            started_at=started_at,
            request_restart=request_restart,
        )
    workers = 0 if adapter is None else config.queue.workers
    logger.info("daemon started: %d workers, watch=%s", workers, config.watch.enabled)
    try:
        while not stop.is_set():
            if all(thread.is_alive() for thread in threads):
                queue.set_meta({HEARTBEAT_KEY: repr(clock())})
            else:
                logger.error("a daemon thread stopped unexpectedly; heartbeat paused")
            stop.wait(heartbeat_interval)
    finally:
        stop.set()
        if web is not None:
            web.stop()
        for thread in threads:
            thread.join(timeout=60)
        queue.close()
        ledger.close()
        logger.info("daemon stopped%s", " for restart" if restart.is_set() else "")
    return restart.is_set()


def _worker_threads(
    config: AppConfig,
    queue: JobQueue,
    ledger: Ledger,
    data_dir: Path,
    adapter: LlmAdapter,
    stop: threading.Event,
    idle_wait: float,
) -> list[threading.Thread]:
    # 종료 요청을 LLM 요청 사이와 공급자 일시 정지 중에 반영한다
    cancellable = CancellableAdapter(adapter, stop)
    guard = ProviderGuard(
        cancellable,
        policy=AvailabilityPolicy(),
        runtime=Runtime(sleep=stop_aware_sleep(stop)),
        listeners=[queue],
    )
    # 워커들이 캐시를 함께 쓴다 (조회기 안에서 잠근다)
    origins = create_origin_resolver(config.tmdb, data_dir)
    return [
        threading.Thread(
            target=_work,
            args=(MediaWorker(
                config, queue=queue, ledger=ledger, data_dir=data_dir, adapter=cancellable,
                guard=guard, stop=stop, origin_resolver=origins,
            ), stop, idle_wait),
            name=f"worker-{number}",
            daemon=True,
        )
        for number in range(1, config.queue.workers + 1)
    ]  # fmt: skip


def _work(worker: MediaWorker, stop: threading.Event, idle_wait: float) -> None:
    # 작업 시작·결과 로그는 워커가 경로와 함께 남긴다
    while not stop.is_set():
        if worker.run_once() is None:
            stop.wait(idle_wait)
