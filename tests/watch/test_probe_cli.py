"""`subtitle-robot probe` 표시: 이 도구의 출력은 외부 한국어 자막으로 보지 않는다."""

from pathlib import Path

import pytest

from subtitle_robot.cli import EXIT_OK, main
from subtitle_robot.media.probe import ProbeResult
from subtitle_robot.media.sidecar import SidecarWriter
from subtitle_robot.media.tracks import SubtitleTrack
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.state import state_path

KO = "1\n00:00:01,000 --> 00:00:02,000\n안녕하세요, 오늘 날씨가 좋네요\n"


def test_probe_does_not_report_own_output_as_external(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    video = tmp_path / "media" / "Movie.mkv"
    video.parent.mkdir()
    video.write_bytes(b"video" * 100)
    track = SubtitleTrack(
        order=0, track_id=1, codec="S_TEXT/ASS", kind="ass", language="ja", language_raw="jpn",
        name="", forced=False, default=True, hearing_impaired=False,
    )  # fmt: skip
    monkeypatch.setattr("subtitle_robot.cli.probe", lambda path: ProbeResult(path, "mkv", (track,)))
    data = tmp_path / "data"
    writer = SidecarWriter()
    writer.write_text(video.with_name("Movie.ko.srt"), KO)
    Ledger(state_path(data), data, hash_bytes=64).record(
        video, verdict="translated", sidecars=writer.record
    )
    (video.parent / "Movie.en.srt").write_text("1\n00:00:01,000 --> 00:00:02,000\nHi\n", "utf-8")

    assert main(["--data", str(data), "probe", str(video)]) == EXIT_OK
    printed = capsys.readouterr().out

    assert "자막 있음" not in printed
    assert "이 도구의 출력: Movie.ko.srt" in printed
    assert "외부 자막: Movie.en.srt" in printed
    assert "처리 기록: translated" in printed

    video.with_name("Movie.ko.srt").write_text(KO + "\n", encoding="utf-8")  # 사용자가 고침
    assert main(["--data", str(data), "probe", str(video)]) == EXIT_OK
    assert "대상 언어(ko) 자막 있음: 외부 자막 Movie.ko.srt" in capsys.readouterr().out
