"""자막 검수 API (WI-7.009). 자막 픽스처는 직접 만든 텍스트다."""

import json
from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.config import AppConfig, WatchConfig, WatchPath, load_config
from subtitle_robot.io.parser import parse_srt
from subtitle_robot.media.sidecar import OutputFile, SidecarRecord, file_sha256
from subtitle_robot.watch.ledger import LedgerEntry
from subtitle_robot.web.review import MAX_TEXT_LENGTH, clean_text, state_path
from tests.web.conftest import WebEnv, make_env

ENGLISH = (
    "1\n00:00:01,000 --> 00:00:03,000\nThe harbor closes at midnight.\n\n"
    "2\n00:00:04,000 --> 00:00:06,500\nThen we leave now.\nGet the ship ready.\n\n"
    "3\n00:00:07,000 --> 00:00:09,000\nMira is waiting.\n"
)
KOREAN = (
    "1\n00:00:01,000 --> 00:00:03,000\n항구는 자정에 닫힙니다.\n\n"
    "2\n00:00:04,000 --> 00:00:06,500\n그럼 지금 떠나죠.\n배를 준비해요.\n\n"
    "3\n00:00:07,000 --> 00:00:09,000\n미라가 기다려요.\n"
)
EMBEDDED = {"order": 0, "track_id": 2, "language": "en", "codec": "S_TEXT/UTF8", "name": ""}


@pytest.fixture
def movies(tmp_path: Path) -> Path:
    folder = tmp_path / "media" / "movies"
    folder.mkdir(parents=True)
    return folder


@pytest.fixture
def api(tmp_path: Path, movies: Path) -> WebEnv:
    config: AppConfig = load_config(None).model_copy(
        update={"watch": WatchConfig(paths=[WatchPath(path=str(movies), kind="movie")])}
    )
    env = make_env(tmp_path, config=config)
    env.login()
    return env


def _translated(
    api: WebEnv,
    movies: Path,
    name: str = "Sea Lark (2026)",
    *,
    source_name: str | None = "en.srt",
    source_text: str = ENGLISH,
    source: dict[str, Any] | None = None,
) -> LedgerEntry:
    """번역된 영상 기록: 영상, 소스 사이드카, 번역 SRT."""
    video = movies / f"{name}.mkv"
    video.write_bytes(name.encode() * 50)
    korean = movies / f"{name}.ko.srt"
    korean.write_text(KOREAN, encoding="utf-8")
    outputs = [OutputFile(path=str(korean), sha256=file_sha256(korean))]
    if source_name is not None:
        extracted = movies / f"{name}.{source_name}"
        extracted.write_text(source_text, encoding="utf-8")
        outputs.insert(0, OutputFile(path=str(extracted), sha256=file_sha256(extracted)))
    return api.ledger.record(
        video,
        verdict="translated",
        reason="소스 트랙 #0",
        source=source or EMBEDDED,
        provider="gemini",
        sidecars=SidecarRecord(outputs=outputs),
    )


def _get(api: WebEnv, entry: LedgerEntry, **params: str) -> dict[str, Any]:
    response = api.client.get(f"/api/ledger/{entry.id}/review", params=params)
    assert response.status_code == 200, response.text
    body: dict[str, Any] = response.json()
    return body


def _put(api: WebEnv, entry: LedgerEntry, index: int, text: str) -> Any:
    return api.client.put(
        f"/api/ledger/{entry.id}/review",
        json={"name": f"{entry.path.stem}.ko.srt", "index": index, "text": text},
    )


def test_review_requires_login(tmp_path: Path) -> None:
    env = make_env(tmp_path)

    assert env.client.get("/api/ledger/1/review").status_code == 401
    assert env.client.put("/api/ledger/1/review", json={}).status_code == 401


def test_rows_pair_source_and_translation(api: WebEnv, movies: Path) -> None:
    entry = _translated(api, movies)

    body = _get(api, entry)

    assert (body["id"], body["video"], body["name"]) == (
        entry.id,
        "Sea Lark (2026).mkv",
        "Sea Lark (2026).ko.srt",
    )
    assert body["subtitles"] == ["Sea Lark (2026).ko.srt"]
    assert (body["source_name"], body["aligned"], body["edited"]) == (
        "Sea Lark (2026).en.srt",
        True,
        False,
    )
    assert [(r["index"], r["start"], r["end"], r["source"], r["text"]) for r in body["rows"]] == [
        (1, 1.0, 3.0, "The harbor closes at midnight.", "항구는 자정에 닫힙니다."),
        (2, 4.0, 6.5, "Then we leave now.\nGet the ship ready.", "그럼 지금 떠나죠.\n배를 준비해요."),
        (3, 7.0, 9.0, "Mira is waiting.", "미라가 기다려요."),
    ]
    assert all(not r["reviewed"] and not r["needs_review"] for r in body["rows"])


