import json
import re
from pathlib import Path
from typing import Any

import pytest

from subtitle_robot.cli import EXIT_OK, main
from subtitle_robot.llm.base import ChatRequest
from subtitle_robot.series.lint import lint_series
from subtitle_robot.series.phrases import (
    EpisodeLines,
    PhraseBook,
    collect_phrases,
    load_phrases,
    save_phrases,
)
from subtitle_robot.series.retranslate import retranslate_series
from subtitle_robot.series.runner import run_series
from subtitle_robot.series.workspace import SeriesWorkspace, init_series
from tests.fake_llm import FakeAdapter

KO = {
    "いただきます": "잘 먹겠습니다",
    "いただきます！": "잘 먹겠습니다!",
    "今日は雨だ": "오늘은 비다",
    "明日は晴れ": "내일은 맑음",
    "また会おう": "또 보자",
}
EPISODES = {
    "S01E01": ["今日は雨だ", "いただきます"],
    "S01E02": ["いただきます！", "明日は晴れ"],
    "S01E03": ["いただきます", "また会おう"],
}


def _respond(request: ChatRequest) -> str:
    if request.schema_name == "pass1_output":
        return json.dumps({"new_entities": []})
    message = request.messages[-1].content
    match = re.search(r"<translate>\n(.*)\n</translate>", message, re.DOTALL)
    assert match
    units = json.loads(match.group(1))["units"]
    reply: dict[str, Any] = {
        "units": [
            {
                "unit": u["unit"],
                "blocks": [{"idx": b["idx"], "ko": KO[b["src"]]} for b in u["blocks"]],
            }
            for u in units
        ]
    }
    return json.dumps(reply, ensure_ascii=False)


def _series(tmp_path: Path) -> SeriesWorkspace:
    root = tmp_path / "Show"
    root.mkdir()
    for key, lines in EPISODES.items():
        blocks = "\n".join(
            f"{n}\n00:00:{n * 10:02d},000 --> 00:00:{n * 10 + 2:02d},000\n{line}\n"
            for n, line in enumerate(lines, start=1)
        )
        (root / f"Show.{key}.srt").write_text(blocks, encoding="utf-8")
    workspace, _ = init_series(root, "ja")
    return workspace


def _phrase_sections(adapter: FakeAdapter) -> list[str | None]:
    found: list[str | None] = []
    for request in adapter.requests:
        if request.schema_name == "pass2_output":
            match = re.search(
                r'<phrases context_only="true">\n(.*?)\n</phrases>',
                request.messages[-1].content,
                re.DOTALL,
            )
            found.append(match.group(1) if match else None)
    return found


def test_repeated_line_is_collected_and_used_in_later_episode(tmp_path: Path) -> None:
    workspace = _series(tmp_path)
    adapter = FakeAdapter(_respond)

    run_series(workspace, adapter)

    book = load_phrases(workspace.phrases_path)
    assert [(p.id, p.src, p.target, p.status, p.episodes) for p in book.phrases] == [
        ("P0001", "いただきます", "잘 먹겠습니다", "auto", ["S01E01", "S01E02", "S01E03"])
    ]
    assert _phrase_sections(adapter) == [None, None, "いただきます → 잘 먹겠습니다"]

    again = FakeAdapter(_respond)
    run_series(workspace, again)
    assert again.requests == []  # 수집 전에 번역한 화는 stale 이 아니다


