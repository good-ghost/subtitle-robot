"""Pass 2 요청 문맥 조립 (PROJECT-PLAN §10.4, §10.5, WI-3.006).

순서 고정: 용어집·경칭·relations·스타일 → 직전 번역 → 다음 원문 → 번역 대상.
앞부분이 배치마다 거의 같아 llama-server 프롬프트 캐시가 잘 맞는다 (§6.4).
LLM 에는 ASS 태그를 뺀 텍스트를 보내고, 블록 앞 태그는 출력 때 복원하도록 기록한다 (Q-01).
"""

from __future__ import annotations

import json
import re
import zlib
from collections.abc import Callable, Iterable, Mapping, Sequence
from dataclasses import dataclass, field

from subtitle_robot.glossary.honorifics import HonorificForm, HonorificResolver
from subtitle_robot.glossary.matcher import TermMatcher
from subtitle_robot.glossary.model import GlossaryEntry, Relation
from subtitle_robot.io.normalize import NormalizedDocument
from subtitle_robot.lang.base import LanguageCode, normalize_line
from subtitle_robot.lang.target import is_korean
from subtitle_robot.pipeline.style import StylePolicy
from subtitle_robot.pipeline.unitizer import Unit, UnitPlan

# fingerprint 의 요약 키 (checkpoint.LATE_CONTEXT_KEYS 의 "STORY")
STORY_KEY = "STORY"
# fingerprint 의 반복 대사 키 접두사 (checkpoint.LATE_CONTEXT_KEYS 의 "PHR:")
PHRASE_KEY_PREFIX = "PHR:"


@dataclass(frozen=True)
class PhraseHint:
    """문맥에 넣을 반복 대사 (series.phrases 의 항목, WI-6.005).

    Attributes:
        id: `P0001`.
        src: 정규화한 원문 (`lang.base.normalize_line`).
        target: 번역 (대상 언어).
        rev: 바뀔 때마다 오르는 번호 (fingerprint).
        locked: 사람이 확정했다.
    """

    id: str
    src: str
    target: str
    rev: int
    locked: bool = False


_ASS_TAG_RE = re.compile(r"\{\\[^}]*\}")
_LEADING_ASS_RE = re.compile(r"^(?:\s*\{\\[^}]*\})+")


@dataclass(frozen=True)
class SourceBlock:
    """LLM 에 보낼 원문 블록.

    Attributes:
        idx: 블록 인덱스.
        text: ASS 태그를 뺀 원문 (`<i>` 등 HTML 태그는 남긴다).
        leading_tags: 블록 앞 ASS 태그 원문. 번역문 앞에 복원한다 (Q-01).
        inner_tags: 블록 중간 ASS 태그. 위치를 알 수 없어 리포트에만 남긴다.
    """

    idx: int
    text: str
    leading_tags: str = ""
    inner_tags: tuple[str, ...] = ()


def prepare_source(idx: int, text: str) -> SourceBlock:
    """원문에서 ASS 태그를 분리한다."""
    leading_match = _LEADING_ASS_RE.match(text)
    leading = leading_match.group(0).strip() if leading_match else ""
    rest = text[leading_match.end() :] if leading_match else text
    inner = tuple(_ASS_TAG_RE.findall(rest))
    return SourceBlock(idx, _ASS_TAG_RE.sub("", rest).strip(), leading, inner)


@dataclass(frozen=True)
class BatchRequest:
    """배치 하나의 Pass 2 요청 내용.

    Attributes:
        batch_id: 배치 ID.
        unit_ids: 번역할 unit (재요청이면 일부).
        idxs: 번역할 블록.
        user_message: 사용자 메시지 전체.
        entity_revs: 주입한 용어집 항목과 rev (fingerprint §13.1).
        suffixes: 주입한 경칭 접미사.
    """

    batch_id: str
    unit_ids: tuple[str, ...]
    idxs: tuple[int, ...]
    user_message: str
    entity_revs: dict[str, int] = field(default_factory=dict)
    suffixes: tuple[str, ...] = ()


