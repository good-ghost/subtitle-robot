"""번역 리포트 `report.json` 과 사람이 읽는 요약 (PROJECT-PLAN §11.2, WI-3.009).

배치 결과(BatchOutcome)를 모아 문서 하나의 리포트를 만든다. needs_review 블록, 코드별 error·warning,
용어집 병합 결과, 새 용어, LLM 사용량, 입력 정규화 이슈를 담는다.
"""

from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from subtitle_robot.analysis.merger import MergeReport
from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.io.normalize import NormalizedDocument
from subtitle_robot.lang.codes import DEFAULT_TARGET
from subtitle_robot.pipeline.unitizer import UnitPlan
from subtitle_robot.pipeline.validator import BatchOutcome

REPORT_SCHEMA_VERSION: Literal[1] = 1


class ReportIssue(BaseModel):
    """리포트의 검사 결과 하나."""

    model_config = ConfigDict(frozen=True)

    code: str
    severity: Literal["error", "warning"]
    unit_id: str | None
    idx: int | None
    detail: str


class GlossarySummary(BaseModel):
    """Pass 1 병합 결과 요약."""

    added: dict[str, str] = Field(default_factory=dict)
    variants_added: dict[str, list[str]] = Field(default_factory=dict)
    conflicts: list[dict[str, str]] = Field(default_factory=list)
    low_confidence: list[str] = Field(default_factory=list)
    llm_fallbacks: list[str] = Field(default_factory=list)
    rejected: list[str] = Field(default_factory=list)


class Usage(BaseModel):
    """LLM 사용량."""

    requests: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    latency_s: float = 0.0


class TranslationReport(BaseModel):
    """문서 하나의 번역 리포트 (`report.json`)."""

    schema_version: Literal[1] = REPORT_SCHEMA_VERSION
    source_path: str
    output_path: str = ""
    src_lang: str
    # 0.6.0 전 리포트에는 없다 (한국어 번역, §26.1)
    target_lang: str = DEFAULT_TARGET
    provider: str = ""
    model: str = ""
    # 응답이 알려 준 실제 모델 중 요청한 모델과 다른 것 (구독 별칭 `sonnet` → 실제 모델 등).
    # fingerprint 는 요청 기준(`model`)이라 이어 번역 판정에는 쓰지 않는다 (WI-10.009h)
    served_models: list[str] = Field(default_factory=list)
    prompt_versions: dict[str, str] = Field(default_factory=dict)
    style_hash: str = ""
    blocks: int = 0
    translated_blocks: int = 0
    units: int = 0
    batches: int = 0
    excluded: dict[str, int] = Field(default_factory=dict)
    needs_review: list[int] = Field(default_factory=list)
    errors: int = 0
    warnings: int = 0
    issue_counts: dict[str, int] = Field(default_factory=dict)
    issues: list[ReportIssue] = Field(default_factory=list)
    input_issues: list[dict[str, Any]] = Field(default_factory=list)
    glossary: GlossarySummary = Field(default_factory=GlossarySummary)
    new_terms: list[dict[str, str]] = Field(default_factory=list)
    usage: Usage = Field(default_factory=Usage)


