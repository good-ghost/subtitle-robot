"""미디어 감시: 이벤트·안정화·백로그·reconcile·시리즈 배치 창 (PROJECT-PLAN §21.7, WI-5.007).

감시 경로의 `*.mkv`·`*.mp4` 를 찾아 작업 큐에 등록한다. 처리는 데몬 워커(WI-5.008)가 한다.
이벤트를 놓쳐도 주기 reconcile 스캔이 처리 기록이 없는 파일을 등록한다.
규칙은 WI-5.007.
"""

from __future__ import annotations

import errno
import fnmatch
import logging
import os
import threading
import time
from collections.abc import Callable, Iterable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from watchdog.events import (
    DirMovedEvent,
    FileClosedEvent,
    FileCreatedEvent,
    FileDeletedEvent,
    FileMovedEvent,
    FileSystemEvent,
    FileSystemEventHandler,
)
from watchdog.observers import Observer
from watchdog.observers.api import BaseObserver
from watchdog.observers.polling import PollingObserver

from subtitle_robot.config import LedgerConfig, WatchConfig
from subtitle_robot.media.select import MediaTarget, WatchKind, classify_media
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.queue import JobPriority, JobQueue
from subtitle_robot.watch.stability import StabilityTracker

logger = logging.getLogger(__name__)

# inotify 를 쓸 수 없을 때 polling 으로 바꾸는 오류:
# 감시 한도(max_user_watches) 초과, 인스턴스 한도 초과
INOTIFY_LIMIT_ERRNOS = frozenset({errno.ENOSPC, errno.EMFILE})

BASELINE_KEY = "watch_baseline"
SERIES_KEY_PREFIX = "series:"
DELETED_REASON = "파일 삭제됨"
# 이벤트 처리·안정화 확인 주기. stable_seconds 보다 충분히 짧으면 된다
TICK_INTERVAL_S = 5.0
Origin = Literal["new", "backlog"]
# batched: 시리즈 배치 창이 끝날 때까지 큐에서 기다린다 (queue list 에 "대기 HH:MM까지")
Outcome = Literal["queued", "batched", "known", "relocated", "gone"]


@dataclass(frozen=True)
class _Admission:
    """등록할 영상."""

    path: Path
    target: MediaTarget
    origin: Origin
    size: int
    mtime: float


@dataclass
class ScanReport:
    """스캔·처리 결과 (로그·테스트용)."""

    outcomes: dict[Path, Outcome] = field(default_factory=dict)

    def paths(self, outcome: Outcome) -> list[Path]:
        """결과가 outcome 인 경로."""
        return sorted(path for path, value in self.outcomes.items() if value == outcome)


def is_media_candidate(path: Path, config: WatchConfig) -> bool:
    """감시·`media` 대상 영상인지.

    include·exclude(파일 이름)·exclude_dirs(위 폴더 이름)는 대소문자를 무시한다. 숨김 파일은 뺀다.
    """
    name = path.name.casefold()
    if name.startswith("."):
        return False
    folders = [part.casefold() for part in path.parts[:-1]]
    excluded = [pattern.casefold() for pattern in config.exclude_dirs]
    if any(fnmatch.fnmatch(folder, pattern) for folder in folders for pattern in excluded):
        return False
    if not any(fnmatch.fnmatch(name, pattern.casefold()) for pattern in config.include):
        return False
    return not any(fnmatch.fnmatch(name, pattern.casefold()) for pattern in config.exclude)


def collect_media_files(
    targets: Iterable[str | Path], config: WatchConfig, *, recursive: bool
) -> list[Path]:
    """파일은 그대로, 폴더는 안의 동영상 후보(include·exclude)를 모은다 (`media` 명령·웹 등록).

    Raises:
        FileNotFoundError: 없는 경로.
    """
    files: list[Path] = []
    for target in targets:
        path = Path(target).absolute()
        if path.is_file():
            files.append(path)
        elif path.is_dir():
            found = path.rglob("*") if recursive else path.iterdir()
            files.extend(sorted(p for p in found if p.is_file() and is_media_candidate(p, config)))
        else:
            raise FileNotFoundError(f"없는 경로: {target}")
    return files