def test_phrase_edit_retranslates_only_units_that_used_it(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    workspace = _series(tmp_path)
    run_series(workspace, FakeAdapter(_respond))
    root = str(workspace.root)

    assert main(["series", "review", root, "--phrase-set", "P0001=잘 먹겠습니다!!"]) == EXIT_OK
    assert "rev 2" in capsys.readouterr().out
    result = retranslate_series(workspace, FakeAdapter(_respond))

    assert result.retranslated == {"S01E03": 1}
    assert main(["series", "review", root, "--phrases"]) == EXIT_OK
    assert "[확정] P0001 いただきます → 잘 먹겠습니다!!" in capsys.readouterr().out


def test_lint_warns_when_locked_phrase_not_used(tmp_path: Path) -> None:
    workspace = _series(tmp_path)
    run_series(workspace, FakeAdapter(_respond))
    main(["series", "review", str(workspace.root), "--phrase-accept", "P0001"])
    assert [i for i in lint_series(workspace).issues if i.code == "phrase_not_used"] == []
    output = workspace.out_dir / "S01E01.ko.srt"
    output.write_text(
        output.read_text(encoding="utf-8").replace("잘 먹겠습니다", "감사히 먹을게"),
        encoding="utf-8",
    )

    issues = [i for i in lint_series(workspace).issues if i.code == "phrase_not_used"]

    assert [(i.episode, i.idx, i.severity) for i in issues] == [("S01E01", 2, "warning")]


def test_collect_rules() -> None:
    book = PhraseBook()
    episodes = [
        EpisodeLines(
            "S01E01",
            "ja",
            [("はい", "네"), ("ブルノ", "브루노"), ("あ", "아"), ("長" * 50, "길다")],
        ),
        EpisodeLines(
            "S01E02",
            "ja",
            [("はい", "예"), ("ブルノ", "브루노"), ("あ", "아"), ("長" * 50, "길다")],
        ),
        EpisodeLines("S01E03", "en", [("Yes", "네")]),
    ]

    result = collect_phrases(
        book, episodes, min_episodes=2, min_chars=2, max_chars=40, skip={"ブルノ"}.__contains__
    )

    assert [(p.src, p.target) for p in book.phrases] == [
        ("はい", "네")
    ]  # 첫 번역, 이름·짧은·긴 줄 제외
    assert result.added == ["P0001"]
    book.phrases[0].target = "사람이 고친 번역"
    collect_phrases(book, episodes, min_episodes=2, min_chars=2, max_chars=40)
    assert book.phrases[0].target == "사람이 고친 번역"  # first-wins
    assert book.phrases[0].rev == 1


def test_disabled_phrases(tmp_path: Path) -> None:
    workspace = _series(tmp_path)
    path = workspace.settings_path
    path.write_text(
        path.read_text(encoding="utf-8").replace(
            "[phrases]\nenabled = true", "[phrases]\nenabled = false"
        ),
        encoding="utf-8",
    )
    adapter = FakeAdapter(_respond)

    run_series(workspace, adapter)

    assert not (workspace.root / "phrases.yaml").exists()
    assert _phrase_sections(adapter) == [None, None, None]


def test_phrase_matches_whole_line_only(tmp_path: Path) -> None:
    from subtitle_robot.io.normalize import normalize_srt
    from subtitle_robot.pipeline.context import ContextBuilder, PhraseHint
    from subtitle_robot.pipeline.style import StylePolicy
    from subtitle_robot.pipeline.unitizer import unitize

    srt = (
        "1\n00:00:01,000 --> 00:00:02,000\nいただきますよ、本当に\n\n"
        "2\n00:00:09,000 --> 00:00:10,000\nいただきます！\n"
    )
    doc = normalize_srt(srt.encode("utf-8"), source_path="t.srt")
    plan = unitize(doc, "ja")
    hint = PhraseHint("P0001", "いただきます", "잘 먹겠습니다", 1)
    builder = ContextBuilder(doc, plan, [], "ja", StylePolicy(), phrases=[hint])

    assert builder.entity_revs((1,)) == {}  # 문장 속에 들어 있을 뿐이면 넣지 않는다
    assert builder.entity_revs((2,)) == {"PHR:P0001": 1}


def test_legacy_ko_field_loads_and_saves_as_target(tmp_path: Path) -> None:
    """0.6.0 전 phrases.yaml 의 ko 필드를 읽고 저장하면 target 으로 쓴다 (§26.5)."""
    path = tmp_path / "phrases.yaml"
    path.write_text(
        "schema_version: 1\nphrases:\n"
        "- {id: P0001, src: いただきます, ko: 잘 먹겠습니다, status: locked, rev: 2,"
        " src_lang: ja, episodes: [S01E01, S01E02]}\n",
        encoding="utf-8",
    )
    book = load_phrases(path)

    assert book.phrases[0].target == "잘 먹겠습니다"
    save_phrases(book, path)
    text = path.read_text(encoding="utf-8")
    assert "target: 잘 먹겠습니다" in text
    assert "ko:" not in text
    assert load_phrases(path) == book