class ReportBuilder:
    """번역 진행 중 결과를 모아 리포트를 만든다."""

    def __init__(
        self,
        doc: NormalizedDocument,
        plan: UnitPlan,
        src_lang: str,
        target_lang: str = DEFAULT_TARGET,
    ) -> None:
        """리포트 틀을 만든다."""
        excluded = Counter(plan.excluded.values())
        self._report = TranslationReport(
            source_path=doc.source_path,
            src_lang=src_lang,
            target_lang=target_lang,
            blocks=len(doc.blocks),
            translated_blocks=sum(len(unit.idxs) for unit in plan.units),
            units=len(plan.units),
            excluded=dict(sorted(excluded.items())),
            input_issues=[issue.model_dump(mode="json") for issue in doc.issues],
        )
        self._needs_review: set[int] = set()
        self._new_terms: dict[str, dict[str, str]] = {}
        self._requested_model = ""
        self._served_models: list[str] = []

    def set_run_info(
        self,
        *,
        provider: str,
        model: str,
        prompt_versions: dict[str, str],
        style_hash: str,
        requested_model: str = "",
    ) -> None:
        """공급자·모델·프롬프트 버전·스타일 해시.

        Args:
            model: 기록용 모델 이름 (fingerprint 와 같다, 컨텍스트 크기가 붙을 수 있다).
            requested_model: 요청에 넣은 모델. 응답의 실제 모델이 이와 다를 때만 남긴다.
        """
        self._report.provider = provider
        self._report.model = model
        self._requested_model = requested_model
        self._report.prompt_versions = dict(prompt_versions)
        self._report.style_hash = style_hash

    def add_merge(self, merge: MergeReport) -> None:
        """Pass 1 병합 결과."""
        self._report.glossary = GlossarySummary(
            added=dict(merge.added),
            variants_added={k: list(v) for k, v in merge.variants_added.items()},
            conflicts=[conflict.model_dump() for conflict in merge.conflicts],
            low_confidence=list(merge.low_confidence),
            llm_fallbacks=list(merge.llm_fallbacks),
            rejected=list(merge.rejected),
        )

    def add_usage(
        self, *, prompt_tokens: int | None, completion_tokens: int | None, latency_s: float
    ) -> None:
        """LLM 요청 하나의 사용량."""
        usage = self._report.usage
        usage.requests += 1
        usage.prompt_tokens += prompt_tokens or 0
        usage.completion_tokens += completion_tokens or 0
        usage.latency_s = round(usage.latency_s + latency_s, 3)

    def add_batch(self, outcome: BatchOutcome) -> None:
        """배치 결과."""
        self._report.batches += 1
        for response in outcome.responses:
            self.observe_model(response.model)
            self.add_usage(
                prompt_tokens=response.prompt_tokens,
                completion_tokens=response.completion_tokens,
                latency_s=response.latency_s,
            )
        self._report.issues.extend(
            ReportIssue(
                code=issue.code,
                severity=issue.severity,
                unit_id=issue.unit_id,
                idx=issue.idx,
                detail=issue.detail,
            )
            for issue in outcome.issues
        )
        self._needs_review.update(outcome.needs_review)
        for term in outcome.new_terms:
            self._new_terms.setdefault(term.src, term.model_dump())

    def add_record(self, record: Any) -> None:
        """체크포인트에서 재사용한 unit 의 needs_review·issues (리포트가 문서 전체를 반영하게)."""
        self._needs_review.update(record.needs_review)
        self._report.issues.extend(ReportIssue.model_validate(issue) for issue in record.issues)

    def add_note(self, kind: str, detail: str) -> None:
        """실행 중 알림 (Pass 1 실패, 체크포인트 폐기 등)."""
        self._report.input_issues.append(
            {"kind": kind, "idx": None, "line_no": None, "detail": detail}
        )

    def observe_model(self, model: str | None) -> None:
        """응답이 알려 준 실제 모델을 기록한다 (처음 본 순서)."""
        if model and model not in self._served_models:
            self._served_models.append(model)

    def build(self, output_path: str = "") -> TranslationReport:
        """리포트를 완성한다."""
        report = self._report.model_copy(deep=True)
        report.output_path = output_path
        report.needs_review = sorted(self._needs_review)
        report.issue_counts = dict(sorted(Counter(issue.code for issue in report.issues).items()))
        report.errors = sum(1 for issue in report.issues if issue.severity == "error")
        report.warnings = sum(1 for issue in report.issues if issue.severity == "warning")
        report.new_terms = list(self._new_terms.values())
        report.served_models = [m for m in self._served_models if m != self._requested_model]
        return report


def save_report(report: TranslationReport, path: Path) -> None:
    """`report.json` 과 같은 이름의 `.txt` 요약을 원자적으로 쓴다."""
    path = Path(path)
    atomic_write_text(path, report.model_dump_json(indent=2) + "\n")
    atomic_write_text(path.with_suffix(".txt"), render_summary(report))


def model_display(report: TranslationReport) -> str:
    """사람이 읽는 모델 이름. 실제 모델이 요청과 다르면 `실제 [요청]` (예: 구독 별칭)."""
    if not report.served_models:
        return report.model
    served = ", ".join(report.served_models)
    return f"{served} [{report.model}]" if report.model else served


def render_summary(report: TranslationReport) -> str:
    """사람이 읽는 요약."""
    lines = [
        f"원본: {report.source_path}",
        f"출력: {report.output_path or '-'}",
        f"언어: {report.src_lang} → {report.target_lang}, "
        f"공급자: {report.provider or '-'} ({model_display(report) or '-'})",
        f"블록 {report.blocks} (번역 {report.translated_blocks}, unit {report.units}, "
        f"배치 {report.batches})",
    ]
    if report.excluded:
        lines.append("번역 제외: " + ", ".join(f"{k} {v}" for k, v in report.excluded.items()))
    lines.append(f"error {report.errors}, warning {report.warnings}")
    if report.issue_counts:
        lines.append("  " + ", ".join(f"{k} {v}" for k, v in report.issue_counts.items()))
    if report.needs_review:
        shown = ", ".join(str(idx) for idx in report.needs_review[:30])
        more = " …" if len(report.needs_review) > 30 else ""
        lines.append(f"검토 필요 블록 ({len(report.needs_review)}): {shown}{more}")
    glossary = report.glossary
    if glossary.added or glossary.conflicts or glossary.low_confidence:
        lines.append(
            f"용어집: 추가 {len(glossary.added)}, 충돌 {len(glossary.conflicts)}, "
            f"읽기 신뢰도 낮음 {len(glossary.low_confidence)}"
        )
    if report.new_terms:
        lines.append("새 용어: " + ", ".join(t["src"] for t in report.new_terms[:20]))
    usage = report.usage
    lines.append(
        f"LLM 요청 {usage.requests}, "
        f"토큰 입력 {usage.prompt_tokens} / 출력 {usage.completion_tokens}, "
        f"누적 {usage.latency_s:.1f}초"
    )
    return "\n".join(lines) + "\n"
