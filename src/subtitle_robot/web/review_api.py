"""자막 검수 API (WI-7.009). 대상은 처리 기록 번호로만 가리킨다 (파일 경로를 받지 않는다)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from subtitle_robot.watch.ledger import LedgerEntry, LedgerError
from subtitle_robot.web.context import Context
from subtitle_robot.web.review import (
    MAX_TEXT_LENGTH,
    ReviewError,
    ReviewRow,
    load_review,
    save_text,
)

router = APIRouter(prefix="/api")

# 줄바꿈·앞뒤 공백을 다듬기 전 길이라 여유를 둔다 (다듬은 뒤 길이는 review.clean_text 가 본다)
_RAW_TEXT_LIMIT = MAX_TEXT_LENGTH * 4
_NOT_FOUND = frozenset({"review_unavailable", "subtitle_not_found", "block_not_found"})


class ReviewNoteOut(BaseModel):
    """번역 리포트의 검사 결과."""

    code: str
    severity: str
    detail: str


class ReviewRowOut(BaseModel):
    """검수할 블록. start·end 는 초 (시각 줄을 읽지 못했으면 None)."""

    index: int
    start: float | None
    end: float | None
    source: str
    text: str
    needs_review: bool
    notes: list[ReviewNoteOut]
    reviewed: bool


class ReviewOut(BaseModel):
    """검수 화면의 자막."""

    id: int
    video: str
    name: str
    subtitles: list[str]
    source_name: str | None
    aligned: bool
    edited: bool
    rows: list[ReviewRowOut]


class ReviewIn(BaseModel):
    """블록 하나 저장 요청."""

    name: str
    index: int = Field(ge=1)
    text: str = Field(max_length=_RAW_TEXT_LIMIT)


@router.get("/ledger/{entry_id}/review")
def get_review(entry_id: int, context: Context, name: str | None = None) -> ReviewOut:
    """처리 기록의 번역 자막을 원본과 나란히 (블록마다 검토 필요·검수 완료 표시)."""
    entry = _entry(context, entry_id)
    try:
        review = load_review(entry, context.config, context.data_dir, name)
    except ReviewError as exc:
        raise _http(exc) from exc
    return ReviewOut(
        id=entry.id,
        video=entry.path.name,
        name=review.name,
        subtitles=review.subtitles,
        source_name=review.source_name,
        aligned=review.aligned,
        edited=review.edited,
        rows=[_row(row) for row in review.rows],
    )


@router.put("/ledger/{entry_id}/review")
def put_review(entry_id: int, body: ReviewIn, context: Context) -> ReviewRowOut:
    """번역 자막 블록 하나의 글자를 저장하고 검수 완료로 적는다."""
    entry = _entry(context, entry_id)
    try:
        row = save_text(
            entry, context.config, context.data_dir, body.name, body.index, body.text
        )
    except ReviewError as exc:
        raise _http(exc) from exc
    return _row(row)


def _entry(context: Context, entry_id: int) -> LedgerEntry:
    try:
        return context.ledger.get(entry_id)
    except LedgerError as exc:
        raise HTTPException(status_code=404, detail="ledger_not_found") from exc


def _http(error: ReviewError) -> HTTPException:
    return HTTPException(status_code=404 if error.code in _NOT_FOUND else 400, detail=error.code)


def _seconds(value: int | None) -> float | None:
    return None if value is None else value / 1000


def _row(row: ReviewRow) -> ReviewRowOut:
    return ReviewRowOut(
        index=row.index,
        start=_seconds(row.start_ms),
        end=_seconds(row.end_ms),
        source=row.source,
        text=row.text,
        needs_review=row.needs_review,
        notes=[ReviewNoteOut(code=n.code, severity=n.severity, detail=n.detail) for n in row.notes],
        reviewed=row.reviewed,
    )
