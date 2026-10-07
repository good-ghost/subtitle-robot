"""문서 하나를 끝까지 번역하는 실행 흐름 (PROJECT-PLAN §4.1, §13, WI-3.010).

정규화 → Pass 1 → Merger → Unitizer·스타일 → resume 판정 → 배치 번역·검증 → 체크포인트
→ 출력·리포트. CLI(WI-3.013)와 감시 데몬(Phase 5)이 이 함수를 부른다.
단계별 산출물은 작업 폴더에 남는다 (§15 work/).
"""

from __future__ import annotations

import logging
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any, Literal

from subtitle_robot.analysis.analyzer import (
    DEFAULT_CONTEXT_TOKENS,
    AnalysisBudget,
    Pass1Analyzer,
    Pass1Error,
)
from subtitle_robot.analysis.merger import MergeOptions, merge_pass1
from subtitle_robot.checkpoint import (
    Checkpoint,
    Fingerprint,
    Pass1Record,
    ResumePolicy,
    StaleCheckpointError,
    UnitRecord,
    classify,
    load_checkpoint,
    save_checkpoint,
    unit_key,
)
from subtitle_robot.glossary.model import Glossary
from subtitle_robot.glossary.store import load_glossary, save_glossary
from subtitle_robot.io.ass import japanese_only_fonts, render_ass, to_ass_text
from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.io.langdetect import (
    LanguageDetectionError,
    SourceOption,
    resolve_source_language,
)
from subtitle_robot.io.normalize import NormalizedDocument, save_normalized
from subtitle_robot.io.subtitle_input import SubtitleInput, read_subtitle
from subtitle_robot.io.writer import write_srt_file
from subtitle_robot.lang.base import LanguageCode
from subtitle_robot.lang.codes import DEFAULT_TARGET
from subtitle_robot.llm.availability import ProviderGuard
from subtitle_robot.llm.base import LlmAdapter
from subtitle_robot.pipeline.batcher import BatchBudget, output_ratio_for, plan_batches
from subtitle_robot.pipeline.context import ContextBuilder, ContextSettings, PhraseHint
from subtitle_robot.pipeline.report import (
    ReportBuilder,
    ReportIssue,
    TranslationReport,
    save_report,
)
from subtitle_robot.pipeline.splitter import OutputBlock, assemble_output
from subtitle_robot.pipeline.style import StylePolicy, apply_block_styles
from subtitle_robot.pipeline.translator import Pass2Translator
from subtitle_robot.pipeline.unitizer import ExclusionReason, UnitLimits, UnitPlan, unitize
from subtitle_robot.pipeline.validator import BatchOutcome, BatchProcessor, RetryLimits, Validator

logger = logging.getLogger(__name__)

OutputFormat = Literal["auto", "srt", "ass"]


# 번역 진행 (끝낸 블록, 전체 블록). 재사용·제외 블록은 처음부터 끝낸 것으로 센다 (WI-7.004c)
ProgressCallback = Callable[[int, int], None]


class OutputFormatError(ValueError):
    """요청한 출력 형식을 입력에서 만들 수 없다."""


