"""Pass 2 검증·재시도·폴백 (PROJECT-PLAN §11, WI-3.008).

error 는 재요청 → 폴백(분리·치환·needs_review)으로 처리하고 warning 은 리포트에만 남긴다.
어떤 경우에도 파이프라인은 멈추지 않는다. 공급자 장애만 위로 올린다 (가드가 일시 정지).
규칙표는 WI-3.008.
"""

from __future__ import annotations

import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Literal

from subtitle_robot.glossary.honorifics import HonorificForm, HonorificResolver
from subtitle_robot.glossary.matcher import TermMatch, TermMatcher
from subtitle_robot.glossary.model import GlossaryEntry
from subtitle_robot.glossary.particles import replace_with_particles
from subtitle_robot.lang.base import LanguageCode, plain_text
from subtitle_robot.lang.codes import script_of
from subtitle_robot.lang.target import is_korean, max_line_chars
from subtitle_robot.pipeline.batcher import Batch
from subtitle_robot.pipeline.context import ContextBuilder, SourceBlock
from subtitle_robot.pipeline.schema import NewTerm, Pass2Output
from subtitle_robot.pipeline.splitter import collect_translations, fallback_split, unit_text
from subtitle_robot.pipeline.style import StylePolicy
from subtitle_robot.pipeline.translator import BatchResponse, Pass2Translator
from subtitle_robot.pipeline.unitizer import Unit, UnitPlan

Severity = Literal["error", "warning"]
IssueCode = Literal[
    "batch_format", "idx_missing", "idx_duplicate", "idx_order", "empty", "avoid_used",
    "residual_source", "term_missing", "honorific_form", "line_too_long", "too_many_lines",
    "fallback_split", "avoid_replaced", "needs_review",
]  # fmt: skip

_STRUCTURAL = frozenset({"idx_missing", "idx_duplicate", "idx_order", "empty"})
_RESIDUAL = {
    "en": re.compile(r"[A-Za-z]{3,}"),
    "ja": re.compile(r"[぀-ゟ゠-ヿ]{2,}"),
}
# 전용 패턴이 없는 원본: 문자 체계로 (§26.3). 없는 문자 체계는 검사하지 않는다
_RESIDUAL_BY_SCRIPT = {
    "latin": re.compile(r"[A-Za-zÀ-ÖØ-öø-ɏ]{3,}"),
    "cyrillic": re.compile(r"[Ѐ-ӿ]{3,}"),
    "greek": re.compile(r"[Ͱ-Ͽ]{3,}"),
    "kana": re.compile(r"[぀-ゟ゠-ヿ]{2,}"),
    "hangul": re.compile(r"[가-힣]{2,}"),
    "han": re.compile(r"[一-鿿]{2,}"),
    "arabic": re.compile(r"[؀-ۿ]{3,}"),
    "hebrew": re.compile(r"[֐-׿]{3,}"),
    "thai": re.compile(r"[฀-๿]{3,}"),
    "devanagari": re.compile(r"[ऀ-ॿ]{3,}"),
}
# 띄어 쓰지 않는 문자 (가나·한자·한글·태국)
_UNSPACED_RE = re.compile(r"[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7a3\u0e00-\u0e7f]")
# 대상 문자 체계가 원본 문자를 정상적으로 쓰는 경우 (일본어는 한자를 쓴다)
_SHARED_SCRIPTS = frozenset({("han", "kana")})
_QUOTED = re.compile(r"\"[^\"]*\"|“[^”]*”|'[^']*'")
_MAX_ACRONYM = 5  # 이 길이 이하 대문자 단어는 약어로 보고 원문 잔존에서 뺀다 (M0: NASA)


def residual_pattern(src_lang: str, target: str) -> re.Pattern[str] | None:
    """원문 잔존 검사 패턴. 원본과 대상의 문자 체계가 같으면 None (en → fr 은 검사하지 않는다)."""
    source_script, target_script = script_of(src_lang), script_of(target)
    if source_script == target_script or (source_script, target_script) in _SHARED_SCRIPTS:
        return None
    if src_lang in _RESIDUAL:
        return _RESIDUAL[src_lang]
    return _RESIDUAL_BY_SCRIPT.get(source_script or "")


