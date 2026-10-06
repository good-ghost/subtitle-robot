"""시리즈 진행 상태 `work/series_state.json` (PROJECT-PLAN §12.1, §12.3, WI-4.002).

에피소드별 분석·번역 여부, 엔티티 출현 에피소드, 검토 대기열을 담는다.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from subtitle_robot.io.atomic import atomic_write_text

STATE_SCHEMA_VERSION: Literal[1] = 1
ReviewKind = Literal["conflict", "low_confidence", "proposed", "promote", "merge"]


class ReviewItem(BaseModel):
    """검토 대기열 항목."""

    kind: ReviewKind
    entity_id: str
    episode: str
    detail: str = ""
    blocking: bool = False
    resolved: bool = False


class EpisodeState(BaseModel):
    """에피소드 하나의 진행 상태."""

    source_sha256: str
    src_lang: str
    pass1_version: str | None = None
    added: list[str] = Field(default_factory=list)
    translated: bool = False


class SeriesState(BaseModel):
    """시리즈 전체 진행 상태."""

    schema_version: Literal[1] = STATE_SCHEMA_VERSION
    episodes: dict[str, EpisodeState] = Field(default_factory=dict)
    appearances: dict[str, list[str]] = Field(default_factory=dict)
    review_queue: list[ReviewItem] = Field(default_factory=list)
    reconciled_after: list[str] = Field(default_factory=list)

    def add_review(self, item: ReviewItem) -> None:
        """같은 종류·엔티티의 미해결 항목이 없을 때만 더한다."""
        for existing in self.review_queue:
            if (existing.kind, existing.entity_id, existing.resolved) == (
                item.kind,
                item.entity_id,
                False,
            ):
                existing.blocking = existing.blocking or item.blocking
                return
        self.review_queue.append(item)

    def open_items(self) -> list[ReviewItem]:
        """미해결 항목."""
        return [item for item in self.review_queue if not item.resolved]

    def blocking_items(self, episode_key: str) -> list[ReviewItem]:
        """이 에피소드 번역을 막는 미해결 항목: 그 엔티티가 이 에피소드에 나온다."""
        return [
            item
            for item in self.open_items()
            if item.blocking and episode_key in self.appearances.get(item.entity_id, [item.episode])
        ]

    def record_appearance(self, entity_id: str, episode_key: str) -> None:
        """엔티티 출현 에피소드를 기록한다 (순서 유지, 중복 없음)."""
        episodes = self.appearances.setdefault(entity_id, [])
        if episode_key not in episodes:
            episodes.append(episode_key)
            episodes.sort()


def load_state(path: Path) -> SeriesState:
    """상태를 읽는다. 없으면 빈 상태."""
    path = Path(path)
    if not path.exists():
        return SeriesState()
    return SeriesState.model_validate(json.loads(path.read_text(encoding="utf-8")))


def save_state(state: SeriesState, path: Path) -> None:
    """원자적으로 저장한다."""
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    atomic_write_text(Path(path), state.model_dump_json(indent=1) + "\n")