def test_ledger_marks_reviewable_entries(api: WebEnv, movies: Path) -> None:
    entry = _translated(api, movies)
    other = movies / "Other (2025).mkv"
    other.write_bytes(b"o" * 500)
    api.ledger.record(other, verdict="has_target", reason="내장 한국어 트랙")

    rows = {row["name"]: row["reviewable"] for row in api.client.get("/api/ledger").json()}

    assert rows == {entry.path.name: True, "Other (2025).mkv": False}
    unavailable = api.client.get(f"/api/ledger/{entry.id + 1}/review")
    assert (unavailable.status_code, unavailable.json()["detail"]) == (404, "review_unavailable")
    assert api.client.get("/api/ledger/999/review").json()["detail"] == "ledger_not_found"


def test_external_source_and_ass_source(api: WebEnv, movies: Path) -> None:
    """외부 자막 소스는 그 파일, ASS 소스는 Dialogue 를 블록으로 읽어 맞춘다."""
    external = _translated(
        api, movies, "Ext (2026)", source_name=None,
        source={"track_id": -1, "language": "en", "codec": "external.srt", "name": "Ext (2026).srt"},
    )  # fmt: skip
    (movies / "Ext (2026).srt").write_text(ENGLISH, encoding="utf-8")
    assert _get(api, external)["source_name"] == "Ext (2026).srt"

    ass = (
        "[Script Info]\nScriptType: v4.00+\n\n[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
        "Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,港は真夜中に閉まります。\n"
        "Dialogue: 0,0:00:04.00,0:00:06.50,Default,,0,0,0,,では出発しましょう。\n"
        "Dialogue: 0,0:00:07.00,0:00:09.00,Default,,0,0,0,,ミラが待っています。\n"
    )
    japanese = _translated(
        api, movies, "Anime - S01E01", source_name="ja.ass", source_text=ass,
        source={"order": 0, "track_id": 2, "language": "ja", "codec": "S_TEXT/ASS", "name": ""},
    )  # fmt: skip
    body = _get(api, japanese)
    assert (body["source_name"], body["aligned"]) == ("Anime - S01E01.ja.ass", True)
    assert [r["source"] for r in body["rows"]][0] == "港は真夜中に閉まります。"


def test_source_missing_or_different_block_count(api: WebEnv, movies: Path) -> None:
    missing = _translated(api, movies, "No Source (2026)", source_name=None)
    body = _get(api, missing)
    assert (body["source_name"], [r["source"] for r in body["rows"]]) == (None, ["", "", ""])

    shorter = "1\n00:00:04,000 --> 00:00:06,500\nOnly this line.\n"
    partial = _translated(api, movies, "Partial (2026)", source_text=shorter)
    body = _get(api, partial)
    assert body["aligned"] is False  # 블록 수가 달라 시작 시각으로 맞춘다
    assert [r["source"] for r in body["rows"]] == ["", "Only this line.", ""]


def test_report_flags_blocks_that_need_review(api: WebEnv, movies: Path) -> None:
    entry = _translated(api, movies)
    report = api.data / "movies" / "sea-lark-2026" / "report.json"
    report.parent.mkdir(parents=True)
    issue = {"code": "avoid_term", "severity": "error", "unit_id": "u2", "idx": 2, "detail": "타나카"}
    report.write_text(
        json.dumps({"needs_review": [2], "issues": [issue, issue]}), encoding="utf-8"
    )

    rows = _get(api, entry)["rows"]

    assert [r["needs_review"] for r in rows] == [False, True, False]
    assert rows[1]["notes"] == [{"code": "avoid_term", "severity": "error", "detail": "타나카"}]


def test_save_changes_only_that_block_and_marks_reviewed(api: WebEnv, movies: Path) -> None:
    entry = _translated(api, movies)
    korean = movies / "Sea Lark (2026).ko.srt"

    saved = _put(api, entry, 2, "  그럼 지금 떠납시다.  \n\n 배를 준비하세요. ")

    assert saved.status_code == 200
    assert (saved.json()["text"], saved.json()["reviewed"]) == (
        "그럼 지금 떠납시다.\n배를 준비하세요.",
        True,
    )
    blocks = parse_srt(korean.read_text(encoding="utf-8")).blocks
    assert [(b.number_line, b.timing_line) for b in blocks] == [
        ("1", "00:00:01,000 --> 00:00:03,000"),
        ("2", "00:00:04,000 --> 00:00:06,500"),
        ("3", "00:00:07,000 --> 00:00:09,000"),
    ]  # 번호·시각은 그대로 (SRT 구조 보존)
    assert [b.text for b in blocks] == [
        "항구는 자정에 닫힙니다.",
        "그럼 지금 떠납시다.\n배를 준비하세요.",
        "미라가 기다려요.",
    ]
    body = _get(api, entry)
    assert body["edited"] is True  # 처리 기록의 해시와 달라졌다
    assert [r["reviewed"] for r in body["rows"]] == [False, True, False]
    # 처음 번역은 처리 기록의 보관본에 남아 있다
    assert entry.archive is not None
    assert (entry.archive / "ko.srt").read_text(encoding="utf-8") == KOREAN


