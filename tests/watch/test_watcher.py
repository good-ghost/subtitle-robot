import errno
import logging
import os
import threading
import time
from pathlib import Path

import pytest
from watchdog.observers.polling import PollingObserver

from subtitle_robot.config import WatchConfig, WatchPath
from subtitle_robot.media.sidecar import SidecarWriter
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.queue import Job, JobQueue
from subtitle_robot.watch.stability import StabilityTracker
from subtitle_robot.watch.state import state_path
from subtitle_robot.watch.watcher import MediaWatcher, is_media_candidate

START = 1_700_000_000.0
OLD = START - 86_400 * 30


class FakeClock:
    def __init__(self) -> None:
        self.now = START

    def __call__(self) -> float:
        return self.now


class Env:
    def __init__(self, tmp_path: Path) -> None:
        self.media = tmp_path / "media"
        self.movies = self.media / "movies"
        self.tv = self.media / "tv"
        self.movies.mkdir(parents=True)
        self.tv.mkdir(parents=True)
        self.data = tmp_path / "data"
        self.clock = FakeClock()
        self.queue = JobQueue(state_path(self.data), clock=self.clock)
        self.ledger = Ledger(state_path(self.data), self.data, hash_bytes=64, clock=self.clock)
        self.config = WatchConfig(
            stable_seconds=60,
            paths=[
                WatchPath(path=str(self.movies), kind="movie"),
                WatchPath(path=str(self.tv), kind="series"),
            ],
        )

    def watcher(self, **overrides: object) -> MediaWatcher:
        config = self.config.model_copy(update=overrides)
        return MediaWatcher(
            config,
            queue=self.queue,
            ledger=self.ledger,
            data_dir=self.data,
            series_window=600,
            clock=self.clock,
        )

    def video(self, relative: str, *, mtime: float | None = None, body: bytes = b"") -> Path:
        path = self.media / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(body or relative.encode() * 50)
        stamp = mtime if mtime is not None else self.clock.now
        os.utime(path, (stamp, stamp))
        return path

    def queued(self) -> list[Job]:
        return self.queue.jobs("queued")


@pytest.fixture
def env(tmp_path: Path) -> Env:
    return Env(tmp_path)


def test_stability_tracker() -> None:
    sizes = {Path("a"): (1, 1)}
    tracker = StabilityTracker(60, stat=lambda path: sizes.get(path))
    tracker.observe(Path("a"), 0)

    assert tracker.ready(59) == []
    sizes[Path("a")] = (2, 2)  # 아직 쓰는 중
    assert tracker.ready(70) == []
    assert tracker.ready(129) == []
    assert tracker.ready(130) == [Path("a")]
    assert Path("a") not in tracker
    tracker.observe(Path("a"), 200)
    del sizes[Path("a")]  # 사라짐
    assert tracker.ready(1000) == []
    assert len(tracker) == 0


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("Movie.mkv", True), ("Movie.MP4", True), ("Movie.mkv.part", False),
        ("Movie.mkv.!qB", False), ("Movie.tmp", False), (".hidden.mkv", False),
        ("Movie-SAMPLE.mkv", False), ("Movie.avi", False), ("Movie.en.srt", False),
    ],
)  # fmt: skip
def test_candidate_filter(env: Env, name: str, expected: bool) -> None:
    assert env.watcher().is_candidate(env.movies / name) is expected


def test_file_being_copied_waits_until_stable(env: Env) -> None:
    watcher = env.watcher()
    watcher.baseline()
    path = env.video("movies/Movie (2020).mkv")
    watcher.observe(path)

    env.clock.now += 30
    path.write_bytes(path.read_bytes() + b"more")  # 아직 복사 중
    assert watcher.tick().outcomes == {}
    env.clock.now += 59
    assert watcher.tick().outcomes == {}
    env.clock.now += 1

    report = watcher.tick()

    assert report.paths("queued") == [path]
    job = env.queued()[0]
    assert (job.priority, job.detail["kind"]) == ("new", "movie")


