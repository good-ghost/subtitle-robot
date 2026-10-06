"""용어집 YAML 저장·로드 (PROJECT-PLAN §5, §12.2, WI-2.002).

디스크 형식은 YAML(사람이 고친다), LLM 과의 교환 형식은 JSON 이다 (§6.5).
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from pydantic import ValidationError

from subtitle_robot.glossary.model import GLOSSARY_SCHEMA_VERSION, Glossary, GlossaryError
from subtitle_robot.io.atomic import atomic_write_text


def load_glossary(path: Path) -> Glossary:
    """`glossary.yaml` 을 읽는다.

    Raises:
        GlossaryError: 파일이 없거나, YAML 문법·schema_version·내용이 잘못됐다. 위치를 담는다.
    """
    path = Path(path)
    try:
        raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise GlossaryError(f"용어집 파일이 없다: {path}") from exc
    except yaml.YAMLError as exc:
        raise GlossaryError(f"{path}: YAML 문법 오류: {exc}") from exc
    if not isinstance(raw, dict):
        raise GlossaryError(f"{path}: 최상위는 매핑이어야 한다")
    version = raw.get("schema_version")
    if version != GLOSSARY_SCHEMA_VERSION:
        raise GlossaryError(
            f"{path}: 용어집 schema_version {version!r} 은 지원하지 않는다 "
            f"(지원: {GLOSSARY_SCHEMA_VERSION})"
        )
    return parse_glossary(raw, source=str(path))


def parse_glossary(raw: dict[str, Any], *, source: str) -> Glossary:
    """dict 를 검증해 용어집으로 만든다."""
    try:
        return Glossary.model_validate(raw)
    except ValidationError as exc:
        details = "; ".join(
            f"{'.'.join(str(part) for part in error['loc']) or '(전체)'}: {error['msg']}"
            for error in exc.errors()
        )
        raise GlossaryError(f"{source}: 용어집 값 오류 — {details}") from exc


def dump_glossary(glossary: Glossary) -> str:
    """YAML 문자열. 비어 있는 선택 필드는 쓰지 않는다."""
    data = glossary.model_dump(mode="json", by_alias=True, exclude_none=True)
    for entry in data["entries"]:
        for key in ("variants", "avoid", "seen_suffixes"):
            if not entry.get(key):
                entry.pop(key, None)
        for variant in entry.get("variants", []):
            for key in ("target", "reading"):
                if variant.get(key) is None:
                    variant.pop(key, None)
    if not data["relations"]:
        data.pop("relations")
    return yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=1000)


def save_glossary(glossary: Glossary, path: Path) -> None:
    """원자적으로 저장한다 (임시 파일 → rename)."""
    atomic_write_text(Path(path), dump_glossary(glossary))
