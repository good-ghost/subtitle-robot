import sqlite3
from pathlib import Path

import pytest

from subtitle_robot.llm.availability import AvailabilityPolicy, ProviderGuard
from subtitle_robot.llm.errors import ProviderUnavailableError
from subtitle_robot.llm.limiter import Runtime
from subtitle_robot.watch.queue import Job, JobError, JobQueue, backoff_seconds
from subtitle_robot.watch.state import SCHEMA_VERSION, StateSchemaError, connect


def _claim(queue: JobQueue) -> Job:
    job = queue.claim()
    assert job is not None
    return job


class FakeClock:
    def __init__(self) -> None:
        self.now = 1_000.0

    def __call__(self) -> float:
        return self.now


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock()


@pytest.fixture
def db(tmp_path: Path) -> Path:
    return tmp_path / "data" / "state.db"


@pytest.fixture
def queue(db: Path, clock: FakeClock) -> JobQueue:
    return JobQueue(db, max_attempts=3, clock=clock)


def test_new_videos_before_backlog_in_order(queue: JobQueue) -> None:
    queue.enqueue(Path("/m/old1.mkv"), priority="backlog")
    queue.enqueue(Path("/m/old2.mkv"), priority="backlog")
    queue.enqueue(Path("/m/new1.mkv"))
    queue.enqueue(Path("/m/new2.mkv"), priority="new")

    order = []
    while (job := queue.claim()) is not None:
        order.append(job.path.name)
        queue.complete(job.id, "done")

    assert order == ["new1.mkv", "new2.mkv", "old1.mkv", "old2.mkv"]


def test_enqueue_deduplicates_and_raises_priority(queue: JobQueue) -> None:
    first = queue.enqueue(Path("/m/a.mkv"), priority="backlog")
    again = queue.enqueue(Path("/m/a.mkv"), priority="new", force=True)

    assert again.id == first.id
    assert (again.priority, again.force) == ("new", True)
    assert len(queue.jobs()) == 1
    queue.complete(_claim(queue).id, "done")
    assert queue.enqueue(Path("/m/a.mkv")).id != first.id  # 끝난 뒤에는 새 작업


def test_state_transitions(queue: JobQueue) -> None:
    queue.enqueue(Path("/m/a.mkv"))
    job = queue.claim()
    assert job is not None
    assert job.status == "probing"
    assert queue.advance(job.id, "extracting").status == "extracting"
    assert queue.advance(job.id, "translating").status == "translating"
    done = queue.complete(job.id, "done", {"verdict": "translated", "outputs": ["a.ko.srt"]})
    assert (done.status, done.detail["outputs"]) == ("done", ["a.ko.srt"])
    with pytest.raises(JobError, match="done 상태"):
        queue.advance(job.id, "extracting")
    with pytest.raises(JobError, match="없다"):
        queue.get(999)


def test_failure_backoff_then_failed(queue: JobQueue, clock: FakeClock) -> None:
    queue.enqueue(Path("/m/a.mkv"))
    job = queue.claim()
    assert job is not None

    retried = queue.fail(job.id, "probe 실패")
    assert (retried.status, retried.attempts) == ("queued", 1)
    assert retried.next_attempt_at == clock.now + backoff_seconds(1)
    assert queue.claim() is None  # 백오프 동안 꺼내지 않는다
    clock.now += backoff_seconds(1)
    job = queue.claim()
    assert job is not None
    queue.fail(job.id, "또 실패")
    clock.now += backoff_seconds(2)
    job = queue.claim()
    assert job is not None

    failed = queue.fail(job.id, "마지막 실패")

    assert (failed.status, failed.attempts, failed.error) == ("failed", 3, "마지막 실패")
    assert queue.claim() is None
    assert queue.retry() == 1
    assert queue.get(job.id).attempts == 0
    queue.fail(_claim(queue).id, "x")
    assert backoff_seconds(1) == 60
    assert backoff_seconds(10) == 3600


def test_retry_runs_a_job_waiting_for_backoff_now(queue: JobQueue, clock: FakeClock) -> None:
    """설정을 고친 뒤 백오프를 기다리지 않고 다시 처리한다 (WI-10.004c)."""
    waiting = queue.enqueue(Path("/m/a.mkv"))
    fresh = queue.enqueue(Path("/m/b.mkv"))
    queue.fail(_claim(queue).id, "HTTP 404")
    queue.defer(_claim(queue).id, "공급자 불가")  # 시도 횟수를 쓰지 않은 대기는 대상이 아니다

    assert queue.retry(fresh.id) == 0
    assert queue.retry(waiting.id) == 1

    job = queue.get(waiting.id)
    assert (job.status, job.attempts, job.next_attempt_at) == ("queued", 0, 0)
    assert _claim(queue).id == waiting.id


