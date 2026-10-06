"""체크포인트·fingerprint·resume 판정 (PROJECT-PLAN §13, WI-3.010).

결과는 unit 단위로 저장한다 (배치 경계는 모델·예산에 따라 바뀌므로).
fingerprint 는 §13.1 과 같되 엔티티 rev 는 그 unit 원문에 나온 항목만 담는다.
규칙은 docs/work-items/WI-3.010-checkpoint-resume.md.
"""

from __future__ import annotations

import json
from collections.abc import Sequence
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.lang.codes import DEFAULT_TARGET

CHECKPOINT_SCHEMA_VERSION: Literal[1] = 1
ResumePolicy = Literal["ask", "redo", "accept"]
UnitState = Literal["missing", "fresh", "settings", "entities"]


# 나중에 생긴 문맥 키 접두사 (entity_differences 참고)
LATE_CONTEXT_KEYS = ("STORY", "PHR:")


class Fingerprint(BaseModel):
    """unit 번역에 쓴 설정 (§13.1)."""

    model_config = ConfigDict(frozen=True)

    prompt_version: str
    provider: str
    model: str
    params: dict[str, Any] = Field(default_factory=dict)
    style_hash: str
    entities: dict[str, int] = Field(default_factory=dict)

    def settings_differences(self, other: Fingerprint) -> list[str]:
        """엔티티를 뺀 설정의 차이 (사람이 읽는 문장)."""
        diffs = []
        for name in ("prompt_version", "provider", "model", "style_hash"):
            mine, theirs = getattr(self, name), getattr(other, name)
            if mine != theirs:
                diffs.append(f"{name}: {mine} → {theirs}")
        if json.dumps(self.params, sort_keys=True) != json.dumps(other.params, sort_keys=True):
            diffs.append(f"params: {self.params} → {other.params}")
        return diffs

    def entity_differences(self, other: Fingerprint) -> list[str]:
        """엔티티 rev 차이 (self 가 저장된 fingerprint).

        나중에 생긴 문맥(`STORY` 요약, `PHR:` 반복 대사)은 저장된 쪽에 그 키가 없으면
        비교하지 않는다. 그 기능이 없을 때 번역한 unit 을 업그레이드만으로 다시 번역하지 않게 한다
        (WI-6.004).
        """
        keys = sorted(set(self.entities) | set(other.entities))
        return [
            f"{key}: rev {self.entities.get(key, '-')} → {other.entities.get(key, '-')}"
            for key in keys
            if self.entities.get(key) != other.entities.get(key)
            and not (key.startswith(LATE_CONTEXT_KEYS) and key not in self.entities)
        ]


class UnitRecord(BaseModel):
    """unit 하나의 번역 결과."""

    unit_id: str
    idxs: list[int]
    translations: dict[int, str]
    needs_review: list[int] = Field(default_factory=list)
    issues: list[dict[str, Any]] = Field(default_factory=list)
    fingerprint: Fingerprint


class Pass1Record(BaseModel):
    """Pass 1 을 마쳤다는 기록 (이어 실행 때 다시 하지 않는다)."""

    prompt_version: str
    model: str


class Checkpoint(BaseModel):
    """문서 하나의 체크포인트 (`checkpoint.json`)."""

    schema_version: Literal[1] = CHECKPOINT_SCHEMA_VERSION
    source_sha256: str
    src_lang: str
    # 0.6.0 전 체크포인트에는 없다 (한국어 번역, §26.1)
    target_lang: str = DEFAULT_TARGET
    pass1: Pass1Record | None = None
    units: dict[str, UnitRecord] = Field(default_factory=dict)


class StaleCheckpointError(RuntimeError):
    """설정이 바뀐 뒤 이어 실행: 정책이 ask 라 멈췄다. 메시지에 차이를 담는다."""

    def __init__(self, details: list[str]) -> None:
        super().__init__(
            "이전 번역과 설정이 다르다. "
            "--redo-stale(다시 번역) 또는 --accept-stale(유지)을 지정해야 한다:\n"
            + "\n".join(f"  {line}" for line in details)
        )
        self.details = details


def unit_key(idxs: Sequence[int]) -> str:
    """unit 저장 키: idx 구성 (unit ID 는 unit 구성이 바뀌면 다른 블록을 가리킬 수 있다)."""
    return ",".join(str(idx) for idx in idxs)


def classify(record: UnitRecord | None, idxs: Sequence[int], current: Fingerprint) -> UnitState:
    """저장된 unit 결과의 상태."""
    if record is None or record.idxs != list(idxs):
        return "missing"
    if record.fingerprint.settings_differences(current):
        return "settings"
    if record.fingerprint.entity_differences(current):
        return "entities"
    return "fresh"


def load_checkpoint(
    path: Path, *, source_sha256: str, src_lang: str, target_lang: str = DEFAULT_TARGET
) -> tuple[Checkpoint, str | None]:
    """체크포인트를 읽는다.

    Returns:
        (체크포인트, 버린 이유). 없으면 빈 체크포인트와 None. 원본 해시·원본·대상 언어·스키마가
        다르면 빈 체크포인트와 그 이유 (처음부터 다시 번역한다, §13.2).
    """
    path = Path(path)
    empty = Checkpoint(source_sha256=source_sha256, src_lang=src_lang, target_lang=target_lang)
    if not path.exists():
        return empty, None
    raw = json.loads(path.read_text(encoding="utf-8"))
    if raw.get("schema_version") != CHECKPOINT_SCHEMA_VERSION:
        return empty, f"체크포인트 schema_version {raw.get('schema_version')!r} 을 지원하지 않는다"
    checkpoint = Checkpoint.model_validate(raw)
    if checkpoint.source_sha256 != source_sha256:
        return empty, "원본 파일이 바뀌었다"
    if checkpoint.src_lang != src_lang:
        return empty, f"원본 언어가 바뀌었다 ({checkpoint.src_lang} → {src_lang})"
    if checkpoint.target_lang != target_lang:
        return empty, f"대상 언어가 바뀌었다 ({checkpoint.target_lang} → {target_lang})"
    return checkpoint, None


def save_checkpoint(checkpoint: Checkpoint, path: Path) -> None:
    """원자적으로 저장한다."""
    atomic_write_text(Path(path), checkpoint.model_dump_json(indent=1) + "\n")
