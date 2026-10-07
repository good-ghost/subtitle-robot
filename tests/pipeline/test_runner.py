import json
import re
from collections.abc import Callable
from pathlib import Path

import pytest

from subtitle_robot.checkpoint import StaleCheckpointError
from subtitle_robot.glossary.model import update_entry
from subtitle_robot.glossary.store import load_glossary, save_glossary
from subtitle_robot.io.parser import parse_srt
from subtitle_robot.llm.base import ChatRequest, ChatResult
from subtitle_robot.pipeline.runner import RunOptions, translate_file
from subtitle_robot.pipeline.style import StylePolicy
from tests.fake_llm import FakeAdapter

SRT = (
    "1\n00:00:01,000 --> 00:00:02,000\n{\\an8}田中さん、これ\n\n"
    "2\n00:00:03,000 --> 00:00:04,000\n佐藤さんの部屋に\n\n"
    "3\n00:00:04,100 --> 00:00:05,000\n届いてたよ。\n\n"
    "4\n00:00:06,000 --> 00:00:07,000\n本字幕由花語千夏字幕組共同製作\n\n"
    "5\n00:00:08,000 --> 00:00:09,000\n（笑）\n\n"
    "6\n00:00:10,000 --> 00:00:11,000\nありがとう。\n"
)
KO = {1: "타나카 상, 이거", 2: "사토 상 방에", 3: "와 있었어.", 5: "(웃음)", 6: "고마워."}
PASS1 = {
    "new_entities": [
        {"tmp": "n1", "type": "person", "source": "田中", "reading": "たなか", "origin": "japanese",
         "ko_suggestion": "다나카", "seen_suffixes": ["さん"], "first_seen": 1, "count": 1},
        {"tmp": "n2", "type": "person", "source": "佐藤", "reading": "さとう", "origin": "japanese",
         "ko_suggestion": "사토", "seen_suffixes": ["さん"], "first_seen": 2, "count": 1},
    ]
}  # fmt: skip


def _responder(fail_on_call: int | None = None) -> Callable[[ChatRequest], str]:
    calls = {"pass2": 0}

    def respond(request: ChatRequest) -> str:
        if request.schema_name == "pass1_output":
            return json.dumps(PASS1, ensure_ascii=False)
        calls["pass2"] += 1
        if fail_on_call is not None and calls["pass2"] == fail_on_call:
            raise RuntimeError("simulated crash")
        message = request.messages[-1].content
        match = re.search(r"<translate>\n(.*)\n</translate>", message, re.DOTALL)
        assert match
        units = [
            {
                "unit": u["unit"],
                "blocks": [{"idx": b["idx"], "ko": KO[b["idx"]]} for b in u["blocks"]],
            }
            for u in json.loads(match.group(1))["units"]
        ]
        return json.dumps({"units": units}, ensure_ascii=False)

    return respond


def _paths(tmp_path: Path) -> tuple[Path, Path, Path]:
    source = tmp_path / "ep.ja.srt"
    source.write_text(SRT, encoding="utf-8")
    return source, tmp_path / "ep.ko.srt", tmp_path / "work"


def _pass2_requests(adapter: FakeAdapter) -> int:
    return sum(1 for r in adapter.requests if r.schema_name == "pass2_output")


def test_first_run_translates_and_preserves_structure(tmp_path: Path) -> None:
    source, output, work = _paths(tmp_path)
    adapter = FakeAdapter(_responder())

    result = translate_file(source, output, work, adapter)

    blocks = parse_srt(output.read_text(encoding="utf-8")).blocks
    original = parse_srt(SRT).blocks
    assert [b.timing_line for b in blocks] == [b.timing_line for b in original]
    assert [b.text for b in blocks] == [
        "{\\an8}타나카 상, 이거",  # ASS 태그 복원 (Q-01)
        "사토 상 방에",
        "와 있었어.",
        "本字幕由花語千夏字幕組共同製作",  # 비원본 언어 블록은 원문 (Q-02)
        "(웃음)",
        "고마워.",
    ]
    assert result.src_lang == "ja"
    assert result.report.excluded == {"non_source_language": 1}
    assert result.report.glossary.added == {"n1": "E0001", "n2": "E0002"}
    glossary = load_glossary(work / "glossary.yaml")
    assert glossary.get("E0001").target == "타나카"  # 코드 음역 (common)
    for name in ("normalized.json", "units.json", "checkpoint.json", "report.json", "report.txt"):
        assert (work / name).exists()


def test_rerun_with_same_settings_makes_no_requests(tmp_path: Path) -> None:
    source, output, work = _paths(tmp_path)
    translate_file(source, output, work, FakeAdapter(_responder()))
    first = output.read_text(encoding="utf-8")

    adapter = FakeAdapter(_responder())
    result = translate_file(source, output, work, adapter)

    assert adapter.requests == []  # Pass 1 도, Pass 2 도 다시 하지 않는다
    assert result.reused_units == result.report.units
    assert output.read_text(encoding="utf-8") == first


def test_resume_after_crash_skips_finished_units(tmp_path: Path) -> None:
    source, output, work = _paths(tmp_path)
    options = RunOptions(max_batch_blocks=2)  # 배치를 여러 개로
    with pytest.raises(RuntimeError, match="simulated crash"):
        translate_file(source, output, work, FakeAdapter(_responder(fail_on_call=2)), options)

    adapter = FakeAdapter(_responder())
    result = translate_file(source, output, work, adapter, options)

    assert result.reused_units >= 1
    assert _pass2_requests(adapter) < result.report.units
    assert "고마워." in output.read_text(encoding="utf-8")


