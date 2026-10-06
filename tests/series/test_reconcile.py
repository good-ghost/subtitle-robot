import json
from pathlib import Path

from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.llm.base import ChatRequest
from subtitle_robot.series.reconcile import reconcile_glossary
from subtitle_robot.series.state import SeriesState
from tests.fake_llm import FakeAdapter

EXAMPLE = Path(__file__).parent.parent.parent / "examples" / "glossary.example.yaml"


def test_spelling_suggestions_skip_unchanged_spelling() -> None:
    glossary = load_glossary(EXAMPLE)
    candidates = [e for e in glossary.for_language("ja") if e.status in ("auto", "proposed")]
    changed, same = candidates[0], candidates[1]

    def respond(_request: ChatRequest) -> str:
        return json.dumps(
            {
                "spelling": [
                    {"entity_id": changed.id, "suggested_ko": changed.target + "아", "reason": "x"},
                    {"entity_id": same.id, "suggested_ko": same.target, "reason": "같은 표기"},
                ]
            },
            ensure_ascii=False,
        )

    state = SeriesState()
    reconcile_glossary(
        glossary, state, FakeAdapter(respond), "ja", episode_label="reconcile", blocking=False
    )

    assert [(i.kind, i.entity_id) for i in state.open_items()] == [("conflict", changed.id)]


def test_other_target_uses_generic_prompt_and_field_names() -> None:
    glossary = load_glossary(EXAMPLE)
    entry = next(e for e in glossary.for_language("ja") if e.status == "auto")
    requests: list[ChatRequest] = []

    def respond(request: ChatRequest) -> str:
        requests.append(request)
        return json.dumps(
            {"spelling": [{"entity_id": entry.id, "suggested": "Tanaka H.", "reason": "x"}]}
        )

    state = SeriesState()
    reconcile_glossary(
        glossary, state, FakeAdapter(respond), "ja", target="en",
        episode_label="reconcile", blocking=False,
    )  # fmt: skip

    system = requests[0].messages[0].content
    assert "translation into English" in system
    assert "Korean" not in system
    spelling = requests[0].output_schema["$defs"]["SpellingIssue"]  # type: ignore[index]
    assert "suggested" in spelling["properties"]
    assert [item.detail for item in state.open_items()] == [f"{entry.target} → Tanaka H.: x"]
