import json
import re

import pytest

from subtitle_robot.analysis.analyzer import (
    AnalysisBudget,
    Pass1Analyzer,
    Pass1Error,
    format_subtitles,
    merge_outputs,
)
from subtitle_robot.analysis.schema import NewEntity, Pass1Output, Pass1Variant
from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.io.normalize import NormalizedDocument, normalize_srt
from subtitle_robot.llm.base import ChatRequest
from subtitle_robot.prompt import load_prompt
from tests.fake_llm import FakeAdapter

JA_SRT = """1
00:00:01,000 --> 00:00:02,000
{\\an8}田中さん、これ

2
00:00:03,000 --> 00:00:04,000


3
00:00:05,000 --> 00:00:06,000
- アンジェロが来た
- ブルノさんも？
"""


def _doc(text: str = JA_SRT) -> NormalizedDocument:
    return normalize_srt(text.encode("utf-8"), source_path="ep.srt")


def _numbered_srt(lines: int) -> str:
    return "".join(
        f"{n}\n00:00:{n:02d},000 --> 00:00:{n:02d},500\n田中さん台詞{n}\n\n"
        for n in range(1, lines + 1)
    )


ENTITY = {
    "tmp": "n1",
    "type": "person",
    "source": "田中",
    "reading": "たなか",
    "reading_confidence": "high",
    "origin": "japanese",
    "ko_suggestion": "타나카",
    "seen_suffixes": ["さん"],
    "first_seen": 1,
    "count": 1,
}


def _idx_in(request: ChatRequest) -> list[int]:
    return [int(m) for m in re.findall(r"^(\d+): ", request.messages[-1].content, re.MULTILINE)]


def test_single_request_with_japanese_prompt_and_clean_input() -> None:
    adapter = FakeAdapter(lambda _r: {"new_entities": [ENTITY]})

    result = Pass1Analyzer(adapter, "ja").analyze(_doc())

    (request,) = adapter.requests
    system, user = request.messages[0].content, request.messages[1].content
    assert "Source language: Japanese" in system
    assert '"origin"' in system
    assert "1: 田中さん、これ" in user  # ASS 태그 제거
    assert "2: " not in user  # 빈 블록은 보내지 않는다
    assert "3: - アンジェロが来た / - ブルノさんも？" in user
    assert request.output_schema is not None
    assert result.output.new_entities[0].origin == "japanese"
    assert result.prompt_version.startswith("pass1.ja@")
    assert result.model == "fake-model"
    assert (result.segments[0].first_idx, result.segments[0].last_idx) == (1, 3)


def test_known_glossary_is_sent_with_ids() -> None:
    glossary = load_glossary(__import__("pathlib").Path("examples/glossary.example.yaml"))
    adapter = FakeAdapter(lambda _r: {})

    Pass1Analyzer(adapter, "ja").analyze(_doc(), glossary.for_language("ja"))

    user = adapter.user_messages()[0]
    assert "E0007 | 田中ヒロシ = 타나카 히로시 | variants: 田中, ヒロシ, ヒロ" in user


def test_splits_into_segments_when_over_budget() -> None:
    system = load_prompt("pass1", "ja").render(src_lang="Japanese")
    # 시스템 프롬프트·출력 예산을 빼고 약 300 토큰이 남게 한다 (자막 60줄은 약 900 토큰)
    adapter = FakeAdapter(lambda _r: {"new_entities": [ENTITY]}, context_tokens=len(system) + 900)
    budget = AnalysisBudget(max_output_tokens=500, safety_margin=100)

    result = Pass1Analyzer(adapter, "ja", budget).analyze(_doc(_numbered_srt(60)))

    assert len(adapter.requests) > 1
    covered = [idx for request in adapter.requests for idx in _idx_in(request)]
    assert covered == list(range(1, 61))  # 빠짐·겹침 없이 순서대로
    assert len(result.output.new_entities) == 1  # 같은 source 는 병합
    assert result.output.new_entities[0].count == len(adapter.requests)


