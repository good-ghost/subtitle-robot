"""에피소드 델타 분석 (PROJECT-PLAN §9.1, §9.4, §12.1, WI-4.002).

에피소드 하나를 Pass 1 로 분석해 마스터 용어집에 새로 나온 것만 더한다.
기존 locked·auto 항목의 표기는 바꾸지 않는다 (first-wins).
충돌·낮은 신뢰도·proposed·승격 제안은 검토 대기열에 남긴다.
규칙은 WI-4.002.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from subtitle_robot.analysis.analyzer import AnalysisBudget, Pass1Analyzer
from subtitle_robot.analysis.merger import MergeOptions, MergeReport, merge_pass1
from subtitle_robot.glossary.matcher import TermMatcher
from subtitle_robot.glossary.model import Glossary, GlossaryEntry
from subtitle_robot.glossary.store import load_glossary, save_glossary
from subtitle_robot.io.normalize import NormalizedDocument, save_normalized
from subtitle_robot.io.subtitle_input import read_subtitle
from subtitle_robot.lang.base import LanguageCode
from subtitle_robot.llm.base import LlmAdapter
from subtitle_robot.series.manifest import Episode
from subtitle_robot.series.settings import SeriesSettings
from subtitle_robot.series.state import EpisodeState, ReviewItem, SeriesState
from subtitle_robot.series.story import summarize_episode
from subtitle_robot.series.workspace import SeriesWorkspace

logger = logging.getLogger(__name__)
_PROMOTE_MIN_EPISODES = 2
# Pass 1 에 알려 줄 기존 항목 상한. 항목 한 줄은 15 토큰 안팎이라 300개면 5천 토큰 정도이고,
# 남는 컨텍스트는 원문 구간에 쓴다 (작은 로컬 컨텍스트에서는 구간이 잘게 나뉜다).
KNOWN_MAX_ENTRIES = 300


@dataclass
class EpisodeAnalysis:
    """에피소드 분석 결과."""

    episode: str
    skipped: bool
    known_sent: int = 0
    merge: MergeReport = field(default_factory=MergeReport)
    appearing: list[str] = field(default_factory=list)


def episode_language(episode: Episode, settings: SeriesSettings) -> LanguageCode:
    """에피소드 원본 언어: 매니페스트 지정 → 시리즈 기본 (§8.2)."""
    lang = episode.src_lang or settings.src_lang
    return "ja" if lang == "ja" else "en"


def load_episode(episode: Episode) -> NormalizedDocument:
    """에피소드 자막을 정규화한다."""
    return read_subtitle(episode.path).doc


def analyze_episode(
    workspace: SeriesWorkspace,
    episode: Episode,
    adapter: LlmAdapter,
    settings: SeriesSettings,
    state: SeriesState,
    *,
    budget: AnalysisBudget | None = None,
) -> EpisodeAnalysis:
    """에피소드 하나를 델타 분석한다. 상태(state)를 갱신한다 — 저장은 호출자가 한다."""
    key = episode.key
    lang = episode_language(episode, settings)
    doc = load_episode(episode)
    work_dir = workspace.episode_work_dir(episode)
    work_dir.mkdir(parents=True, exist_ok=True)
    save_normalized(doc, work_dir / "normalized.json")

    analyzer = Pass1Analyzer(adapter, lang, budget, target=workspace.target)
    previous = state.episodes.get(key)
    if (
        previous is not None
        and previous.source_sha256 == doc.source_sha256
        and previous.pass1_version == analyzer.prompt_version
    ):
        # 요약 기능 전에 분석한 작업공간도 요약을 갖게 한다 (있으면 LLM 요청 없음)
        _summarize(
            workspace, episode, doc, _load_master(workspace, settings), lang, adapter, settings
        )
        return EpisodeAnalysis(episode=key, skipped=True)

    glossary = _load_master(workspace, settings)
    known = known_entries(glossary, doc, lang, state)
    analysis = analyzer.analyze(doc, known)
    options = MergeOptions(
        src_lang=lang,
        target=workspace.target,
        style=settings.transliteration,
        review=settings.review,
        scope=f"episode:{key}",
        scope_label=key,
    )
    glossary, merge = merge_pass1(glossary, analysis.output, options)
    save_glossary(glossary, workspace.glossary_path)
    added_ids = list(merge.added.values())
    delta = Glossary(
        series=glossary.series, entries=tuple(e for e in glossary.entries if e.id in added_ids)
    )
    save_glossary(delta, work_dir / "glossary.delta.yaml")

    appearing = appearing_entities(glossary, doc, lang)
    for entity_id in appearing:
        state.record_appearance(entity_id, key)
    state.episodes[key] = EpisodeState(
        source_sha256=doc.source_sha256,
        src_lang=lang,
        pass1_version=analysis.prompt_version,
        added=added_ids,
        translated=previous.translated if previous else False,
    )
    _update_review_queue(state, glossary, merge, key, settings)
    _summarize(workspace, episode, doc, glossary, lang, adapter, settings, appearing)
    return EpisodeAnalysis(
        key, skipped=False, known_sent=len(known), merge=merge, appearing=appearing
    )


def known_entries(
    glossary: Glossary,
    doc: NormalizedDocument,
    lang: LanguageCode,
    state: SeriesState | None = None,
) -> list[GlossaryEntry]:
    """Pass 1 에 알려 줄 기존 항목 (§9.4, WI-4.008 정정).

    에피소드 원문과 매칭된 항목 → 주요 인물(scope series) → 나머지(출현 에피소드가 많은 순)를
    KNOWN_MAX_ENTRIES 까지. 매칭되지 않은 항목도 보내야 다른 표기(ラグサ / ラグーザ)를 새 엔티티가
    아니라 기존 항목의 변형으로 받을 수 있다 (시리즈 E2E).
    """
    matched = set(appearing_entities(glossary, doc, lang))
    appearances = state.appearances if state else {}

    def priority(entry: GlossaryEntry) -> tuple[int, int, str]:
        if entry.id in matched:
            group = 0
        elif entry.scope == "series" and entry.type == "person":
            group = 1
        else:
            group = 2
        return group, -len(appearances.get(entry.id, ())), entry.id

    return sorted(glossary.for_language(lang), key=priority)[:KNOWN_MAX_ENTRIES]


def appearing_entities(
    glossary: Glossary, doc: NormalizedDocument, lang: LanguageCode
) -> list[str]:
    """에피소드 원문에 나오는 엔티티 ID (ambiguous 매치 제외)."""
    matcher = TermMatcher(glossary.for_language(lang), lang)
    found: set[str] = set()
    for block in doc.blocks:
        if not block.translate:
            continue
        for match in matcher.find(block.text):
            if not match.ambiguous:
                found.update(match.entity_ids)
    return sorted(found)


def _summarize(
    workspace: SeriesWorkspace,
    episode: Episode,
    doc: NormalizedDocument,
    glossary: Glossary,
    lang: LanguageCode,
    adapter: LlmAdapter,
    settings: SeriesSettings,
    appearing: list[str] | None = None,
) -> None:
    """`story_so_far` 용 에피소드 요약 (§24.3). 꺼져 있으면 하지 않는다."""
    if not settings.story.enabled:
        return
    if appearing is None:
        appearing = appearing_entities(glossary, doc, lang)
    summarize_episode(
        episode,
        doc,
        glossary,
        appearing,
        lang,
        adapter,
        workspace.episode_work_dir(episode),
        target=workspace.target,
    )


def _load_master(workspace: SeriesWorkspace, settings: SeriesSettings) -> Glossary:
    if workspace.glossary_path.exists():
        return load_glossary(workspace.glossary_path)
    return Glossary(series=settings.title or workspace.root.name)


def _update_review_queue(
    state: SeriesState, glossary: Glossary, merge: MergeReport, key: str, settings: SeriesSettings
) -> None:
    for conflict in merge.conflicts:
        state.add_review(
            ReviewItem(
                kind="conflict",
                entity_id=conflict.entity_id,
                episode=key,
                detail=f"{conflict.current} → {conflict.suggested}: {conflict.reason}",
                blocking=settings.review,
            )
        )
    block_low = settings.review or settings.on_low_confidence == "block"
    for entity_id in merge.low_confidence:
        entry = glossary.get(entity_id)
        state.add_review(
            ReviewItem(
                kind="low_confidence",
                entity_id=entity_id,
                episode=key,
                detail=f"{entry.source} 읽기 {entry.reading} → {entry.target}",
                blocking=block_low,
            )
        )
    if settings.review:
        for entity_id in merge.added.values():
            entry = glossary.get(entity_id)
            state.add_review(
                ReviewItem(
                    kind="proposed",
                    entity_id=entity_id,
                    episode=key,
                    detail=f"{entry.source} = {entry.target}",
                    blocking=True,
                )
            )
    for entity_id, episodes in state.appearances.items():
        candidate = next((e for e in glossary.entries if e.id == entity_id), None)
        if candidate and len(episodes) >= _PROMOTE_MIN_EPISODES and candidate.scope != "series":
            state.add_review(
                ReviewItem(
                    kind="promote",
                    entity_id=entity_id,
                    episode=key,
                    detail=f"{candidate.source}: {', '.join(episodes)} 에 출현 → scope series 제안",
                )
            )