@dataclass(frozen=True)
class ContextSettings:
    """문맥 크기 (§10.4)."""

    previous_blocks: int = 3
    upcoming_blocks: int = 3


class ContextBuilder:
    """문서 하나의 Pass 2 문맥을 만든다."""

    def __init__(
        self,
        doc: NormalizedDocument,
        plan: UnitPlan,
        entries: Sequence[GlossaryEntry],
        lang: LanguageCode,
        style: StylePolicy,
        settings: ContextSettings | None = None,
        *,
        relations: Sequence[Relation] = (),
        episode: str | None = None,
        story: str = "",
        phrases: Sequence[PhraseHint] = (),
    ) -> None:
        """문맥 조립기를 만든다.

        Args:
            relations: 용어집 relations (§12.2). 배치에 두 인물이 모두 나올 때만 넣는다.
            episode: 지금 에피소드 (`S01E05`). relations 의 valid_from 비교에 쓴다.
            story: 직전 에피소드 요약 (§24.3). 에피소드 안에서 고정이라 관계 다음에 둔다
                (llama-server 프롬프트 캐시).
            phrases: 반복 대사 메모리 (§24.4). 배치 원문에 있는 것만 넣는다.
        """
        self._story = story.strip()
        self._phrases = list(phrases)
        self._plan = plan
        self._units: dict[str, Unit] = {unit.unit_id: unit for unit in plan.units}
        self._entries = {entry.id: entry for entry in entries if entry.src_lang == lang}
        self._matcher = TermMatcher(self._entries.values(), lang)
        self._resolver = HonorificResolver(
            style.honorifics_policy,
            {s: HonorificForm(c.ko, c.space) for s, c in style.honorifics_custom.items()},
        )
        # 경칭 표·말투 단계는 한국어 대상 전용이다 (§26.3)
        self._korean = is_korean(style.target_lang)
        self._style = style
        self._relations = [r for r in relations if _relation_active(r, episode)]
        self._settings = settings or ContextSettings()
        self.sources: dict[int, SourceBlock] = {
            block.idx: prepare_source(block.idx, block.text) for block in doc.blocks
        }
        self._translatable = [idx for unit in plan.units for idx in unit.idxs]

    def build(
        self,
        batch_id: str,
        unit_ids: Sequence[str],
        previous: Sequence[tuple[int, str]] = (),
    ) -> BatchRequest:
        """배치 요청을 만든다.

        Args:
            batch_id: 배치 ID.
            unit_ids: 번역할 unit.
            previous: 직전 번역 (idx, 번역문). 마지막 N 개만 쓴다.
        """
        units = [self._units[unit_id] for unit_id in unit_ids]
        idxs = tuple(idx for unit in units for idx in unit.idxs)
        glossary_text, entity_ids, suffixes = self._glossary_and_suffixes(idxs)
        relation_lines = [self._relation_line(r) for r in self._relations_among(entity_ids)]
        relation_suffixes = [
            r.address_name.suffix
            for r in self._relations_among(entity_ids)
            if r.address_name and r.address_name.suffix
        ]
        honorifics = self._honorifics([*suffixes, *relation_suffixes])
        n_prev = self._settings.previous_blocks
        previous_lines = [
            f"{idx}: {self.sources[idx].text} => {ko}"
            for idx, ko in (list(previous)[-n_prev:] if n_prev else [])
        ]
        upcoming_lines = [f"{idx}: {self.sources[idx].text}" for idx in self._upcoming(idxs)]
        payload = {
            "units": [
                {
                    "unit": unit.unit_id,
                    "blocks": [{"idx": i, "src": self.sources[i].text} for i in unit.idxs],
                }
                for unit in units
            ]
        }
        story = (
            [_section("story_so_far", self._story, 'context_only="true"')] if self._story else []
        )
        phrases = self._phrases_in(idx for unit in units for idx in unit.idxs)
        phrase_section = (
            [
                _section(
                    "phrases", "\n".join(_phrase_line(p) for p in phrases), 'context_only="true"'
                )
            ]
            if phrases
            else []
        )
        message = "\n".join(
            [
                _section("glossary", glossary_text),
                _section("honorifics", honorifics),
                _section("relations", "\n".join(relation_lines)),
                *story,
                *phrase_section,
                _section("style", self._style.prompt_block()),
                _section("previous_translations", "\n".join(previous_lines)),
                _section("upcoming_context", "\n".join(upcoming_lines), 'do_not_translate="true"'),
                _section("translate", json.dumps(payload, ensure_ascii=False)),
            ]
        )
        return BatchRequest(
            batch_id=batch_id,
            unit_ids=tuple(unit_ids),
            idxs=idxs,
            user_message=message,
            entity_revs={**self._revs(entity_ids), **_phrase_revs(phrases)},
            suffixes=tuple(suffixes),
        )

    def entity_revs(self, idxs: Sequence[int]) -> dict[str, int]:
        """블록 원문에서 매칭된 용어집 항목과 rev, 적용되는 relations 의 내용 해시 (§13.1).

        relations 에는 rev 가 없어 내용 해시(`REL:E0007>E0012`)를 함께 넣는다. 관계를 고치면
        그 관계가 쓰인 unit 이 stale(entities) 가 되어 부분 재번역(--changed) 대상이 된다.
        요약(`STORY`)·반복 대사(`PHR:P0001`)도 같은 방식이다 (WI-6.004, WI-6.005).
        """
        _, entity_ids, _ = self._glossary_and_suffixes(idxs)
        return {**self._revs(entity_ids), **_phrase_revs(self._phrases_in(idxs))}

    def _revs(self, entity_ids: set[str]) -> dict[str, int]:
        revs = {eid: self._entries[eid].rev for eid in sorted(entity_ids)}
        if self._story:
            revs[STORY_KEY] = zlib.crc32(self._story.encode())
        for relation in self._relations_among(entity_ids):
            content = relation.model_dump_json(by_alias=True).encode()
            revs[f"REL:{relation.from_id}>{relation.to}"] = zlib.crc32(content)
        return revs

    def _phrases_in(self, idxs: Iterable[int]) -> list[PhraseHint]:
        """줄 전체가 반복 대사와 같은 블록의 항목 (정규화 후 일치).

        부분 일치는 `この`·`いや` 같은 짧은 말이 거의 모든 배치에 붙어 잡음이 됐다 (WI-6.006 실측).
        """
        if not self._phrases:
            return []
        lines = [normalize_line(self.sources[idx].text) for idx in idxs if idx in self.sources]
        return [phrase for phrase in self._phrases if phrase.src in set(lines)]

    def _relations_among(self, entity_ids: set[str]) -> list[Relation]:
        return [r for r in self._relations if r.from_id in entity_ids and r.to in entity_ids]

    def _relation_line(self, relation: Relation) -> str:
        """`E0007 → E0012: calls 사토 상; speech 해요체`."""
        parts = []
        if relation.address_name is not None:
            target = self._entries.get(relation.to)
            name = relation.address_name.variant
            form = name
            if target is not None:
                form = (
                    next((v.target for v in target.variants if v.src == name and v.target), None)
                    or target.target
                )
                if self._style.name_style == "original":
                    form = name
            parts.append(f"calls {self._address(form, relation.address_name.suffix)}")
        if relation.address_term is not None:
            parts.append(f"calls {relation.address_term.target} (for {relation.address_term.src})")
        if relation.speech_level and self._korean:
            parts.append(f"speech {relation.speech_level}")
        return f"{relation.from_id} → {relation.to}: {'; '.join(parts)}"

    def estimate_fixed_tokens(self, system_prompt: str, count_tokens: Callable[[str], int]) -> int:
        """배처(WI-3.005)에 넘길 고정 요소 토큰의 상한 추정.

        문서 전체에서 매칭된 용어집·경칭과 가장 긴 블록 기준의 직전·다음 문맥을 더한다.
        """
        all_idxs = tuple(self._translatable)
        glossary_text, _, suffixes = self._glossary_and_suffixes(all_idxs)
        honorifics = self._honorifics(suffixes)
        longest = max((len(self.sources[i].text) for i in all_idxs), default=0)
        context_chars = longest * (
            2 * self._settings.previous_blocks + self._settings.upcoming_blocks
        )
        fixed = "\n".join(
            [system_prompt, glossary_text, honorifics, self._story, self._style.prompt_block()]
        )
        per_char = count_tokens(fixed) / len(fixed) if fixed else 0.0
        return count_tokens(fixed) + int(context_chars * per_char) + 200  # 태그·JSON 틀 여유

    # ---------------------------------------------------------------- 내부

    def _glossary_and_suffixes(self, idxs: Sequence[int]) -> tuple[str, set[str], list[str]]:
        entity_ids: set[str] = set()
        suffixes: list[str] = []
        for idx in idxs:
            for match in self._matcher.find(self.sources[idx].text):
                entity_ids.update(match.entity_ids)
                if match.suffix:
                    suffixes.append(match.suffix)
        lines = [self._glossary_line(self._entries[eid]) for eid in sorted(entity_ids)]
        return "\n".join(lines), entity_ids, list(dict.fromkeys(suffixes))

    def _glossary_line(self, entry: GlossaryEntry) -> str:
        original = self._style.name_style == "original"
        parts = [f"{entry.id} {entry.source} = {entry.source if original else entry.target}"]
        for variant in entry.variants:
            form = variant.src if original else variant.target
            if form:
                parts.append(f"{variant.src} = {form}")
        if entry.avoid and not original:
            parts.append(f"AVOID: {', '.join(entry.avoid)}")
        if entry.title_target:
            label = "TITLE_KO" if self._korean else "TITLE"
            parts.append(f"{label}: {entry.title_target}")
        return " | ".join(parts)

    def _honorifics(self, suffixes: Sequence[str]) -> str:
        """`<honorifics>` 내용. 한국어 대상만 표를 넣는다 (다른 대상은 프롬프트 규칙으로)."""
        if not self._korean:
            return ""
        return self._honorific_lines(self._resolver.prompt_map(suffixes))

    def _address(self, form: str, suffix: str | None) -> str:
        """관계의 호칭: 한국어는 경칭 표로 조합, 다른 대상은 이름과 원래 접미사."""
        if self._korean:
            return self._resolver.compose(form, suffix)
        return f"{form} (suffix {suffix})" if suffix else form

    @staticmethod
    def _honorific_lines(mapping: Mapping[str, HonorificForm]) -> str:
        return "\n".join(
            f"{suffix} = {form.ko or '(omit)'} ({'space' if form.space else 'no space'})"
            for suffix, form in mapping.items()
        )

    def _upcoming(self, idxs: Sequence[int]) -> list[int]:
        count = self._settings.upcoming_blocks
        if not idxs or not count:
            return []
        last = idxs[-1]
        return [idx for idx in self._translatable if idx > last][:count]


def _relation_active(relation: Relation, episode: str | None) -> bool:
    """valid_from 이 없거나, 에피소드를 모르거나, 지금 에피소드가 valid_from 이후면 적용한다."""
    if not relation.valid_from or not episode:
        return True
    pattern = re.compile(r"S(\d+)E(\d+)")
    start, now = pattern.fullmatch(relation.valid_from), pattern.fullmatch(episode)
    if start is None or now is None:
        return True
    return (int(now.group(1)), int(now.group(2))) >= (int(start.group(1)), int(start.group(2)))


def _section(name: str, body: str, attributes: str = "") -> str:
    opening = f"<{name} {attributes}>" if attributes else f"<{name}>"
    return f"{opening}\n{body}\n</{name}>"


def _phrase_line(phrase: PhraseHint) -> str:
    """`いただきます → 잘 먹겠습니다 (confirmed)`."""
    return f"{phrase.src} → {phrase.target}" + (" (confirmed)" if phrase.locked else "")


def _phrase_revs(phrases: Sequence[PhraseHint]) -> dict[str, int]:
    return {f"{PHRASE_KEY_PREFIX}{phrase.id}": phrase.rev for phrase in phrases}