def test_clear_failed(db: Path) -> None:
    queue = JobQueue(db, max_attempts=1)
    queue.enqueue(Path("/m/a.mkv"))
    queue.fail(_claim(queue).id, "x")

    assert queue.clear_failed() == 1
    assert queue.jobs() == []


def test_defer_keeps_attempts(queue: JobQueue) -> None:
    queue.enqueue(Path("/m/a.mkv"))
    job = queue.claim()
    assert job is not None

    deferred = queue.defer(job.id, "공급자 불가")

    assert (deferred.status, deferred.attempts) == ("queued", 0)
    assert queue.claim() is not None


def test_restart_recovers_interrupted_jobs(db: Path, clock: FakeClock) -> None:
    first = JobQueue(db, clock=clock)
    first.enqueue(Path("/m/a.mkv"))
    job = first.claim()
    assert job is not None
    first.advance(job.id, "translating")
    first.close()

    restarted = JobQueue(db, clock=clock)

    assert restarted.recover_interrupted() == 1
    again = restarted.claim()
    assert again is not None
    assert (again.id, again.attempts) == (job.id, 0)


def test_same_series_one_at_a_time(queue: JobQueue) -> None:
    queue.enqueue(Path("/m/show/e1.mkv"), series_key="show")
    queue.enqueue(Path("/m/show/e2.mkv"), series_key="show")
    queue.enqueue(Path("/m/movie.mkv"))

    first = queue.claim()
    second = queue.claim()
    assert first is not None
    assert second is not None

    assert (first.path.name, second.path.name) == ("e1.mkv", "movie.mkv")
    assert queue.claim() is None  # e2 는 e1 이 끝날 때까지 기다린다
    queue.complete(first.id, "done")
    assert _claim(queue).path.name == "e2.mkv"


def test_cancel_queued_job_for_deleted_file(queue: JobQueue) -> None:
    queue.enqueue(Path("/m/a.mkv"))

    assert queue.cancel(Path("/m/a.mkv"), "파일 삭제됨") == 1
    assert queue.jobs("skipped")[0].error == "파일 삭제됨"
    assert queue.claim() is None


def test_provider_outage_pauses_queue_without_attempts(db: Path, clock: FakeClock) -> None:
    queue = JobQueue(db, clock=clock)
    other_process = JobQueue(db, clock=clock)
    queue.enqueue(Path("/m/a.mkv"))
    queue.enqueue(Path("/m/b.mkv"))
    job = queue.claim()
    assert job is not None
    health = iter([False, True])
    observed: list[tuple[str, bool]] = []

    class Adapter:
        def health_check(self) -> bool:
            return next(health)

    def sleep(_seconds: float) -> None:
        observed.append((other_process.provider_state(), other_process.claim() is None))

    guard = ProviderGuard(
        Adapter(),
        policy=AvailabilityPolicy(check_interval_s=1),
        runtime=Runtime(sleep=sleep),
        listeners=[queue],
    )
    calls = iter([ProviderUnavailableError("429"), "번역 완료"])

    def translate() -> str:
        result = next(calls)
        if isinstance(result, Exception):
            raise result
        return str(result)

    assert guard.run(translate) == "번역 완료"
    assert observed == [("unavailable", True), ("unavailable", True)]  # 멈춘 동안 새 작업 없음
    assert queue.provider_state() == "available"
    assert queue.get(job.id).attempts == 0
    assert queue.claim() is not None  # 복구 뒤 재개


def test_newer_schema_is_rejected(db: Path) -> None:
    connect(db).execute(f"PRAGMA user_version = {SCHEMA_VERSION + 1}")

    with pytest.raises(StateSchemaError, match="새롭다"):
        connect(db)


def test_schema_is_created_once(db: Path) -> None:
    connect(db).close()
    conn = connect(db)

    assert conn.execute("PRAGMA user_version").fetchone()[0] == SCHEMA_VERSION
    assert conn.execute("PRAGMA journal_mode").fetchone()[0] == "wal"
    with pytest.raises(sqlite3.OperationalError):
        conn.execute("CREATE TABLE jobs (x)")


def test_sql_status_literals_match_constants() -> None:
    import subtitle_robot.watch.queue as module

    source = Path(module.__file__).read_text(encoding="utf-8")
    active = "(" + ", ".join(f"'{status}'" for status in module.ACTIVE_STATUSES) + ")"
    pending = "(" + ", ".join(f"'{status}'" for status in module.PENDING_STATUSES) + ")"

    assert source.count(active) == 2  # claim, recover_interrupted
    assert pending in source  # enqueue