def test_truncated_output_splits_segment() -> None:
    def respond(request: ChatRequest) -> tuple[str, str] | dict[str, object]:
        if len(_idx_in(request)) > 2:
            return '{"new_entities": [', "length"
        return {"new_entities": [ENTITY]}

    adapter = FakeAdapter(respond)

    result = Pass1Analyzer(adapter, "ja").analyze(_doc(_numbered_srt(4)))

    assert [len(_idx_in(r)) for r in adapter.requests] == [4, 2, 2]
    assert len(result.segments) == 2


def test_invalid_response_retries_then_succeeds() -> None:
    replies = iter(['{"new_entities": "oops"}', json.dumps({"new_entities": [ENTITY]})])
    adapter = FakeAdapter(lambda _r: next(replies))

    result = Pass1Analyzer(adapter, "ja").analyze(_doc())

    assert result.segments[0].attempts == 2


def test_invalid_response_exhausts_attempts() -> None:
    adapter = FakeAdapter(lambda _r: "not json")

    with pytest.raises(Pass1Error, match="3회"):
        Pass1Analyzer(adapter, "ja").analyze(_doc())


def test_no_budget_left_is_error() -> None:
    adapter = FakeAdapter(lambda _r: {}, context_tokens=100)

    with pytest.raises(Pass1Error, match="토큰 예산"):
        Pass1Analyzer(adapter, "ja").analyze(_doc())


def test_empty_document_makes_no_request() -> None:
    adapter = FakeAdapter(lambda _r: {})

    result = Pass1Analyzer(adapter, "en").analyze(_doc("1\n00:00:01,000 --> 00:00:02,000\n\n"))

    assert adapter.requests == []
    assert result.output == Pass1Output()


def test_merge_outputs_unions_and_renames() -> None:
    first = Pass1Output(
        new_entities=[NewEntity(**{**ENTITY, "variants": [Pass1Variant(src="田中")]})]
    )
    second = Pass1Output(
        new_entities=[
            NewEntity(
                **{
                    **ENTITY,
                    "first_seen": 40,
                    "seen_suffixes": ["君"],
                    "variants": [Pass1Variant(src="タナカ")],
                }
            ),
            NewEntity(**{**ENTITY, "tmp": "n2", "source": "ブルノ", "origin": "foreign"}),
        ]
    )

    merged = merge_outputs([(1, first), (2, second)])

    tanaka, bruno = merged.new_entities
    assert tanaka.tmp == "s1.n1"
    assert [v.src for v in tanaka.variants] == ["田中", "タナカ"]
    assert tanaka.seen_suffixes == ["さん", "君"]
    assert (tanaka.first_seen, tanaka.count) == (1, 2)
    assert bruno.tmp == "s2.n2"


def test_lenient_schema_ignores_extra_fields() -> None:
    output = Pass1Output.model_validate(
        {"new_entities": [{**ENTITY, "confidence": 0.9}], "extra": 1}
    )

    assert output.new_entities[0].source == "田中"


def test_format_subtitles_joins_lines() -> None:
    assert format_subtitles(_doc().blocks[2:]) == "3: - アンジェロが来た / - ブルノさんも？"


def test_segments_are_capped_by_block_count_even_when_context_is_large() -> None:
    """컨텍스트에 다 들어가도 블록 수 상한으로 나눈다 (응답 시간이 공급자 제한을 넘지 않게)."""
    adapter = FakeAdapter(lambda _r: {"new_entities": [ENTITY]}, context_tokens=1_000_000)

    Pass1Analyzer(adapter, "ja", AnalysisBudget(max_segment_blocks=25)).analyze(
        _doc(_numbered_srt(60))
    )

    sizes = [len(_idx_in(request)) for request in adapter.requests]
    assert sizes == [20, 20, 20]  # 60블록 / 25 → 3구간, 고르게
    assert [idx for request in adapter.requests for idx in _idx_in(request)] == list(range(1, 61))


def test_default_block_cap() -> None:
    assert AnalysisBudget().max_segment_blocks == 300
