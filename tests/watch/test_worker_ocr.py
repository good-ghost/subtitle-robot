"""텍스트 자막이 없는 영상을 이미지 자막 OCR 로 번역 (WI-5.004c).

검사·추출·Tesseract 는 가짜로 바꾸고 번역 파이프라인은 그대로 돈다.
"""

from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.config import AppConfig, MediaConfig, WatchConfig, WatchPath, load_config
from subtitle_robot.io.parser import parse_srt
from subtitle_robot.media.commands import CommandResult
from subtitle_robot.media.extract import ExtractionResult
from subtitle_robot.media.probe import ProbeResult
from subtitle_robot.media.tracks import SubtitleTrack
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.queue import JobQueue
from subtitle_robot.watch.state import state_path
from subtitle_robot.watch.worker import MediaWorker
from tests.fake_llm import FakeAdapter
from tests.ocr.encoders import FakeTesseract, encode_pgs, glyph
from tests.ocr.test_ocr_source import ENGLISH
from tests.series.test_runner import _respond

PGS = encode_pgs([(1000, 3000, [glyph(40)]), (4000, 6000, [glyph(60)])])
PGS_TRACK = SubtitleTrack(
    order=0, track_id=3, codec="S_HDMV/PGS", kind="image", language="en", language_raw="eng",
    name="", forced=False, default=True, hearing_impaired=False,
)  # fmt: skip


class Env:
    def __init__(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, *, ocr: bool) -> None:
        self.movies = tmp_path / "media" / "movies"
        self.movies.mkdir(parents=True)
        self.tracks: tuple[SubtitleTrack, ...] = ()

        def fake_probe(path: Path, **_kwargs: Any) -> ProbeResult:
            return ProbeResult(path, "mkv", self.tracks)

        def fake_extract(result: ProbeResult, _work_dir: Path, **_kwargs: Any) -> ExtractionResult:
            return ExtractionResult(result.path)

        monkeypatch.setattr("subtitle_robot.watch.worker.probe", fake_probe)
        monkeypatch.setattr("subtitle_robot.watch.worker.extract_subtitles", fake_extract)
        monkeypatch.setattr("subtitle_robot.watch.worker.tesseract_available", lambda: True)
        base = load_config(None)
        config: AppConfig = base.model_copy(
            update={
                "watch": WatchConfig(
                    enabled=False, paths=[WatchPath(path=str(self.movies), kind="movie")]
                ),
                "media": MediaConfig(ocr=ocr, ocr_workers=2),
            }
        )
        data = tmp_path / "data"
        self.queue = JobQueue(state_path(data))
        self.ledger = Ledger(state_path(data), data, hash_bytes=64)
        self.adapter = FakeAdapter(_respond)
        self.worker = MediaWorker(
            config, queue=self.queue, ledger=self.ledger, data_dir=data, adapter=self.adapter
        )
        self.tesseract = FakeTesseract(ENGLISH)
        self.extracted: list[list[str]] = []
        self.worker._ocr_run = self.tesseract
        self.worker._extract_run = self._mkvextract

    def _mkvextract(self, args: Any) -> CommandResult:
        self.extracted.append(list(args))
        Path(args[-1].split(":", 1)[1]).write_bytes(PGS)
        return CommandResult(0, "", "")

    def video(self, name: str = "Sea Lark (2026).mkv") -> Path:
        path = self.movies / name
        path.write_bytes(name.encode() * 100)
        return path

    def run(self, video: Path) -> Any:
        job = self.queue.enqueue(video)
        claimed = self.queue.claim(job.id)
        assert claimed is not None
        return self.worker.process(claimed)


def test_external_pgs_is_read_then_translated(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    env = Env(tmp_path, monkeypatch, ocr=True)
    video = env.video()
    (env.movies / "Sea Lark (2026).en.sup").write_bytes(PGS)

    outcome = env.run(video)

    assert (outcome.status, outcome.verdict) == ("done", "translated")
    assert outcome.reason.startswith("OCR Sea Lark (2026).en.sup (그림 2장 → 자막 2개)")
    assert sorted(path.name for path in outcome.outputs) == [
        "Sea Lark (2026).en.srt",  # 읽은 결과도 사이드카로 남긴다
        "Sea Lark (2026).ko.srt",
    ]
    english = parse_srt((env.movies / "Sea Lark (2026).en.srt").read_text(encoding="utf-8"))
    assert [b.text for b in english.blocks] == list(ENGLISH.values())
    korean = parse_srt((env.movies / "Sea Lark (2026).ko.srt").read_text(encoding="utf-8"))
    assert [b.timing_line for b in korean.blocks] == [
        "00:00:01,000 --> 00:00:03,000",
        "00:00:04,000 --> 00:00:06,000",
    ]
    entry = env.ledger.find(video)
    assert entry is not None
    assert entry.source is not None
    assert entry.source["ocr"] is True
    assert env.extracted == []  # 외부 파일은 뽑지 않는다


def test_embedded_pgs_track_is_extracted_and_read(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    env = Env(tmp_path, monkeypatch, ocr=True)
    env.tracks = (PGS_TRACK,)
    video = env.video()

    outcome = env.run(video)

    assert outcome.verdict == "translated"
    assert outcome.reason.startswith("OCR 트랙 #0 (S_HDMV/PGS, en)")
    assert env.extracted[0][-1].startswith("3:")
    assert (env.movies / "Sea Lark (2026).en.srt").is_file()


def test_ocr_off_keeps_image_only(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    env = Env(tmp_path, monkeypatch, ocr=False)
    env.tracks = (PGS_TRACK,)

    outcome = env.run(env.video())

    assert (outcome.verdict, outcome.reason) == ("image_only", "이미지 자막만 있음 (OCR 꺼짐)")
    assert env.tesseract.calls == []


def test_ocr_without_tesseract_notes_reason(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    env = Env(tmp_path, monkeypatch, ocr=True)
    monkeypatch.setattr("subtitle_robot.watch.worker.tesseract_available", lambda: False)
    env.tracks = (PGS_TRACK,)

    outcome = env.run(env.video())

    assert outcome.verdict == "image_only"
    assert outcome.reason == (
        "이미지 자막만 있음 — OCR 켜짐, tesseract 없음 (ocr 이미지 태그 필요)"
    )


def test_fixed_ocr_sidecar_is_used_when_processed_again(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """사용자가 OCR 결과를 고치고 다시 처리하면 고친 파일(외부 자막)로 번역하고 다시 읽지 않는다."""
    env = Env(tmp_path, monkeypatch, ocr=True)
    env.tracks = (PGS_TRACK,)
    video = env.video()
    env.run(video)
    sidecar = env.movies / "Sea Lark (2026).en.srt"
    sidecar.write_text(
        sidecar.read_text(encoding="utf-8").replace("captain", "Captain Mira"), encoding="utf-8"
    )
    calls = len(env.tesseract.ocr_calls)

    job = env.queue.enqueue(video, force=True)
    claimed = env.queue.claim(job.id)
    assert claimed is not None
    outcome = env.worker.process(claimed)

    assert outcome.verdict == "translated"
    assert outcome.reason.startswith("외부 자막 Sea Lark (2026).en.srt (en)")
    assert len(env.tesseract.ocr_calls) == calls
    assert "Captain Mira" in sidecar.read_text(encoding="utf-8")  # 고친 파일은 그대로
