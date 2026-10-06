"""시리즈 에피소드 번역 출력 읽기 (lint·반복 대사 공용, WI-6.002, WI-6.005)."""

from __future__ import annotations

from subtitle_robot.io.ass import parse_ass, to_block_text
from subtitle_robot.io.parser import parse_srt
from subtitle_robot.io.subtitle_input import read_subtitle
from subtitle_robot.series.manifest import Episode
from subtitle_robot.series.workspace import SeriesWorkspace


def output_block_texts(workspace: SeriesWorkspace, episode: Episode) -> dict[int, str] | None:
    """에피소드 출력의 블록 텍스트 (idx → 텍스트). 번역 전이면 None.

    사람이 고친 출력도 검사하도록 실제 출력 파일을 읽는다. `.<대상>.ass` 는 원본 ASS 의
    블록 ↔ 이벤트 대응으로 이벤트 Text 를 블록으로 되돌린다 (WI-6.002).
    이전 버전의 `.<대상>.srt` 출력도 읽는다.
    """
    output = workspace.output_path(episode)
    legacy = workspace.out_dir / f"{episode.key}.{workspace.target}.srt"
    if not output.exists() and legacy.exists():
        output = legacy
    if not output.exists():
        return None
    if output.suffix.lower() != ".ass":
        blocks = parse_srt(output.read_text(encoding="utf-8")).blocks
        return {position: block.text for position, block in enumerate(blocks, start=1)}
    source = read_subtitle(episode.path)
    translated = parse_ass(output.read_text(encoding="utf-8-sig"))
    return {
        idx: to_block_text(translated.events[ref.position].text)
        for idx, ref in source.events.items()
        if ref.position < len(translated.events)
    }
