import json
from pathlib import Path

from subtitle_robot.analysis.merger import MergeReport
from subtitle_robot.analysis.schema import Conflict
from subtitle_robot.io.normalize import normalize_srt
from subtitle_robot.pipeline.report import (
    ReportBuilder,
    model_display,
    render_summary,
    save_report,
)
from subtitle_robot.pipeline.schema import NewTerm
from subtitle_robot.pipeline.translator import BatchResponse
from subtitle_robot.pipeline.unitizer import unitize
from subtitle_robot.pipeline.validator import BatchOutcome, Issue

SRT = (
    "Title\n\n"
    "1\n00:00:01,000 --> 00:00:02,000\nHello,\n\n"
    "2\n00:00:02,100 --> 00:00:03,000\nworld.\n\n"
    "3\n00:00:04,000 --> 00:00:05,000\n\n\n"
    "4\n00:00:06,000 --> 00:00:07,000\nBye.\n"
)


def _response(prompt: int, completion: int, model: str = "m") -> BatchResponse:
    return BatchResponse(None, None, "", model, prompt, completion, 1.5, 1)


def _builder() -> ReportBuilder:
    doc = normalize_srt(SRT.encode("utf-8"), source_path="movie.en.srt")
    return ReportBuilder(doc, unitize(doc, "en"), "en")


def _outcome() -> BatchOutcome:
    return BatchOutcome(
        batch_id="B001",
        translations={1: "안녕,", 2: "세상.", 4: "잘 가."},
        issues=[
            Issue("residual_source", "error", "U2", 4, "plenty"),
            Issue("line_too_long", "warning", "U1", 1, "25자"),
            Issue("line_too_long", "warning", "U1", 2, "24자"),
        ],
        needs_review={4},
        new_terms=[NewTerm(src="Kowalski", type="person", ko_suggestion="코왈스키")],
        responses=[_response(100, 20), _response(50, 10)],
    )


def test_report_aggregates_batches() -> None:
    builder = _builder()
    builder.set_run_info(
        provider="nim", model="deepseek", prompt_versions={"pass2": "pass2.en@1"}, style_hash="abc"
    )
    builder.add_batch(_outcome())
    builder.add_merge(
        MergeReport(
            added={"n1": "E0001"},
            conflicts=[Conflict(entity_id="E1", current_ko="a", suggested_ko="b")],
        )
    )

    report = builder.build(output_path="movie.ko.srt")

    assert (report.blocks, report.translated_blocks, report.units, report.batches) == (4, 3, 2, 1)
    assert report.excluded == {"empty": 1}
    assert report.needs_review == [4]
    assert (report.errors, report.warnings) == (1, 2)
    assert report.issue_counts == {"line_too_long": 2, "residual_source": 1}
    assert report.usage.requests == 2
    assert (report.usage.prompt_tokens, report.usage.completion_tokens) == (150, 30)
    assert report.glossary.added == {"n1": "E0001"}
    assert report.new_terms == [{"src": "Kowalski", "type": "person", "suggestion": "코왈스키"}]
    assert report.input_issues[0]["kind"] == "leading_text"


def test_save_report_writes_json_and_summary(tmp_path: Path) -> None:
    builder = _builder()
    builder.add_batch(_outcome())
    report = builder.build()
    target = tmp_path / "report.json"

    save_report(report, target)

    data = json.loads(target.read_text(encoding="utf-8"))
    assert data["schema_version"] == 1
    assert data["needs_review"] == [4]
    summary = (tmp_path / "report.txt").read_text(encoding="utf-8")
    assert "검토 필요 블록 (1): 4" in summary
    assert "error 1, warning 2" in summary


def test_summary_of_clean_run() -> None:
    report = _builder().build()

    text = render_summary(report)

    assert "error 0, warning 0" in text
    assert "검토 필요" not in text


def test_served_model_is_shown_when_it_differs_from_the_request() -> None:
    """구독 별칭(`sonnet`)이 실제 어떤 모델로 처리됐는지 남긴다 (WI-10.009h)."""
    builder = _builder()
    builder.set_run_info(
        provider="claude",
        model="sonnet (subscription)",
        prompt_versions={},
        style_hash="abc",
        requested_model="sonnet",
    )
    builder.observe_model("claude-sonnet-4-6")  # Pass 1
    outcome = _outcome()
    outcome.responses = [_response(1, 1, "claude-sonnet-4-6"), _response(1, 1, "sonnet")]
    builder.add_batch(outcome)

    report = builder.build()

    assert report.model == "sonnet (subscription)"  # fingerprint 와 같은 요청 기준
    assert report.served_models == ["claude-sonnet-4-6"]
    assert model_display(report) == "claude-sonnet-4-6 [sonnet (subscription)]"
    assert "공급자: claude (claude-sonnet-4-6 [sonnet (subscription)])" in render_summary(report)


def test_served_model_equal_to_request_is_not_repeated() -> None:
    builder = _builder()
    builder.set_run_info(
        provider="gemini",
        model="gemini-3.5-flash",
        prompt_versions={},
        style_hash="abc",
        requested_model="gemini-3.5-flash",
    )
    outcome = _outcome()
    outcome.responses = [_response(1, 1, "gemini-3.5-flash")]
    builder.add_batch(outcome)

    report = builder.build()

    assert report.served_models == []
    assert model_display(report) == "gemini-3.5-flash"