def test_queued_file_is_logged(env: Env, caplog: pytest.LogCaptureFixture) -> None:
    watcher = env.watcher()
    watcher.baseline()
    movie = env.video("movies/Movie (2020).mkv")
    episode = env.video("tv/Show/Show S01E01.mkv")
    watcher.observe(movie)
    watcher.observe(episode)
    env.clock.now += 60

    with caplog.at_level(logging.INFO, logger="subtitle_robot.watch.watcher"):
        watcher.tick()

    messages = sorted(r.getMessage() for r in caplog.records)
    assert messages[0] == f"queued (movie, new): {movie}"
    assert messages[1].startswith("queued (series, new, series window until ")
    assert messages[1].endswith(f"): {episode}")


def test_restart_scan_picks_up_files_added_while_down(env: Env) -> None:
    env.watcher().scan()  # 첫 시작: 기준점 저장
    env.clock.now += 3600
    added = env.video("movies/Added While Down (2021).mkv", mtime=START + 1800)
    old = env.video("movies/Old (1999).mkv", mtime=OLD)

    restarted = env.watcher()
    report = restarted.scan()
    assert report.paths("queued") == [old]  # 기준점 이전: 백로그, 바로 등록
    env.clock.now += 60
    restarted.tick()

    assert {(j.path.name, j.priority) for j in env.queued()} == {
        ("Old (1999).mkv", "backlog"), ("Added While Down (2021).mkv", "new"),
    }  # fmt: skip
    first = env.queue.claim()
    assert first is not None
    assert first.path == added  # 새 영상이 먼저
    assert restarted.scan().outcomes == {}  # 이미 등록된 파일은 다시 등록하지 않는다


def test_backlog_order_and_external_subtitles(env: Env) -> None:
    env.video("movies/A.mkv", mtime=OLD)
    env.video("movies/B.mkv", mtime=OLD + 200)
    env.video("movies/C.mkv", mtime=OLD + 100)
    with_sub = env.video("movies/D.mkv", mtime=OLD + 300)
    (env.movies / "D.eng.srt").write_text("external", encoding="utf-8")

    env.watcher().scan()

    # 외부 자막이 있어도 큐에 넣는다: 내장 텍스트 자막이 없으면 외부 자막으로 번역하므로
    # 건너뛸지는 워커가 영상을 검사한 뒤 정한다 (WI-5.004b)
    assert [j.path.name for j in env.queued()] == [
        "D.mkv",
        "B.mkv",
        "C.mkv",
        "A.mkv",
    ]  # 최근 수정순
    assert env.ledger.find(with_sub) is None


def test_backlog_path_order(env: Env) -> None:
    env.video("movies/B.mkv", mtime=OLD + 200)
    env.video("movies/A.mkv", mtime=OLD)

    env.watcher(backlog_order="path").scan()

    assert [j.path.name for j in env.queued()] == ["A.mkv", "B.mkv"]


def test_season_pack_waits_in_queue_until_window_ends(env: Env) -> None:
    watcher = env.watcher()
    watcher.baseline()
    pack = [env.video(f"tv/Show/Season 01/Show S01E0{n}.mkv") for n in (3, 1)]
    for path in pack:
        watcher.observe(path)
    env.clock.now += 60
    assert len(watcher.tick().paths("batched")) == 2
    window_end = env.clock.now + 600
    env.clock.now += 100
    late = env.video("tv/Show/Season 01/Show S01E02.mkv")
    watcher.observe(late)
    env.clock.now += 60
    watcher.tick()

    queued = env.queued()  # 창 동안에도 큐에 보인다 (queue list "대기 HH:MM까지")
    assert sorted(j.detail["episode"] for j in queued) == ["S01E01", "S01E02", "S01E03"]
    assert {j.next_attempt_at for j in queued} == {window_end}  # 늦게 온 화도 같은 창
    assert {j.series_key for j in queued} == {"series:show"}
    assert all("series_mode" not in j.detail for j in queued)  # 워커가 꺼낼 때 정한다
    assert env.queue.claim() is None  # 창이 끝나기 전에는 꺼내지 않는다

    env.clock.now = window_end
    first = env.queue.claim()
    assert first is not None
    assert len(env.queue.queued_siblings(first)) == 2  # 워커는 prescan 으로 처리한다

    other = env.video("tv/Other/Other S02E05.mkv")
    watcher.observe(other)
    env.clock.now += 60
    watcher.tick()
    lone = next(j for j in env.queued() if j.path == other)
    assert lone.next_attempt_at == env.clock.now + 600 - 0  # 다른 시리즈는 새 창
    assert env.queue.queued_siblings(lone) == []  # 혼자면 incremental


