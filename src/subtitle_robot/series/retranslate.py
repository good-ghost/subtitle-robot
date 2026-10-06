"""부분 재번역 `series retranslate` (PROJECT-PLAN §12.4, WI-4.006).

용어집 표기를 고친 뒤, 이미 번역된 에피소드에서 바뀐 엔티티가 쓰인 unit 만 다시 번역한다.
나머지 unit 은 체크포인트를 그대로 쓴다. 규칙은 WI-4.006.
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace

from subtitle_robot.checkpoint import ResumePolicy
from subtitle_robot.llm.availability import ProviderGuard
from subtitle_robot.llm.base import LlmAdapter
from subtitle_robot.pipeline.runner import RunOptions, translate_file
from subtitle_robot.series.analysis import episode_language
from subtitle_robot.series.index import build_index, save_index
from subtitle_robot.series.phrases import phrase_hints
from subtitle_robot.series.runner import select_episodes
from subtitle_robot.series.story import episode_story
from subtitle_robot.series.workspace import SeriesWorkspace


@dataclass
class RetranslateResult:
    """에피소드별로 다시 번역한 unit 수."""

    retranslated: dict[str, int] = field(default_factory=dict)
    skipped: list[str] = field(default_factory=list)


def retranslate_series(
    workspace: SeriesWorkspace,
    adapter: LlmAdapter,
    *,
    entities: frozenset[str] = frozenset(),
    settings_resume: ResumePolicy = "ask",
    options: RunOptions | None = None,
    episodes: str | None = None,
    guard: ProviderGuard | None = None,
) -> RetranslateResult:
    """바뀐 엔티티(`--changed`) 또는 지정 엔티티(`--entity`)가 쓰인 unit 을 다시 번역한다.

    Args:
        workspace: 시리즈 작업공간.
        adapter: LLM 어댑터.
        entities: 비어 있으면 `--changed` (rev 가 바뀐 unit), 있으면 그 엔티티가 나오는 unit.
        settings_resume: 설정이 바뀐 unit 의 정책 (기본은 멈추고 차이를 보여준다).
        options: 실행 설정 바탕값.
        episodes: 에피소드 범위.
        guard: 공급자 가드.

    Raises:
        StaleCheckpointError: 설정이 바뀐 unit 이 있고 정책이 ask 다.
    """
    settings = workspace.settings()
    targets = [
        episode
        for episode in select_episodes(workspace.scan().episodes, episodes)
        if workspace.output_path(episode).exists()
    ]
    if entities:
        index = build_index(workspace)
        save_index(index, workspace.index_path)
        appearing = {key for entity in entities for key in index.episodes_of(entity)}
        targets = [episode for episode in targets if episode.key in appearing]

    result = RetranslateResult()
    for episode in targets:
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
            resume=settings_resume,
            entities_resume="redo",
            retranslate_entities=entities,
        )
        run = translate_file(
            episode.path,
            workspace.output_path(episode),
            workspace.episode_work_dir(episode),
            adapter,
            run_options,
            guard=guard,
            glossary_path=workspace.glossary_path,
        )
        if run.translated_units:
            result.retranslated[episode.key] = run.translated_units
        else:
            result.skipped.append(episode.key)
    return result
