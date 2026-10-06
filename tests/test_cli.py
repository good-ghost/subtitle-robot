from pathlib import Path

import pytest

from subtitle_robot.cli import (
    EXIT_OK,
    EXIT_STALE,
    EXIT_USAGE,
    AdapterFactory,
    build_parser,
    default_output_path,
    default_work_dir,
    main,
)
from subtitle_robot.config import AppConfig
from subtitle_robot.llm.base import LlmAdapter
from tests.fake_llm import FakeAdapter
from tests.pipeline.test_runner import SRT, _responder


def _factory(adapters: list[FakeAdapter]) -> AdapterFactory:
    def make(_config: AppConfig) -> LlmAdapter:
        adapter = FakeAdapter(_responder())
        adapters.append(adapter)
        return adapter

    return make


@pytest.fixture
def source(tmp_path: Path) -> Path:
    path = tmp_path / "Movie (2020).ja.srt"
    path.write_text(SRT, encoding="utf-8")
    return path


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("movie.en.srt", "movie.ko.srt"),
        ("movie.srt", "movie.ko.srt"),
        ("S01E01.JPN.srt", "S01E01.ko.srt"),
        ("movie.jp.srt", "movie.ko.srt"),
        ("movie.French.srt", "movie.ko.srt"),
        ("movie.pt-BR.srt", "movie.ko.srt"),
        ("Mr.Robot.srt", "Mr.Robot.ko.srt"),
        ("The.Office.srt", "The.Office.ko.srt"),
    ],
)
def test_default_output_path(name: str, expected: str) -> None:
    assert default_output_path(Path("/m") / name) == Path("/m") / expected


def test_default_output_path_other_target() -> None:
    assert default_output_path(Path("/m/movie.ja.ass"), target="en") == Path("/m/movie.en.ass")


def test_default_work_dir() -> None:
    assert default_work_dir(Path("/m/movie.en.srt")) == Path("/m/.subtitle-robot/movie")
    assert default_work_dir(Path("/m/movie.ja.srt"), "en") == Path("/m/.subtitle-robot/movie-en")


def test_translate_command(source: Path, capsys: pytest.CaptureFixture[str]) -> None:
    adapters: list[FakeAdapter] = []

    code = main(["translate", str(source)], adapter_factory=_factory(adapters))

    assert code == EXIT_OK
    output = source.with_name("Movie (2020).ko.srt")
    assert "타나카 상, 이거" in output.read_text(encoding="utf-8")
    assert (source.parent / ".subtitle-robot" / "Movie (2020)" / "report.json").exists()
    printed = capsys.readouterr().out
    assert "error 0" in printed
    assert "새로 번역" in printed