@dataclass(frozen=True)
class RunOptions:
    """실행 설정.

    Attributes:
        src: 원본 언어 (`--src`).
        target: 번역 대상 언어 (§26.1). 스타일 정책(`style.target_lang`)에 실어 보낸다.
        encoding: 입력 인코딩 (`--encoding`).
        style: 스타일 정책.
        unit_limits: unit 상한.
        review: True 면 새 용어집 항목을 proposed 로.
        resume: stale 정책 (`ask` | `redo` | `accept`).
        retry: 검증 재시도 횟수.
        context: 직전·다음 문맥 블록 수.
        context_tokens: 요청 컨텍스트. None 이면 공급자 정보, 없으면 기본값.
        max_output_tokens: 응답 토큰 상한.
        max_batch_blocks: 배치당 블록 상한.
        params: fingerprint 에 넣을 생성 파라미터 (temperature 등).
        scope_label: 용어집 first_seen 앞 표시.
        run_pass1: False 면 Pass 1 을 하지 않는다 (시리즈는 델타 분석이 미리 한다).
        entities_resume: 엔티티 rev 만 다른 unit 의 정책. None 이면 resume 과 같다
            (부분 재번역 `--changed` 는 redo, WI-4.006).
        retranslate_entities: 이 엔티티가 나오는 unit 은 최신이어도 다시 번역한다 (`--entity`).
        story: 직전 에피소드 요약 (`<story_so_far>`, 시리즈만, §24.3).
        phrases: 반복 대사 메모리 (`<phrases>`, 시리즈만, §24.4).
        output_format: 출력 형식. auto 는 입력을 따른다 (ASS → `.ass`, 나머지 SRT, WI-6.002).
        ass_font: ASS 출력의 스타일 폰트를 바꿀 이름 (번역과 무관해 fingerprint 에 넣지 않는다).
        progress: 배치가 끝날 때마다 (끝낸 블록, 전체 블록)을 받는 함수 (대기열 화면 진행률,
            출력과 무관해 fingerprint 에 넣지 않는다).
    """

    src: SourceOption = "auto"
    target: str = DEFAULT_TARGET
    encoding: str | None = None
    style: StylePolicy = field(default_factory=StylePolicy)
    unit_limits: UnitLimits = field(default_factory=UnitLimits)
    review: bool = False
    resume: ResumePolicy = "ask"
    retry: RetryLimits = field(default_factory=RetryLimits)
    context: ContextSettings = field(default_factory=ContextSettings)
    context_tokens: int | None = None
    max_output_tokens: int = 8192
    max_batch_blocks: int = 60
    params: Mapping[str, Any] = field(default_factory=dict)
    scope_label: str = ""
    run_pass1: bool = True
    entities_resume: ResumePolicy | None = None
    retranslate_entities: frozenset[str] = frozenset()
    output_format: OutputFormat = "auto"
    ass_font: str | None = None
    story: str = ""
    phrases: tuple[PhraseHint, ...] = ()
    progress: ProgressCallback | None = field(default=None, compare=False)


@dataclass
class RunResult:
    """실행 결과."""

    output_path: Path
    report: TranslationReport
    src_lang: LanguageCode
    translated_units: int = 0
    reused_units: int = 0
    stale_units: int = 0


@dataclass(frozen=True)
class WorkPaths:
    """작업 폴더 안 파일 (§15 work/)."""

    root: Path

    @property
    def normalized(self) -> Path:
        """정규화 결과."""
        return self.root / "normalized.json"

    @property
    def glossary(self) -> Path:
        """용어집 (단일 작품)."""
        return self.root / "glossary.yaml"

    @property
    def units(self) -> Path:
        """unit 구성."""
        return self.root / "units.json"

    @property
    def checkpoint(self) -> Path:
        """체크포인트."""
        return self.root / "checkpoint.json"

    @property
    def report(self) -> Path:
        """리포트."""
        return self.root / "report.json"


