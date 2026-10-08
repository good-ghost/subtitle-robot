"""운영 API: 상태·큐·처리 기록·동영상 등록 (PROJECT-PLAN §25.4, WI-7.002).

CLI(`health`, `queue`, `ledger`, `media`)와 같은 큐·기록 메서드를 부른다. 로그인 검사는
`create_app`이 라우터에 붙인다.
"""

from __future__ import annotations

import fnmatch
import os
import time
from pathlib import Path
from typing import Annotated, Any, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from subtitle_robot import __version__
from subtitle_robot.config import WatchConfig
from subtitle_robot.media.tmdb import TMDB_SECRET
from subtitle_robot.secret_store import SecretStore
from subtitle_robot.watch.heartbeat import HEALTH_MAX_AGE_S, heartbeat_age
from subtitle_robot.watch.ledger import LedgerEntry, Verdict
from subtitle_robot.watch.queue import Job, JobStatus
from subtitle_robot.watch.state import state_path
from subtitle_robot.watch.watcher import collect_media_files, is_media_candidate
from subtitle_robot.watch.worker import media_target, series_key_for
from subtitle_robot.web.context import Context

router = APIRouter(prefix="/api")

# 폴더 목록 한 번에 보일 항목 상한 (큰 라이브러리 폴더에서 응답이 커지지 않게, WI-7.004d)
BROWSE_LIMIT = 1000

# 화면이 보이는 상태 순서 (queue list 와 같다)
JOB_STATUSES: tuple[JobStatus, ...] = (
    "queued", "probing", "extracting", "translating", "done", "skipped", "failed",
)  # fmt: skip


class ProviderStatus(BaseModel):
    """LLM 공급자 상태."""

    name: str
    model: str
    state: str
    reason: str


class WatchPathOut(BaseModel):
    """감시 경로."""

    path: str
    kind: str


class StatusOut(BaseModel):
    """데몬 상태 (`health` + `queue list` 머리글)."""

    version: str
    # 데몬 시작 시각 (epoch 초). 바뀌면 재기동이 끝난 것이다 (Settings 적용)
    started_at: float
    healthy: bool
    heartbeat_age_s: float | None
    heartbeat_max_age_s: float
    provider: ProviderStatus
    queue: dict[str, int]
    # 처리 기록(현재 기록만) 개수. 화면의 Completed List 와 같은 수
    completed: int
    watch_enabled: bool
    watch_paths: list[WatchPathOut]
    # 번역 대상 언어 (§26.1)와 원어 조회(TMDB)를 쓰는지: 켜져 있고 Settings 에 키가 있다 (§26.6)
    target_language: str
    tmdb_active: bool


class ProgressOut(BaseModel):
    """번역 중인 작업의 진행 (끝낸 블록 / 전체 블록, WI-7.004c)."""

    done: int
    total: int


class JobOut(BaseModel):
    """작업 하나. 판정·사유·출력은 끝난 작업의 `detail`에서 꺼낸다."""

    id: int
    path: str
    name: str
    status: JobStatus
    priority: str
    force: bool
    attempts: int
    next_attempt_at: float
    error: str | None
    kind: str | None
    verdict: str | None
    reason: str | None
    outputs: list[str]
    progress: ProgressOut | None = None
    created_at: float
    updated_at: float


class RetryIn(BaseModel):
    """재시도 요청 (job_id 가 없으면 실패한 작업 전부)."""

    job_id: int | None = None


class CountOut(BaseModel):
    """바꾼 개수."""

    count: int


class LedgerOut(BaseModel):
    """처리 기록 하나."""

    id: int
    content_id: str
    path: str
    name: str
    verdict: Verdict
    reason: str
    source: dict[str, Any]
    provider: str | None
    model: str | None
    outputs: list[str]
    renames: list[dict[str, str]]
    attempts: int
    current: bool
    processed_at: float
    updated_at: float


class ForgetIn(BaseModel):
    """기록 삭제 요청."""

    path: str


class MediaIn(BaseModel):
    """동영상 등록 요청."""

    path: str
    recursive: bool = False
    force: bool = False


class BrowseEntry(BaseModel):
    """폴더 목록의 항목 하나: 하위 폴더 또는 등록할 수 있는 동영상."""

    name: str
    path: str
    kind: Literal["dir", "video"]


class BrowseOut(BaseModel):
    """동영상 등록 화면의 폴더 목록 (WI-7.004d).

    path 가 None 이면 감시 경로 목록이다. parent 는 한 단계 위 (감시 경로면 None = 감시 경로 목록).
    """

    path: str | None
    parent: str | None
    entries: list[BrowseEntry]
    truncated: bool = False