def test_stale_exit_code_and_redo(
    source: Path, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    work = tmp_path / "work"
    factory = _factory([])
    assert (
        main(["translate", str(source), "--work-dir", str(work)], adapter_factory=factory)
        == EXIT_OK
    )
    config = tmp_path / "config.toml"
    config.write_text("[providers.gemini]\ntemperature = 0.5\n", encoding="utf-8")

    stale = main(
        ["--config", str(config), "translate", str(source), "--work-dir", str(work)],
        adapter_factory=factory,
    )
    redo = main(
        [
            "--config",
            str(config),
            "translate",
            str(source),
            "--work-dir",
            str(work),
            "--redo-stale",
        ],
        adapter_factory=factory,
    )

    assert stale == EXIT_STALE
    assert "--redo-stale" in capsys.readouterr().err
    assert redo == EXIT_OK


def test_analyze_command(source: Path, tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    adapters: list[FakeAdapter] = []

    code = main(
        ["analyze", str(source), "--work-dir", str(tmp_path / "w")],
        adapter_factory=_factory(adapters),
    )

    assert code == EXIT_OK
    printed = capsys.readouterr().out
    assert "E0001 田中 = 타나카 [generated, auto]" in printed
    assert all(r.schema_name == "pass1_output" for r in adapters[0].requests)


def test_usage_errors(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    bad_config = tmp_path / "bad.toml"
    bad_config.write_text("[providers.nim]\nrpm = -1\n", encoding="utf-8")

    assert (
        main(["--config", str(bad_config), "translate", "x.srt"], adapter_factory=_factory([]))
        == EXIT_USAGE
    )
    assert (
        main(["translate", str(tmp_path / "none.srt")], adapter_factory=_factory([])) == EXIT_USAGE
    )
    assert "입력 파일이 없다" in capsys.readouterr().err


def test_undetectable_language_is_usage_error(tmp_path: Path) -> None:
    path = tmp_path / "ko.srt"
    path.write_text("1\n00:00:01,000 --> 00:00:02,000\n오늘은 비가 오네요\n", encoding="utf-8")

    assert main(["translate", str(path)], adapter_factory=_factory([])) == EXIT_USAGE


def test_nim_without_key_is_config_error(source: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    monkeypatch.delenv("SUBTITLE_ROBOT_CONFIG", raising=False)

    assert main(["translate", str(source)]) == EXIT_USAGE


def test_ass_input_and_bad_subtitle_errors(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    from tests.pipeline.test_ass_input import ASS
    from tests.series.test_runner import _respond

    source = tmp_path / "Show.ja.ass"
    source.write_text(ASS, encoding="utf-8")
    generic = FakeAdapter(_respond)
    assert main(["translate", str(source)], adapter_factory=lambda _config: generic) == EXIT_OK
    assert (tmp_path / "Show.ko.ass").exists()  # ASS 입력은 ASS 로 (Q-07)

    broken = tmp_path / "broken.ass"
    broken.write_text("[Script Info]\n", encoding="utf-8")
    assert main(["translate", str(broken)], adapter_factory=_factory([])) == EXIT_USAGE
    assert "입력 오류" in capsys.readouterr().err


def test_legacy_names_still_work(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    """0.4.0 이전 이름(srt-translator)의 환경 변수·작업 폴더를 그대로 쓴다."""
    legacy_data = tmp_path / "legacy-data"
    monkeypatch.delenv("SUBTITLE_ROBOT_DATA", raising=False)
    monkeypatch.setenv("SRT_TRANSLATE_DATA", str(legacy_data))
    assert main(["queue", "list"]) == EXIT_OK
    assert (legacy_data / "state.db").exists()

    movie = tmp_path / "m" / "movie.en.srt"
    movie.parent.mkdir()
    assert default_work_dir(movie) == tmp_path / "m" / ".subtitle-robot" / "movie"
    (tmp_path / "m" / ".srt-translate" / "movie").mkdir(parents=True)
    assert default_work_dir(movie) == tmp_path / "m" / ".srt-translate" / "movie"  # 이어 실행
    (tmp_path / "m" / ".subtitle-robot" / "movie").mkdir(parents=True)
    assert default_work_dir(movie) == tmp_path / "m" / ".subtitle-robot" / "movie"


def test_language_arguments_accept_iso_codes_and_names() -> None:
    parser = build_parser()
    args = parser.parse_args(["--target", "French", "translate", "a.srt", "--src", "spa"])
    assert (args.target, args.src) == ("fr", "es")
    assert parser.parse_args(["translate", "a.srt", "--src", "AUTO"]).src == "auto"
    assert parser.parse_args(["series", "init", "x", "--src", "de"]).src == "de"


def test_language_arguments_reject_unknown(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit):
        build_parser().parse_args(["translate", "a.srt", "--src", "klingon"])
    assert "알 수 없는 언어" in capsys.readouterr().err


def test_same_source_and_target_is_usage_error(
    source: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    code = main(["--target", "ja", "translate", str(source), "--src", "ja"])
    assert code == EXIT_USAGE
    assert "같다" in capsys.readouterr().err
