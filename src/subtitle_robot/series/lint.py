"""시리즈 일관성 검사 `series lint` (PROJECT-PLAN §12.4, WI-4.005).

번역된 모든 에피소드에서 확정 항목(locked·auto)이 나오는 unit 을 검사한다.
- avoid 표기가 번역에 있으면 error
- 지정 표기가 번역에 없으면 warning (한국어의 자연스러운 생략 허용, §11.1 과 같은 등급)
이름이 unit 안 다른 블록으로 옮겨질 수 있어 unit 단위로 본다.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Literal

from subtitle_robot.glossary.model import GlossaryEntry
from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.io.normalize import load_normalized
from subtitle_robot.lang.base import normalize_line
from subtitle_robot.pipeline.unitizer import UnitPlan
from subtitle_robot.series.index import Occurrence, build_index, save_index
from subtitle_robot.series.outputs import output_block_texts
from subtitle_robot.series.phrases import load_phrases
from subtitle_robot.series.workspace import SeriesWorkspace

_CHECKED_STATUSES = frozenset({"locked", "auto"})


@dataclass(frozen=True)
class LintIssue:
    """검사 결과 하나."""

    code: Literal["avoid_used", "term_missing", "phrase_not_used"]
    severity: Literal["error", "warning"]
    episode: str
    entity_id: str
    unit: str | None
    idx: int
    detail: str


@dataclass
class LintResult:
    """lint 결과."""

    episodes: list[str] = field(default_factory=list)
    issues: list[LintIssue] = field(default_factory=list)

    @property
    def errors(self) -> list[LintIssue]:
        """error 만."""
        return [issue for issue in self.issues if issue.severity == "error"]


def lint_series(workspace: SeriesWorkspace) -> LintResult:
    """번역된 에피소드 전체를 검사한다. 인덱스도 새로 만들어 저장한다."""
    settings = workspace.settings()
    original_names = settings.name_style == "original"
    glossary = load_glossary(workspace.glossary_path)
    entries = {entry.id: entry for entry in glossary.entries if entry.status in _CHECKED_STATUSES}
    index = build_index(workspace)
    save_index(index, workspace.index_path)

    result = LintResult()
    episodes: dict[str, _EpisodeOutput] = {}
    for episode in workspace.scan().episodes:
        units_path = workspace.episode_work_dir(episode) / "units.json"
        texts = output_block_texts(workspace, episode)
        if texts is None:
            continue
        units: dict[str, tuple[int, ...]] = {}
        if units_path.exists():
            plan = UnitPlan.model_validate(json.loads(units_path.read_text(encoding="utf-8")))
            units = {unit.unit_id: unit.idxs for unit in plan.units}
        episodes[episode.key] = _EpisodeOutput(texts, units)
        result.episodes.append(episode.key)

    result.issues.extend(_phrase_issues(workspace, episodes))
    for entity_id, occurrences in index.entities.items():
        entry = entries.get(entity_id)
        if entry is None:
            continue
        for occurrence in occurrences:
            output_of = episodes.get(occurrence.episode)
            if output_of is not None:
                text = output_of.unit_text(occurrence)
                result.issues.extend(_check(entry, occurrence, text, original_names))
    return result


def _phrase_issues(
    workspace: SeriesWorkspace, episodes: dict[str, _EpisodeOutput]
) -> list[LintIssue]:
    """확정(locked) 반복 대사가 있는 블록에서 그 번역을 쓰지 않았으면 warning (§24.4)."""
    locked = [p for p in load_phrases(workspace.phrases_path).phrases if p.status == "locked"]
    if not locked:
        return []
    issues = []
    for episode in workspace.scan().episodes:
        output = episodes.get(episode.key)
        normalized = workspace.episode_work_dir(episode) / "normalized.json"
        if output is None or not normalized.exists():
            continue
        for block in load_normalized(normalized).blocks:
            line = normalize_line(block.text)
            for phrase in locked:
                text = output.texts.get(block.idx, "")
                if phrase.src == line and text and phrase.target not in text:
                    issues.append(
                        LintIssue(
                            "phrase_not_used",
                            "warning",
                            episode.key,
                            phrase.id,
                            None,
                            block.idx,
                            f"{phrase.src} → {phrase.target}",
                        )
                    )
    return issues


@dataclass(frozen=True)
class _EpisodeOutput:
    texts: dict[int, str]
    units: dict[str, tuple[int, ...]]

    def unit_text(self, occurrence: Occurrence) -> str:
        """이름이 나온 블록이 속한 unit 의 번역 전체 (unit 정보가 없으면 그 블록만)."""
        idxs = self.units.get(occurrence.unit or "", (occurrence.idx,))
        return " ".join(self.texts.get(idx, "") for idx in idxs)


def _check(
    entry: GlossaryEntry, occurrence: Occurrence, text: str, original_names: bool
) -> list[LintIssue]:
    def issue(
        code: Literal["avoid_used", "term_missing", "phrase_not_used"], detail: str
    ) -> LintIssue:
        severity: Literal["error", "warning"] = "error" if code == "avoid_used" else "warning"
        return LintIssue(
            code, severity, occurrence.episode, entry.id, occurrence.unit, occurrence.idx, detail
        )

    issues = []
    if not original_names:
        issues = [
            issue("avoid_used", f"{avoid} (지정 표기 {entry.target})")
            for avoid in entry.avoid
            if avoid and avoid in text
        ]
    if original_names:
        forms = [entry.source, *(v.src for v in entry.variants)]
    else:
        forms = [entry.target, *(v.target for v in entry.variants if v.target)]
    if not any(form in text for form in forms):
        issues.append(issue("term_missing", f"{entry.source} → {entry.target}"))
    return issues