def replace_word(text: str, old: str, new: str) -> tuple[str, int]:
    """`old` 를 `new` 로 바꾼다.

    띄어 쓰는 문자는 단어 경계에서만 바꾼다 (다른 단어의 일부는 두지 않는다).
    한중일·태국 문자는 띄어 쓰지 않아 경계를 보지 않는다.
    """
    if not old:
        return text, 0
    escaped = re.escape(old)
    pattern = escaped if _UNSPACED_RE.search(old) else rf"(?<!\w){escaped}(?!\w)"
    return re.subn(pattern, new, text)


@dataclass(frozen=True)
class Issue:
    """검사 결과 하나."""

    code: IssueCode
    severity: Severity
    unit_id: str | None
    idx: int | None
    detail: str


@dataclass(frozen=True)
class LineLimits:
    """줄 길이 warning 기준."""

    max_line_chars: int = 22
    max_lines: int = 2


@dataclass(frozen=True)
class RetryLimits:
    """재시도 횟수 (`config.toml [retry]`, §11.2). 첫 시도는 세지 않는다."""

    unit_retries: int = 2
    batch_retries: int = 3


@dataclass
class UnitCheck:
    """unit 하나의 검사 결과."""

    unit_id: str
    translations: dict[int, str]
    issues: list[Issue]
    text: str  # 폴백 분리용 unit 전체 번역문

    @property
    def errors(self) -> list[Issue]:
        """error 등급만."""
        return [issue for issue in self.issues if issue.severity == "error"]


