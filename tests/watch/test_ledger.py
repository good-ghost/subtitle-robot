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


def test_shelved_record_still_counts_as_processed(ledger: Ledger, tmp_path: Path) -> None:
    """보관(WI-7.010): 목록에서만 빠지고 처리한 것으로 보는 판정은 그대로다."""
    kept = ledger.record(_video(tmp_path / "media", "A.mkv", b"a" * 500), verdict="translated")
    video = _video(tmp_path / "media", "B.mkv", b"b" * 500)
    entry = ledger.record(video, verdict="translated", sidecars=_translate(video))

    shelved = ledger.shelve(entry.id)

    assert shelved.shelved is True
    assert [e.id for e in ledger.entries(shelved=False)] == [kept.id]
    assert [e.id for e in ledger.entries(shelved=True)] == [entry.id]
    assert len(ledger.entries()) == 2
    assert ledger.lookup(video).kind == "same"  # 다시 처리하지 않는다
    # 옮긴 영상은 같은 기록이라 보관 표시가 따라간다
    moved = video.rename(tmp_path / "media" / "B moved.mkv")
    assert ledger.relocate(ledger.lookup(moved), moved).shelved is True
    # 되돌리기
    assert ledger.shelve(entry.id, False).shelved is False
    with pytest.raises(LedgerError):
        ledger.shelve(9999)


def test_reprocessing_a_shelved_video_shows_it_again(ledger: Ledger, tmp_path: Path) -> None:
    """재작업(기록을 지우고 다시 처리, 또는 다시 기록)한 영상은 새 기록이라 보관 상태가 아니다."""
    video = _video(tmp_path / "media")
    ledger.shelve(ledger.record(video, verdict="translated").id)

    again = ledger.record(video, verdict="translated")

    assert again.shelved is False
    assert [e.id for e in ledger.entries(shelved=False)] == [again.id]
    ledger.shelve(again.id)
    assert ledger.forget(video) == 2
    assert ledger.lookup(video).kind == "new"


def test_schema_2_database_gets_the_shelved_column(tmp_path: Path) -> None:
    """0.8.6 까지의 상태 DB(스키마 2)를 열면 보관 열이 생기고 기록은 보관되지 않은 상태다."""
    import sqlite3

    from subtitle_robot.watch import state

    path = state_path(tmp_path / "data")
    path.parent.mkdir(parents=True)
    old = sqlite3.connect(path, isolation_level=None)
    for number, script in enumerate(state._MIGRATIONS[:2], start=1):
        old.executescript(f"BEGIN; {script} PRAGMA user_version = {number}; COMMIT;")
    old.execute(
        "INSERT INTO media_ledger (content_id, path, size, mtime_ns, verdict, processed_at, "
        "updated_at) VALUES ('c1', '/m/a.mkv', 1, 1, 'translated', 1, 1)"
    )
    old.close()

    ledger = Ledger(path, tmp_path / "data", hash_bytes=HASH_BYTES)

    entries = ledger.entries()
    assert [(e.path.name, e.shelved) for e in entries] == [("a.mkv", False)]
    assert ledger.shelve(entries[0].id).shelved is True


def test_import_rows_exported_before_shelving(ledger: Ledger, tmp_path: Path) -> None:
    video = _video(tmp_path / "media")
    ledger.shelve(ledger.record(video, verdict="translated").id)
    rows = ledger.export_rows()
    assert rows[0]["shelved"] == 1
    legacy = [{key: value for key, value in rows[0].items() if key != "shelved"}]
    other_data = tmp_path / "other"
    other = Ledger(state_path(other_data), other_data, hash_bytes=HASH_BYTES)

    assert other.import_rows(legacy) == 1  # 보관 열이 없는 예전 파일

    found = other.find(video)
    assert found is not None
    assert found.shelved is False


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
