"""`story_so_far`: 에피소드 요약과 Pass 2 문맥 (PROJECT-PLAN §24.3, WI-6.004).

에피소드 분석(Pass 1) 직후 원문으로 그 화의 한국어 요약을 만든다 (Q-04 A안, 용어집 표기 사용).
번역 때 직전 N화 요약을 토큰 상한 안에서 `<story_so_far>` 섹션으로 넣는다. 요약을 만들지 못해도
파이프라인은 멈추지 않는다 (warning 만). 규칙은 WI-6.004.
"""

from __future__ import annotations

import json
import logging
import re
from collections.abc import Sequence
from pathlib import Path

from pydantic import BaseModel, Field, ValidationError

from subtitle_robot.glossary.model import Glossary
from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.io.normalize import NormalizedDocument
from subtitle_robot.lang.base import LanguageCode
from subtitle_robot.lang.codes import DEFAULT_TARGET, language_name
from subtitle_robot.lang.target import is_korean
from subtitle_robot.llm.base import ChatMessage, ChatRequest, LlmAdapter
from subtitle_robot.llm.errors import LlmError
from subtitle_robot.prompt import load_prompt
from subtitle_robot.series.manifest import Episode
from subtitle_robot.series.workspace import SeriesWorkspace

logger = logging.getLogger(__name__)

SUMMARY_FILE = "summary.json"
# 요약 요청에 넣는 원문 상한 (문자). 한 화 대사는 보통 이보다 짧고, 넘으면 앞부분부터 쓴다
SOURCE_MAX_CHARS = 16_000
# 요약 길이 상한 (문자). 한국어는 문자 1개가 대략 토큰 1개 안팎이다
SUMMARY_MAX_CHARS = 400
SUMMARY_MAX_TOKENS = 1024
_KANA_RE = re.compile(r"[\u3040-\u30ff]")
# 문장 끝 (마침표 뒤 공백). 이름 머리 `- 이름:` 는 첫 문장에 붙어 있다
_SENTENCE_RE = re.compile(r"(?<=[.。])\s+")
_HEAD_RE = re.compile(r"-\s*[^:]{1,40}:\s*")


class EpisodeSummary(BaseModel):
    """저장된 에피소드 요약 (`work/<에피소드>/summary.json`)."""

    episode: str
    text: str
    prompt_version: str
    source_sha256: str


class SummaryOutput(BaseModel):
    """요약 응답."""

    summary: str = Field(description="Korean summary of the episode")


def summary_path(work_dir: Path) -> Path:
    """에피소드 작업 폴더의 요약 파일."""
    return Path(work_dir) / SUMMARY_FILE


def load_summary(work_dir: Path) -> EpisodeSummary | None:
    """저장된 요약. 없거나 읽을 수 없으면 None."""
    path = summary_path(work_dir)
    if not path.is_file():
        return None
    try:
        return EpisodeSummary.model_validate_json(path.read_text(encoding="utf-8"))
    except ValidationError as exc:
        logger.warning("summary unreadable %s: %s", path, exc)
        return None