class Validator:
    """unit 단위 검사기 (문서 하나에 하나)."""

    def __init__(
        self,
        entries: Sequence[GlossaryEntry],
        lang: LanguageCode,
        style: StylePolicy,
        sources: Mapping[int, SourceBlock],
        limits: LineLimits | None = None,
    ) -> None:
        """검사기를 만든다."""
        self._entries = {entry.id: entry for entry in entries if entry.src_lang == lang}
        self._matcher = TermMatcher(self._entries.values(), lang)
        self._resolver = HonorificResolver(
            style.honorifics_policy,
            {s: HonorificForm(c.ko, c.space) for s, c in style.honorifics_custom.items()},
        )
        self._lang = lang
        # 경칭 표·조사 보정은 한국어 대상 전용이다 (§26.3)
        self._korean = is_korean(style.target_lang)
        self._residual = residual_pattern(lang, style.target_lang)
        self._original_names = style.name_style == "original"
        self._sources = sources
        self._limits = limits or LineLimits(max_line_chars=max_line_chars(style.target_lang))
        self._allowed = {
            surface for entry in self._entries.values() for surface in entry.surfaces()
        } if self._original_names else set()  # fmt: skip

    # ---------------------------------------------------------------- unit 검사

    def check_unit(self, unit: Unit, output: Pass2Output) -> UnitCheck:
        """응답에서 unit 의 블록을 꺼내 검사한다."""
        candidates = collect_translations(output)
        order = [block.idx for out_unit in output.units for block in out_unit.blocks]
        issues: list[Issue] = []
        translations: dict[int, str] = {}
        for idx in unit.idxs:
            found = candidates.get(idx, [])
            if not found:
                issues.append(Issue("idx_missing", "error", unit.unit_id, idx, "번역 없음"))
                continue
            if len(found) > 1:
                issues.append(Issue("idx_duplicate", "error", unit.unit_id, idx, f"{len(found)}회"))
            translations[idx] = found[0]
        positions = [order.index(idx) for idx in unit.idxs if idx in translations]
        if positions != sorted(positions):
            issues.append(Issue("idx_order", "error", unit.unit_id, None, "블록 순서가 다르다"))
        for idx, ko in translations.items():
            if not plain_text(ko).strip():
                issues.append(Issue("empty", "error", unit.unit_id, idx, "빈 번역"))
        issues.extend(self.content_issues(unit, translations))
        return UnitCheck(unit.unit_id, translations, issues, unit_text(output, unit.idxs))

    def content_issues(self, unit: Unit, translations: Mapping[int, str]) -> list[Issue]:
        """표기·잔존·줄 길이 검사 (구조 검사 뒤, 폴백 뒤에도 다시 쓴다)."""
        issues: list[Issue] = []
        joined = " ".join(translations.get(idx, "") for idx in unit.idxs)
        for match in self._matches(unit):
            issues.extend(self._term_issues(unit.unit_id, match, joined))
        for idx in unit.idxs:
            if idx in translations:
                issues.extend(self._block_issues(unit.unit_id, idx, translations[idx]))
        return issues

    def expected_form(self, match: TermMatch) -> str | None:
        """매치된 원문에 기대하는 번역 표기 (name_style=original 이면 원문)."""
        if self._original_names:
            return match.surface
        entry = self._entries[match.entity_ids[0]]
        if match.surface == entry.source:
            return entry.target
        return next((v.target for v in entry.variants if v.src == match.surface), None)

    def fix_avoid(self, unit: Unit, translations: dict[int, str]) -> list[Issue]:
        """avoid 표기를 지정 표기로 바꾼다 (조사 보정). 바꾼 내역을 돌려준다."""
        issues: list[Issue] = []
        for match in self._matches(unit):
            form = self.expected_form(match)
            if form is None:
                continue
            entry = self._entries[match.entity_ids[0]]
            for avoid in entry.avoid:
                for idx in unit.idxs:
                    if idx not in translations:
                        continue
                    fixed, count = self._replace(translations[idx], avoid, form)
                    if count:
                        translations[idx] = fixed
                        issues.append(
                            Issue(
                                "avoid_replaced", "warning", unit.unit_id, idx, f"{avoid} → {form}"
                            )
                        )
        return issues

    def _replace(self, text: str, old: str, new: str) -> tuple[str, int]:
        """avoid 표기를 지정 표기로: 한국어는 조사 보정, 다른 대상은 단어 단위로 바꾼다."""
        if self._korean:
            return replace_with_particles(text, old, new)
        return replace_word(text, old, new)

    def _matches(self, unit: Unit) -> list[TermMatch]:
        return [
            match
            for idx in unit.idxs
            for match in self._matcher.find(self._sources[idx].text)
            if not match.ambiguous
        ]

    def _term_issues(self, unit_id: str, match: TermMatch, joined: str) -> list[Issue]:
        form = self.expected_form(match)
        if form is None:
            return []
        entry = self._entries[match.entity_ids[0]]
        issues = [
            Issue("avoid_used", "error", unit_id, None, f"{avoid} (지정 표기 {form})")
            for avoid in entry.avoid
            if avoid and avoid in joined
        ]
        if form not in joined:
            issues.append(
                Issue("term_missing", "warning", unit_id, None, f"{match.surface} → {form}")
            )
        elif match.suffix and self._korean:
            composed = self._resolver.compose(form, match.suffix)
            if composed not in joined:
                issues.append(
                    Issue(
                        "honorific_form",
                        "warning",
                        unit_id,
                        None,
                        f"{match.surface}{match.suffix} → {composed}",
                    )
                )
        return issues

    def _block_issues(self, unit_id: str, idx: int, ko: str) -> list[Issue]:
        issues: list[Issue] = []
        plain = plain_text(ko)
        residual = (
            [
                hit
                for hit in self._residual.findall(_QUOTED.sub(" ", plain))
                if not (hit.isupper() and len(hit) <= _MAX_ACRONYM) and hit not in self._allowed
            ]
            if self._residual is not None
            else []
        )
        if residual:
            issues.append(Issue("residual_source", "error", unit_id, idx, ", ".join(residual)))
        lines = [line for line in plain.split("\n") if line.strip()]
        if len(lines) > self._limits.max_lines:
            issues.append(Issue("too_many_lines", "warning", unit_id, idx, f"{len(lines)}줄"))
        longest = max((len(line) for line in lines), default=0)
        if longest > self._limits.max_line_chars:
            issues.append(Issue("line_too_long", "warning", unit_id, idx, f"{longest}자"))
        return issues


# ---------------------------------------------------------------- 배치 처리 (재시도·폴백)


@dataclass
class BatchOutcome:
    """배치 하나의 최종 결과."""

    batch_id: str
    translations: dict[int, str]
    issues: list[Issue]
    needs_review: set[int]
    new_terms: list[NewTerm] = field(default_factory=list)
    responses: list[BatchResponse] = field(default_factory=list)
    batch_attempts: int = 0
    unit_retries: int = 0