def translate_file(
    input_path: Path,
    output_path: Path,
    work_dir: Path,
    adapter: LlmAdapter,
    options: RunOptions | None = None,
    *,
    guard: ProviderGuard | None = None,
    glossary_path: Path | None = None,
) -> RunResult:
    """SRT 파일 하나를 번역한다.

    Args:
        input_path: 원본 SRT.
        output_path: 출력 `.<대상>.srt`.
        work_dir: 작업 폴더 (없으면 만든다).
        adapter: LLM 어댑터.
        options: 실행 설정.
        guard: 공급자 가드. 주면 공급자 장애 시 일시 정지·재개한다.
        glossary_path: 용어집 경로 (시리즈 마스터 용어집 등). 없으면 작업 폴더의 glossary.yaml.

    Raises:
        StaleCheckpointError: 이어 실행인데 설정이 바뀌었고 정책이 ask 다.
        LanguageDetectionError, EncodingDetectionError: 입력을 판단할 수 없다.
    """
    options = with_target_style(options or RunOptions())
    paths = WorkPaths(Path(work_dir))
    paths.root.mkdir(parents=True, exist_ok=True)
    glossary_file = Path(glossary_path) if glossary_path else paths.glossary

    source = read_subtitle(Path(input_path), encoding=options.encoding)
    doc = source.doc
    save_normalized(doc, paths.normalized)
    lang = _source_language(doc, options)
    checkpoint, discarded = load_checkpoint(
        paths.checkpoint, source_sha256=doc.source_sha256, src_lang=lang, target_lang=options.target
    )
    if discarded:
        logger.warning("checkpoint discarded, starting over: %s", discarded)

    glossary = load_glossary(glossary_file) if glossary_file.exists() else Glossary()
    plan = apply_block_styles(
        unitize(doc, lang, options.unit_limits, preset=input_exclusions(source, options.style)),
        doc,
        lang,
        options.style,
    )
    atomic_write_text(paths.units, plan.model_dump_json(indent=1) + "\n")
    report = ReportBuilder(doc, plan, lang, options.target)
    if discarded:
        report.add_note("checkpoint_discarded", discarded)

    glossary = _run_pass1(
        doc, lang, glossary, glossary_file, checkpoint, paths, adapter, options, report
    )

    builder = ContextBuilder(
        doc,
        plan,
        glossary.entries,
        lang,
        options.style,
        options.context,
        relations=glossary.relations,
        episode=options.scope_label or None,
        story=options.story,
        phrases=options.phrases,
    )
    translator = Pass2Translator(
        adapter, lang, target=options.target, max_output_tokens=options.max_output_tokens
    )
    validator = Validator(glossary.entries, lang, options.style, builder.sources)
    processor = BatchProcessor(builder, translator, validator, plan, options.retry)
    info = adapter.describe()
    model_id = (
        info.model_label
        if info.context_tokens is None
        else f"{info.model_label}@ctx{info.context_tokens}"
    )
    report.set_run_info(
        provider=info.provider,
        model=model_id,
        prompt_versions=_prompt_versions(translator.prompt_version, checkpoint),
        style_hash=options.style.style_hash(),
        requested_model=info.model,
    )

    def fingerprint(idxs: tuple[int, ...]) -> Fingerprint:
        return Fingerprint(
            prompt_version=translator.prompt_version,
            provider=info.provider,
            model=model_id,
            params=dict(options.params),
            style_hash=options.style.style_hash(),
            entities=builder.entity_revs(idxs),
        )

    result = RunResult(output_path=Path(output_path), report=report.build(), src_lang=lang)
    todo, reused = _resume(plan, checkpoint, fingerprint, options, result)
    translations: dict[int, str] = {}
    for record in reused:
        translations.update(record.translations)
        report.add_record(record)

    todo_plan = UnitPlan(units=tuple(todo), excluded=plan.excluded)
    budget = BatchBudget(
        context_tokens=options.context_tokens or info.context_tokens or DEFAULT_CONTEXT_TOKENS,
        fixed_tokens=builder.estimate_fixed_tokens(translator.system_prompt, adapter.count_tokens),
        output_tokens_per_char=output_ratio_for(info.model, lang),
        max_output_tokens=options.max_output_tokens,
        max_blocks=options.max_batch_blocks,
    )
    total = len(doc.blocks)
    remaining = sum(len(unit.idxs) for unit in todo)
    _report_progress(options, total - remaining, total)
    for batch in plan_batches(todo_plan, doc, budget, adapter.count_tokens):
        previous = [(idx, translations[idx]) for idx in sorted(translations) if idx < batch.idxs[0]]

        def run_batch(batch: Any = batch, previous: Any = previous) -> BatchOutcome:
            return processor.run(batch, previous)

        outcome = guard.run(run_batch) if guard else run_batch()
        translations.update(outcome.translations)
        report.add_batch(outcome)
        for unit in (u for u in todo if u.unit_id in batch.unit_ids):
            checkpoint.units[unit_key(unit.idxs)] = UnitRecord(
                unit_id=unit.unit_id,
                idxs=list(unit.idxs),
                translations={
                    i: outcome.translations[i] for i in unit.idxs if i in outcome.translations
                },
                needs_review=sorted(i for i in unit.idxs if i in outcome.needs_review),
                issues=[
                    _issue_dict(issue) for issue in outcome.issues if issue.unit_id == unit.unit_id
                ],
                fingerprint=fingerprint(unit.idxs),
            )
            result.translated_units += 1
            remaining -= len(unit.idxs)
        save_checkpoint(checkpoint, paths.checkpoint)
        _report_progress(options, total - remaining, total)

    blocks = assemble_output(doc, translations, plan.excluded, builder.sources)
    if resolve_output_format(source, options.output_format, Path(output_path)) == "ass":
        _write_ass(Path(output_path), source, blocks, translations, plan.excluded, options, report)
    else:
        write_srt_file(Path(output_path), blocks)
    result.report = report.build(output_path=str(output_path))
    save_report(result.report, paths.report)
    return result


def resolve_output_format(
    source: SubtitleInput, requested: OutputFormat, output_path: Path | None = None
) -> Literal["srt", "ass"]:
    """출력 형식 (Q-07). auto 는 출력 경로 확장자(.srt·.ass·.ssa), 없으면 입력 형식을 따른다.

    Raises:
        OutputFormatError: ASS 출력을 요청했는데 입력이 ASS 가 아니다.
    """
    if requested == "auto":
        suffix = output_path.suffix.lower() if output_path else ""
        if suffix == ".srt":
            return "srt"
        if suffix in (".ass", ".ssa") or source.format == "ass":
            requested = "ass"
        else:
            return "srt"
    if requested == "ass" and source.ass is None:
        raise OutputFormatError("ASS 출력은 ASS·SSA 입력에서만 만들 수 있다")
    return requested


