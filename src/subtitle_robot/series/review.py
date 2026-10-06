"""시리즈 검토 `series review` (PROJECT-PLAN §12.1, §12.3, WI-4.004).

검토 대기열(충돌·낮은 신뢰도·proposed·승격·병합 제안)을 보여주고 사람의 결정을 반영한다.
- accept: 지금 표기로 확정 (status locked)
- set: 표기를 고친다 (locked, target_source manual, rev 증가, 이전 표기는 avoid)
- promote: scope 를 series 로 (메타데이터라 rev 는 그대로)
- dismiss: 항목만 닫는다
TUI·CSV 왕복 편집은 고도화 범위다 (§19).
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field

from subtitle_robot.glossary.model import (
    Glossary,
    GlossaryError,
    avoid_with_old,
    respell_variants,
    set_metadata,
    update_entry,
)
from subtitle_robot.glossary.store import load_glossary, save_glossary
from subtitle_robot.series.state import ReviewItem, SeriesState, load_state, save_state
from subtitle_robot.series.workspace import SeriesWorkspace


@dataclass
class ReviewResult:
    """검토 반영 결과."""

    locked: list[str] = field(default_factory=list)
    changed: dict[str, str] = field(default_factory=dict)
    promoted: list[str] = field(default_factory=list)
    dismissed: list[str] = field(default_factory=list)
    remaining: list[ReviewItem] = field(default_factory=list)


def open_review_items(workspace: SeriesWorkspace) -> list[ReviewItem]:
    """미해결 검토 항목."""
    return load_state(workspace.state_path).open_items()


def apply_review(
    workspace: SeriesWorkspace,
    *,
    accept: Iterable[str] = (),
    set_ko: Mapping[str, str] | None = None,
    promote: Iterable[str] = (),
    dismiss: Iterable[str] = (),
    accept_all: bool = False,
) -> ReviewResult:
    """검토 결정을 용어집과 대기열에 반영한다.

    Raises:
        GlossaryError: 없는 엔티티 ID 이거나 표기 값이 잘못됐다.
    """
    glossary = load_glossary(workspace.glossary_path)
    state = load_state(workspace.state_path)
    result = ReviewResult()
    set_ko = dict(set_ko or {})
    accept_ids = list(accept)
    if accept_all:
        accept_ids.extend(item.entity_id for item in state.open_items() if item.kind != "promote")

    for entity_id, ko in set_ko.items():
        glossary = _set_spelling(glossary, entity_id, ko)
        result.changed[entity_id] = ko
        _resolve(state, entity_id, exclude=("promote",))
    for entity_id in dict.fromkeys(accept_ids):
        if entity_id in set_ko:
            continue
        glossary = update_entry(glossary, entity_id, origin="user", status="locked")
        result.locked.append(entity_id)
        _resolve(state, entity_id, exclude=("promote",))
    for entity_id in promote:
        glossary = set_metadata(glossary, entity_id, scope="series")
        result.promoted.append(entity_id)
        _resolve(state, entity_id, only=("promote",))
    for entity_id in dismiss:
        glossary.get(entity_id)  # 없는 ID 면 오류
        _resolve(state, entity_id)
        result.dismissed.append(entity_id)

    save_glossary(glossary, workspace.glossary_path)
    save_state(state, workspace.state_path)
    result.remaining = state.open_items()
    return result


def _set_spelling(glossary: Glossary, entity_id: str, ko: str) -> Glossary:
    ko = ko.strip()
    if not ko:
        raise GlossaryError(f"{entity_id}: 빈 표기는 쓸 수 없다")
    entry = glossary.get(entity_id)
    return update_entry(
        glossary,
        entity_id,
        origin="user",
        target=ko,
        target_source="manual",
        status="locked",
        avoid=avoid_with_old(entry.avoid, old=entry.target, new=ko),
        variants=respell_variants(entry.variants, old=entry.target, new=ko),
    )


def _resolve(
    state: SeriesState,
    entity_id: str,
    *,
    only: tuple[str, ...] = (),
    exclude: tuple[str, ...] = (),
) -> None:
    for item in state.review_queue:
        if item.resolved or item.entity_id != entity_id:
            continue
        if (only and item.kind not in only) or item.kind in exclude:
            continue
        item.resolved = True