class QueuedOut(BaseModel):
    """등록한 작업."""

    id: int
    path: str


@router.get("/status")
def status(context: Context) -> StatusOut:
    """데몬·공급자·큐 상태."""
    name, provider = context.config.active_provider()
    age = heartbeat_age(state_path(context.data_dir))
    counts = dict.fromkeys(JOB_STATUSES, 0)
    for job in context.queue.jobs():
        counts[job.status] += 1
    return StatusOut(
        version=__version__,
        started_at=context.started_at,
        healthy=age is not None and age <= HEALTH_MAX_AGE_S,
        heartbeat_age_s=age,
        heartbeat_max_age_s=HEALTH_MAX_AGE_S,
        provider=ProviderStatus(
            name=name,
            model=provider.model,
            state=context.queue.provider_state(),
            reason=context.queue.provider_reason(),
        ),
        queue=counts,
        completed=len(context.ledger.entries()),
        watch_enabled=context.config.watch.enabled,
        watch_paths=[WatchPathOut(path=p.path, kind=p.kind) for p in context.config.watch.paths],
        target_language=context.config.translation.target_language,
        tmdb_active=context.config.tmdb.enabled
        and bool(SecretStore.for_data_dir(context.data_dir).get(TMDB_SECRET)),
    )


@router.get("/jobs")
def jobs(
    context: Context, status: Annotated[list[JobStatus] | None, Query()] = None
) -> list[JobOut]:
    """작업 목록 (처리 순서). status 를 여러 번 주면 그 상태들만."""
    wanted = set(status or JOB_STATUSES)
    return [_job_out(job) for job in context.queue.jobs() if job.status in wanted]


@router.post("/jobs/retry")
def retry(body: RetryIn, context: Context) -> CountOut:
    """실패했거나 재시도를 기다리는 작업을 바로 다시 대기시킨다 (`queue retry`)."""
    count = context.queue.retry(body.job_id)
    if body.job_id is not None and count == 0:
        raise HTTPException(status_code=409, detail="job_not_failed")
    return CountOut(count=count)


@router.post("/jobs/clear-failed")
def clear_failed(context: Context) -> CountOut:
    """실패한 작업 기록을 지운다 (`queue clear-failed`)."""
    return CountOut(count=context.queue.clear_failed())


@router.get("/ledger")
def ledger(
    context: Context, verdict: Verdict | None = None, history: bool = False
) -> list[LedgerOut]:
    """처리 기록 (최근 처리한 것부터)."""
    entries = context.ledger.entries(verdict, include_history=history)
    return [_ledger_out(entry) for entry in reversed(entries)]


@router.post("/ledger/forget")
def forget(body: ForgetIn, context: Context) -> CountOut:
    """기록을 지운다 → 다음 이벤트·등록 때 다시 처리 (`ledger forget`)."""
    count = context.ledger.forget(Path(body.path))
    if count == 0:
        raise HTTPException(status_code=404, detail="ledger_not_found")
    return CountOut(count=count)


@router.get("/browse")
def browse(context: Context, path: str | None = None) -> BrowseOut:
    """감시 경로 안의 폴더 내용 (하위 폴더·동영상 후보). path 가 없으면 감시 경로 목록.

    경로는 감시 경로 안이어야 하고(`..`·심볼릭 링크로 밖을 가리키면 거절, §25.4), 밖을 가리키는
    심볼릭 링크 항목은 보이지 않는다. 숨김·exclude_dirs 폴더와 include·exclude 밖의 파일은 뺀다.
    """
    watch = context.config.watch
    configured = [Path(item.path) for item in watch.paths]
    if not configured:
        raise HTTPException(status_code=400, detail="no_watch_paths")
    roots = [root.resolve() for root in configured]
    if path is None:
        entries = [BrowseEntry(name=str(root), path=str(root), kind="dir") for root in configured]
        return BrowseOut(path=None, parent=None, entries=entries)
    target = Path(path)
    if not target.is_absolute():
        raise HTTPException(status_code=400, detail="path_not_absolute")
    folder = Path(os.path.normpath(target))
    resolved = folder.resolve()
    if not any(resolved.is_relative_to(root) for root in roots):
        raise HTTPException(status_code=400, detail="path_outside_watch")
    if not resolved.is_dir():
        raise HTTPException(status_code=400, detail="path_not_found")
    entries, truncated = _folder_entries(folder, roots, watch)
    at_root = any(resolved == root for root in roots)
    return BrowseOut(
        path=str(folder),
        parent=None if at_root else str(folder.parent),
        entries=entries,
        truncated=truncated,
    )


