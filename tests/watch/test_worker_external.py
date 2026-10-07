"""내장 자막이 없는 영상을 외부 자막(SRT·SAMI)으로 번역 (WI-5.004b).

검사·추출은 가짜로 바꾸고 번역 파이프라인은 그대로 돈다. 자막 픽스처는 직접 만든 텍스트다.
"""

from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.config import AppConfig, WatchConfig, WatchPath, load_config
from subtitle_robot.io.parser import parse_srt
from subtitle_robot.media.extract import ExtractionResult
from subtitle_robot.media.probe import ProbeResult
from subtitle_robot.media.tracks import SubtitleTrack
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.queue import JobQueue
from subtitle_robot.watch.state import state_path
from subtitle_robot.watch.worker import MediaWorker
from tests.fake_llm import FakeAdapter
from tests.io.test_sami import SAMI
from tests.media.test_external import ENGLISH_ONLY_SAMI, ENGLISH_SRT
from tests.series.test_runner import _respond

EMBEDDED = SubtitleTrack(
    order=0, track_id=2, codec="S_TEXT/UTF8", kind="srt", language="en", language_raw="eng",
    name="", forced=False, default=True, hearing_impaired=False,
)  # fmt: skip


class Env:
    def __init__(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        self.movies = tmp_path / "media" / "movies"
        self.movies.mkdir(parents=True)
        self.tracks: tuple[SubtitleTrack, ...] = ()

        def fake_probe(path: Path, **_kwargs: Any) -> ProbeResult:
            return ProbeResult(path, "mkv", self.tracks)

        def fake_extract(result: ProbeResult, _work_dir: Path, **_kwargs: Any) -> ExtractionResult:
            return ExtractionResult(result.path)  # 내장 트랙은 소스로 쓰지 않는다

        monkeypatch.setattr("subtitle_robot.watch.worker.probe", fake_probe)
        monkeypatch.setattr("subtitle_robot.watch.worker.extract_subtitles", fake_extract)
        config: AppConfig = load_config(None).model_copy(
            update={
                "watch": WatchConfig(
                    enabled=False, paths=[WatchPath(path=str(self.movies), kind="movie")]
                )
            }
        )
        data = tmp_path / "data"
        self.queue = JobQueue(state_path(data))
        self.ledger = Ledger(state_path(data), data, hash_bytes=64)
        self.adapter = FakeAdapter(_respond)
        self.worker = MediaWorker(
            config, queue=self.queue, ledger=self.ledger, data_dir=data, adapter=self.adapter
        )

    def video(self, name: str = "Sea Lark (2026).mkv") -> Path:
        path = self.movies / name
        path.write_bytes(name.encode() * 100)  # 내용이 같으면 처리 기록이 같은 영상으로 본다
        return path

    def run(self, video: Path, **kwargs: Any) -> Any:
        job = self.queue.enqueue(video, **kwargs)
        claimed = self.queue.claim(job.id)
        assert claimed is not None
        return self.worker.process(claimed)


@pytest.fixture
def env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Env:
    return Env(tmp_path, monkeypatch)


def test_external_srt_is_translated_when_no_embedded_subtitles(env: Env) -> None:
    video = env.video()
    (env.movies / "Sea Lark (2026).en.srt").write_text(ENGLISH_SRT, encoding="utf-8")

    outcome = env.run(video)

    assert (outcome.status, outcome.verdict) == ("done", "translated")
    output = env.movies / "Sea Lark (2026).ko.srt"
    assert [b.text for b in parse_srt(output.read_text(encoding="utf-8")).blocks] == [
        "번역",
        "번역",
    ]
    entry = env.ledger.find(video)
    assert entry is not None
    assert entry.reason.startswith("외부 자막 Sea Lark (2026).en.srt (en) — 내장 텍스트 자막 없음")
    assert entry.source is not None
    assert entry.source["track_id"] == -1


def test_korean_sami_is_converted_and_counts_as_target(env: Env) -> None:
    """한국어가 든 SAMI: 언어별 SRT 로 바꾸고, 한국어 자막이 있으므로 번역하지 않는다."""
    video = env.video()
    (env.movies / "Sea Lark (2026).smi").write_bytes(SAMI.encode("cp949"))

    outcome = env.run(video)

    assert outcome.verdict == "has_target"
    assert outcome.reason == "외부 자막 Sea Lark (2026).smi (내용 한국어)"
    names = sorted(path.name for path in outcome.outputs)
    assert names == ["Sea Lark (2026).en.srt", "Sea Lark (2026).ko.srt"]
    korean = parse_srt((env.movies / "Sea Lark (2026).ko.srt").read_text(encoding="utf-8"))
    assert korean.blocks[0].text == "안녕하세요, 선장님.\n오늘 항구가 닫힌다고 합니다."
    assert env.adapter.requests == []


def test_english_sami_is_converted_then_translated(env: Env) -> None:
    video = env.video()
    (env.movies / "Sea Lark (2026).smi").write_text(ENGLISH_ONLY_SAMI, encoding="utf-8")

    outcome = env.run(video)

    assert outcome.verdict == "translated"
    assert sorted(path.name for path in outcome.outputs) == [
        "Sea Lark (2026).en.srt",
        "Sea Lark (2026).ko.srt",
    ]
    assert "외부 자막 Sea Lark (2026).en.srt" in outcome.reason  # 바꾼 SRT 가 소스다


def test_backlog_skips_external_only_with_embedded_text(env: Env) -> None:
    """백로그: 외부 자막이 있어도 내장 텍스트 자막이 없으면 번역하고, 있으면 지금처럼 건너뛴다."""
    plain = env.video("Plain (2026).mkv")
    (env.movies / "Plain (2026).en.srt").write_text(ENGLISH_SRT, encoding="utf-8")
    assert env.run(plain, priority="backlog").verdict == "translated"

    env.tracks = (EMBEDDED,)
    embedded = env.video("Embedded (2026).mkv")
    (env.movies / "Embedded (2026).en.srt").write_text(ENGLISH_SRT, encoding="utf-8")
    skipped = env.run(embedded, priority="backlog")
    assert (skipped.status, skipped.verdict) == ("skipped", "has_external")
    assert skipped.reason == "외부 자막 Embedded (2026).en.srt"
