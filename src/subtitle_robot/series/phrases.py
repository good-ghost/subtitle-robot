"""`phrases`: 반복 대사·캐치프레이즈 번역 메모리 (PROJECT-PLAN §24.4, WI-6.005).

번역이 끝난 에피소드들에서 같은 대사(정규화한 원문)가 여러 에피소드에 걸쳐 반복되면 가장 이른
번역을 `auto` 로 기록한다 (Q-05 A안). 사람이 `series review` 로 확정(`locked`)·수정한다.
Pass 2 에는 그 대사가 있는 배치에만 참고로 넣고, locked 표현을 쓰지 않으면 lint warning 이다.
규칙은 WI-6.005.
"""

from __future__ import annotations

import json
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

import yaml
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, ValidationError

from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.io.normalize import load_normalized
from subtitle_robot.lang.base import normalize_line
from subtitle_robot.pipeline.context import PhraseHint
from subtitle_robot.pipeline.unitizer import UnitPlan
from subtitle_robot.series.outputs import output_block_texts
from subtitle_robot.series.workspace import SeriesWorkspace

PHRASES_SCHEMA_VERSION: Literal[1] = 1
PhraseStatus = Literal["auto", "locked"]


class PhraseError(ValueError):
    """phrases.yaml 을 읽을 수 없거나 없는 항목이다."""


class Phrase(BaseModel):
    """반복 대사 하나."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: str = Field(pattern=r"^P\d{4,}$")
    src: str
    # 대상 언어 번역 (0.6.0 전 이름 ko 도 읽는다, §26.5)
    target: str = Field(validation_alias=AliasChoices("target", "ko"))
    status: PhraseStatus = "auto"
    rev: int = Field(default=1, ge=1)
    src_lang: str
    episodes: list[str] = Field(default_factory=list)


class PhraseBook(BaseModel):
    """`phrases.yaml`."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal[1] = PHRASES_SCHEMA_VERSION
    phrases: list[Phrase] = Field(default_factory=list)

    def get(self, phrase_id: str) -> Phrase:
        """항목 하나.

        Raises:
            PhraseError: 없는 ID.
        """
        for phrase in self.phrases:
            if phrase.id == phrase_id:
                return phrase
        raise PhraseError(f"반복 대사 {phrase_id} 이 없다")

    def next_id(self) -> str:
        """다음 ID (`P0001` …). 지운 번호는 다시 쓰지 않도록 최대값 다음."""
        numbers = [int(phrase.id[1:]) for phrase in self.phrases]
        return f"P{max(numbers, default=0) + 1:04d}"


def load_phrases(path: Path) -> PhraseBook:
    """phrases.yaml (없으면 빈 메모리). 경로는 `SeriesWorkspace.phrases_path` (대상 언어별).

    Raises:
        PhraseError: YAML·내용이 잘못됐다.
    """
    path = Path(path)
    if not path.exists():
        return PhraseBook()
    try:
        raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        return PhraseBook.model_validate(raw)
    except (yaml.YAMLError, ValidationError) as exc:
        raise PhraseError(f"{path}: {exc}") from exc


def save_phrases(book: PhraseBook, path: Path) -> None:
    """phrases.yaml 을 원자적으로 쓴다."""
    data = book.model_dump(mode="json")
    text = yaml.safe_dump(data, allow_unicode=True, sort_keys=False)
    atomic_write_text(Path(path), text)


@dataclass(frozen=True)
class EpisodeLines:
    """번역이 끝난 에피소드 하나의 (정규화 원문, 번역) 블록들."""

    episode: str
    src_lang: str
    lines: list[tuple[str, str]]


def episode_lines(
    episode: str, work_dir: Path, output_texts: dict[int, str]
) -> EpisodeLines | None:
    """에피소드의 번역된 블록을 (정규화 원문, 번역문)으로. 작업 파일이 없으면 None."""
    normalized = work_dir / "normalized.json"
    units = work_dir / "units.json"
    if not normalized.exists() or not units.exists():
        return None
    doc = load_normalized(normalized)
    plan = UnitPlan.model_validate(json.loads(units.read_text(encoding="utf-8")))
    checkpoint = work_dir / "checkpoint.json"
    lang = (
        json.loads(checkpoint.read_text(encoding="utf-8")).get("src_lang", "ja")
        if checkpoint.exists()
        else "ja"
    )
    lines = [
        (normalize_line(block.text), output_texts[block.idx].strip())
        for block in doc.blocks
        if block.translate and block.idx not in plan.excluded and block.idx in output_texts
    ]
    return EpisodeLines(episode, "en" if lang == "en" else "ja", lines)


@dataclass
class CollectResult:
    """수집 결과."""

    added: list[str] = field(default_factory=list)
    updated: list[str] = field(default_factory=list)


