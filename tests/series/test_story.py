import json
import re
from pathlib import Path

from subtitle_robot.checkpoint import Fingerprint
from subtitle_robot.series.manifest import Episode, EpisodeId
from subtitle_robot.series.retranslate import retranslate_series
from subtitle_robot.series.runner import run_series
from subtitle_robot.series.story import load_summary, story_so_far
from subtitle_robot.series.workspace import SeriesWorkspace
from tests.fake_llm import FakeAdapter
from tests.series.test_runner import _respond, _series


def _story_sections(adapter: FakeAdapter) -> dict[str, str | None]:
    """pass2 요청별 (에피소드 원문 첫 줄 → story_so_far 내용)."""
    found: dict[str, str | None] = {}
    for request in adapter.requests:
        if request.schema_name != "pass2_output":
            continue
        message = request.messages[-1].content
        story = re.search(
            r'<story_so_far context_only="true">\n(.*?)\n</story_so_far>', message, re.DOTALL
        )
        translate = re.search(r"<translate>\n(.*)\n</translate>", message, re.DOTALL)
        assert translate is not None
        source = json.loads(translate.group(1))
        found[source["units"][0]["blocks"][0]["src"]] = story.group(1) if story else None
    return found


def _story_series(tmp_path: Path) -> SeriesWorkspace:
    """요약을 켠 시리즈 (기본은 꺼짐)."""
    workspace = _series(tmp_path)
    settings = workspace.settings_path
    settings.write_text(
        settings.read_text(encoding="utf-8").replace(
            "[story]\nenabled = false", "[story]\nenabled = true"
        ),
        encoding="utf-8",
    )
    return workspace


def test_story_is_off_by_default(tmp_path: Path) -> None:
    from subtitle_robot.series.settings import StorySection

    assert StorySection().enabled is False
    assert _series(tmp_path).settings().story.enabled is False


def test_summaries_are_made_once_and_previous_episodes_go_into_context(tmp_path: Path) -> None:
    workspace = _story_series(tmp_path)
    adapter = FakeAdapter(_respond, summary="다나카가 바네치를 만났다")

    run_series(workspace, adapter)

    assert len(adapter.summary_requests) == 3
    first = adapter.summary_requests[0].messages[-1].content
    assert "田中 = 타나카" in first  # 요약도 용어집 표기를 쓴다
    episodes = workspace.scan().episodes
    saved = load_summary(workspace.episode_work_dir(episodes[0]))
    assert saved is not None
    assert saved.text == "다나카가 바네치를 만났다"
    assert _story_sections(adapter) == {
        "田中さん、おはよう": None,  # 1화: 직전 화 없음
        "バネッチィが来た": "S01E01: 다나카가 바네치를 만났다",
        "バネッティと田中": "S01E01: 다나카가 바네치를 만났다\nS01E02: 다나카가 바네치를 만났다",
    }

    again = FakeAdapter(_respond)
    run_series(workspace, again)
    assert again.summary_requests == []  # 저장된 요약을 쓴다
    assert again.requests == []


def test_changed_summary_retranslates_later_episode_only(tmp_path: Path) -> None:
    workspace = _story_series(tmp_path)
    run_series(workspace, FakeAdapter(_respond))
    second = workspace.scan().episodes[1]
    path = workspace.episode_work_dir(second) / "summary.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data["text"] = "2화 요약을 사람이 고쳤다"
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

    result = retranslate_series(workspace, FakeAdapter(_respond))

    assert result.retranslated == {"S01E03": 1}  # 2화 요약을 넣은 3화만 stale


def test_story_budget_drops_oldest(tmp_path: Path) -> None:
    workspace = _story_series(tmp_path)
    run_series(workspace, FakeAdapter(_respond, summary="가" * 300))
    episodes = list(workspace.scan().episodes)
    dirs = {e.key: workspace.episode_work_dir(e) for e in episodes}

    text = story_so_far(episodes[2], episodes, dirs, count=2, max_tokens=400)

    assert text.startswith("S01E02: ")  # 1화 요약은 상한을 넘어 빠진다
    assert story_so_far(episodes[2], episodes, dirs, count=0, max_tokens=400) == ""
    lone = Episode(EpisodeId(1, 9), Path("x.srt"), None)
    assert story_so_far(lone, [lone], {}, count=2, max_tokens=400) == ""


def test_old_fingerprint_without_story_is_not_stale() -> None:
    old = Fingerprint.model_validate(
        {"prompt_version": "p", "provider": "x", "model": "m", "params": {}, "style_hash": "s",
         "entities": {"E0001": 1}}
    )  # fmt: skip
    current = old.model_copy(update={"entities": {"E0001": 1, "STORY": 123, "PHR:P0001": 1}})

    assert old.entity_differences(current) == []
    assert current.entity_differences(
        current.model_copy(update={"entities": {"E0001": 1, "STORY": 456, "PHR:P0001": 1}})
    ) == ["STORY: rev 123 → 456"]


def test_disabled_story_and_failed_summary(tmp_path: Path) -> None:
    workspace = _series(tmp_path)  # 기본 꺼짐
    adapter = FakeAdapter(_respond)
    run_series(workspace, adapter)
    assert adapter.summary_requests == []
    assert all(story is None for story in _story_sections(adapter).values())

    (tmp_path / "other").mkdir()
    other = _story_series(tmp_path / "other")
    broken = FakeAdapter(
        lambda r: "not json" if r.schema_name == "summary_output" else _respond(r), summary=None
    )
    result = run_series(other, broken)  # 요약 실패는 warning, 번역은 끝난다
    assert set(result.translated) == {"S01E01", "S01E02", "S01E03"}
    assert load_summary(other.episode_work_dir(other.scan().episodes[0])) is None


def test_clean_summary_drops_sentences_with_kana() -> None:
    from subtitle_robot.series.story import clean_summary

    text = (
        "- 브루노: '브루노さん'으로 불림. 아빌리오라는 이름도 씀.\n"
        "- 루체: 'ルーチェ'라고 부름.\n"
        "- 네로: 바네티의 아들."
    )

    assert clean_summary(text) == "- 브루노: 아빌리오라는 이름도 씀.\n- 네로: 바네티의 아들."
