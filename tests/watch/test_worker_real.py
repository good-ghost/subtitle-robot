"""작업 처리 전체 흐름 (실제 mkvtoolnix·ffmpeg + 가짜 LLM)."""

import shutil
import threading
import time
from pathlib import Path

import pytest

from subtitle_robot.cli import EXIT_OK, AdapterFactory, main
from subtitle_robot.config import AppConfig, LlmSection, WatchConfig, WatchPath, load_config
from subtitle_robot.llm.base import LlmAdapter
from subtitle_robot.watch.daemon import run_daemon
from subtitle_robot.watch.heartbeat import HEARTBEAT_KEY
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.queue import JobQueue
from subtitle_robot.watch.state import state_path
from subtitle_robot.watch.worker import JobOutcome, MediaWorker, media_target, series_key_for
from tests.fake_llm import FakeAdapter
from tests.media.conftest import MediaSamples, requires_media_tools, run_tool
from tests.series.test_runner import _respond

pytestmark = requires_media_tools


class Env:
    def __init__(self, tmp_path: Path, samples: MediaSamples) -> None:
        self.samples = samples
        self.media = tmp_path / "media"
        self.movies = self.media / "movies"
        self.tv = self.media / "tv"
        self.data = tmp_path / "data"
        self.config: AppConfig = load_config(None).model_copy(
            update={
                "watch": WatchConfig(
                    enabled=False,
                    paths=[
                        WatchPath(path=str(self.movies), kind="movie"),
                        WatchPath(path=str(self.tv), kind="series"),
                    ],
                ),
                "llm": LlmSection(provider="nim"),
            }
        )
        self.queue = JobQueue(state_path(self.data), max_attempts=2)
        self.ledger = Ledger(state_path(self.data), self.data, hash_bytes=4096)
        self.adapter = FakeAdapter(_respond)

    def worker(self) -> MediaWorker:
        return MediaWorker(
            self.config, queue=self.queue, ledger=self.ledger, data_dir=self.data,
            adapter=self.adapter,
        )  # fmt: skip

    def place(self, sample: Path, relative: str) -> Path:
        target = self.media / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        return Path(shutil.copy2(sample, target))

    def variant(self, relative: str, title: str) -> Path:
        """샘플 MP4 를 다시 묶어 내용이 다른 영상을 만든다 (메타데이터만 다름)."""
        target = self.media / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        run_tool(
            ["ffmpeg", "-v", "error", "-y", "-i", str(self.samples.mp4), "-map", "0", "-c", "copy",
             "-metadata", f"title={title}", str(target)]
        )  # fmt: skip
        return target

    def enqueue(self, path: Path, **detail: object) -> int:
        target = media_target(self.config, self.data, path)
        force = bool(detail.pop("force", False))
        return self.queue.enqueue(
            path, series_key=series_key_for(target), force=force, detail=dict(detail)
        ).id

    def process(self, job_id: int) -> JobOutcome:
        job = self.queue.claim(job_id)
        assert job is not None
        return self.worker().process(job)


@pytest.fixture
def env(tmp_path: Path, media_samples: MediaSamples) -> Env:
    return Env(tmp_path, media_samples)


def test_movie_is_extracted_and_translated(env: Env) -> None:
    video = env.place(env.samples.mp4, "movies/Movie (2024)/Movie (2024).mp4")
    job_id = env.enqueue(video)

    outcome = env.process(job_id)

    folder = video.parent
    assert sorted(p.name for p in folder.iterdir()) == [
        "Movie (2024).en.forced.srt", "Movie (2024).en.srt", "Movie (2024).ja.srt",
        "Movie (2024).ko.srt", "Movie (2024).mp4",
    ]  # fmt: skip
    assert "번역" in (folder / "Movie (2024).ko.srt").read_text(encoding="utf-8")
    entry = env.ledger.find(video)
    assert entry is not None
    assert (entry.verdict, entry.source["language"], entry.source["order"]) == (
        "translated",
        "en",
        0,
    )
    assert len(entry.sidecars.outputs) == 4
    job = env.queue.get(job_id)
    assert (job.status, job.detail["verdict"]) == ("done", "translated")
    assert outcome.verdict == "translated"

    again = env.process(env.enqueue(video))
    assert again.reason == "이미 처리함 (translated)"

    forced = env.process(env.enqueue(video, force=True))
    assert forced.verdict == "translated"
    assert not [p for p in folder.iterdir() if ".orig" in p.name]  # 도구 출력은 교체


def test_embedded_korean_is_extracted_not_translated(env: Env) -> None:
    video = env.place(env.samples.mkv, "movies/Movie (2020)/Movie (2020).mkv")

    outcome = env.process(env.enqueue(video))

    assert outcome.verdict == "has_target"
    assert (video.parent / "Movie (2020).ko.vtt").exists()
    assert not (video.parent / "Movie (2020).ko.srt").exists()
    assert env.adapter.requests == []


