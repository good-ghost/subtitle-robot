"""미디어 소스 트랙 선택·대상 언어 판정 (PROJECT-PLAN §26.6, WI-8.006).

검사·추출·원어 조회는 가짜로 바꾸고 번역 파이프라인은 그대로 돈다.
"""

from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.config import AppConfig, TranslationConfig, WatchConfig, WatchPath, load_config
from subtitle_robot.media.extract import ExtractedTrack, ExtractionResult
from subtitle_robot.media.probe import ProbeResult
from subtitle_robot.media.tmdb import OriginLanguage, OriginLanguageResolver
from subtitle_robot.media.tracks import SubtitleTrack
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.queue import JobQueue
from subtitle_robot.watch.state import state_path
from subtitle_robot.watch.worker import JobOutcome, MediaWorker
from tests.fake_llm import FakeAdapter
from tests.series.test_runner import _respond

LINES = {
    "en": "Where are you going?",
    "ja": "どこ行くの？",
    "de": "Wohin gehst du?",
    "ko": "어디 가?",
}


class StubOrigins(OriginLanguageResolver):
    """정해 둔 원어를 돌려주고 요청을 기록한다."""

    def __init__(self, language: str | None) -> None:
        super().__init__(None, Path("/nonexistent"))
        self.language = language
        self.calls: list[tuple[str, Path, str]] = []

    def resolve(self, kind: Any, video: Path, title: str) -> OriginLanguage:
        self.calls.append((kind, video, title))
        return OriginLanguage(self.language, "tmdb:movie/1" if self.language else "not_found")


class Env:
    def __init__(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, languages: list[str | None],
        *, target: str = "ko", origin: str | None = None,
    ) -> None:  # fmt: skip
        media = tmp_path / "media"
        self.video = media / "movies" / "Movie.mkv"
        self.video.parent.mkdir(parents=True)
        self.video.write_bytes(b"video" * 100)
        self.tracks = tuple(
            SubtitleTrack(
                order=n,
                track_id=n + 2,
                codec="S_TEXT/UTF8",
                kind="srt",
                language=lang,
                language_raw=lang or "und",
                name="",
                forced=False,
                default=n == 0,
                hearing_impaired=False,
            )
            for n, lang in enumerate(languages)
        )
        self.extract_calls: list[dict[str, Any]] = []
        work = tmp_path / "extracted"
        work.mkdir()

        def fake_probe(path: Path, **_kwargs: Any) -> ProbeResult:
            return ProbeResult(path, "mkv", self.tracks)

        def fake_extract(result: ProbeResult, work_dir: Path, **kwargs: Any) -> ExtractionResult:
            self.extract_calls.append(kwargs)
            extracted = []
            for track in self.tracks:
                language = track.language or "de"  # 언어 미지정 트랙은 내용으로 de 라고 본다
                if language not in kwargs["langs"] and track.order not in kwargs["always"]:
                    continue
                srt = work / f"track{track.order}.srt"
                srt.write_text(
                    f"1\n00:00:01,000 --> 00:00:02,000\n{LINES[language]}\n", encoding="utf-8"
                )
                planned = result.path.with_name(f"{result.path.stem}.{language}.srt")
                extracted.append(ExtractedTrack(track, language, None, planned, srt))
            return ExtractionResult(result.path, extracted)

        monkeypatch.setattr("subtitle_robot.watch.worker.probe", fake_probe)
        monkeypatch.setattr("subtitle_robot.watch.worker.extract_subtitles", fake_extract)
        config: AppConfig = load_config(None).model_copy(
            update={
                "translation": TranslationConfig(target_language=target),
                "watch": WatchConfig(
                    enabled=False, paths=[WatchPath(path=str(media / "movies"), kind="movie")]
                ),
            }
        )
        self.data = tmp_path / "data"
        self.queue = JobQueue(state_path(self.data))
        self.ledger = Ledger(state_path(self.data), self.data, hash_bytes=64)
        self.origins = StubOrigins(origin)
        self.adapter = FakeAdapter(_respond)
        self.worker = MediaWorker(
            config, queue=self.queue, ledger=self.ledger, data_dir=self.data,
            adapter=self.adapter, origin_resolver=self.origins,
        )  # fmt: skip

    def run(self) -> JobOutcome:
        job = self.queue.enqueue(self.video)
        claimed = self.queue.claim(job.id)
        assert claimed is not None
        return self.worker.process(claimed)

    def source_text(self) -> str:
        pass2 = [r for r in self.adapter.requests if r.schema_name == "pass2_output"]
        return pass2[0].messages[-1].content


