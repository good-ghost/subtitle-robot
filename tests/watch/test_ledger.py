import os
import shutil
from pathlib import Path

import pytest

from subtitle_robot.cli import EXIT_OK, EXIT_USAGE, main
from subtitle_robot.media.sidecar import SidecarRecord, SidecarWriter
from subtitle_robot.watch.identity import content_id
from subtitle_robot.watch.ledger import Ledger, LedgerError
from subtitle_robot.watch.state import state_path

HASH_BYTES = 16


class FakeClock:
    def __init__(self) -> None:
        self.now = 1_000.0

    def __call__(self) -> float:
        self.now += 1
        return self.now


@pytest.fixture
def data(tmp_path: Path) -> Path:
    return tmp_path / "data"


@pytest.fixture
def ledger(data: Path) -> Ledger:
    return Ledger(state_path(data), data, hash_bytes=HASH_BYTES, clock=FakeClock())


def _video(folder: Path, name: str = "Movie (2020).mkv", body: bytes = b"") -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / name
    path.write_bytes(body or bytes(range(256)) * 4)
    return path


def _translate(video: Path) -> SidecarRecord:
    writer = SidecarWriter()
    writer.write_text(
        video.with_name(f"{video.stem}.en.srt"), "1\n00:00:01,000 --> 00:00:02,000\nHi\n"
    )
    writer.write_text(
        video.with_name(f"{video.stem}.ko.srt"), "1\n00:00:01,000 --> 00:00:02,000\n안녕\n"
    )
    return writer.record


def test_content_id_reads_only_head_and_tail(tmp_path: Path) -> None:
    path = _video(tmp_path)
    before = content_id(path, hash_bytes=HASH_BYTES)
    data = bytearray(path.read_bytes())

    data[500] ^= 0xFF  # 가운데: 읽지 않는 부분
    path.write_bytes(bytes(data))
    assert content_id(path, hash_bytes=HASH_BYTES) == before
    data[3] ^= 0xFF  # 앞부분
    path.write_bytes(bytes(data))
    assert content_id(path, hash_bytes=HASH_BYTES) != before
    with pytest.raises(ValueError, match="양수"):
        content_id(path, hash_bytes=0)


def test_new_then_same_and_mtime_only_change(ledger: Ledger, tmp_path: Path) -> None:
    video = _video(tmp_path / "media")
    assert ledger.lookup(video).kind == "new"

    entry = ledger.record(video, verdict="translated", sidecars=_translate(video), provider="nim")
    assert entry.settled
    assert ledger.lookup(video).kind == "same"
    os.utime(video, ns=(1, 1))  # 내용은 그대로, 수정 시각만 바뀜

    again = ledger.lookup(video)

    assert again.kind == "same"
    assert again.entry is not None
    assert again.entry.mtime_ns == 1


def test_moved_video_restores_outputs_without_translation(ledger: Ledger, tmp_path: Path) -> None:
    video = _video(tmp_path / "downloads")
    ledger.record(video, verdict="translated", sidecars=_translate(video))
    moved = tmp_path / "library" / "Movie (2020)" / "Movie.2020.1080p.mkv"
    moved.parent.mkdir(parents=True)
    video.rename(moved)  # 관리 도구가 영상만 옮기고 이름을 바꿨다

    lookup = ledger.lookup(moved)
    assert lookup.kind == "moved"
    entry = ledger.relocate(lookup, moved)

    assert sorted(p.name for p in moved.parent.iterdir()) == [
        "Movie.2020.1080p.en.srt", "Movie.2020.1080p.ko.srt", "Movie.2020.1080p.mkv",
    ]  # fmt: skip
    assert "안녕" in (moved.parent / "Movie.2020.1080p.ko.srt").read_text(encoding="utf-8")
    assert entry.path == moved
    assert {Path(o.path).name for o in entry.sidecars.outputs} == {
        "Movie.2020.1080p.en.srt", "Movie.2020.1080p.ko.srt",
    }  # fmt: skip
    assert ledger.find(video) is None
    assert ledger.lookup(moved).kind == "same"