def _folder_entries(
    folder: Path, roots: list[Path], watch: WatchConfig
) -> tuple[list[BrowseEntry], bool]:
    """하위 폴더(이름순) 다음 동영상(이름순). 상한을 넘으면 잘라 낸다."""
    excluded = [pattern.casefold() for pattern in watch.exclude_dirs]
    folders: list[BrowseEntry] = []
    videos: list[BrowseEntry] = []
    with os.scandir(folder) as found:
        for item in found:
            if item.name.startswith("."):
                continue
            entry = Path(item.path)
            if item.is_symlink() and not any(entry.resolve().is_relative_to(r) for r in roots):
                continue
            if item.is_dir():
                name = item.name.casefold()
                if not any(fnmatch.fnmatch(name, pattern) for pattern in excluded):
                    folders.append(BrowseEntry(name=item.name, path=str(entry), kind="dir"))
            elif item.is_file() and is_media_candidate(entry, watch):
                videos.append(BrowseEntry(name=item.name, path=str(entry), kind="video"))
    ordered = sorted(folders, key=lambda e: e.name.casefold()) + sorted(
        videos, key=lambda e: e.name.casefold()
    )
    return ordered[:BROWSE_LIMIT], len(ordered) > BROWSE_LIMIT


@router.post("/media")
def register_media(body: MediaIn, context: Context) -> list[QueuedOut]:
    """감시 경로 안의 동영상(폴더면 안의 후보)을 큐에 등록한다 (`media`, 등록만)."""
    roots = [Path(item.path).resolve() for item in context.config.watch.paths]
    if not roots:
        raise HTTPException(status_code=400, detail="no_watch_paths")
    target = Path(body.path)
    if not target.is_absolute():
        raise HTTPException(status_code=400, detail="path_not_absolute")
    # resolve: `..`·심볼릭 링크로 감시 경로 밖을 가리키는 요청을 막는다 (§25.4)
    resolved = target.resolve()
    if not any(resolved.is_relative_to(root) for root in roots):
        raise HTTPException(status_code=400, detail="path_outside_watch")
    try:
        files = collect_media_files([resolved], context.config.watch, recursive=body.recursive)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail="path_not_found") from exc
    if not files:
        raise HTTPException(status_code=400, detail="no_media_files")
    queued = []
    for path in files:
        media = media_target(context.config, context.data_dir, path)
        job = context.queue.enqueue(
            path,
            force=body.force,
            series_key=series_key_for(media),
            detail={"origin": "web", "kind": media.kind, "slug": media.slug},
        )
        queued.append(QueuedOut(id=job.id, path=str(job.path)))
    return queued


def _job_out(job: Job) -> JobOut:
    detail = job.detail
    outputs = detail.get("outputs") or []
    return JobOut(
        id=job.id,
        path=str(job.path),
        name=job.path.name,
        status=job.status,
        priority=job.priority,
        force=job.force,
        attempts=job.attempts,
        # 0 은 "바로 처리 가능"이다. 지난 시각도 화면에서는 기다리지 않는 것으로 보인다
        next_attempt_at=job.next_attempt_at if job.next_attempt_at > time.time() else 0,
        error=job.error,
        kind=detail.get("kind"),
        verdict=detail.get("verdict"),
        reason=detail.get("reason"),
        outputs=[str(item) for item in outputs],
        progress=_progress(job),
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


def _progress(job: Job) -> ProgressOut | None:
    """번역 중일 때만 진행을 보인다 (끝난 작업의 detail 에 남은 값은 쓰지 않는다)."""
    raw = job.detail.get("progress")
    if job.status != "translating" or not isinstance(raw, dict):
        return None
    done, total = raw.get("done"), raw.get("total")
    if not isinstance(done, int) or not isinstance(total, int) or total <= 0:
        return None
    return ProgressOut(done=min(done, total), total=total)


def _ledger_out(entry: LedgerEntry) -> LedgerOut:
    return LedgerOut(
        id=entry.id,
        content_id=entry.content_id,
        path=str(entry.path),
        name=entry.path.name,
        verdict=entry.verdict,
        reason=entry.reason,
        source=entry.source,
        provider=entry.provider,
        model=entry.model,
        outputs=[item.path for item in entry.sidecars.outputs],
        renames=[item.model_dump() for item in entry.sidecars.renames],
        attempts=entry.attempts,
        current=entry.current,
        processed_at=entry.processed_at,
        updated_at=entry.updated_at,
    )