def test_original_language_track_is_the_source(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    env = Env(tmp_path, monkeypatch, ["en", "ja"], origin="ja")

    outcome = env.run()

    assert outcome.verdict == "translated"
    assert "소스 트랙 #1 (ja" in outcome.reason
    assert "원어 트랙 (원어 ja, tmdb:movie/1)" in outcome.reason
    assert LINES["ja"] in env.source_text()
    assert env.origins.calls == [("movie", env.video, "Movie")]
    call = env.extract_calls[0]
    assert "ja" in call["langs"]
    assert call["always"] == (0,)  # 첫 후보 트랙
    assert (env.video.parent / "Movie.ko.srt").exists()


def test_english_track_when_original_track_is_missing(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """원어 트랙이 없으면 첫 트랙보다 영어 트랙 (§26.6, WI-8.006b)."""
    env = Env(tmp_path, monkeypatch, ["de", "en"], origin="fr")

    outcome = env.run()

    assert "소스 트랙 #1 (en" in outcome.reason
    assert "영어 트랙 (원어 fr" in outcome.reason
    assert {"fr", "en"} <= set(env.extract_calls[0]["langs"])


def test_first_track_without_original_or_english(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    env = Env(tmp_path, monkeypatch, ["de", "ja"], origin="fr")

    outcome = env.run()

    assert "소스 트랙 #0 (de" in outcome.reason
    assert "첫 트랙 (원어 fr" in outcome.reason


def test_unlabelled_first_track_is_extracted_and_used(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """언어 표시 없는 첫 트랙은 설정 언어 밖이어도 뽑아 내용으로 판별한다 (원어를 모름).

    영어 트랙이 없어야 첫 트랙을 쓴다 (영어가 있으면 영어, WI-8.006b).
    """
    env = Env(tmp_path, monkeypatch, [None, "ja"])

    outcome = env.run()

    assert "소스 트랙 #0 (de" in outcome.reason
    assert "첫 트랙 (원어 모름, not_found)" in outcome.reason
    assert LINES["de"] in env.source_text()


def test_target_language_track_means_no_translation(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    env = Env(tmp_path, monkeypatch, ["ja", "en"], target="en", origin="ja")

    outcome = env.run()

    assert outcome.verdict == "has_target"
    assert outcome.reason == "내장 English(en) 트랙 #1 (S_TEXT/UTF8)"
    assert env.adapter.requests == []
    assert env.ledger.find(env.video) is not None


def test_other_target_output_and_work_folder(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    env = Env(tmp_path, monkeypatch, ["ja"], target="fr", origin="ja")

    outcome = env.run()

    assert outcome.verdict == "translated"
    assert [p.name for p in outcome.outputs] == ["Movie.fr.srt"]
    assert not (env.video.parent / "Movie.ko.srt").exists()
    work = env.data / "movies" / "movie" / "work-fr"
    # 번역이 끝나면 작업 파일은 지우고 대상 언어의 용어집·리포트는 남긴다 (WI-5.008c)
    assert (work / "glossary.yaml").exists()
    assert (work / "report.json").exists()
    assert not (work / "out.fr.srt").exists()
    assert not (work / "checkpoint.json").exists()
    pass2 = [r for r in env.adapter.requests if r.schema_name == "pass2_output"]
    assert "(Japanese -> French)" in pass2[0].messages[0].content


def test_legacy_has_korean_record_is_settled(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    env = Env(tmp_path, monkeypatch, ["en"])
    env.ledger.record(env.video, verdict="has_korean", reason="외부 자막 Movie.ko.srt")

    outcome = env.run()

    assert (outcome.status, outcome.verdict) == ("skipped", "has_korean")
    assert env.extract_calls == []