def collect_phrases(
    book: PhraseBook,
    episodes: Sequence[EpisodeLines],
    *,
    min_episodes: int,
    min_chars: int,
    max_chars: int,
    skip: Callable[[str], bool] = lambda _src: False,
) -> CollectResult:
    """여러 에피소드에 반복된 대사를 메모리에 더한다 (book 을 고친다).

    이미 있는 항목의 번역은 바꾸지 않는다 (first-wins). 출현 에피소드만 갱신하고 rev 는 그대로다
    (rev 가 오르면 그 대사를 넣어 번역한 unit 이 stale 이 된다).

    Args:
        book: 반복 대사 메모리.
        episodes: 에피소드 순서의 번역된 블록.
        min_episodes: 이만큼 다른 에피소드에 나와야 기록한다.
        min_chars: 정규화 원문 최소 길이.
        max_chars: 정규화 원문 최대 길이 (긴 문장은 반복 대사가 아니다).
        skip: 기록하지 않을 원문 (용어집 이름 자체 등).
    """
    first: dict[tuple[str, str], str] = {}
    seen: dict[tuple[str, str], list[str]] = {}
    for item in episodes:
        for src, ko in item.lines:
            if not ko or not min_chars <= len(src) <= max_chars or skip(src):
                continue
            key = (item.src_lang, src)
            first.setdefault(key, ko)
            keys = seen.setdefault(key, [])
            if item.episode not in keys:
                keys.append(item.episode)
    existing = {(phrase.src_lang, phrase.src): phrase for phrase in book.phrases}
    result = CollectResult()
    for key, found in seen.items():
        phrase = existing.get(key)
        if phrase is not None:
            merged = sorted(set(phrase.episodes) | set(found))
            if merged != phrase.episodes:
                phrase.episodes = merged
                result.updated.append(phrase.id)
            continue
        if len(found) < min_episodes:
            continue
        lang, src = key
        new = Phrase(
            id=book.next_id(), src=src, target=first[key], src_lang=lang, episodes=sorted(found)
        )
        book.phrases.append(new)
        result.added.append(new.id)
    return result


def set_phrase(book: PhraseBook, phrase_id: str, ko: str) -> Phrase:
    """번역을 고치고 확정한다 (rev 증가).

    Raises:
        PhraseError: 없는 ID 이거나 빈 번역.
    """
    ko = ko.strip()
    if not ko:
        raise PhraseError(f"{phrase_id}: 빈 번역은 쓸 수 없다")
    phrase = book.get(phrase_id)
    if phrase.target != ko:
        phrase.target = ko
        phrase.rev += 1
    phrase.status = "locked"
    return phrase


def accept_phrase(book: PhraseBook, phrase_id: str) -> Phrase:
    """지금 번역으로 확정한다 (번역이 그대로라 rev 는 그대로).

    Raises:
        PhraseError: 없는 ID.
    """
    phrase = book.get(phrase_id)
    phrase.status = "locked"
    return phrase


def remove_phrase(book: PhraseBook, phrase_id: str) -> None:
    """항목을 지운다 (ID 는 다시 쓰지 않는다).

    Raises:
        PhraseError: 없는 ID.
    """
    book.phrases.remove(book.get(phrase_id))


def refresh_phrases(workspace: SeriesWorkspace) -> CollectResult:
    """번역된 에피소드들에서 반복 대사를 다시 모아 phrases.yaml 을 갱신한다 (꺼져 있으면 하지 않음).

    사람이 고친 출력도 반영하도록 실제 출력 파일을 읽는다. 용어집 이름 자체인 줄은 뺀다.
    """
    settings = workspace.settings().phrases
    if not settings.enabled:
        return CollectResult()
    glossary = load_glossary(workspace.glossary_path) if workspace.glossary_path.exists() else None
    names = {
        normalize_line(surface)
        for entry in (glossary.entries if glossary else ())
        for surface in entry.surfaces()
    }
    lines = []
    for episode in workspace.scan().episodes:
        texts = output_block_texts(workspace, episode)
        if texts is None:
            continue
        item = episode_lines(episode.key, workspace.episode_work_dir(episode), texts)
        if item is not None:
            lines.append(item)
    book = load_phrases(workspace.phrases_path)
    result = collect_phrases(
        book,
        lines,
        min_episodes=settings.min_episodes,
        min_chars=settings.min_chars,
        max_chars=settings.max_chars,
        skip=names.__contains__,
    )
    if result.added or result.updated:
        save_phrases(book, workspace.phrases_path)
    return result


def phrase_hints(workspace: SeriesWorkspace, src_lang: str) -> tuple[PhraseHint, ...]:
    """번역 문맥에 넘길 반복 대사 (꺼져 있으면 비어 있다)."""
    if not workspace.settings().phrases.enabled:
        return ()
    return tuple(
        PhraseHint(phrase.id, phrase.src, phrase.target, phrase.rev, phrase.status == "locked")
        for phrase in load_phrases(workspace.phrases_path).phrases
        if phrase.src_lang == src_lang
    )
