"""종료 요청으로 멈춘 작업을 이어서 처리 (2026-10-03 컨테이너 테스트 결함)."""

import shutil
import threading
from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.config import AppConfig, WatchConfig, WatchPath, load_config
from subtitle_robot.io.convert import ass_to_srt
from subtitle_robot.llm.availability import AvailabilityPolicy, ProviderGuard
from subtitle_robot.llm.base import ChatRequest
from subtitle_robot.llm.errors import ProviderUnavailableError
from subtitle_robot.llm.limiter import Runtime
from subtitle_robot.media.extract import ExtractedTrack, ExtractionResult
from subtitle_robot.media.probe import ProbeResult
from subtitle_robot.media.sidecar import SidecarWriter
from subtitle_robot.media.tracks import SubtitleTrack
from subtitle_robot.watch.cancel import CancellableAdapter, OperationCancelled, stop_aware_sleep
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.queue import JobQueue
from subtitle_robot.watch.state import state_path
from subtitle_robot.watch.worker import PARTIAL_KEY, MediaWorker
from tests.fake_llm import FakeAdapter
from tests.pipeline.test_ass_input import ASS
from tests.series.test_runner import _respond

TRACK = SubtitleTrack(
    order=0, track_id=2, codec="S_TEXT/ASS", kind="ass", language="ja", language_raw="jpn",
    name="", forced=False, default=True, hearing_impaired=False,
)  # fmt: skip


class Env:
    def __init__(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        media = tmp_path / "media" / "movies"
        media.mkdir(parents=True)
        self.video = media / "Movie.mkv"
        self.video.write_bytes(b"video" * 100)
        work = tmp_path / "extracted"
        work.mkdir()
        raw = work / "track0.ass"
        raw.write_text(ASS, encoding="utf-8")
        converted = work / "track0.converted.srt"
        converted.write_text(ass_to_srt(ASS), encoding="utf-8")

        def fake_extract(result: ProbeResult, _work: Path, **kwargs: Any) -> ExtractionResult:
            """실제 추출처럼 설치 함수(SidecarWriter)로 사이드카를 쓴다."""
            target = result.path.with_name(f"{result.path.stem}.ja.ass")
            temp = target.with_name(".tmp-extract")
            shutil.copyfile(raw, temp)
            sidecar = kwargs["install"](temp, target)
            temp.unlink(missing_ok=True)
            item = ExtractedTrack(TRACK, "ja", sidecar, target, converted, raw=raw)
            return ExtractionResult(result.path, [item])

        monkeypatch.setattr(
            "subtitle_robot.watch.worker.probe", lambda p, **_k: ProbeResult(p, "mkv", (TRACK,))
        )
        monkeypatch.setattr("subtitle_robot.watch.worker.extract_subtitles", fake_extract)
        self.config: AppConfig = load_config(None).model_copy(
            update={
                "watch": WatchConfig(
                    enabled=False, paths=[WatchPath(path=str(media), kind="movie")]
                )
            }
        )
        data = tmp_path / "data"
        self.queue = JobQueue(state_path(data))
        self.ledger = Ledger(state_path(data), data, hash_bytes=64)
        self.data = data

    def worker(self, adapter: Any) -> MediaWorker:
        return MediaWorker(
            self.config, queue=self.queue, ledger=self.ledger, data_dir=self.data, adapter=adapter
        )

    def files(self) -> list[str]:
        return sorted(p.name for p in self.video.parent.iterdir())


@pytest.fixture
def env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Env:
    return Env(tmp_path, monkeypatch)


def test_stop_mid_translation_defers_and_resume_reuses_own_sidecars(env: Env) -> None:
    stop = threading.Event()
    calls = {"n": 0}

    def respond(request: ChatRequest) -> str:
        calls["n"] += 1
        stop.set()  # 첫 요청 처리 중 종료 요청이 들어왔다
        return _respond(request)

    job = env.queue.enqueue(env.video)
    claimed = env.queue.claim(job.id)
    assert claimed is not None
    first = env.worker(CancellableAdapter(FakeAdapter(respond), stop)).process(claimed)

    assert first.status == "queued"  # 다음 요청 전에 멈추고 대기로 돌아간다
    deferred = env.queue.get(job.id)
    assert (deferred.status, deferred.attempts) == ("queued", 0)
    assert PARTIAL_KEY in deferred.detail  # 추출한 사이드카 기록이 작업에 남는다
    assert env.ledger.find(env.video) is None
    assert env.files() == ["Movie.ja.ass", "Movie.mkv"]

    again = env.queue.claim(job.id)
    assert again is not None
    second = env.worker(FakeAdapter(_respond)).process(again)

    assert second.verdict == "translated"
    assert env.files() == ["Movie.ja.ass", "Movie.ko.srt", "Movie.mkv"]  # .orig 없음 (기본 srt)


def test_korean_output_written_before_crash_is_not_external(env: Env) -> None:
    """번역 결과를 쓴 뒤 처리 기록 전에 끊겨도 다시 처리할 때 has_target 으로 끝나지 않는다."""
    job = env.queue.enqueue(env.video)
    claimed = env.queue.claim(job.id)
    assert claimed is not None
    env.worker(FakeAdapter(_respond)).process(claimed)
    entry = env.ledger.find(env.video)
    assert entry is not None
    env.ledger.forget(env.video)  # 기록이 남기 전에 끊긴 상황
    retry = env.queue.enqueue(
        env.video, detail={PARTIAL_KEY: entry.sidecars.model_dump(mode="json")}
    )
    claimed = env.queue.claim(retry.id)
    assert claimed is not None

    outcome = env.worker(FakeAdapter(_respond)).process(claimed)

    assert outcome.verdict == "translated"
    assert not [name for name in env.files() if ".orig" in name]


def test_identical_existing_file_is_replaced_not_preserved(tmp_path: Path) -> None:
    target = tmp_path / "Movie.en.srt"
    target.write_text("same", encoding="utf-8")

    SidecarWriter().write_text(target, "same")

    assert sorted(p.name for p in tmp_path.iterdir()) == ["Movie.en.srt"]


def test_cancel_during_provider_pause() -> None:
    stop = threading.Event()
    stop.set()

    class Down:
        def health_check(self) -> bool:
            return False

    def unavailable() -> str:
        raise ProviderUnavailableError("429")

    guard = ProviderGuard(
        Down(),
        policy=AvailabilityPolicy(check_interval_s=60),
        runtime=Runtime(sleep=stop_aware_sleep(stop)),
    )
    with pytest.raises(OperationCancelled):
        guard.run(unavailable)