def summarize_episode(
    episode: Episode,
    doc: NormalizedDocument,
    glossary: Glossary,
    appearing: Sequence[str],
    lang: LanguageCode,
    adapter: LlmAdapter,
    work_dir: Path,
    *,
    target: str = DEFAULT_TARGET,
) -> EpisodeSummary | None:
    """에피소드 요약을 만들어 저장한다. 원본·프롬프트가 같으면 저장된 요약을 쓴다.

    Args:
        episode: 에피소드.
        doc: 정규화한 원문.
        glossary: 마스터 용어집 (이름 표기).
        appearing: 이 화에 나온 엔티티 ID.
        lang: 원본 언어.
        adapter: LLM 어댑터.
        work_dir: 에피소드 작업 폴더.
        target: 번역 대상 언어 (요약을 쓰는 언어, §26.5).

    Returns:
        요약. 만들지 못했으면 None (warning 을 남긴다).
    """
    template = load_prompt("summary", lang, target=target)
    # 대상 ko 의 원본 이름은 0.6.0 전처럼 코드로 넣는다 (프롬프트가 바뀌지 않게)
    source_name = lang if is_korean(target) else language_name(lang)
    existing = load_summary(work_dir)
    if (
        existing is not None
        and existing.source_sha256 == doc.source_sha256
        and existing.prompt_version == template.version
    ):
        return existing
    names = [
        f"{entry.source} = {entry.target}"
        for entry in glossary.for_language(lang)
        if entry.id in set(appearing)
    ]
    lines = [block.text.replace("\n", " ") for block in doc.blocks if block.translate]
    source_text = "\n".join(lines)[:SOURCE_MAX_CHARS]
    request = ChatRequest(
        messages=[
            ChatMessage(
                role="system",
                content=template.render(
                    src_lang=source_name,
                    tgt_lang=language_name(target),
                    max_chars=str(SUMMARY_MAX_CHARS),
                ),
            ),
            ChatMessage(
                role="user",
                content=f"<glossary>\n{chr(10).join(names)}\n</glossary>\n"
                f"<episode>\n{source_text}\n</episode>",
            ),
        ],
        output_schema=SummaryOutput.model_json_schema(),
        schema_name="summary_output",
        max_tokens=SUMMARY_MAX_TOKENS,
    )
    try:
        chat = adapter.chat(request)
        text = SummaryOutput.model_validate(json.loads(chat.json_text)).summary.strip()
    except (LlmError, json.JSONDecodeError, ValidationError) as exc:
        logger.warning("episode %s summary failed: %s", episode.key, exc)
        return None
    text = clean_summary(text)
    if not text:
        logger.warning("episode %s summary is empty", episode.key)
        return None
    summary = EpisodeSummary(
        episode=episode.key,
        text=text[: SUMMARY_MAX_CHARS * 2],
        prompt_version=template.version,
        source_sha256=doc.source_sha256,
    )
    Path(work_dir).mkdir(parents=True, exist_ok=True)
    atomic_write_text(summary_path(work_dir), summary.model_dump_json(indent=1) + "\n")
    return summary


def clean_summary(text: str) -> str:
    """가나가 섞인 문장을 뺀다 (모델이 이름을 가나로 옮기면 표기가 흔들린다, WI-6.006 실측).

    줄 단위로 이름 머리(`- 루체:`)를 떼고 문장을 나눠 가나가 있는 문장만 지운다.
    남은 문장이 없는 줄은 버린다.
    """
    kept_lines = []
    for line in text.splitlines():
        head_match = _HEAD_RE.match(line.strip())
        head = head_match.group(0) if head_match else ""
        body = line.strip()[len(head) :]
        sentences = [part for part in _SENTENCE_RE.split(body) if part.strip()]
        kept = [sentence.strip() for sentence in sentences if not _KANA_RE.search(sentence)]
        if kept:
            kept_lines.append(f"{head}{' '.join(kept)}")
    return "\n".join(kept_lines)


def story_so_far(
    episode: Episode,
    episodes: Sequence[Episode],
    work_dirs: dict[str, Path],
    *,
    count: int,
    max_tokens: int,
) -> str:
    """직전 count 화의 요약 (오래된 화부터 빼서 max_tokens 안). 없으면 빈 문자열.

    토큰 수는 문자 수로 어림한다 (한국어는 문자 하나가 토큰 하나 안팎, 넉넉한 쪽).
    """
    if count <= 0:
        return ""
    previous = [other for other in episodes if other.id < episode.id][-count:]
    items: list[str] = []
    for other in previous:
        summary = load_summary(work_dirs[other.key]) if other.key in work_dirs else None
        if summary is not None:
            items.append(f"{other.key}: {summary.text}")
    while items and sum(len(item) for item in items) > max_tokens:
        items.pop(0)
    return "\n".join(items)


def episode_story(workspace: SeriesWorkspace, episode: Episode) -> str:
    """시리즈 설정(`[story]`)에 따른 이 에피소드의 `story_so_far` 문맥. 꺼져 있으면 빈 문자열."""
    settings = workspace.settings().story
    if not settings.enabled:
        return ""
    episodes = workspace.scan().episodes
    work_dirs = {other.key: workspace.episode_work_dir(other) for other in episodes}
    return story_so_far(
        episode, episodes, work_dirs, count=settings.episodes, max_tokens=settings.max_tokens
    )
