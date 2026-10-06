"""미디어 번역 출력 형식 (WI-6.003). 검사·추출은 가짜로 바꾸고 번역 파이프라인은 그대로 돈다."""

import logging
from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.config import AppConfig, MediaConfig, WatchConfig, WatchPath, load_config
from subtitle_robot.io.ass import parse_ass
from subtitle_robot.io.convert import ass_to_srt
from subtitle_robot.media.commands import CommandCancelled
from subtitle_robot.media.extract import ExtractedTrack, ExtractionResult
from subtitle_robot.media.probe import ProbeResult
from subtitle_robot.media.tracks import SubtitleTrack
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.queue import JobQueue
from subtitle_robot.watch.state import state_path
from subtitle_robot.watch.worker import MediaWorker
from tests.fake_llm import FakeAdapter
from tests.pipeline.test_ass_input import ASS
from tests.series.test_runner import _respond


def _setup(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, output_format: str, relative: str
) -> tuple[MediaWorker, JobQueue, Path]:
    media = tmp_path / "media"
    video = media / relative
    video.parent.mkdir(parents=True)
    video.write_bytes(b"video" * 100)
    work = tmp_path / "extracted"
    work.mkdir()
    raw = work / "track0.ass"
    raw.write_text(ASS, encoding="utf-8")
    converted = work / "track0.converted.srt"
    converted.write_text(ass_to_srt(ASS), encoding="utf-8")
    track = SubtitleTrack(
        order=0, track_id=2, codec="S_TEXT/ASS", kind="ass", language="ja", language_raw="jpn",
        name="", forced=False, default=True, hearing_impaired=False,
    )  # fmt: skip

    def fake_probe(path: Path, **_kwargs: Any) -> ProbeResult:
        return ProbeResult(path, "mkv", (track,))

    def fake_extract(result: ProbeResult, work_dir: Path, **_kwargs: Any) -> ExtractionResult:
        # 실제 추출처럼 작업공간의 추출 폴더에 트랙을 남긴다 (작업 파일 정리 확인용)
        (work_dir / "tracks").mkdir(parents=True, exist_ok=True)
        (work_dir / "tracks" / "track0.ass").write_text(ASS, encoding="utf-8")
        planned = result.path.with_name(f"{result.path.stem}.ja.ass")
        extracted = ExtractedTrack(track, "ja", None, planned, converted, raw=raw)
        return ExtractionResult(result.path, [extracted])

    monkeypatch.setattr("subtitle_robot.watch.worker.probe", fake_probe)
    monkeypatch.setattr("subtitle_robot.watch.worker.extract_subtitles", fake_extract)
    config: AppConfig = load_config(None).model_copy(
        update={
            "media": MediaConfig.model_validate({"output_format": output_format}),
            "watch": WatchConfig(
                enabled=False,
                paths=[
                    WatchPath(path=str(media / "movies"), kind="movie"),
                    WatchPath(path=str(media / "tv"), kind="series"),
                ],
            ),
        }
    )
    data = tmp_path / "data"
    queue = JobQueue(state_path(data))
    ledger = Ledger(state_path(data), data, hash_bytes=64)
    worker = MediaWorker(
        config, queue=queue, ledger=ledger, data_dir=data, adapter=FakeAdapter(_respond)
    )
    return worker, queue, video


def _run(worker: MediaWorker, queue: JobQueue, video: Path, **kwargs: Any) -> None:
    job = queue.enqueue(video, **kwargs)
    claimed = queue.claim(job.id)
    assert claimed is not None
    outcome = worker.process(claimed)
    assert outcome.verdict == "translated", outcome.reason


@pytest.mark.parametrize(
    ("output_format", "expected"),
    [
        ("srt", ["Movie.ko.srt"]),
        ("ass", ["Movie.ko.ass"]),
        ("both", ["Movie.ko.ass", "Movie.ko.srt"]),
    ],
)
def test_movie_output_formats(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, output_format: str, expected: list[str]
) -> None:
    worker, queue, video = _setup(tmp_path, monkeypatch, output_format, "movies/Movie.mkv")

    _run(worker, queue, video)

    outputs = sorted(p.name for p in video.parent.iterdir() if ".ko." in p.name)
    assert outputs == expected
    if "Movie.ko.ass" in expected:
        events = parse_ass((video.parent / "Movie.ko.ass").read_text(encoding="utf-8")).events
        assert [e.text for e in events][-1] == "{\\an8}번역"  # 스타일·앞 태그 보존한 ASS
    if "Movie.ko.srt" in expected:
        assert "번역" in (video.parent / "Movie.ko.srt").read_text(encoding="utf-8")


