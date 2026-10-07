from collections.abc import Sequence
from pathlib import Path

import pytest

from subtitle_robot.media.commands import CommandResult, Runner
from subtitle_robot.media.extract import ExtractionError, extract_subtitles
from subtitle_robot.media.probe import ProbeResult
from subtitle_robot.media.tracks import SubtitleKind, SubtitleTrack

SRT = "1\n00:00:01,000 --> 00:00:02,000\nHello there, how are you?\n"


def _track(order: int, kind: SubtitleKind, language: str | None) -> SubtitleTrack:
    return SubtitleTrack(
        order=order,
        track_id=order + 2,
        codec=kind,
        kind=kind,
        language=language,
        language_raw=language or "und",
        name="",
        forced=False,
        default=False,
        hearing_impaired=False,
    )


def _writing_runner(calls: list[list[str]]) -> Runner:
    """mkvextract 처럼 `id:경로` 인자마다 SRT 를 쓴다."""

    def run(args: Sequence[str]) -> CommandResult:
        calls.append(list(args))
        for arg in args[4:]:
            Path(arg.split(":", 1)[1]).write_text(SRT, encoding="utf-8")
        return CommandResult(0, "", "")

    return run


def test_skips_image_and_other_languages(tmp_path: Path) -> None:
    calls: list[list[str]] = []
    probe = ProbeResult(
        tmp_path / "Movie.mkv",
        "mkv",
        (_track(0, "image", "en"), _track(1, "srt", "fr"), _track(2, "srt", "en")),
    )

    result = extract_subtitles(probe, tmp_path / "work", run=_writing_runner(calls))

    assert [s.reason for s in result.skipped] == ["이미지 자막 (OCR 은 판정 뒤 따로)", "언어 fr"]
    assert [(e.language, e.sidecar) for e in result.extracted] == [
        ("en", tmp_path / "Movie.en.srt")
    ]
    assert calls == [
        [
            "mkvextract",
            str(tmp_path / "Movie.mkv"),
            "tracks",
            "-q",
            f"4:{tmp_path / 'work' / 'tracks' / 'track2.srt'}",
        ]
    ]


def test_no_candidates_runs_nothing(tmp_path: Path) -> None:
    probe = ProbeResult(tmp_path / "a.mkv", "mkv", (_track(0, "image", "en"),))

    result = extract_subtitles(
        probe, tmp_path / "w", run=lambda _a: pytest.fail("실행하면 안 된다")
    )

    assert result.extracted == []


def test_existing_sidecar_is_not_overwritten(tmp_path: Path) -> None:
    existing = tmp_path / "Movie.EN.srt"
    existing.write_text("사용자 자막", encoding="utf-8")
    probe = ProbeResult(tmp_path / "Movie.mkv", "mkv", (_track(0, "srt", "en"),))

    result = extract_subtitles(probe, tmp_path / "work", run=_writing_runner([]))

    assert result.extracted[0].sidecar is None
    assert result.extracted[0].planned == tmp_path / "Movie.en.srt"
    assert existing.read_text(encoding="utf-8") == "사용자 자막"
    assert sorted(p.name for p in tmp_path.iterdir()) == ["Movie.EN.srt", "work"]  # 임시 파일 없음


@pytest.mark.parametrize(
    ("result", "message"),
    [
        (CommandResult(2, "", "Error: broken"), "broken"),
        (CommandResult(0, "", ""), "추출 결과가 없다"),
    ],
)
def test_tool_failures(tmp_path: Path, result: CommandResult, message: str) -> None:
    probe = ProbeResult(tmp_path / "a.mkv", "mkv", (_track(0, "srt", "en"),))

    with pytest.raises(ExtractionError, match=message):
        extract_subtitles(probe, tmp_path / "w", run=lambda _a: result)
