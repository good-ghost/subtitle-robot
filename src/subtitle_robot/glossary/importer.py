"""공식 현지화 이름 가져오기 `glossary import` (PROJECT-PLAN §8.5, WI-2.008).

정발판 등 공식 현지화 이름(대상 언어)을 CSV 로 가져와 `target_source: official` 로 등록한다.
- 출처 우선순위(manual > official > generated > llm)를 따른다: manual 항목은 건너뛴다
- 가져온 항목은 사람이 확정한 이름이므로 `locked` 로 둔다
- 표기가 바뀌면 이전 표기를 `avoid` 에 넣는다 (이미 번역된 곳의 옛 표기를 검증이 잡는다)
- 원문이 항목의 변형(성만, 이름만 등)과 같으면 그 변형의 표기를 바꾼다

CSV: 머리글 필수. `source`, `target`(0.6.0 전 이름 `ko`) 은 필수, `type`, `reading`, `src_lang`,
`note` 는 선택.
UTF-8(BOM 허용).
"""

from __future__ import annotations

import csv
from dataclasses import dataclass, field
from pathlib import Path
from typing import cast, get_args

from subtitle_robot.glossary.model import (
    TARGET_SOURCE_PRIORITY,
    EntityType,
    Glossary,
    GlossaryEntry,
    GlossaryError,
    add_entry,
    avoid_with_old,
    next_entity_id,
    respell_variants,
    update_entry,
)
from subtitle_robot.lang.codes import is_language_code

# 표기 열: target (0.6.0 전 이름 ko 도 받는다, §26.5)
_TARGET_COLUMNS = ("target", "ko")
_KNOWN_COLUMNS = {"source", *_TARGET_COLUMNS, "type", "reading", "src_lang", "note"}


class GlossaryImportError(GlossaryError):
    """가져오기 파일이 형식에 맞지 않는다."""


@dataclass(frozen=True)
class OfficialRow:
    """CSV 한 줄."""

    line_no: int
    source: str
    target: str
    type: EntityType | None = None
    reading: str | None = None
    src_lang: str | None = None
    note: str | None = None


@dataclass
class ImportReport:
    """가져오기 결과 (리포트·CLI 출력용)."""

    added: list[str] = field(default_factory=list)
    updated: list[str] = field(default_factory=list)
    variants_updated: list[str] = field(default_factory=list)
    unchanged: list[str] = field(default_factory=list)
    skipped_manual: list[str] = field(default_factory=list)


def read_official_csv(path: Path) -> list[OfficialRow]:
    """공식 이름 CSV 를 읽는다.

    Raises:
        GlossaryImportError: 필수 열이 없거나, 모르는 열·빈 값·잘못된 type/src_lang 이 있다.
    """
    path = Path(path)
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        columns = set(reader.fieldnames or ())
        missing = [] if "source" in columns else ["source"]
        if not columns & set(_TARGET_COLUMNS):
            missing.append("target")
        if missing:
            raise GlossaryImportError(f"{path}: 필수 열이 없다: {', '.join(missing)}")
        if set(_TARGET_COLUMNS) <= columns:
            raise GlossaryImportError(f"{path}: target 과 ko 열을 함께 쓸 수 없다")
        unknown = columns - _KNOWN_COLUMNS
        if unknown:
            raise GlossaryImportError(f"{path}: 모르는 열: {', '.join(sorted(unknown))}")
        return [_parse_row(path, line_no, row) for line_no, row in enumerate(reader, start=2)]


def _parse_row(path: Path, line_no: int, row: dict[str, str]) -> OfficialRow:
    def value(column: str) -> str | None:
        text = (row.get(column) or "").strip()
        return text or None

    source = value("source")
    target = value("target") or value("ko")
    if source is None or target is None:
        raise GlossaryImportError(f"{path}:{line_no}: source 와 target 은 비울 수 없다")
    entity_type = value("type")
    if entity_type is not None and entity_type not in get_args(EntityType):
        raise GlossaryImportError(f"{path}:{line_no}: 모르는 type: {entity_type}")
    src_lang = value("src_lang")
    if src_lang is not None and not is_language_code(src_lang):
        raise GlossaryImportError(
            f"{path}:{line_no}: src_lang 은 ISO 639-1 코드 (en, ja, fr …): {src_lang}"
        )
    return OfficialRow(
        line_no=line_no,
        source=source,
        target=target,
        type=cast("EntityType | None", entity_type),
        reading=value("reading"),
        src_lang=src_lang,
        note=value("note"),
    )


