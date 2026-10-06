"""시리즈 전역 reconcile (PROJECT-PLAN §4.2, §12.3, WI-4.003).

모든 에피소드를 분석한 뒤 LLM 이 자동 수락·제안 항목을 함께 보고 같은 엔티티로 보이는 묶음과
의심스러운 표기를 찾는다. 결과는 검토 대기열에 제안으로만 넣는다 —
자동 수락 항목은 first-wins(§12.1, §20)이고, 항목을 지우면 ID 가 재사용될 수 있다.
규칙은 docs/work-items/WI-4.003-series-modes.md.
"""

from __future__ import annotations

import json
import logging
from string import Template

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, ValidationError

from subtitle_robot.glossary.model import Glossary
from subtitle_robot.lang.base import LanguageCode
from subtitle_robot.lang.codes import DEFAULT_TARGET, language_name
from subtitle_robot.lang.target import is_korean, schema_for_target
from subtitle_robot.llm.base import ChatMessage, ChatRequest, LlmAdapter
from subtitle_robot.series.state import ReviewItem, SeriesState

logger = logging.getLogger(__name__)

# 대상 ko 는 0.6.0 전 프롬프트 그대로, 다른 대상은 GENERIC_PROMPT (§26.5)
SYSTEM_PROMPT = """You review a Korean subtitle glossary collected from several episodes
of one series.
Each line is: id | original name | Hangul spelling | variants.

Find:
1. "same_entity": entries that clearly refer to the same person/place/thing written
   differently (spelling variants, typos, nickname vs full name). Pick the entry to keep.
2. "spelling": entries whose Hangul spelling looks wrong for the original name.

Only report clear cases. Use only ids from the list. Output ONLY JSON:
{"same_entity": [{"keep": "E0003", "merge": ["E0010"], "reason": "..."}],
 "spelling": [{"entity_id": "E0004", "suggested_ko": "...", "reason": "..."}]}
"""


GENERIC_PROMPT = """You review a subtitle glossary for translation into ${tgt_lang},
collected from several episodes of one series.
Each line is: id | original name | ${tgt_lang} spelling | variants.

Find:
1. "same_entity": entries that clearly refer to the same person/place/thing written
   differently (spelling variants, typos, nickname vs full name). Pick the entry to keep.
2. "spelling": entries whose ${tgt_lang} spelling looks wrong for the original name.

Only report clear cases. Use only ids from the list. Output ONLY JSON:
{"same_entity": [{"keep": "E0003", "merge": ["E0010"], "reason": "..."}],
 "spelling": [{"entity_id": "E0004", "suggested": "...", "reason": "..."}]}
"""


class _Lenient(BaseModel):
    model_config = ConfigDict(extra="ignore")


class SameEntity(_Lenient):
    """같은 엔티티 묶음."""

    keep: str
    merge: list[str] = Field(default_factory=list)
    reason: str = ""


class SpellingIssue(_Lenient):
    """의심스러운 표기."""

    entity_id: str
    suggested: str = Field(validation_alias=AliasChoices("suggested_ko", "suggested"))
    reason: str = ""


class ReconcileOutput(_Lenient):
    """reconcile 응답."""

    same_entity: list[SameEntity] = Field(default_factory=list)
    spelling: list[SpellingIssue] = Field(default_factory=list)


def reconcile_glossary(
    glossary: Glossary,
    state: SeriesState,
    adapter: LlmAdapter,
    lang: LanguageCode,
    *,
    target: str = DEFAULT_TARGET,
    episode_label: str,
    blocking: bool,
) -> ReconcileOutput | None:
    """자동 수락·제안 항목을 LLM 으로 검토해 제안을 대기열에 넣는다. 응답이 쓸 수 없으면 None."""
    candidates = [e for e in glossary.for_language(lang) if e.status in ("auto", "proposed")]
    if len(candidates) < 2:
        return ReconcileOutput()
    lines = [
        f"{e.id} | {e.source} | {e.target} | {', '.join(v.src for v in e.variants)}"
        for e in candidates
    ]
    chat = adapter.chat(
        ChatRequest(
            messages=[
                ChatMessage(role="system", content=_system_prompt(target)),
                ChatMessage(role="user", content="\n".join(lines)),
            ],
            output_schema=schema_for_target(ReconcileOutput.model_json_schema(), target),
            schema_name="reconcile_output",
        )
    )
    try:
        output = ReconcileOutput.model_validate(json.loads(chat.json_text))
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.warning("reconcile response unusable: %s", exc)
        return None
    known = {e.id: e for e in candidates}
    for group in output.same_entity:
        members = [eid for eid in [group.keep, *group.merge] if eid in known]
        if len(members) < 2 or group.keep not in known:
            continue
        names = ", ".join(f"{eid} {known[eid].source}={known[eid].target}" for eid in members)
        for eid in members[1:]:
            state.add_review(
                ReviewItem(
                    kind="merge",
                    entity_id=eid,
                    episode=episode_label,
                    detail=f"{group.keep} 과 같은 엔티티로 보임: {names} ({group.reason})",
                    blocking=blocking,
                )
            )
    for issue in output.spelling:
        entry = known.get(issue.entity_id)
        # 제안 표기가 지금과 같으면 고칠 것이 없다 (시리즈 E2E: "로지 → 로지")
        if entry is None or issue.suggested.strip() == entry.target:
            continue
        state.add_review(
            ReviewItem(
                kind="conflict",
                entity_id=issue.entity_id,
                episode=episode_label,
                detail=f"{entry.target} → {issue.suggested}: {issue.reason}",
                blocking=blocking,
            )
        )
    return output


def _system_prompt(target: str) -> str:
    if is_korean(target):
        return SYSTEM_PROMPT
    return Template(GENERIC_PROMPT).substitute(tgt_lang=language_name(target))