def test_deleted_episode_during_window_is_cancelled(env: Env) -> None:
    watcher = env.watcher()
    watcher.baseline()
    path = env.video("tv/Show/Season 01/Show S01E01.mkv")
    watcher.observe(path)
    env.clock.now += 60
    watcher.tick()
    path.unlink()

    watcher.deleted(path)

    assert env.queued() == []


def test_backlog_season_is_grouped(env: Env) -> None:
    env.video("tv/Show/Season 01/Show S01E01.mkv", mtime=OLD)
    env.video("tv/Show/Season 01/Show S01E02.mkv", mtime=OLD)
    env.video("tv/Solo/Solo S01E01.mkv", mtime=OLD)

    env.watcher().scan()

    modes = {j.path.name: (j.priority, j.detail["series_mode"]) for j in env.queued()}
    assert modes == {
        "Show S01E01.mkv": ("backlog", "prescan"),
        "Show S01E02.mkv": ("backlog", "prescan"),
        "Solo S01E01.mkv": ("backlog", "incremental"),
    }


def test_moved_video_is_restored_not_queued(env: Env) -> None:
    video = env.video("movies/incoming/Movie (2020).mkv", mtime=OLD)
    writer = SidecarWriter()
    writer.write_text(
        video.with_name("Movie (2020).ko.srt"), "1\n00:00:01,000 --> 00:00:02,000\n안녕\n"
    )
    env.ledger.record(video, verdict="translated", sidecars=writer.record)
    moved = env.movies / "Movie (2020)" / "Movie (2020).mkv"
    moved.parent.mkdir()
    video.rename(moved)

    report = env.watcher().scan()

    assert report.paths("relocated") == [moved]
    assert env.queued() == []
    assert (moved.parent / "Movie (2020).ko.srt").read_text(encoding="utf-8").endswith("안녕\n")


def test_deleted_file_cancels_queued_job(env: Env) -> None:
    path = env.video("movies/Gone.mkv", mtime=OLD)
    watcher = env.watcher()
    watcher.scan()
    path.unlink()

    watcher.deleted(path)

    assert env.queued() == []
    assert env.queue.jobs("skipped")[0].error == "파일 삭제됨"


def test_real_watchdog_polling_detects_new_file(tmp_path: Path) -> None:
    media = tmp_path / "media"
    media.mkdir()
    data = tmp_path / "data"
    queue = JobQueue(state_path(data))
    ledger = Ledger(state_path(data), data, hash_bytes=64)
    config = WatchConfig(
        stable_seconds=0,
        polling=True,
        polling_interval=0.2,
        paths=[WatchPath(path=str(media), kind="movie")],
    )
    watcher = MediaWatcher(config, queue=queue, ledger=ledger, data_dir=data)
    stop = threading.Event()
    thread = threading.Thread(target=watcher.run, args=(stop,), kwargs={"tick_interval": 0.1})
    thread.start()
    try:
        time.sleep(0.5)
        (media / "New Movie (2024).mkv").write_bytes(b"video" * 100)
        deadline = time.monotonic() + 10
        while not queue.jobs("queued") and time.monotonic() < deadline:
            time.sleep(0.1)
    finally:
        stop.set()
        thread.join(timeout=10)

    assert [j.path.name for j in queue.jobs("queued")] == ["New Movie (2024).mkv"]
    assert not thread.is_alive()


