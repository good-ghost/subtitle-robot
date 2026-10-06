from pathlib import Path

import pytest

from subtitle_robot.cli import EXIT_FAILED, EXIT_OK, EXIT_USAGE, AdapterFactory, main
from subtitle_robot.config import AppConfig
from subtitle_robot.glossary.store import load_glossary
from subtitle_robot.llm.base import LlmAdapter
from subtitle_robot.series.state import load_state
from tests.fake_llm import FakeAdapter
from tests.series.test_runner import EPISODES, _respond


def _factory(adapters: list[FakeAdapter]) -> AdapterFactory:
    def make(_config: AppConfig) -> LlmAdapter:
        adapter = FakeAdapter(_respond)
        adapters.append(adapter)
        return adapter

    return make


def _no_llm(_config: AppConfig) -> LlmAdapter:
    raise AssertionError("이 명령은 LLM 어댑터를 만들면 안 된다")


@pytest.fixture
def root(tmp_path: Path) -> Path:
    root = tmp_path / "Show"
    root.mkdir()
    for key, line in EPISODES.items():
        (root / f"Show.{key}.srt").write_text(
            f"1\n00:00:01,000 --> 00:00:02,000\n{line}\n", encoding="utf-8"
        )
    (root / "extras.srt").write_text("1\n00:00:01,000 --> 00:00:02,000\nおまけ\n", "utf-8")
    return root


def _entity_id(root: Path, source: str) -> str:
    return next(e.id for e in load_glossary(root / "glossary.yaml").entries if e.source == source)


def test_init_lists_episodes_without_llm(root: Path, capsys: pytest.CaptureFixture[str]) -> None:
    code = main(["series", "init", str(root), "--src", "ja"], adapter_factory=_no_llm)

    assert code == EXIT_OK
    printed = capsys.readouterr().out
    assert "S01E01  Show.S01E01.srt" in printed
    assert "extras.srt" in printed.split("[[episodes]]")[1]
    assert "에피소드 3개" in printed
    assert (root / "series.toml").exists()


def test_translate_review_retranslate_lint_flow(
    root: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    main(["series", "init", str(root), "--src", "ja"], adapter_factory=_no_llm)
    adapters: list[FakeAdapter] = []

    assert main(["series", "translate", str(root)], adapter_factory=_factory(adapters)) == EXIT_OK
    printed = capsys.readouterr().out
    assert "S01E03: 블록 1 (번역 1), error 0" in printed
    assert "전역 reconcile 완료" in printed
    assert "검토 대기" in printed
    assert (root / "out" / "S01E02.ko.srt").exists()

    assert main(["series", "review", str(root)], adapter_factory=_no_llm) == EXIT_OK
    assert "[제안] merge" in capsys.readouterr().out

    tanaka = _entity_id(root, "田中")
    review = ["series", "review", str(root), "--set", f"{tanaka}=다나카"]
    assert main(review, adapter_factory=_no_llm) == EXIT_OK
    assert f"표기 수정 {tanaka} = 다나카" in capsys.readouterr().out

    adapters.clear()
    retranslate = ["series", "retranslate", str(root), "--changed"]
    assert main(retranslate, adapter_factory=_factory(adapters)) == EXIT_OK
    printed = capsys.readouterr().out
    assert "S01E01: unit 1개 다시 번역" in printed
    assert "S01E03: unit 1개 다시 번역" in printed
    assert "바뀐 unit 없음: S01E02" in printed
    assert len(adapters[0].requests) == 2

    assert main(["series", "lint", str(root)], adapter_factory=_no_llm) == EXIT_OK
    assert "error 0" in capsys.readouterr().out


def test_lint_error_exit_code(root: Path, capsys: pytest.CaptureFixture[str]) -> None:
    main(["series", "init", str(root), "--src", "ja"], adapter_factory=_no_llm)
    main(["series", "translate", str(root)], adapter_factory=_factory([]))
    tanaka = _entity_id(root, "田中")
    main(["series", "review", str(root), "--set", f"{tanaka}=다나카"], adapter_factory=_no_llm)
    capsys.readouterr()
    output = root / "out" / "S01E01.ko.srt"
    output.write_text("1\n00:00:01,000 --> 00:00:02,000\n타나카 씨\n", encoding="utf-8")

    assert main(["series", "lint", str(root)], adapter_factory=_no_llm) == EXIT_FAILED
    assert "error avoid_used S01E01#1" in capsys.readouterr().out


def test_blocked_episodes_exit_failed(root: Path, capsys: pytest.CaptureFixture[str]) -> None:
    main(["series", "init", str(root), "--src", "ja"], adapter_factory=_no_llm)
    settings = root / "series.toml"
    settings.write_text(
        settings.read_text(encoding="utf-8").replace("review = false", "review = true"), "utf-8"
    )

    code = main(["series", "translate", str(root)], adapter_factory=_factory([]))

    assert code == EXIT_FAILED
    assert "검토 대기 항목 때문에 번역하지 않음" in capsys.readouterr().err

    assert main(["series", "review", str(root), "--accept-all"], adapter_factory=_no_llm) == 0
    assert main(["series", "translate", str(root)], adapter_factory=_factory([])) == EXIT_OK
    assert all(
        ep.translated for ep in load_state(root / "work" / "series_state.json").episodes.values()
    )


def test_analyze_with_episode_range(root: Path, capsys: pytest.CaptureFixture[str]) -> None:
    main(["series", "init", str(root), "--src", "ja"], adapter_factory=_no_llm)
    capsys.readouterr()
    adapters: list[FakeAdapter] = []

    code = main(
        ["series", "analyze", str(root), "--episodes", "S01E02-S01E03"],
        adapter_factory=_factory(adapters),
    )

    assert code == EXIT_OK
    printed = capsys.readouterr().out
    assert "S01E01" not in printed
    assert "S01E02: 새 항목 1" in printed
    assert [r.schema_name for r in adapters[0].requests].count("pass1_output") == 2


def test_glossary_import(root: Path, tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    main(["series", "init", str(root), "--src", "ja"], adapter_factory=_no_llm)
    main(["series", "analyze", str(root)], adapter_factory=_factory([]))
    csv_path = tmp_path / "official.csv"
    csv_path.write_text("source,ko\n田中,다나카\n東京,도쿄\n", encoding="utf-8")
    capsys.readouterr()

    code = main(["glossary", "import", str(root), str(csv_path)], adapter_factory=_no_llm)

    assert code == EXIT_OK
    assert "추가 1, 표기 변경 1" in capsys.readouterr().out
    entry = load_glossary(root / "glossary.yaml").entries
    assert {(e.source, e.target, e.target_source) for e in entry} >= {
        ("田中", "다나카", "official"),
        ("東京", "도쿄", "official"),
    }


def test_usage_errors(root: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["series", "lint", str(root)], adapter_factory=_no_llm) == EXIT_USAGE
    assert "series init" in capsys.readouterr().err
    assert main(["series", "init", str(root / "none"), "--src", "ja"]) == EXIT_USAGE

    main(["series", "init", str(root), "--src", "ja"], adapter_factory=_no_llm)
    with pytest.raises(SystemExit) as exc:
        main(["series", "translate", str(root), "--episodes", "1-3"])
    assert exc.value.code == EXIT_USAGE
    with pytest.raises(SystemExit):
        main(["series", "review", str(root), "--set", "E0001"])
    assert main(["series", "review", str(root), "--accept", "E0099"]) == EXIT_USAGE