def import_official(
    glossary: Glossary,
    rows: list[OfficialRow],
    *,
    default_src_lang: str,
    default_type: EntityType = "person",
) -> tuple[Glossary, ImportReport]:
    """공식 이름을 용어집에 반영한다.

    Args:
        glossary: 원래 용어집.
        rows: CSV 행.
        default_src_lang: 행에 src_lang 이 없을 때 (시리즈의 src_lang).
        default_type: 행에 type 이 없고 새로 추가할 때.

    Returns:
        (새 용어집, 결과 보고).
    """
    report = ImportReport()
    for row in rows:
        glossary = _apply_row(glossary, row, report, default_src_lang, default_type)
    return glossary, report


def _apply_row(
    glossary: Glossary,
    row: OfficialRow,
    report: ImportReport,
    default_src_lang: str,
    default_type: EntityType,
) -> Glossary:
    src_lang = row.src_lang or default_src_lang
    entry = _find_by_source(glossary, row.source, src_lang)
    if entry is not None:
        return _update_body(glossary, entry, row, report)
    owner = _find_by_variant(glossary, row.source, src_lang)
    if owner is not None:
        return _update_variant(glossary, owner, row, report)

    new_entry = GlossaryEntry(
        id=next_entity_id(glossary),
        type=row.type or default_type,
        status="locked",
        src_lang=src_lang,
        source=row.source,
        target=row.target,
        target_source="official",
        reading=row.reading,
        note=row.note,
    )
    report.added.append(new_entry.id)
    return add_entry(glossary, new_entry)


def _update_body(
    glossary: Glossary, entry: GlossaryEntry, row: OfficialRow, report: ImportReport
) -> Glossary:
    if TARGET_SOURCE_PRIORITY[entry.target_source] > TARGET_SOURCE_PRIORITY["official"]:
        report.skipped_manual.append(entry.id)
        return glossary
    avoid = avoid_with_old(entry.avoid, old=entry.target, new=row.target)
    updated = update_entry(
        glossary,
        entry.id,
        origin="user",
        target=row.target,
        target_source="official",
        status="locked",
        avoid=avoid,
        variants=respell_variants(entry.variants, old=entry.target, new=row.target),
        **({"reading": row.reading} if row.reading else {}),
    )
    (report.unchanged if updated is glossary else report.updated).append(entry.id)
    return updated


def _update_variant(
    glossary: Glossary, entry: GlossaryEntry, row: OfficialRow, report: ImportReport
) -> Glossary:
    if TARGET_SOURCE_PRIORITY[entry.target_source] > TARGET_SOURCE_PRIORITY["official"]:
        report.skipped_manual.append(entry.id)
        return glossary
    old_ko: str | None = None
    variants = []
    for variant in entry.variants:
        if variant.src == row.source:
            old_ko = variant.target
            variant = variant.model_copy(update={"target": row.target})
        variants.append(variant)
    updated = update_entry(
        glossary,
        entry.id,
        origin="user",
        variants=tuple(variants),
        status="locked",
        avoid=avoid_with_old(entry.avoid, old=old_ko, new=row.target),
    )
    (report.unchanged if updated is glossary else report.variants_updated).append(entry.id)
    return updated


def _find_by_source(glossary: Glossary, source: str, lang: str) -> GlossaryEntry | None:
    return next((e for e in glossary.entries if e.source == source and e.src_lang == lang), None)


def _find_by_variant(glossary: Glossary, source: str, lang: str) -> GlossaryEntry | None:
    return next(
        (
            entry
            for entry in glossary.entries
            if entry.src_lang == lang and any(v.src == source for v in entry.variants)
        ),
        None,
    )
