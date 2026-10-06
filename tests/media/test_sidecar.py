from pathlib import Path

import pytest

from subtitle_robot.media.sidecar import (
    RenameStyle,
    SidecarRecord,
    SidecarWriter,
    preserved_name,
    revert_sidecars,
)


def _snapshot(folder: Path) -> dict[str, str]:
    return {p.name: p.read_text(encoding="utf-8") for p in sorted(folder.iterdir())}


@pytest.fixture
def folder(tmp_path: Path) -> Path:
    (tmp_path / "Movie.mkv").write_text("video", encoding="utf-8")
    (tmp_path / "Movie.EN.srt").write_text("기존 영어", encoding="utf-8")
    (tmp_path / "Movie.en.orig.srt").write_text("이미 있던 orig", encoding="utf-8")
    (tmp_path / "Movie.srt").write_text("언어 없는 외부", encoding="utf-8")
    (tmp_path / "Movie.eng.srt").write_text("eng 외부", encoding="utf-8")
    return tmp_path


@pytest.mark.parametrize(
    ("name", "style", "number", "expected"),
    [
        ("Movie.en.srt", "orig", 1, "Movie.en.orig.srt"),
        ("Movie.en.srt", "orig", 2, "Movie.en.orig.2.srt"),
        ("Movie.en.srt", "backup", 1, "Movie.en.srt.orig"),
        ("Movie.en.srt", "backup", 3, "Movie.en.srt.orig.3"),
    ],
)
def test_preserved_name(name: str, style: RenameStyle, number: int, expected: str) -> None:
    assert preserved_name(Path(name), style, number).name == expected


def test_conflict_is_preserved_with_next_number(folder: Path) -> None:
    writer = SidecarWriter()

    written = writer.write_text(folder / "Movie.en.srt", "추출본")

    assert written == folder / "Movie.en.srt"
    files = _snapshot(folder)
    assert files["Movie.en.srt"] == "추출본"
    assert files["Movie.EN.orig.2.srt"] == "기존 영어"  # 대소문자 무시 충돌, 원래 대소문자 보존
    assert files["Movie.en.orig.srt"] == "이미 있던 orig"
    assert files["Movie.srt"] == "언어 없는 외부"  # 이름이 겹치지 않으면 그대로
    assert files["Movie.eng.srt"] == "eng 외부"
    assert [(r.original, r.renamed) for r in writer.record.renames] == [
        (str(folder / "Movie.EN.srt"), str(folder / "Movie.EN.orig.2.srt"))
    ]
    assert not [p for p in folder.iterdir() if p.name.endswith(".tmp")]


def test_backup_style_and_skip_policy(folder: Path) -> None:
    SidecarWriter(style="backup").write_text(folder / "Movie.en.srt", "추출본")
    assert (folder / "Movie.EN.srt.orig").read_text(encoding="utf-8") == "기존 영어"

    skipped = SidecarWriter(on_conflict="skip").write_text(folder / "Movie.en.srt", "다시")
    assert skipped is None
    assert (folder / "Movie.en.srt").read_text(encoding="utf-8") == "추출본"


def test_previous_output_is_replaced_not_preserved(folder: Path) -> None:
    first = SidecarWriter()
    first.write_text(folder / "Movie.en.srt", "추출본")
    first.write_text(folder / "Movie.ko.srt", "번역 1")

    again = SidecarWriter(previous=first.record)
    again.write_text(folder / "Movie.ko.srt", "번역 2")

    assert (folder / "Movie.ko.srt").read_text(encoding="utf-8") == "번역 2"
    assert not (folder / "Movie.ko.orig.srt").exists()
    assert len(again.record.renames) == 1  # 처음의 이름 변경을 이어받는다
    assert {Path(o.path).name for o in again.record.outputs} == {"Movie.en.srt", "Movie.ko.srt"}


def test_user_edited_output_counts_as_external(folder: Path) -> None:
    first = SidecarWriter()
    first.write_text(folder / "Movie.ko.srt", "번역 1")
    (folder / "Movie.ko.srt").write_text("사용자가 고침", encoding="utf-8")

    SidecarWriter(previous=first.record).write_text(folder / "Movie.ko.srt", "번역 2")

    assert (folder / "Movie.ko.orig.srt").read_text(encoding="utf-8") == "사용자가 고침"


def test_revert_restores_folder(folder: Path) -> None:
    before = _snapshot(folder)
    first = SidecarWriter()
    first.write_text(folder / "Movie.en.srt", "추출본")
    first.write_text(folder / "Movie.ko.srt", "번역")
    again = SidecarWriter(previous=first.record)
    again.write_text(folder / "Movie.en.srt", "추출본")  # 재처리

    record = SidecarRecord.model_validate_json(again.record.model_dump_json())  # ledger 왕복
    result = revert_sidecars(record)

    assert _snapshot(folder) == before
    assert {p.name for p in result.removed} == {"Movie.en.srt", "Movie.ko.srt"}
    assert [p.name for p in result.restored] == ["Movie.EN.srt"]


def test_revert_keeps_user_edits_and_reports_blocked_restore(folder: Path) -> None:
    writer = SidecarWriter()
    writer.write_text(folder / "Movie.en.srt", "추출본")
    (folder / "Movie.en.srt").write_text("사용자가 고침", encoding="utf-8")

    result = revert_sidecars(writer.record)

    assert result.kept_modified == [folder / "Movie.en.srt"]
    assert result.restored == []
    assert "자리에 다른 파일" in result.not_restored[0]
    assert (folder / "Movie.EN.orig.2.srt").exists()


def test_written_files_are_readable_by_others(tmp_path: Path) -> None:
    from subtitle_robot.io.atomic import atomic_write_text, default_file_mode

    written = SidecarWriter().write_text(tmp_path / "Movie.ko.srt", "x")
    atomic_write_text(tmp_path / "report.json", "{}")

    assert written is not None
    expected = default_file_mode()
    assert expected & 0o044  # 그룹·기타 읽기 (umask 022 기준 0644)
    assert written.stat().st_mode & 0o777 == expected  # mkstemp 의 0600 이 남지 않는다
    assert (tmp_path / "report.json").stat().st_mode & 0o777 == expected