class MediaWatcher:
    """감시 경로를 지켜보며 영상을 작업 큐에 등록한다.

    Args:
        config: `[watch]` 설정.
        queue: 작업 큐.
        ledger: 처리 기록.
        data_dir: 데이터 폴더 (시리즈 작업공간 위치 판정).
        series_window: 시리즈 배치 창 (초, `[media] series_window`).
        ledger_config: `[ledger]` 설정 (이동 시 복원 여부).
        clock: 현재 시각.
    """

    def __init__(
        self,
        config: WatchConfig,
        *,
        queue: JobQueue,
        ledger: Ledger,
        data_dir: Path,
        series_window: float = 600.0,
        ledger_config: LedgerConfig | None = None,
        clock: Callable[[], float] = time.time,
    ) -> None:
        self._config = config
        self._queue = queue
        self._ledger = ledger
        self._data_dir = Path(data_dir)
        self._series_window = series_window
        self._ledger_config = ledger_config or LedgerConfig()
        self._clock = clock
        self._roots: list[tuple[Path, WatchKind]] = sorted(
            ((Path(item.path), item.kind) for item in config.paths),
            key=lambda item: len(item[0].parts),
            reverse=True,
        )
        self._tracker = StabilityTracker(config.stable_seconds)
        self._lock = threading.Lock()

    # ------------------------------------------------------------ 기준점·필터

    def baseline(self) -> float:
        """기준점: 처음 시작한 시각. 이전에 수정된 파일은 백로그다 (§21.7)."""
        stored = self._queue.meta(BASELINE_KEY)
        if stored is not None:
            return float(stored)
        now = self._clock()
        self._queue.set_meta({BASELINE_KEY: repr(now)})
        return now

    def is_candidate(self, path: Path) -> bool:
        """감시 대상 영상인지 (include·exclude 는 대소문자 무시, 숨김 파일 제외)."""
        return is_media_candidate(path, self._config)

    def root_for(self, path: Path) -> tuple[Path, WatchKind] | None:
        """파일이 속한 감시 경로와 종류 (가장 깊은 경로 우선)."""
        for root, kind in self._roots:
            if path.is_relative_to(root):
                return root, kind
        return None

    # ------------------------------------------------------------ 이벤트

    def observe(self, path: Path) -> None:
        """생성·이동·쓰기 종료 이벤트: 안정화를 기다리는 목록에 넣는다."""
        if not self.is_candidate(path) or self.root_for(path) is None:
            return
        with self._lock:
            self._tracker.observe(path, self._clock())

    def deleted(self, path: Path) -> None:
        """삭제 이벤트: 관찰을 그만두고 대기 중인 작업을 취소한다 (만든 사이드카는 유지)."""
        with self._lock:
            self._tracker.forget(path)
        if self._queue.cancel(path, DELETED_REASON):
            logger.info("cancelled queued job for deleted file %s", path)

    def tick(self) -> ScanReport:
        """안정된 파일을 등록한다 (시리즈 새 화는 배치 창 끝까지 기다리게 등록)."""
        report = ScanReport()
        now = self._clock()
        with self._lock:
            ready = self._tracker.ready(now)
        for path in ready:
            self._admit(path, "new", report)
        return report

    # ------------------------------------------------------------ reconcile 스캔

    def scan(self) -> ScanReport:
        """감시 경로 전체에서 처리 기록이 없는 파일을 찾는다 (시작 시·주기적으로).

        기준점 이후 파일은 새 영상이라 안정화를 거치고, 이전 파일은 백로그로 바로 등록한다.
        """
        report = ScanReport()
        baseline = self.baseline()
        backlog: list[tuple[float, Path]] = []
        for path in self._candidates():
            if self._queue.is_pending(path) or self._in_progress(path):
                continue
            entry = self._ledger.find(path)
            try:
                stat = path.stat()
            except FileNotFoundError:
                continue
            if entry is not None and (entry.size, entry.mtime_ns) == (
                stat.st_size,
                stat.st_mtime_ns,
            ):
                continue  # 빠른 확인: 이미 처리한 영상
            if stat.st_mtime >= baseline:
                with self._lock:
                    self._tracker.observe(path, self._clock())
            elif self._config.scan_existing:
                backlog.append((stat.st_mtime, path))
        if self._config.backlog_order == "newest":
            backlog.sort(key=lambda item: (-item[0], str(item[1])))
        else:
            backlog.sort(key=lambda item: str(item[1]))
        admissions = [
            admission
            for _, path in backlog
            if (admission := self._admit(path, "backlog", report, enqueue=False)) is not None
        ]
        self._enqueue_backlog(admissions, report)
        return report

    def _candidates(self) -> Iterable[Path]:
        """감시 대상 파일. 감시 경로가 겹치면 가장 깊은 경로가 맡는다."""
        for root, _ in self._roots:
            if not root.is_dir():
                logger.warning("watch path does not exist: %s", root)
                continue
            for directory, _dirs, files in os.walk(root):
                for name in files:
                    path = Path(directory) / name
                    owner = self.root_for(path)
                    if self.is_candidate(path) and owner is not None and owner[0] == root:
                        yield path

    def _in_progress(self, path: Path) -> bool:
        with self._lock:
            return path in self._tracker

    # ------------------------------------------------------------ 등록

    def _admit(
        self, path: Path, origin: Origin, report: ScanReport, *, enqueue: bool = True
    ) -> _Admission | None:
        """ledger 를 확인하고 등록 대상이면 등록(또는 배치)한다.

        백로그(enqueue=False)는 모아서 호출자가 시리즈별로 묶어 등록한다.
        """
        try:
            lookup = self._ledger.lookup(path)
            stat = path.stat()
        except FileNotFoundError:
            report.outcomes[path] = "gone"
            return None
        if lookup.kind == "same":
            report.outcomes[path] = "known"
            return None
        if lookup.kind in ("moved", "copied"):
            self._ledger.relocate(lookup, path, restore=self._ledger_config.restore_missing_outputs)
            logger.info("known video %s at new path, outputs restored: %s", lookup.kind, path)
            report.outcomes[path] = "relocated"
            return None
        root, kind = self.root_for(path) or (path.parent, "auto")
        target = classify_media(path, self._data_dir, kind=kind, watch_root=root)
        # 백로그의 외부 자막 건너뛰기(backlog_skip_if_external)는 워커가 영상을 검사한 뒤 정한다:
        # 내장 텍스트 자막이 없으면 외부 자막으로 번역한다 (WI-5.004b, 2026-10-07 사용자 결정)
        admission = _Admission(path, target, origin, stat.st_size, stat.st_mtime)
        if not enqueue:
            return admission
        if target.kind == "series":
            # 같은 시리즈 화가 창 안에 더 들어오면 함께 prescan 한다 (워커가 꺼낼 때 판단)
            key = f"{SERIES_KEY_PREFIX}{target.slug}"
            window_end = self._queue.open_window(key) or self._clock() + self._series_window
            self._enqueue(admission, "new", None, report, not_before=window_end)
            report.outcomes[path] = "batched"
        else:
            self._enqueue(admission, "new", None, report)
        return admission

    def _enqueue_backlog(self, admissions: list[_Admission], report: ScanReport) -> None:
        """백로그 등록. 같은 시리즈는 이미 시즌이 모여 있으므로 묶어서 prescan 으로 둔다."""
        counts: dict[str, int] = {}
        for item in admissions:
            if item.target.kind == "series":
                counts[item.target.slug] = counts.get(item.target.slug, 0) + 1
        for item in admissions:
            mode = None
            if item.target.kind == "series":
                mode = "prescan" if counts[item.target.slug] > 1 else "incremental"
            self._enqueue(item, "backlog", mode, report)

    def _enqueue(
        self,
        item: _Admission,
        priority: JobPriority,
        series_mode: str | None,
        report: ScanReport,
        *,
        not_before: float | None = None,
    ) -> None:
        target = item.target
        detail: dict[str, object] = {
            "kind": target.kind,
            "title": target.title,
            "slug": target.slug,
        }
        if target.episode is not None:
            detail["episode"] = str(target.episode)
        if series_mode:
            detail["series_mode"] = series_mode
        series_key = f"{SERIES_KEY_PREFIX}{target.slug}" if target.kind == "series" else None
        self._queue.enqueue(
            item.path,
            priority=priority,
            series_key=series_key,
            size=item.size,
            mtime=item.mtime,
            detail=detail,
            not_before=not_before,
        )
        wait = ""
        if not_before is not None:
            wait = f", series window until {time.strftime('%H:%M:%S', time.localtime(not_before))}"
        logger.info("queued (%s, %s%s): %s", target.kind, priority, wait, item.path)
        report.outcomes[item.path] = "queued"

    # ------------------------------------------------------------ 실행 (watchdog)

    def run(self, stop: threading.Event, *, tick_interval: float = TICK_INTERVAL_S) -> None:
        """stop 이 설정될 때까지 감시한다: 시작 스캔 → 이벤트·tick → 주기 reconcile."""
        observer = self._start_observer()
        try:
            self.scan()
            last_scan = self._clock()
            while not stop.is_set():
                self.tick()
                if self._clock() - last_scan >= self._config.reconcile_interval:
                    self.scan()
                    last_scan = self._clock()
                stop.wait(tick_interval)
        finally:
            observer.stop()
            observer.join()

    def _start_observer(self) -> BaseObserver:
        if self._config.polling:
            return self._schedule_and_start(self._polling_observer())
        try:
            return self._schedule_and_start(Observer())
        except OSError as exc:
            if exc.errno not in INOTIFY_LIMIT_ERRNOS:
                raise
            # inotify 감시 한도는 호스트 계정 전체가 나눠 쓴다. 다른 프로그램이 다 쓰면 감시를
            # 시작하지 못해 감시 스레드가 죽었다
            # (2026-10-03 실사용: 편집기가 한도 524,288개를 거의 씀)
            logger.warning(
                "inotify unavailable (%s); falling back to polling. "
                "Raise fs.inotify.max_user_watches or set [watch] polling = true",
                exc,
            )
            return self._schedule_and_start(self._polling_observer())

    def _polling_observer(self) -> BaseObserver:
        # watchdog 기본(1초)은 폴더 전체를 1초마다 훑는다
        return PollingObserver(timeout=self._config.polling_interval)

    def _schedule_and_start(self, observer: BaseObserver) -> BaseObserver:
        handler = _EventHandler(self)
        for root, _ in self._roots:
            if root.is_dir():
                observer.schedule(handler, str(root), recursive=True)
            else:
                logger.warning("watch path does not exist: %s", root)
        try:
            observer.start()
        except OSError:
            # 앞서 시작한 감시 스레드를 정리한다 (watchdog 은 실패한 것만 지운다)
            observer.unschedule_all()
            raise
        return observer


class _EventHandler(FileSystemEventHandler):
    """watchdog 이벤트를 Watcher 로 넘긴다 (watchdog 스레드에서 불린다)."""

    def __init__(self, watcher: MediaWatcher) -> None:
        self._watcher = watcher

    def on_any_event(self, event: FileSystemEvent) -> None:
        if event.is_directory and not isinstance(event, DirMovedEvent):
            return
        if isinstance(event, FileCreatedEvent | FileClosedEvent):
            self._watcher.observe(Path(os.fsdecode(event.src_path)))
        elif isinstance(event, FileMovedEvent):
            self._watcher.deleted(Path(os.fsdecode(event.src_path)))
            self._watcher.observe(Path(os.fsdecode(event.dest_path)))
        elif isinstance(event, DirMovedEvent):
            # 폴더째 옮긴 경우 (시즌 폴더 이동) 안의 영상을 새로 본다
            for directory, _dirs, files in os.walk(os.fsdecode(event.dest_path)):
                for name in files:
                    self._watcher.observe(Path(directory) / name)
        elif isinstance(event, FileDeletedEvent):
            self._watcher.deleted(Path(os.fsdecode(event.src_path)))