def _write_ass(
    output_path: Path,
    source: SubtitleInput,
    blocks: Sequence[OutputBlock],
    translations: Mapping[int, str],
    excluded: Mapping[int, ExclusionReason],
    options: RunOptions,
    report: ReportBuilder,
) -> None:
    """원본 ASS 에서 번역한 이벤트의 Text 만 바꿔 쓴다. 번역하지 않은 이벤트는 원문 그대로."""
    if source.ass is None:
        raise OutputFormatError("ASS 출력은 ASS·SSA 입력에서만 만들 수 있다")
    texts: dict[int, str] = {}
    for idx, text in blocks_by_idx(source, blocks):
        reason = excluded.get(idx)
        if reason == "sdh_drop":
            texts[source.events[idx].position] = ""
        elif reason is None and idx in translations:
            texts[source.events[idx].position] = to_ass_text(text)
    if options.ass_font is None:
        fonts = japanese_only_fonts(source.ass)
        if fonts:
            report.add_note(
                "ass_font",
                f"일본어 전용일 수 있는 폰트 {', '.join(fonts)}: 한글이 다른 폰트로 대체될 수 있다 "
                "(ass.font 로 한글 폰트를 지정)",
            )
    text = render_ass(source.ass, texts, font=options.ass_font)
    atomic_write_text(output_path, ("\ufeff" if source.doc.had_bom else "") + text)


def blocks_by_idx(source: SubtitleInput, blocks: Sequence[OutputBlock]) -> list[tuple[int, str]]:
    """출력 블록(원본 블록 순서)과 블록 idx."""
    return [(block.idx, out.text) for block, out in zip(source.doc.blocks, blocks, strict=True)]


def input_exclusions(source: SubtitleInput, style: StylePolicy) -> dict[int, ExclusionReason]:
    """입력 형식이 정하는 번역 제외 (ASS 노래 이벤트는 lyrics 정책, 제외 스타일, Q-06)."""
    excluded: dict[int, ExclusionReason] = {}
    if style.lyrics == "keep":
        excluded.update(dict.fromkeys(source.song_blocks(), "lyrics_keep"))
    excluded.update(
        dict.fromkeys(source.blocks_with_styles(style.ass_exclude_styles), "style_excluded")
    )
    return excluded


def with_target_style(options: RunOptions) -> RunOptions:
    """스타일 정책에 대상 언어를 싣는다 (문맥·검증·style_hash 가 대상 언어를 본다)."""
    if options.style.target_lang == options.target:
        return options
    return replace(options, style=options.style.model_copy(update={"target_lang": options.target}))


def _source_language(doc: NormalizedDocument, options: RunOptions) -> LanguageCode:
    """원본 언어를 정한다.

    Raises:
        LanguageDetectionError: 판단할 수 없거나 대상 언어와 같다.
    """
    lang = resolve_source_language((b.text for b in doc.blocks if b.translate), options.src)
    if lang == options.target:
        raise LanguageDetectionError(f"원본과 대상 언어가 같다 ({lang}): 번역할 것이 없다")
    return lang


def analyze_file(
    input_path: Path,
    work_dir: Path,
    adapter: LlmAdapter,
    options: RunOptions | None = None,
    *,
    glossary_path: Path | None = None,
) -> tuple[Glossary, TranslationReport, LanguageCode]:
    """Pass 1 분석과 용어집 병합만 한다 (`subtitle-robot analyze`). 이미 했으면 다시 하지 않는다."""
    options = with_target_style(options or RunOptions())
    paths = WorkPaths(Path(work_dir))
    paths.root.mkdir(parents=True, exist_ok=True)
    glossary_file = Path(glossary_path) if glossary_path else paths.glossary
    source = read_subtitle(Path(input_path), encoding=options.encoding)
    doc = source.doc
    save_normalized(doc, paths.normalized)
    lang = _source_language(doc, options)
    checkpoint, _ = load_checkpoint(
        paths.checkpoint, source_sha256=doc.source_sha256, src_lang=lang, target_lang=options.target
    )
    glossary = load_glossary(glossary_file) if glossary_file.exists() else Glossary()
    plan = apply_block_styles(
        unitize(doc, lang, options.unit_limits, preset=input_exclusions(source, options.style)),
        doc,
        lang,
        options.style,
    )
    report = ReportBuilder(doc, plan, lang, options.target)
    glossary = _run_pass1(
        doc, lang, glossary, glossary_file, checkpoint, paths, adapter, options, report
    )
    return glossary, report.build(), lang