def test_job_log_names_video_and_outputs(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    worker, queue, video = _setup(tmp_path, monkeypatch, "both", "movies/Movie.mkv")

    with caplog.at_level(logging.INFO, logger="subtitle_robot.watch.worker"):
        _run(worker, queue, video)

    messages = [r.getMessage() for r in caplog.records if r.name == "subtitle_robot.watch.worker"]
    assert messages[0] == f"job 1 started: {video}"
    assert messages[-2].startswith("job 1 done (translated): ")
    assert messages[-2].endswith("-> Movie.ko.ass, Movie.ko.srt")
    assert messages[-1].startswith("cleaned ")
    assert messages[-1].endswith(f"work files of {video}")


def test_series_ass_episode_is_staged_as_ass(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    worker, queue, video = _setup(tmp_path, monkeypatch, "ass", "tv/Show/Season 01/Show S01E02.mkv")

    _run(worker, queue, video, series_key="series:show")

    workspace = tmp_path / "data" / "series" / "show"
    assert sorted(p.name for p in (workspace / "episodes").iterdir()) == ["S01E02.ass"]
    assert (workspace / "out" / "S01E02.ko.ass").exists()
    assert (video.parent / "Show S01E02.ko.ass").exists()


def test_stop_during_extraction_defers_job(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    # 종료 요청으로 추출 도구를 끝내면 실패로 세지 않고 다음 기동 때 다시 처리한다 (WI-5.009b)
    worker, queue, video = _setup(tmp_path, monkeypatch, "srt", "movies/Movie.mkv")

    def cancelled_extract(*_args: Any, **_kwargs: Any) -> ExtractionResult:
        raise CommandCancelled("종료 요청으로 mkvextract 을 멈춤")

    monkeypatch.setattr("subtitle_robot.watch.worker.extract_subtitles", cancelled_extract)
    job = queue.enqueue(video)
    claimed = queue.claim(job.id)
    assert claimed is not None

    outcome = worker.process(claimed)

    assert outcome.status == "queued"
    after = queue.get(job.id)
    assert (after.status, after.attempts) == ("queued", 0)


def test_movie_work_files_are_cleaned_after_translation(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """번역이 끝나면 추출 트랙과 영화 작업 파일을 지우고 용어집·리포트는 남긴다 (WI-5.008c)."""
    worker, queue, video = _setup(tmp_path, monkeypatch, "srt", "movies/Movie.mkv")

    _run(worker, queue, video)

    workspace = tmp_path / "data" / "movies" / "movie"
    assert (video.parent / "Movie.ko.srt").exists()
    assert not (workspace / "extract" / "movie").exists()
    remaining = sorted(p.name for p in workspace.iterdir() if p.is_file())
    assert remaining == ["glossary.yaml", "report.json", "report.txt"]


def test_series_keeps_episode_records_and_cleans_tracks(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """시리즈는 추출 트랙만 지운다: 반복 대사·일관성 검사가 끝난 화의 파일을 다시 읽는다."""
    worker, queue, video = _setup(tmp_path, monkeypatch, "ass", "tv/Show/Season 01/Show S01E02.mkv")

    _run(worker, queue, video, series_key="series:show")

    workspace = tmp_path / "data" / "series" / "show"
    assert not (workspace / "extract" / "S01E02").exists()
    assert (workspace / "episodes" / "S01E02.ass").exists()
    assert (workspace / "out" / "S01E02.ko.ass").exists()
    assert (workspace / "work" / "S01E02" / "checkpoint.json").exists()
    assert (workspace / "glossary.yaml").exists()


def test_failed_job_keeps_work_files(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """실패한 작업의 파일은 진단용으로 남긴다."""
    worker, queue, video = _setup(tmp_path, monkeypatch, "srt", "movies/Movie.mkv")

    def broken(*_args: Any, **_kwargs: Any) -> Any:
        raise OSError("disk full")

    monkeypatch.setattr("subtitle_robot.watch.worker.translate_file", broken)
    job = queue.enqueue(video)
    claimed = queue.claim(job.id)
    assert claimed is not None
    assert worker.process(claimed).verdict is None  # 실패 (다시 시도할 대기)

    tracks = tmp_path / "data" / "movies" / "movie" / "extract" / "movie" / "tracks"
    assert (tracks / "track0.ass").exists()
