"""시리즈 실행: Mode A(prescan) / Mode B(incremental) (PROJECT-PLAN §4.2, §12.3, WI-4.003).

에피소드 번역은 단일 작품 runner 를 마스터 용어집으로 부른다 (Pass 1 은 델타 분석이 미리 한다).
이어 실행·stale 판정·체크포인트가 그대로 적용된다. 규칙은 docs/work-items/WI-4.003-series-modes.md.
"""

from __future__ import annotations

import logging
from collections.abc import Sequence
from dataclasses import dataclass, field, replace

from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.llm.availability import ProviderGuard
from subtitle_robot.llm.base import LlmAdapter
from subtitle_robot.pipeline.report import TranslationReport
from subtitle_robot.pipeline.runner import RunOptions, translate_file
from subtitle_robot.series.analysis import EpisodeAnalysis, analyze_episode, episode_language
from subtitle_robot.series.manifest import Episode, EpisodeId
from subtitle_robot.series.phrases import phrase_hints, refresh_phrases
from subtitle_robot.series.reconcile import reconcile_glossary
from subtitle_robot.series.state import SeriesState, load_state, save_state
from subtitle_robot.series.story import episode_story
from subtitle_robot.series.workspace import SeriesWorkspace

logger = logging.getLogger(__name__)


@dataclass
class SeriesRunResult:
    """시리즈 실행 결과."""

    analyses: list[EpisodeAnalysis] = field(default_factory=list)
    reconciled: bool = False
    translated: dict[str, TranslationReport] = field(default_factory=dict)
    blocked: dict[str, list[str]] = field(default_factory=dict)


def select_episodes(episodes: Sequence[Episode], spec: str | None) -> list[Episode]:
    """`S01E01-S01E06` 또는 `S01E03` 범위로 고른다. None 이면 전부.

    Raises:
        ValueError: 범위 형식이 아니다.
    """
    if not spec:
        return list(episodes)
    first_text, _, last_text = spec.partition("-")
    first = EpisodeId.parse(first_text.strip())
    last = EpisodeId.parse(last_text.strip()) if last_text else first
    return [episode for episode in episodes if first <= episode.id <= last]


def analyze_series(
    workspace: SeriesWorkspace, adapter: LlmAdapter, *, episodes: str | None = None
) -> SeriesRunResult:
    """에피소드를 순서대로 델타 분석한다. Mode A 면 마지막에 전역 reconcile 을 한다."""
    settings = workspace.settings()
    state = load_state(workspace.state_path)
    result = SeriesRunResult()
    for episode in select_episodes(workspace.scan().episodes, episodes):
        result.analyses.append(analyze_episode(workspace, episode, adapter, settings, state))
        save_state(state, workspace.state_path)
    if settings.mode == "prescan":
        result.reconciled = _reconcile(workspace, adapter, state)
        save_state(state, workspace.state_path)
    return result


def run_series(
    workspace: SeriesWorkspace,
    adapter: LlmAdapter,
    options: RunOptions | None = None,
    *,
    episodes: str | None = None,
    guard: ProviderGuard | None = None,
) -> SeriesRunResult:
    """분석과 번역을 모드에 맞춰 실행한다 (`series translate`)."""
    settings = workspace.settings()
    targets = select_episodes(workspace.scan().episodes, episodes)
    if settings.mode == "prescan":
        result = analyze_series(workspace, adapter, episodes=episodes)
        state = load_state(workspace.state_path)
        for episode in targets:
            _translate_episode(workspace, episode, adapter, options, state, result, guard)
        return result

    result = SeriesRunResult()
    state = load_state(workspace.state_path)
    for episode in targets:
        result.analyses.append(analyze_episode(workspace, episode, adapter, settings, state))
        save_state(state, workspace.state_path)
        _translate_episode(workspace, episode, adapter, options, state, result, guard)
    return result


def _reconcile(workspace: SeriesWorkspace, adapter: LlmAdapter, state: SeriesState) -> bool:
    analyzed = sorted(key for key, ep in state.episodes.items() if ep.pass1_version)
    if analyzed == state.reconciled_after:
        return False
    settings = workspace.settings()
    glossary = load_glossary(workspace.glossary_path)
    output = reconcile_glossary(
        glossary,
        state,
        adapter,
        settings.src_lang,
        target=workspace.target,
        episode_label="reconcile",
        blocking=settings.review,
    )
    if output is not None:
        state.reconciled_after = analyzed
    return output is not None


def _translate_episode(
    workspace: SeriesWorkspace,
    episode: Episode,
    adapter: LlmAdapter,
    options: RunOptions | None,
    state: SeriesState,
    result: SeriesRunResult,
    guard: ProviderGuard | None,
) -> None:
    blocking = state.blocking_items(episode.key)
    if blocking:
        result.blocked[episode.key] = [
            f"{item.kind} {item.entity_id}: {item.detail}" for item in blocking
        ]
        logger.warning("episode %s blocked by %d review items", episode.key, len(blocking))
        return
    settings = workspace.settings()
    run_options = replace(
        options or RunOptions(),
        src=episode_language(episode, settings),
        target=workspace.target,
        style=settings.style(),
        unit_limits=settings.unit,
        review=settings.review,
        scope_label=episode.key,
        run_pass1=False,
        ass_font=settings.ass.font,
        story=episode_story(workspace, episode),
        phrases=phrase_hints(workspace, episode_language(episode, settings)),
    )
    workspace.out_dir.mkdir(parents=True, exist_ok=True)
    run = translate_file(
        episode.path,
        workspace.output_path(episode),
        workspace.episode_work_dir(episode),
        adapter,
        run_options,
        guard=guard,
        glossary_path=workspace.glossary_path,
    )
    result.translated[episode.key] = run.report
    refresh_phrases(workspace)
    if episode.key in state.episodes:
        state.episodes[episode.key].translated = True
    save_state(state, workspace.state_path)
