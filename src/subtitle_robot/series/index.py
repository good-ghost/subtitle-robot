"""출현 인덱스 `work/index.json` (PROJECT-PLAN §12.4, WI-4.005).

엔티티 ID → [(에피소드, unit, idx)].
에피소드 원문을 용어집 매처로 맞춰 만든다 (ambiguous 매치 제외).
lint 와 부분 재번역(WI-4.006)이 쓴다.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from subtitle_robot.glossary.matcher import TermMatcher
from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.io.normalize import load_normalized
from subtitle_robot.pipeline.unitizer import UnitPlan
from subtitle_robot.series.analysis import episode_language
from subtitle_robot.series.workspace import SeriesWorkspace

INDEX_SCHEMA_VERSION: Literal[1] = 1


class Occurrence(BaseModel):
    """엔티티가 나온 자리."""

    episode: str
    unit: str | None
    idx: int


class OccurrenceIndex(BaseModel):
    """출현 인덱스."""

    schema_version: Literal[1] = INDEX_SCHEMA_VERSION
    entities: dict[str, list[Occurrence]] = Field(default_factory=dict)

    def episodes_of(self, entity_id: str) -> list[str]:
        """엔티티가 나온 에피소드 (순서대로)."""
        return sorted({occ.episode for occ in self.entities.get(entity_id, [])})


def build_index(workspace: SeriesWorkspace) -> OccurrenceIndex:
    """정규화·unit 구성이 있는 에피소드로 인덱스를 만든다."""
    settings = workspace.settings()
    glossary = load_glossary(workspace.glossary_path)
    index = OccurrenceIndex()
    matchers: dict[str, TermMatcher] = {}
    for episode in workspace.scan().episodes:
        work = workspace.episode_work_dir(episode)
        if not (work / "normalized.json").exists():
            continue
        lang = episode_language(episode, settings)
        matcher = matchers.setdefault(lang, TermMatcher(glossary.for_language(lang), lang))
        doc = load_normalized(work / "normalized.json")
        unit_of = _unit_map(work / "units.json")
        for block in doc.blocks:
            if not block.translate:
                continue
            for match in matcher.find(block.text):
                if match.ambiguous:
                    continue
                for entity_id in match.entity_ids:
                    index.entities.setdefault(entity_id, []).append(
                        Occurrence(episode=episode.key, unit=unit_of.get(block.idx), idx=block.idx)
                    )
    return index


def save_index(index: OccurrenceIndex, path: Path) -> None:
    """원자적으로 저장한다."""
    atomic_write_text(Path(path), index.model_dump_json(indent=1) + "\n")


def load_index(path: Path) -> OccurrenceIndex:
    """읽는다. 없으면 빈 인덱스."""
    path = Path(path)
    if not path.exists():
        return OccurrenceIndex()
    return OccurrenceIndex.model_validate(json.loads(path.read_text(encoding="utf-8")))


def _unit_map(path: Path) -> dict[int, str]:
    if not path.exists():
        return {}
    plan = UnitPlan.model_validate(json.loads(path.read_text(encoding="utf-8")))
    return plan.unit_of()