def test_restore_keeps_existing_files(ledger: Ledger, tmp_path: Path) -> None:
    video = _video(tmp_path / "a")
    ledger.record(video, verdict="translated", sidecars=_translate(video))
    target = tmp_path / "b"
    target.mkdir()
    shutil.move(video.with_name("Movie (2020).en.srt"), target / "Movie (2020).en.srt")  # 같이 옮김
    (target / "Movie (2020).KO.srt").write_text("사용자 자막", encoding="utf-8")
    moved = target / video.name
    video.rename(moved)

    entry = ledger.relocate(ledger.lookup(moved), moved)

    assert (target / "Movie (2020).KO.srt").read_text(encoding="utf-8") == "사용자 자막"
    korean = [p.name for p in target.iterdir() if p.name.casefold().endswith(".ko.srt")]
    assert korean == ["Movie (2020).KO.srt"]  # 대소문자만 다른 사용자 파일이 있으면 복원하지 않는다
    assert [Path(o.path).name for o in entry.sidecars.outputs] == ["Movie (2020).en.srt"]


def test_copied_video_keeps_both_records(ledger: Ledger, tmp_path: Path) -> None:
    video = _video(tmp_path / "seeding")
    ledger.record(video, verdict="translated", sidecars=_translate(video))
    copy = _video(tmp_path / "library", body=video.read_bytes())

    lookup = ledger.lookup(copy)
    assert lookup.kind == "copied"
    ledger.relocate(lookup, copy)

    assert {e.path for e in ledger.entries()} == {video, copy}
    assert (copy.parent / "Movie (2020).ko.srt").exists()


def test_changed_content_is_new_video_and_keeps_history(ledger: Ledger, tmp_path: Path) -> None:
    video = _video(tmp_path / "media")
    ledger.record(video, verdict="has_korean", reason="외부 자막 Movie.ko.srt")
    video.write_bytes(b"new release" * 100)

    lookup = ledger.lookup(video)
    assert lookup.kind == "changed"
    ledger.record(video, verdict="no_source", identity=lookup.content_id)

    assert [e.verdict for e in ledger.entries()] == ["no_source"]
    history = ledger.entries(include_history=True)
    assert [(e.verdict, e.current) for e in history] == [("has_korean", False), ("no_source", True)]


def test_forget_makes_video_new(ledger: Ledger, tmp_path: Path) -> None:
    video = _video(tmp_path / "media")
    ledger.record(video, verdict="image_only")

    assert ledger.forget(video) == 1
    assert ledger.lookup(video).kind == "new"


def test_export_import_round_trip(ledger: Ledger, tmp_path: Path) -> None:
    video = _video(tmp_path / "media")
    ledger.record(video, verdict="translated", sidecars=_translate(video), source={"order": 0})
    rows = ledger.export_rows()
    other_data = tmp_path / "other"
    other = Ledger(state_path(other_data), other_data, hash_bytes=HASH_BYTES)

    assert other.import_rows(rows) == 1
    assert other.import_rows(rows) == 0  # 두 번 가져와도 한 번
    copied = other.find(video)
    assert copied is not None
    assert (copied.verdict, copied.source) == ("translated", {"order": 0})
    assert other.lookup(video).kind == "same"
    with pytest.raises(LedgerError, match="열이 없다"):
        other.import_rows([{"path": "x"}])
    with pytest.raises(LedgerError, match="판정"):
        other.import_rows([{**rows[0], "verdict": "maybe", "path": "/other"}])


def test_relocate_requires_moved_or_copied(ledger: Ledger, tmp_path: Path) -> None:
    video = _video(tmp_path)
    with pytest.raises(LedgerError, match="이동"):
        ledger.relocate(ledger.lookup(video), video)


def test_ledger_cli(
    ledger: Ledger, data: Path, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    video = _video(tmp_path / "media")
    ledger.record(
        video, verdict="translated", sidecars=_translate(video), provider="nim", model="m"
    )
    base = ["--data", str(data), "ledger"]

    assert main([*base, "list"]) == EXIT_OK
    assert "translated" in capsys.readouterr().out
    assert main([*base, "show", str(video)]) == EXIT_OK
    shown = capsys.readouterr().out
    assert "공급자: nim (m)" in shown
    assert "Movie (2020).ko.srt" in shown
    exported = tmp_path / "ledger.json"
    assert main([*base, "export", str(exported)]) == EXIT_OK
    assert main([*base, "forget", str(video)]) == EXIT_OK
    assert main([*base, "forget", str(video)]) == EXIT_USAGE
    assert main([*base, "show", str(video)]) == EXIT_USAGE
    assert main([*base, "import", str(exported)]) == EXIT_OK
    assert "가져온 기록: 1건" in capsys.readouterr().out