def test_saving_unchanged_text_only_marks_reviewed(api: WebEnv, movies: Path) -> None:
    entry = _translated(api, movies)
    korean = movies / "Sea Lark (2026).ko.srt"
    before = korean.stat().st_mtime_ns

    assert _put(api, entry, 1, "항구는 자정에 닫힙니다.").status_code == 200

    assert korean.stat().st_mtime_ns == before  # 파일을 다시 쓰지 않는다
    body = _get(api, entry)
    assert (body["edited"], body["rows"][0]["reviewed"]) == (False, True)
    assert json.loads(state_path(api.data, entry.id).read_text()) == {"Sea Lark (2026).ko.srt": [1]}


@pytest.mark.parametrize(
    ("index", "text", "status", "detail"),
    [
        (1, "  \n ", 400, "text_empty"),
        (1, "가" * (MAX_TEXT_LENGTH + 1), 400, "text_too_long"),
        (1, "00:00:01,000 --> 00:00:02,000", 400, "text_invalid"),
        (9, "없는 블록", 404, "block_not_found"),
    ],
)
def test_save_rejects(
    api: WebEnv, movies: Path, index: int, text: str, status: int, detail: str
) -> None:
    entry = _translated(api, movies)

    response = _put(api, entry, index, text)

    assert (response.status_code, response.json()["detail"]) == (status, detail)
    assert (movies / "Sea Lark (2026).ko.srt").read_text(encoding="utf-8") == KOREAN


def test_save_only_touches_translated_outputs_of_the_entry(api: WebEnv, movies: Path) -> None:
    """이름을 바꿔 다른 파일(소스 사이드카·경로 밖)을 고치지 못한다."""
    entry = _translated(api, movies)

    for name in ("Sea Lark (2026).en.srt", "../../etc/passwd", "Other.ko.srt"):
        response = api.client.put(
            f"/api/ledger/{entry.id}/review", json={"name": name, "index": 1, "text": "x"}
        )
        assert (response.status_code, response.json()["detail"]) == (404, "subtitle_not_found")
    assert (movies / "Sea Lark (2026).en.srt").read_text(encoding="utf-8") == ENGLISH


def test_missing_translated_file(api: WebEnv, movies: Path) -> None:
    entry = _translated(api, movies)
    (movies / "Sea Lark (2026).ko.srt").unlink()

    response = api.client.get(f"/api/ledger/{entry.id}/review")

    assert (response.status_code, response.json()["detail"]) == (404, "subtitle_not_found")


def test_clean_text_strips_lines_and_blank_lines() -> None:
    assert clean_text(" 첫 줄 \r\n\r\n 둘째 줄 ") == "첫 줄\n둘째 줄"


# ---------------------------------------------------------------- ASS 번역 출력

ASS_HEAD = (
    "[Script Info]\n; translated by Subtitle Robot\nScriptType: v4.00+\nPlayResX: 1920\n\n"
    "[V4+ Styles]\nFormat: Name, Fontname, Fontsize\nStyle: Default,Noto Sans,60\n\n"
    "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
)
JAPANESE_ASS = ASS_HEAD + (
    "Comment: 0,0:00:00.00,0:00:00.50,Default,,0,0,0,,メモ\n"
    "Dialogue: 0,0:00:04.00,0:00:06.50,Default,,0,0,0,,{\\an8}では出発しましょう。\\N船を用意して。\n"
    "Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,港は真夜中に閉まります。\n"
    "Dialogue: 0,0:00:07.00,0:00:09.00,Default,,0,0,0,,ミラが待っています。\n"
)
KOREAN_ASS = ASS_HEAD + (
    "Comment: 0,0:00:00.00,0:00:00.50,Default,,0,0,0,,メモ\n"
    "Dialogue: 0,0:00:04.00,0:00:06.50,Default,,0,0,0,,{\\an8}그럼 지금 떠나죠.\\N배를 준비해요.\n"
    "Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,항구는 자정에 닫힙니다.\n"
    "Dialogue: 0,0:00:07.00,0:00:09.00,Default,,0,0,0,,미라가 기다려요.\n"
)