def test_media_command_respects_external_subtitles_unless_forced(env: Env) -> None:
    video = env.place(env.samples.mp4, "movies/Old/Old.mp4")
    (video.parent / "Old.en.srt").write_text("기존 외부 자막", encoding="utf-8")

    skipped = env.process(env.enqueue(video, origin="media"))
    assert skipped.verdict == "has_external"

    forced = env.process(env.enqueue(video, origin="media", force=True))

    assert forced.verdict == "translated"
    assert (video.parent / "Old.en.orig.srt").read_text(encoding="utf-8") == "기존 외부 자막"
    assert (video.parent / "Old.ko.srt").exists()


def test_series_prescan_batch_analyzes_before_translating(env: Env) -> None:
    # 같은 파일을 두 번 복사하면 ledger 가 같은 영상(copied)으로 본다. 내용이 다른 에피소드를 만든다
    first = env.variant("tv/Show/Season 01/Show S01E02.mp4", "E02")
    second = env.variant("tv/Show/Season 01/Show S01E03.mp4", "E03")
    first_id = env.enqueue(first, series_mode="prescan")
    second_id = env.enqueue(second, series_mode="prescan")

    env.process(first_id)
    kinds = [str(r.schema_name).split("_")[0] for r in env.adapter.requests]
    assert kinds.count("pass1") == 2  # 두 에피소드를 먼저 분석
    assert kinds.index("pass2") > max(i for i, k in enumerate(kinds) if k == "pass1")
    env.adapter.requests.clear()
    env.process(second_id)

    assert {str(r.schema_name) for r in env.adapter.requests} == {"pass2_output"}  # 분석은 이미 함
    assert (second.parent / "Show S01E03.ko.srt").exists()
    workspace = env.data / "series" / "show"
    assert sorted(p.name for p in (workspace / "episodes").iterdir()) == [
        "S01E02.srt",
        "S01E03.srt",
    ]
    assert sorted(p.name for p in (workspace / "out").iterdir()) == [
        "S01E02.ko.srt",
        "S01E03.ko.srt",
    ]


def test_failure_is_retried_then_recorded(env: Env) -> None:
    bad = env.media / "movies" / "Broken.mkv"
    bad.parent.mkdir(parents=True)
    bad.write_bytes(b"not a matroska file")
    job_id = env.enqueue(bad)

    first = env.process(job_id)
    assert first.status == "queued"  # 재시도 대기
    env.queue.retry()  # 대기 시간 없이 다시
    job = env.queue.claim(job_id)
    assert job is not None
    last = env.worker().process(job)

    assert last.status == "failed"
    entry = env.ledger.find(bad)
    assert entry is not None
    assert entry.verdict == "failed"


def _factory(adapter: FakeAdapter) -> AdapterFactory:
    def make(_config: AppConfig) -> LlmAdapter:
        return adapter

    return make


def _no_llm(_config: AppConfig) -> LlmAdapter:
    raise AssertionError("LLM 을 쓰면 안 된다")


def test_media_cli(env: Env, capsys: pytest.CaptureFixture[str]) -> None:
    video = env.place(env.samples.mp4, "movies/Cli (2024)/Cli (2024).mp4")
    base = ["--data", str(env.data)]

    assert main([*base, "probe", str(video)], adapter_factory=_no_llm) == EXIT_OK
    printed = capsys.readouterr().out
    assert "#2 [3] mov_text 미지정" in printed  # und, 이름 힌트도 없다 (추출 뒤 내용으로 판정)
    assert main([*base, "media", str(video.parent)], adapter_factory=_no_llm) == EXIT_OK
    assert "큐 등록 1건" in capsys.readouterr().out
    assert (
        main([*base, "media", str(video), "--foreground"], adapter_factory=_factory(env.adapter))
        == EXIT_OK
    )
    assert "translated" in capsys.readouterr().out
    assert (video.parent / "Cli (2024).ko.srt").exists()

    assert main([*base, "media", "revert", str(video)], adapter_factory=_no_llm) == EXIT_OK

    assert sorted(p.name for p in video.parent.iterdir()) == ["Cli (2024).mp4"]
    assert (
        main([*base, "media", str(video), "--foreground"], adapter_factory=_factory(env.adapter))
        == EXIT_OK
    )
    assert (
        "has_external" in capsys.readouterr().out.split("지움")[-1]
    )  # 되돌린 영상은 다시 하지 않는다


def test_daemon_processes_queue_and_writes_heartbeat(env: Env) -> None:
    video = env.place(env.samples.mp4, "movies/Daemon (2024)/Daemon (2024).mp4")
    job_id = env.enqueue(video)
    stop = threading.Event()
    thread = threading.Thread(
        target=run_daemon,
        kwargs={
            "config": env.config, "data_dir": env.data, "adapter": env.adapter, "stop": stop,
            "heartbeat_interval": 0.1, "idle_wait": 0.1,
        },
    )  # fmt: skip
    thread.start()
    try:
        deadline = time.monotonic() + 30
        while env.queue.get(job_id).status != "done" and time.monotonic() < deadline:
            time.sleep(0.1)
    finally:
        stop.set()
        thread.join(timeout=30)

    assert env.queue.get(job_id).status == "done"
    assert env.queue.meta(HEARTBEAT_KEY) is not None
    assert not thread.is_alive()