class BatchProcessor:
    """배치 하나를 번역하고 검증한다 (§11.2)."""

    def __init__(
        self,
        builder: ContextBuilder,
        translator: Pass2Translator,
        validator: Validator,
        plan: UnitPlan,
        limits: RetryLimits | None = None,
    ) -> None:
        """처리기를 만든다."""
        self._builder = builder
        self._translator = translator
        self._validator = validator
        self._units = {unit.unit_id: unit for unit in plan.units}
        self._limits = limits or RetryLimits()

    def run(self, batch: Batch, previous: Sequence[tuple[int, str]] = ()) -> BatchOutcome:
        """배치를 처리한다. 공급자 장애 외에는 예외를 내지 않는다."""
        outcome = BatchOutcome(batch.batch_id, {}, [], set())
        units = [self._units[unit_id] for unit_id in batch.unit_ids]
        best: dict[str, UnitCheck] = {}

        output = self._request_batch(batch, previous, outcome)
        if output is not None:
            self._evaluate(units, output, best)
        pending = [unit for unit in units if unit.unit_id not in best or best[unit.unit_id].errors]

        for retry in range(1, self._limits.unit_retries + 1):
            if not pending:
                break
            outcome.unit_retries += 1
            response = self._translator.translate(
                self._builder.build(
                    f"{batch.batch_id}-R{retry}", [u.unit_id for u in pending], previous
                )
            )
            outcome.responses.append(response)
            if response.output is not None:
                outcome.new_terms.extend(response.output.new_terms)
                self._evaluate(pending, response.output, best)
            pending = [u for u in pending if u.unit_id not in best or best[u.unit_id].errors]

        for unit in units:
            self._finalize(unit, best.get(unit.unit_id), outcome)
        return outcome

    def _request_batch(
        self, batch: Batch, previous: Sequence[tuple[int, str]], outcome: BatchOutcome
    ) -> Pass2Output | None:
        response: BatchResponse | None = None
        for _attempt in range(1 + self._limits.batch_retries):
            outcome.batch_attempts += 1
            response = self._translator.translate(
                self._builder.build(batch.batch_id, batch.unit_ids, previous)
            )
            outcome.responses.append(response)
            if response.output is not None:
                outcome.new_terms.extend(response.output.new_terms)
                return response.output
        detail = response.error if response else "요청 없음"
        outcome.issues.append(Issue("batch_format", "error", None, None, detail))
        return None

    def _evaluate(
        self, units: Sequence[Unit], output: Pass2Output, best: dict[str, UnitCheck]
    ) -> None:
        for unit in units:
            check = self._validator.check_unit(unit, output)
            previous = best.get(unit.unit_id)
            if previous is None or len(check.errors) <= len(previous.errors):
                best[unit.unit_id] = check

    def _finalize(self, unit: Unit, check: UnitCheck | None, outcome: BatchOutcome) -> None:
        """남은 error 에 폴백을 적용하고, 최종 번역문으로 내용 검사를 다시 한다."""
        sources = self._builder.sources
        translations = dict(check.translations) if check else {}
        text = check.text if check else ""
        error_codes = {issue.code for issue in check.errors} if check else {"idx_missing"}
        notes: list[Issue] = []

        if _STRUCTURAL & error_codes:
            if text.strip():
                weights = [len(sources[idx].text) for idx in unit.idxs]
                translations = dict(zip(unit.idxs, fallback_split(text, weights), strict=True))
                notes.append(Issue("fallback_split", "warning", unit.unit_id, None, "폴백 분리"))
            else:
                translations = {idx: sources[idx].text for idx in unit.idxs}
                notes.append(
                    Issue("needs_review", "error", unit.unit_id, None, "번역을 얻지 못해 원문 유지")
                )
                outcome.needs_review.update(unit.idxs)
        if error_codes & ({"avoid_used"} | _STRUCTURAL):
            notes.extend(self._validator.fix_avoid(unit, translations))

        # 폴백·치환 뒤의 최종 번역문으로 표기·잔존·줄 길이를 다시 본다. 남은 error 는 needs_review
        for issue in self._validator.content_issues(unit, translations):
            notes.append(issue)
            if issue.severity == "error":
                outcome.needs_review.update([issue.idx] if issue.idx is not None else unit.idxs)
        for idx in unit.idxs:
            if not plain_text(translations.get(idx, "")).strip():
                outcome.needs_review.add(idx)
        outcome.translations.update(translations)
        outcome.issues.extend(notes)