def _run_pass1(
    doc: Any,
    lang: LanguageCode,
    glossary: Glossary,
    glossary_file: Path,
    checkpoint: Checkpoint,
    paths: WorkPaths,
    adapter: LlmAdapter,
    options: RunOptions,
    report: ReportBuilder,
) -> Glossary:
    """Pass 1 → Merger. 체크포인트에 기록이 있으면 건너뛴다. 실패해도 멈추지 않는다 (NFR-003)."""
    if checkpoint.pass1 is not None or not options.run_pass1:
        return glossary
    analyzer = Pass1Analyzer(
        adapter,
        lang,
        AnalysisBudget(
            context_tokens=options.context_tokens, max_output_tokens=options.max_output_tokens
        ),
        target=options.target,
    )
    try:
        analysis = analyzer.analyze(doc, glossary.for_language(lang))
    except Pass1Error as exc:
        logger.error("pass1 failed, continuing with the existing glossary: %s", exc)
        report.add_note("pass1_failed", str(exc))
        return glossary
    for segment in analysis.segments:
        report.add_usage(
            prompt_tokens=segment.prompt_tokens,
            completion_tokens=segment.completion_tokens,
            latency_s=0.0,
        )
    merge_options = MergeOptions(
        src_lang=lang,
        target=options.target,
        style=options.style.transliteration,
        review=options.review,
        scope_label=options.scope_label,
    )
    glossary, merge_report = merge_pass1(glossary, analysis.output, merge_options)
    save_glossary(glossary, glossary_file)
    report.add_merge(merge_report)
    report.observe_model(analysis.model)
    checkpoint.pass1 = Pass1Record(prompt_version=analysis.prompt_version, model=analysis.model)
    save_checkpoint(checkpoint, paths.checkpoint)
    return glossary


def _resume(
    plan: UnitPlan,
    checkpoint: Checkpoint,
    fingerprint: Callable[[tuple[int, ...]], Fingerprint],
    options: RunOptions,
    result: RunResult,
) -> tuple[list[Any], list[UnitRecord]]:
    """unit 마다 번역할지, 저장된 결과를 쓸지 정한다 (§13.2, 부분 재번역 §12.4)."""
    policies: dict[str, ResumePolicy] = {
        "settings": options.resume,
        "entities": options.entities_resume or options.resume,
    }
    todo = []
    reused: list[UnitRecord] = []
    stale_details: list[str] = []
    for unit in plan.units:
        record = checkpoint.units.get(unit_key(unit.idxs))
        current = fingerprint(unit.idxs)
        state = classify(record, unit.idxs, current)
        if state == "missing" or record is None:
            todo.append(unit)
            continue
        if options.retranslate_entities & set(current.entities):
            result.stale_units += 1
            todo.append(unit)
            continue
        if state == "fresh":
            reused.append(record)
            continue
        result.stale_units += 1
        policy = policies[state]
        if policy == "ask":
            diffs = (
                record.fingerprint.settings_differences(current)
                if state == "settings"
                else record.fingerprint.entity_differences(current)
            )
            stale_details.append(f"{unit.unit_id} ({state}): {'; '.join(diffs)}")
        if policy == "accept":
            reused.append(record)
        else:
            todo.append(unit)
    if stale_details:
        raise StaleCheckpointError(_summarize(stale_details))
    result.reused_units = len(reused)
    return todo, reused


def _report_progress(options: RunOptions, done: int, total: int) -> None:
    """진행을 알린다 (받는 쪽이 자기 오류를 처리한다)."""
    if options.progress is not None:
        options.progress(done, total)


def _prompt_versions(pass2: str, checkpoint: Checkpoint) -> dict[str, str]:
    versions = {"pass2": pass2}
    if checkpoint.pass1 is not None:
        versions["pass1"] = checkpoint.pass1.prompt_version
    return versions


def _summarize(details: list[str], limit: int = 10) -> list[str]:
    shown = details[:limit]
    if len(details) > limit:
        shown.append(f"... 외 {len(details) - limit}개 unit")
    return shown


def _issue_dict(issue: Any) -> dict[str, Any]:
    return ReportIssue(
        code=issue.code,
        severity=issue.severity,
        unit_id=issue.unit_id,
        idx=issue.idx,
        detail=issue.detail,
    ).model_dump()