def test_style_change_is_stale_by_default(tmp_path: Path) -> None:
    source, output, work = _paths(tmp_path)
    translate_file(source, output, work, FakeAdapter(_responder()))
    changed = RunOptions(style=StylePolicy(honorifics_policy="translate"))

    with pytest.raises(StaleCheckpointError, match="style_hash"):
        translate_file(source, output, work, FakeAdapter(_responder()), changed)


def test_redo_and_accept_policies(tmp_path: Path) -> None:
    source, output, work = _paths(tmp_path)
    translate_file(source, output, work, FakeAdapter(_responder()))
    style = StylePolicy(honorifics_policy="translate")

    redo = FakeAdapter(_responder())
    redo_result = translate_file(source, output, work, redo, RunOptions(style=style, resume="redo"))
    assert _pass2_requests(redo) >= 1
    assert redo_result.stale_units == redo_result.report.units

    accept = FakeAdapter(_responder())
    translate_file(source, output, work, accept, RunOptions(resume="accept"))
    assert _pass2_requests(accept) == 0


def test_entity_rev_change_is_entities_stale(tmp_path: Path) -> None:
    source, output, work = _paths(tmp_path)
    translate_file(source, output, work, FakeAdapter(_responder()))
    glossary_file = work / "glossary.yaml"
    glossary = update_entry(load_glossary(glossary_file), "E0001", origin="user", target="다나카")
    save_glossary(glossary, glossary_file)

    with pytest.raises(StaleCheckpointError) as info:
        translate_file(source, output, work, FakeAdapter(_responder()))

    assert any("(entities)" in line and "E0001" in line for line in info.value.details)


def test_changed_source_starts_over(tmp_path: Path) -> None:
    source, output, work = _paths(tmp_path)
    translate_file(source, output, work, FakeAdapter(_responder()))
    source.write_text(SRT.replace("ありがとう。", "ありがとう！"), encoding="utf-8")

    adapter = FakeAdapter(_responder())
    result = translate_file(source, output, work, adapter)

    assert any(r.schema_name == "pass1_output" for r in adapter.requests)
    assert result.reused_units == 0
    assert any(i["kind"] == "checkpoint_discarded" for i in result.report.input_issues)


def test_pass1_failure_does_not_stop(tmp_path: Path) -> None:
    source, output, work = _paths(tmp_path)

    def respond(request: ChatRequest) -> str:
        if request.schema_name == "pass1_output":
            return "not json"
        return _responder()(request)

    result = translate_file(source, output, work, FakeAdapter(respond))

    assert any(i["kind"] == "pass1_failed" for i in result.report.input_issues)
    assert output.exists()


class _AliasAdapter(FakeAdapter):
    """요청은 별칭(`sonnet`)으로 하고 응답은 실제 모델을 알려 주는 구독 CLI 를 흉내 낸다."""

    def chat(self, request: ChatRequest) -> ChatResult:
        return super().chat(request).model_copy(update={"model": "claude-sonnet-4-6"})


def test_report_records_the_served_model_but_resume_keeps_the_request(tmp_path: Path) -> None:
    """리포트는 실제 모델을 남기고, fingerprint 는 요청 모델이라 재실행이 요청 없이 끝난다."""
    source, output, work = _paths(tmp_path)
    adapter = _AliasAdapter(_responder(), model="sonnet")

    first = translate_file(source, output, work, adapter)
    again = _AliasAdapter(_responder(), model="sonnet")
    second = translate_file(source, output, work, again)

    assert first.report.served_models == ["claude-sonnet-4-6"]
    assert first.report.model.startswith("sonnet")
    assert again.requests == []
    assert second.report.model == first.report.model


def test_progress_is_reported_per_batch(tmp_path: Path) -> None:
    """대기열 화면의 "번역 중 (n/m)" (WI-7.004c): 배치마다 끝낸 블록 / 전체 블록."""
    source, output, work = _paths(tmp_path)
    calls: list[tuple[int, int]] = []
    options = RunOptions(
        max_batch_blocks=2, progress=lambda done, total: calls.append((done, total))
    )

    translate_file(source, output, work, FakeAdapter(_responder()), options)

    assert {total for _, total in calls} == {6}
    done = [d for d, _ in calls]
    assert done == sorted(done)
    assert done[0] < 6
    assert done[-1] == 6
    assert len(calls) >= 3  # 시작 + 배치 2개 이상

    calls.clear()  # 다시 실행: 모두 재사용이라 처음부터 끝
    translate_file(source, output, work, FakeAdapter(_responder()), options)
    assert calls == [(6, 6)]


def test_progress_callback_is_not_part_of_the_fingerprint(tmp_path: Path) -> None:
    """진행 함수가 달라도 설정이 바뀐 것으로 보지 않는다 (resume 그대로)."""
    source, output, work = _paths(tmp_path)
    translate_file(source, output, work, FakeAdapter(_responder()))
    adapter = FakeAdapter(_responder())

    translate_file(source, output, work, adapter, RunOptions(progress=lambda _d, _t: None))

    assert _pass2_requests(adapter) == 0