def _translated_ass(api: WebEnv, movies: Path, *, with_srt: bool = False) -> LedgerEntry:
    """ASS 트랙을 네이티브 ASS 로 번역한 기록 (`output_format = "ass"`, both 면 SRT 도)."""
    name = "Anime - S01E02"
    video = movies / f"{name}.mkv"
    video.write_bytes(name.encode() * 50)
    files = {f"{name}.ja.ass": JAPANESE_ASS, f"{name}.ko.ass": "﻿" + KOREAN_ASS}
    if with_srt:
        files[f"{name}.ko.srt"] = KOREAN
    outputs = []
    for file_name, text in files.items():
        path = movies / file_name
        path.write_text(text, encoding="utf-8")
        outputs.append(OutputFile(path=str(path), sha256=file_sha256(path)))
    return api.ledger.record(
        video,
        verdict="translated",
        reason="소스 트랙 #0",
        source={"order": 0, "track_id": 2, "language": "ja", "codec": "S_TEXT/ASS", "name": ""},
        sidecars=SidecarRecord(outputs=outputs),
    )


def test_ass_output_is_reviewable_and_paired_by_dialogue(api: WebEnv, movies: Path) -> None:
    """번역 ASS: Dialogue 이벤트가 시작 시각 순서의 블록이다 (Comment 제외, 태그는 글자 그대로)."""
    entry = _translated_ass(api, movies)

    assert api.client.get("/api/ledger").json()[0]["reviewable"] is True
    body = _get(api, entry)

    assert (body["name"], body["subtitles"]) == ("Anime - S01E02.ko.ass", ["Anime - S01E02.ko.ass"])
    assert (body["source_name"], body["aligned"]) == ("Anime - S01E02.ja.ass", True)
    assert [(r["index"], r["start"], r["end"], r["source"], r["text"]) for r in body["rows"]] == [
        (1, 1.0, 3.0, "港は真夜中に閉まります。", "항구는 자정에 닫힙니다."),
        (
            2,
            4.0,
            6.5,
            "{\\an8}では出発しましょう。\n船を用意して。",
            "{\\an8}그럼 지금 떠나죠.\n배를 준비해요.",
        ),
        (3, 7.0, 9.0, "ミラが待っています。", "미라가 기다려요."),
    ]


def test_saving_ass_changes_only_that_dialogue_text(api: WebEnv, movies: Path) -> None:
    entry = _translated_ass(api, movies)
    korean = movies / "Anime - S01E02.ko.ass"
    name = korean.name

    saved = api.client.put(
        f"/api/ledger/{entry.id}/review",
        json={"name": name, "index": 2, "text": "{\\an8}그럼 지금 떠납시다.\n배를 준비하세요."},
    )

    assert saved.status_code == 200
    assert saved.json()["text"] == "{\\an8}그럼 지금 떠납시다.\n배를 준비하세요."
    after = korean.read_text(encoding="utf-8")
    expected = ("﻿" + KOREAN_ASS).replace(
        "{\\an8}그럼 지금 떠나죠.\\N배를 준비해요.", "{\\an8}그럼 지금 떠납시다.\\N배를 준비하세요."
    )
    assert after == expected  # 그 이벤트의 Text 만: BOM·스타일·Comment·다른 이벤트·줄 순서 그대로
    body = _get(api, entry)
    assert (body["edited"], [r["reviewed"] for r in body["rows"]]) == (True, [False, True, False])

    unchanged = korean.stat().st_mtime_ns
    assert (
        api.client.put(
            f"/api/ledger/{entry.id}/review",
            json={"name": name, "index": 1, "text": "항구는 자정에 닫힙니다."},
        ).status_code
        == 200
    )
    assert korean.stat().st_mtime_ns == unchanged  # 그대로면 다시 쓰지 않는다
    missing = api.client.put(
        f"/api/ledger/{entry.id}/review", json={"name": name, "index": 4, "text": "없는 블록"}
    )
    assert (missing.status_code, missing.json()["detail"]) == (404, "block_not_found")


def test_both_outputs_are_listed_and_edited_separately(api: WebEnv, movies: Path) -> None:
    """`output_format = "both"`: ASS 와 SRT 를 따로 고른다 (하나를 고쳐도 다른 하나는 그대로)."""
    entry = _translated_ass(api, movies, with_srt=True)

    body = _get(api, entry)
    assert body["subtitles"] == ["Anime - S01E02.ko.ass", "Anime - S01E02.ko.srt"]
    srt = _get(api, entry, name="Anime - S01E02.ko.srt")
    assert [r["text"] for r in srt["rows"]][0] == "항구는 자정에 닫힙니다."

    api.client.put(
        f"/api/ledger/{entry.id}/review",
        json={"name": "Anime - S01E02.ko.srt", "index": 1, "text": "항구는 자정에 닫혀요."},
    )
    assert (movies / "Anime - S01E02.ko.ass").read_text(encoding="utf-8") == "﻿" + KOREAN_ASS