class _LimitedInotifyObserver(PollingObserver):
    """inotify 감시 한도를 넘은 것처럼 시작에 실패한다 (호스트 한도를 바꾸지 않고 재현)."""

    def start(self) -> None:
        raise OSError(errno.ENOSPC, "inotify watch limit reached")


def _run_until_queued(watcher: MediaWatcher, media: Path, queue: JobQueue) -> threading.Thread:
    stop = threading.Event()
    thread = threading.Thread(target=watcher.run, args=(stop,), kwargs={"tick_interval": 0.1})
    thread.start()
    try:
        time.sleep(0.5)
        (media / "New Movie (2024).mkv").write_bytes(b"video" * 100)
        deadline = time.monotonic() + 10
        while not queue.jobs("queued") and time.monotonic() < deadline:
            time.sleep(0.1)
    finally:
        stop.set()
        thread.join(timeout=10)
    return thread


def test_inotify_limit_falls_back_to_polling(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    media = tmp_path / "media"
    media.mkdir()
    data = tmp_path / "data"
    queue = JobQueue(state_path(data))
    ledger = Ledger(state_path(data), data, hash_bytes=64)
    config = WatchConfig(
        stable_seconds=0, polling_interval=0.2, paths=[WatchPath(path=str(media), kind="movie")]
    )
    monkeypatch.setattr("subtitle_robot.watch.watcher.Observer", _LimitedInotifyObserver)
    watcher = MediaWatcher(config, queue=queue, ledger=ledger, data_dir=data)

    with caplog.at_level(logging.WARNING, logger="subtitle_robot.watch.watcher"):
        thread = _run_until_queued(watcher, media, queue)

    # 감시 스레드가 죽지 않고 polling 으로 새 파일을 찾는다
    assert [j.path.name for j in queue.jobs("queued")] == ["New Movie (2024).mkv"]
    assert not thread.is_alive()
    assert any("falling back to polling" in r.getMessage() for r in caplog.records)


def test_other_observer_errors_are_not_hidden(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    class Broken(PollingObserver):
        def start(self) -> None:
            raise OSError(errno.EACCES, "permission denied")

    data = tmp_path / "data"
    config = WatchConfig(paths=[WatchPath(path=str(tmp_path), kind="movie")])
    monkeypatch.setattr("subtitle_robot.watch.watcher.Observer", Broken)
    watcher = MediaWatcher(
        config,
        queue=JobQueue(state_path(data)),
        ledger=Ledger(state_path(data), data, hash_bytes=64),
        data_dir=data,
    )

    with pytest.raises(OSError, match="permission denied"):
        watcher.run(threading.Event())


def test_download_tool_work_folders_are_excluded(env: Env) -> None:
    # SABnzbd 가 압축을 푸는 중인 폴더의 파일은 감시하지 않는다 (다운로드와 추출이 겹치지 않게)
    config = env.config
    assert not is_media_candidate(env.movies / "_UNPACK_Movie (2024)" / "Movie (2024).mkv", config)
    assert not is_media_candidate(env.movies / "_failed_Movie" / "Movie.mkv", config)
    assert is_media_candidate(env.movies / "Movie (2024)" / "Movie (2024).mkv", config)


def test_polling_interval_is_configurable(env: Env, monkeypatch: pytest.MonkeyPatch) -> None:
    timeouts: list[float] = []

    class Recording(PollingObserver):
        def __init__(self, *, timeout: float = 1.0) -> None:
            timeouts.append(timeout)
            super().__init__(timeout=timeout)

    monkeypatch.setattr("subtitle_robot.watch.watcher.PollingObserver", Recording)
    stop = threading.Event()
    stop.set()
    env.watcher(polling=True, polling_interval=45).run(stop)

    assert timeouts == [45]
