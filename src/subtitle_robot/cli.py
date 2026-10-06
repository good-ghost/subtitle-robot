"""명령줄 `subtitle-robot` (PROJECT-PLAN §14.2, WI-3.013, WI-4.008).

단일 작품(analyze, translate), 시리즈(series …, glossary import), 미디어(probe, media, watch,
queue, ledger) 명령이 있다.
종료 코드: 0 성공, 1 실행 실패(막힌 에피소드·lint error 포함), 2 설정·입력 오류,
3 설정이 바뀌어 이어 실행을 멈춤(stale).
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import signal
import sys
import threading
import time
from collections.abc import Callable, Iterator, Sequence
from contextlib import contextmanager
from dataclasses import replace
from pathlib import Path
from typing import Any, get_args

from subtitle_robot.checkpoint import ResumePolicy, StaleCheckpointError
from subtitle_robot.config import (
    AppConfig,
    ConfigError,
    TranslationConfig,
    apply_timezone,
    load_config,
)
from subtitle_robot.glossary.importer import import_official, read_official_csv
from subtitle_robot.glossary.model import Glossary, GlossaryError
from subtitle_robot.glossary.store import load_glossary, save_glossary
from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.io.encoding import EncodingDetectionError
from subtitle_robot.io.langdetect import LanguageDetectionError
from subtitle_robot.io.subtitle_input import SubtitleInputError
from subtitle_robot.lang.codes import DEFAULT_TARGET, normalize_language
from subtitle_robot.llm.availability import AvailabilityPolicy, GuardedAdapter, ProviderGuard
from subtitle_robot.llm.base import LlmAdapter
from subtitle_robot.llm.errors import LlmError
from subtitle_robot.llm.factory import create_adapter
from subtitle_robot.media.commands import MediaToolError
from subtitle_robot.media.probe import probe
from subtitle_robot.media.select import external_subtitles, target_evidence
from subtitle_robot.media.tmdb import create_origin_resolver
from subtitle_robot.pipeline.report import render_summary
from subtitle_robot.pipeline.runner import (
    OutputFormatError,
    RunOptions,
    analyze_file,
    translate_file,
)
from subtitle_robot.run_config import base_run_options
from subtitle_robot.secret_store import SecretStore
from subtitle_robot.series.lint import lint_series
from subtitle_robot.series.phrases import (
    PhraseError,
    accept_phrase,
    load_phrases,
    remove_phrase,
    save_phrases,
    set_phrase,
)
from subtitle_robot.series.retranslate import retranslate_series
from subtitle_robot.series.review import apply_review, open_review_items
from subtitle_robot.series.runner import (
    SeriesRunResult,
    analyze_series,
    run_series,
    select_episodes,
)
from subtitle_robot.series.settings import SeriesSettingsError
from subtitle_robot.series.workspace import SeriesInitError, SeriesWorkspace, init_series
from subtitle_robot.watch.daemon import run_daemon
from subtitle_robot.watch.heartbeat import HEALTH_MAX_AGE_S, heartbeat_age
from subtitle_robot.watch.ledger import Ledger, LedgerError, Verdict
from subtitle_robot.watch.logfile import open_log_handler
from subtitle_robot.watch.queue import Job, JobQueue, JobStatus
from subtitle_robot.watch.state import state_path
from subtitle_robot.watch.watcher import collect_media_files
from subtitle_robot.watch.worker import (
    MediaWorker,
    media_target,
    own_outputs,
    revert_media,
    series_key_for,
)

CONFIG_ENV = "SUBTITLE_ROBOT_CONFIG"
# 감시 데몬·미디어 명령의 데이터 폴더 (state.db, 작업공간). 컨테이너에서는 /data 볼륨이다 (§21.9)
DATA_ENV = "SUBTITLE_ROBOT_DATA"
DEFAULT_DATA_DIR = Path("/data")
WORK_DIR_NAME = ".subtitle-robot"
# 0.4.0 이전 이름(srt-translator). 새 이름이 없을 때 읽어 기존 설정·작업 폴더를 그대로 쓴다
LEGACY_CONFIG_ENV = "SRT_TRANSLATE_CONFIG"
LEGACY_DATA_ENV = "SRT_TRANSLATE_DATA"
LEGACY_WORK_DIR_NAME = ".srt-translate"
# CLI 는 사람이 기다리므로 공급자 장애 일시 정지에 상한을 둔다 (감시 데몬은 무제한)
CLI_MAX_PAUSE_S = 300.0
CLI_LOG_FORMAT = "%(levelname)s %(name)s: %(message)s"
# 데몬 로그는 시각이 있어야 큐 기록과 맞춰 볼 수 있다 (시간대는 컨테이너 TZ).
# 웹 Logs 화면이 이 형식으로 파일을 읽는다 (watch/logfile.py)
DAEMON_LOG_FORMAT = "%(asctime)s %(levelname)s %(threadName)s %(name)s: %(message)s"
DAEMON_LOG_DATEFMT = "%Y-%m-%d %H:%M:%S"
EXIT_OK, EXIT_FAILED, EXIT_USAGE, EXIT_STALE = 0, 1, 2, 3
# 웹 Settings 의 적용 버튼으로 끝난 `watch` (§25.9)
EXIT_RESTART = 4

AdapterFactory = Callable[[AppConfig], LlmAdapter]


def _strip_language(stem: str) -> str:
    """이름 끝 언어 표시를 뗀다 (`movie.en` → `movie`, `movie.French` → `movie`)."""
    base, dot, last = stem.rpartition(".")
    if dot and base and _LANGUAGE_TAG_RE.fullmatch(last) and normalize_language(last):
        return base
    return stem


# 이름 끝 언어 표시로 볼 모양: 코드(en, eng, pt-BR)나 영어 이름 한 단어
_LANGUAGE_TAG_RE = re.compile(r"[A-Za-z]{2,3}(?:[-_][A-Za-z]{2,4})?|[A-Za-z]{4,}", re.ASCII)


def default_output_path(
    input_path: Path, output_format: str = "auto", target: str = DEFAULT_TARGET
) -> Path:
    """입력 옆 `<이름>.<대상>.srt` (ASS 입력이면 `.ass`, Q-07). 이름 끝 언어 표시는 뗀다."""
    stem = _strip_language(input_path.stem)
    is_ass = input_path.suffix.lower() in (".ass", ".ssa")
    suffix = "ass" if output_format == "ass" or (output_format == "auto" and is_ass) else "srt"
    return input_path.with_name(f"{stem}.{target}.{suffix}")


def default_work_dir(input_path: Path, target: str = DEFAULT_TARGET) -> Path:
    """입력 옆 숨김 작업 폴더 `.subtitle-robot/<이름>/` (대상 ko 가 아니면 `<이름>-<대상>/`).

    0.4.0 이전에 만든 `.srt-translate/<이름>/` 이 있고 새 폴더가 없으면 그것을 써서 이어 실행한다.
    """
    name = _strip_language(input_path.stem)
    if target != DEFAULT_TARGET:
        return input_path.parent / WORK_DIR_NAME / f"{name}-{target}"
    current = input_path.parent / WORK_DIR_NAME / name
    legacy = input_path.parent / LEGACY_WORK_DIR_NAME / name
    return legacy if legacy.is_dir() and not current.exists() else current


def build_parser() -> argparse.ArgumentParser:
    """인자 파서."""
    parser = argparse.ArgumentParser(
        prog="subtitle-robot",
        description="Subtitle Robot: 자막(SRT·ASS·VTT·동영상 트랙)을 한국어로 번역한다",
    )
    parser.add_argument(
        "--config", type=Path, help=f"config.toml (없으면 ${CONFIG_ENV}, 그다음 기본값)"
    )
    parser.add_argument(
        "--data",
        type=Path,
        help=f"데이터 폴더 (state.db 등, 없으면 ${DATA_ENV}, 그다음 {DEFAULT_DATA_DIR})",
    )
    parser.add_argument(
        "--target",
        type=_language_arg,
        help="번역 대상 언어 (ISO 639-1, 기본: config.toml [translation] target_language)",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="자세한 로그")
    commands = parser.add_subparsers(dest="command", required=True)

    def common(sub: argparse.ArgumentParser) -> None:
        sub.add_argument("input", type=Path, help="원본 자막 (SRT·ASS·SSA·VTT)")
        sub.add_argument(
            "--src", type=_source_arg, default="auto", help="원본 언어 (auto 또는 ISO 639-1)"
        )
        sub.add_argument("--encoding", help="입력 인코딩 (감지 대신)")
        sub.add_argument(
            "--work-dir", type=Path, help="작업 폴더 (기본: 입력 옆 .subtitle-robot/<이름>)"
        )

    analyze = commands.add_parser("analyze", help="Pass 1: 인명·고유명사 용어집만 만든다")
    common(analyze)

    translate = commands.add_parser("translate", help="번역한다 (Pass 1 포함)")
    common(translate)
    translate.add_argument(
        "-o", "--output", type=Path, help="출력 경로 (기본: 입력 옆 <이름>.ko.srt, ASS 는 .ko.ass)"
    )
    translate.add_argument(
        "--format",
        dest="output_format",
        choices=["auto", "srt", "ass"],
        default="auto",
        help="출력 형식 (auto: 출력 확장자, 없으면 입력 형식)",
    )
    translate.add_argument("--ass-font", help="ASS 출력의 스타일 폰트 (한글 폰트 이름)")
    _stale_options(translate)
    _add_series_parser(commands)
    _add_glossary_parser(commands)
    _add_media_parsers(commands)
    _add_queue_parser(commands)
    _add_ledger_parser(commands)
    return parser


def _language_arg(text: str) -> str:
    """언어 인자를 639-1 로 (`fre`, `French` 도 받는다)."""
    code = normalize_language(text)
    if code is None:
        raise argparse.ArgumentTypeError(f"알 수 없는 언어: {text!r} (ISO 639-1, 예: ko, en, fr)")
    return code


def _source_arg(text: str) -> str:
    return "auto" if text.strip().lower() == "auto" else _language_arg(text)


def _stale_options(sub: argparse.ArgumentParser) -> None:
    stale = sub.add_mutually_exclusive_group()
    stale.add_argument("--redo-stale", action="store_true", help="설정이 바뀐 부분을 다시 번역")
    stale.add_argument(
        "--accept-stale", action="store_true", help="설정이 바뀐 부분도 이전 번역 유지"
    )


def _episode_range(text: str) -> str:
    """`--episodes` 값을 파싱 단계에서 검사한다."""
    try:
        select_episodes((), text)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"{exc} (예: S01E01-S01E06)") from exc
    return text


def _entity_spelling(text: str) -> tuple[str, str]:
    entity_id, sep, ko = text.partition("=")
    if not sep or not entity_id.strip() or not ko.strip():
        raise argparse.ArgumentTypeError(f"ID=표기 형식이어야 한다: {text!r}")
    return entity_id.strip(), ko.strip()


def _add_series_parser(commands: Any) -> None:
    series = commands.add_parser("series", help="시리즈 단위 처리 (마스터 용어집 공유)")
    actions = series.add_subparsers(dest="series_command", required=True)

    def root(sub: argparse.ArgumentParser) -> None:
        sub.add_argument("root", type=Path, help="시리즈 폴더")

    def episodes(sub: argparse.ArgumentParser) -> None:
        sub.add_argument(
            "--episodes", type=_episode_range, help="에피소드 범위 (S01E01-S01E06, S01E03)"
        )

    init = actions.add_parser("init", help="series.toml·용어집을 만들고 에피소드를 인식한다")
    root(init)
    init.add_argument("--src", type=_language_arg, required=True, help="원본 언어 (ISO 639-1)")
    init.add_argument("--title", default="", help="작품 이름 (기본: 폴더 이름)")

    analyze = actions.add_parser("analyze", help="에피소드별 델타 분석 (+ prescan 면 reconcile)")
    root(analyze)
    episodes(analyze)

    translate = actions.add_parser("translate", help="분석 후 번역 (모드는 series.toml)")
    root(translate)
    episodes(translate)
    _stale_options(translate)

    review = actions.add_parser("review", help="검토 대기열 보기·결정 반영")
    root(review)
    review.add_argument("--accept", action="append", default=[], metavar="ID", help="표기 확정")
    review.add_argument(
        "--set",
        dest="set_ko",
        action="append",
        default=[],
        type=_entity_spelling,
        metavar="ID=표기",
        help="표기 수정 (locked, 이전 표기는 avoid)",
    )
    review.add_argument("--promote", action="append", default=[], metavar="ID", help="scope series")
    review.add_argument("--dismiss", action="append", default=[], metavar="ID", help="항목만 닫음")
    review.add_argument("--accept-all", action="store_true", help="승격 제안 외 전부 확정")
    review.add_argument("--phrases", action="store_true", help="반복 대사 메모리 목록")
    review.add_argument(
        "--phrase-set",
        action="append",
        default=[],
        type=_entity_spelling,
        metavar="ID=번역",
        help="반복 대사 번역 수정·확정 (rev 증가)",
    )
    review.add_argument(
        "--phrase-accept", action="append", default=[], metavar="ID", help="반복 대사 확정"
    )
    review.add_argument(
        "--phrase-remove", action="append", default=[], metavar="ID", help="반복 대사 지우기"
    )

    lint = actions.add_parser("lint", help="번역된 에피소드의 용어집 표기 일관성 검사")
    root(lint)

    retranslate = actions.add_parser("retranslate", help="바뀐 엔티티가 쓰인 unit 만 다시 번역")
    root(retranslate)
    target = retranslate.add_mutually_exclusive_group(required=True)
    target.add_argument("--changed", action="store_true", help="rev 가 바뀐 엔티티의 unit")
    target.add_argument(
        "--entity", action="append", default=[], metavar="ID", help="이 엔티티가 나오는 unit"
    )
    episodes(retranslate)
    _stale_options(retranslate)


def _add_media_parsers(commands: Any) -> None:
    probe_cmd = commands.add_parser("probe", help="동영상 자막 트랙 목록과 판정 근거")
    probe_cmd.add_argument("file", type=Path)
    media = commands.add_parser(
        "media",
        help="동영상 처리: 큐 등록(기본) · --foreground 바로 처리 · revert <file> 되돌리기",
    )
    media.add_argument("targets", nargs="+", help="파일·폴더, 또는 revert <file>")
    media.add_argument("--recursive", action="store_true", help="하위 폴더까지")
    media.add_argument("--foreground", action="store_true", help="데몬 없이 바로 처리")
    media.add_argument(
        "--force", action="store_true", help="처리 기록·외부 자막이 있어도 다시 처리"
    )
    commands.add_parser("watch", help="감시 데몬 (컨테이너 기본 진입점)")
    commands.add_parser("health", help="감시 데몬 heartbeat 확인 (컨테이너 healthcheck)")


def _add_queue_parser(commands: Any) -> None:
    queue = commands.add_parser("queue", help="미디어 작업 큐 (감시 데몬과 공유)")
    actions = queue.add_subparsers(dest="queue_command", required=True)
    listing = actions.add_parser("list", help="작업 목록")
    listing.add_argument("--status", choices=list(get_args(JobStatus)), help="이 상태만")
    retry = actions.add_parser(
        "retry", help="실패했거나 재시도를 기다리는 작업을 바로 다시 대기시킨다"
    )
    retry.add_argument(
        "job", type=int, nargs="?", help="작업 번호 (없으면 실패·재시도 대기 작업 전부)"
    )
    actions.add_parser("clear-failed", help="실패한 작업 기록을 지운다")


def _add_ledger_parser(commands: Any) -> None:
    ledger = commands.add_parser("ledger", help="미디어 처리 기록")
    actions = ledger.add_subparsers(dest="ledger_command", required=True)
    listing = actions.add_parser("list", help="처리 기록 목록")
    listing.add_argument("--verdict", choices=list(get_args(Verdict)), help="이 판정만")
    listing.add_argument("--all", action="store_true", help="이력(같은 경로의 이전 내용) 포함")
    show = actions.add_parser("show", help="영상 하나의 기록")
    show.add_argument("file", type=Path)
    forget = actions.add_parser("forget", help="기록을 지워 다음에 다시 처리하게 한다")
    forget.add_argument("file", type=Path)
    export = actions.add_parser("export", help="기록을 JSON 으로 내보낸다")
    export.add_argument("output", type=Path, nargs="?", help="파일 (없으면 표준 출력)")
    importer = actions.add_parser("import", help="내보낸 JSON 기록을 가져온다")
    importer.add_argument("input", type=Path)


def _add_glossary_parser(commands: Any) -> None:
    glossary = commands.add_parser("glossary", help="용어집 관리")
    actions = glossary.add_subparsers(dest="glossary_command", required=True)
    importer = actions.add_parser("import", help="공식 이름 CSV 를 시리즈 용어집에 반영")
    importer.add_argument("root", type=Path, help="시리즈 폴더")
    importer.add_argument("csv", type=Path, help="official.csv (source, ko 필수)")


def _configure_logging(args: argparse.Namespace) -> None:
    """로그 레벨·형식을 정한다.

    감시 데몬은 로그가 유일한 진행 기록이다 (컨테이너 로그·Cockpit 에서 본다). 그래서 `-v` 없이도
    INFO 를 내고 시각을 붙인다. 요청마다 INFO 를 남기는 httpx 는 `-v` 일 때만 보인다.
    데몬은 웹 Logs 화면이 읽도록 데이터 폴더의 로그 파일에도 쓴다 (§25.8).
    """
    daemon = args.command == "watch"
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stderr)]
    file_error: OSError | None = None
    if daemon:
        try:
            handlers.append(open_log_handler(data_dir(args)))
        except OSError as exc:
            file_error = exc
    logging.basicConfig(
        level=logging.INFO if args.verbose or daemon else logging.WARNING,
        format=DAEMON_LOG_FORMAT if daemon else CLI_LOG_FORMAT,
        datefmt=DAEMON_LOG_DATEFMT,
        handlers=handlers,
    )
    if not args.verbose:
        logging.getLogger("httpx").setLevel(logging.WARNING)
    if file_error is not None:
        # 로그 파일이 없어도 데몬은 돈다 (컨테이너 로그에는 남는다)
        logging.getLogger(__name__).warning("log file unavailable: %s", file_error)


def main(
    argv: Sequence[str] | None = None, *, adapter_factory: AdapterFactory | None = None
) -> int:
    """CLI 진입점."""
    args = build_parser().parse_args(argv)
    _configure_logging(args)
    try:
        config = load_config(args.config or _env_config())
        apply_timezone(config)
        if args.target:
            config = config.model_copy(
                update={"translation": TranslationConfig(target_language=args.target)}
            )
        return _dispatch(args, config, adapter_factory or _store_adapter_factory(args))
    except ConfigError as exc:
        print(f"설정 오류: {exc}", file=sys.stderr)
        return EXIT_USAGE
    except StaleCheckpointError as exc:
        print(str(exc), file=sys.stderr)
        return EXIT_STALE
    except (
        EncodingDetectionError,
        LanguageDetectionError,
        SubtitleInputError,
        OutputFormatError,
    ) as exc:
        print(f"입력 오류: {exc}", file=sys.stderr)
        return EXIT_USAGE
    except (SeriesInitError, SeriesSettingsError, GlossaryError, PhraseError) as exc:
        print(f"시리즈 오류: {exc}", file=sys.stderr)
        return EXIT_USAGE
    except LlmError as exc:
        print(f"LLM 오류: {exc}", file=sys.stderr)
        return EXIT_FAILED


def _store_adapter_factory(args: argparse.Namespace) -> AdapterFactory:
    """데이터 폴더 비밀 저장소의 키로 어댑터를 만든다 (환경 변수 키는 읽지 않는다, §28.2)."""

    def make(config: AppConfig) -> LlmAdapter:
        folder = data_dir(args)
        return create_adapter(config, secrets=SecretStore.for_data_dir(folder), data_dir=folder)

    return make


def _dispatch(args: argparse.Namespace, config: AppConfig, factory: AdapterFactory) -> int:
    if args.command == "series":
        return _series(args, config, factory)
    if args.command == "glossary":
        return _glossary_import(args.root, args.csv, config.translation.target_language)
    if args.command == "queue":
        return _queue(args, config)
    if args.command == "probe":
        return _probe(args, config)
    if args.command == "media":
        return _media(args, config, factory)
    if args.command == "watch":
        return _watch(args, config, factory)
    if args.command == "health":
        return _health(args)
    if args.command == "ledger":
        return _ledger(args, config)
    if not args.input.is_file():
        print(f"입력 파일이 없다: {args.input}", file=sys.stderr)
        return EXIT_USAGE
    if args.src == config.translation.target_language:
        print(f"원본과 대상 언어가 같다: {args.src}", file=sys.stderr)
        return EXIT_USAGE
    options = _run_options(args, config)
    work_dir = args.work_dir or default_work_dir(args.input, config.translation.target_language)
    with _adapter(factory, config) as adapter:
        if args.command == "analyze":
            return _analyze(args.input, work_dir, adapter, options)
        return _translate(args, work_dir, adapter, options)


@contextmanager
def _adapter(factory: AdapterFactory, config: AppConfig) -> Iterator[LlmAdapter]:
    """LLM 을 쓰는 명령만 어댑터를 만든다 (init·review·lint 는 키 없이 돈다)."""
    adapter = factory(config)
    try:
        yield adapter
    finally:
        adapter.close()


def _guarded(adapter: LlmAdapter) -> GuardedAdapter:
    """모든 요청을 공급자 가드로 감싼 어댑터 (CLI 는 일시 정지 상한이 있다)."""
    return GuardedAdapter(adapter, _guard(adapter))


def _guard(adapter: LlmAdapter) -> ProviderGuard:
    return ProviderGuard(
        adapter, policy=AvailabilityPolicy(check_interval_s=30, max_pause_s=CLI_MAX_PAUSE_S)
    )


def data_dir(args: argparse.Namespace) -> Path:
    """데이터 폴더: `--data` → 환경 변수 → `/data`."""
    if args.data:
        return Path(args.data)
    value = os.environ.get(DATA_ENV) or os.environ.get(LEGACY_DATA_ENV)
    return Path(value) if value else DEFAULT_DATA_DIR


def _env_config() -> Path | None:
    value = os.environ.get(CONFIG_ENV) or os.environ.get(LEGACY_CONFIG_ENV)
    return Path(value) if value else None


def _run_options(args: argparse.Namespace, config: AppConfig) -> RunOptions:
    return base_run_options(
        config,
        src=getattr(args, "src", "auto"),
        encoding=getattr(args, "encoding", None),
        resume=_resume_policy(args),
    )


def _resume_policy(args: argparse.Namespace) -> ResumePolicy:
    if getattr(args, "redo_stale", False):
        return "redo"
    if getattr(args, "accept_stale", False):
        return "accept"
    return "ask"


def _analyze(input_path: Path, work_dir: Path, adapter: LlmAdapter, options: RunOptions) -> int:
    glossary, _, lang = analyze_file(input_path, work_dir, adapter, options)
    entries = glossary.for_language(lang)
    print(f"용어집 {len(entries)}개 항목 ({lang}): {work_dir / 'glossary.yaml'}")
    for entry in entries:
        print(
            f"  {entry.id} {entry.source} = {entry.target} [{entry.target_source}, {entry.status}]"
        )
    return EXIT_OK


def _translate(
    args: argparse.Namespace, work_dir: Path, adapter: LlmAdapter, options: RunOptions
) -> int:
    output = args.output or default_output_path(args.input, args.output_format, options.target)
    options = replace(options, output_format=args.output_format, ass_font=args.ass_font)
    # Pass 1·2 모든 요청이 가드를 거친다 (공급자 장애 시 일시 정지, §6.3)
    result = translate_file(args.input, output, work_dir, _guarded(adapter), options)
    print(render_summary(result.report), end="")
    print(
        f"작업 폴더: {work_dir} "
        f"(재사용 unit {result.reused_units}, 새로 번역 {result.translated_units})"
    )
    return EXIT_OK


def _series(args: argparse.Namespace, config: AppConfig, factory: AdapterFactory) -> int:
    command: str = args.series_command
    if command == "init":
        return _series_init(args.root, args.src, args.title, config.translation.target_language)
    workspace = SeriesWorkspace(args.root, config.translation.target_language)
    workspace.settings()  # series.toml 이 없거나 잘못됐으면 어댑터를 만들기 전에 멈춘다
    if command == "review":
        return _series_review(workspace, args)
    if command == "lint":
        return _series_lint(workspace)
    options = _run_options(args, config)
    with _adapter(factory, config) as raw_adapter:
        adapter = _guarded(raw_adapter)
        if command == "analyze":
            result = analyze_series(workspace, adapter, episodes=args.episodes)
            _print_analyses(result)
            return _print_review_hint(workspace)
        if command == "translate":
            result = run_series(workspace, adapter, options, episodes=args.episodes)
            return _print_series_run(workspace, result)
        retranslated = retranslate_series(
            workspace,
            adapter,
            entities=frozenset(args.entity),
            settings_resume=options.resume,
            options=options,
            episodes=args.episodes,
        )
    for key, count in retranslated.retranslated.items():
        print(f"{key}: unit {count}개 다시 번역")
    if retranslated.skipped:
        print(f"바뀐 unit 없음: {', '.join(retranslated.skipped)}")
    return EXIT_OK


def _series_init(root: Path, src_lang: str, title: str, target: str) -> int:
    workspace, scan = init_series(root, src_lang, title=title, target=target)
    print(f"시리즈: {workspace.settings_path}")
    for episode in scan.episodes:
        print(f"  {episode.key}  {episode.path.relative_to(workspace.root)}")
    for key, path in scan.duplicates:
        print(f"  중복 {key} (사용 안 함): {path.relative_to(workspace.root)}")
    if scan.unrecognized:
        print("에피소드 번호를 알 수 없는 파일 (series.toml [[episodes]] 로 지정):")
        for path in scan.unrecognized:
            print(f"  {path.relative_to(workspace.root)}")
    print(f"에피소드 {len(scan.episodes)}개")
    return EXIT_OK


def _print_analyses(result: SeriesRunResult) -> None:
    for analysis in result.analyses:
        if analysis.skipped:
            print(f"{analysis.episode}: 이미 분석함")
            continue
        merge = analysis.merge
        print(
            f"{analysis.episode}: 새 항목 {len(merge.added)}, 변형 {len(merge.variants_added)}, "
            f"충돌 {len(merge.conflicts)}, 읽기 신뢰도 낮음 {len(merge.low_confidence)}"
        )
    if result.reconciled:
        print("전역 reconcile 완료")


def _print_review_hint(workspace: SeriesWorkspace) -> int:
    items = open_review_items(workspace)
    if items:
        blocking = sum(1 for item in items if item.blocking)
        print(
            f"검토 대기 {len(items)}건 (번역을 막는 항목 {blocking}): "
            f"subtitle-robot series review {workspace.root}"
        )
    return EXIT_OK


def _print_series_run(workspace: SeriesWorkspace, result: SeriesRunResult) -> int:
    _print_analyses(result)
    for key, report in result.translated.items():
        review = f", 검토 필요 블록 {len(report.needs_review)}" if report.needs_review else ""
        print(
            f"{key}: 블록 {report.blocks} (번역 {report.translated_blocks}), "
            f"error {report.errors}, warning {report.warnings}{review}"
        )
    for key, reasons in result.blocked.items():
        print(f"{key}: 검토 대기 항목 때문에 번역하지 않음", file=sys.stderr)
        for reason in reasons:
            print(f"  {reason}", file=sys.stderr)
    print(f"출력 폴더: {workspace.out_dir}")
    _print_review_hint(workspace)
    return EXIT_FAILED if result.blocked else EXIT_OK


def _series_phrases(workspace: SeriesWorkspace, args: argparse.Namespace) -> bool:
    """반복 대사 확정·수정·삭제·목록 (§24.4). 무엇이든 했으면 True."""
    if not (args.phrases or args.phrase_set or args.phrase_accept or args.phrase_remove):
        return False
    book = load_phrases(workspace.phrases_path)
    changed = False
    for phrase_id, ko in args.phrase_set:
        phrase = set_phrase(book, phrase_id, ko)
        print(f"반복 대사 수정 {phrase.id} = {phrase.target} (rev {phrase.rev})")
        changed = True
    for phrase_id in args.phrase_accept:
        print(f"반복 대사 확정 {accept_phrase(book, phrase_id).id}")
    for phrase_id in args.phrase_remove:
        remove_phrase(book, phrase_id)
        print(f"반복 대사 지움 {phrase_id}")
    if args.phrase_set or args.phrase_accept or args.phrase_remove:
        save_phrases(book, workspace.phrases_path)
    if changed:
        print(f"번역된 에피소드 반영: subtitle-robot series retranslate {workspace.root} --changed")
    if args.phrases:
        print(f"반복 대사 {len(book.phrases)}개")
        for phrase in book.phrases:
            mark = "확정" if phrase.status == "locked" else "자동"
            episodes = ", ".join(phrase.episodes)
            print(f"  [{mark}] {phrase.id} {phrase.src} → {phrase.target} ({episodes})")
    return True


def _series_review(workspace: SeriesWorkspace, args: argparse.Namespace) -> int:
    phrases_only = _series_phrases(workspace, args)
    decided = args.accept or args.set_ko or args.promote or args.dismiss or args.accept_all
    if phrases_only and not decided:
        return EXIT_OK
    if decided:
        result = apply_review(
            workspace,
            accept=args.accept,
            set_ko=dict(args.set_ko),
            promote=args.promote,
            dismiss=args.dismiss,
            accept_all=args.accept_all,
        )
        for entity_id in result.locked:
            print(f"확정 {entity_id}")
        for entity_id, ko in result.changed.items():
            print(f"표기 수정 {entity_id} = {ko}")
        for entity_id in result.promoted:
            print(f"scope series {entity_id}")
        for entity_id in result.dismissed:
            print(f"닫음 {entity_id}")
        if result.changed:
            print(
                "번역된 에피소드 반영: "
                f"subtitle-robot series retranslate {workspace.root} --changed"
            )
        remaining = result.remaining
    else:
        remaining = open_review_items(workspace)
    glossary = load_glossary(workspace.glossary_path)
    names = {entry.id: f"{entry.source}={entry.target}" for entry in glossary.entries}
    print(f"검토 대기 {len(remaining)}건")
    for item in remaining:
        mark = "막음" if item.blocking else "제안"
        name = names.get(item.entity_id, "")
        print(f"  [{mark}] {item.kind} {item.entity_id} {name} ({item.episode}): {item.detail}")
    return EXIT_OK


def _series_lint(workspace: SeriesWorkspace) -> int:
    result = lint_series(workspace)
    for issue in result.issues:
        unit = f" {issue.unit}" if issue.unit else ""
        print(
            f"{issue.severity} {issue.code} {issue.episode}#{issue.idx}{unit} "
            f"{issue.entity_id}: {issue.detail}"
        )
    print(
        f"에피소드 {len(result.episodes)}개, error {len(result.errors)}, "
        f"warning {len(result.issues) - len(result.errors)}"
    )
    return EXIT_FAILED if result.errors else EXIT_OK


def _glossary_import(root: Path, csv_path: Path, target: str) -> int:
    workspace = SeriesWorkspace(root, target)
    settings = workspace.settings()
    if not csv_path.is_file():
        print(f"입력 파일이 없다: {csv_path}", file=sys.stderr)
        return EXIT_USAGE
    rows = read_official_csv(csv_path)
    current = (
        load_glossary(workspace.glossary_path)
        if workspace.glossary_path.exists()
        else Glossary(series=settings.title or None)
    )
    glossary, report = import_official(current, rows, default_src_lang=settings.src_lang)
    save_glossary(glossary, workspace.glossary_path)
    print(
        f"추가 {len(report.added)}, 표기 변경 {len(report.updated)}, "
        f"변형 변경 {len(report.variants_updated)}, 그대로 {len(report.unchanged)}, "
        f"수동 표기라 건너뜀 {len(report.skipped_manual)}"
    )
    if report.updated or report.variants_updated:
        print(f"번역된 에피소드 반영: subtitle-robot series retranslate {root} --changed")
    return EXIT_OK


def _queue(args: argparse.Namespace, config: AppConfig) -> int:
    queue = JobQueue(state_path(data_dir(args)), max_attempts=config.queue.max_attempts)
    try:
        if args.queue_command == "retry":
            count = queue.retry(args.job)
            print(f"다시 대기: {count}건")
            return EXIT_OK if count or args.job is None else EXIT_USAGE
        if args.queue_command == "clear-failed":
            print(f"지운 실패 작업: {queue.clear_failed()}건")
            return EXIT_OK
        state = queue.provider_state()
        reason = queue.provider_reason()
        print(f"공급자: {state}" + (f" ({reason})" if reason else ""))
        jobs = queue.jobs(args.status)
        for job in jobs:
            retry = ""
            if job.status == "queued" and job.attempts:
                retry = f" 재시도 {job.attempts}회"
            if job.status == "queued" and job.next_attempt_at > time.time():
                until = time.strftime("%H:%M:%S", time.localtime(job.next_attempt_at))
                retry += f" 대기 {until}까지"
            error = f" — {job.error}" if job.error else ""
            print(f"{job.id:>5} {job.status:<11} {job.priority:<7}{retry} {job.path}{error}")
        print(f"작업 {len(jobs)}건")
        return EXIT_OK
    finally:
        queue.close()


def _ledger(args: argparse.Namespace, config: AppConfig) -> int:
    data = data_dir(args)
    ledger = Ledger(state_path(data), data, hash_bytes=config.ledger.hash_bytes)
    try:
        command: str = args.ledger_command
        if command == "list":
            entries = ledger.entries(args.verdict, include_history=args.all)
            for entry in entries:
                mark = "" if entry.current else " (이력)"
                print(f"{entry.verdict:<12} {entry.content_id[:12]} {entry.path}{mark}")
            print(f"기록 {len(entries)}건")
            return EXIT_OK
        if command == "show":
            found = ledger.find(args.file.absolute())
            if found is None:
                print(f"기록이 없다: {args.file}", file=sys.stderr)
                return EXIT_USAGE
            print(f"경로: {found.path}")
            print(f"판정: {found.verdict}" + (f" ({found.reason})" if found.reason else ""))
            print(f"내용 식별값: {found.content_id}")
            if found.provider:
                print(f"공급자: {found.provider} ({found.model or '-'})")
            if found.source:
                print(f"소스: {json.dumps(found.source, ensure_ascii=False)}")
            for output in found.sidecars.outputs:
                print(f"  출력 {output.path}")
            for rename in found.sidecars.renames:
                print(f"  이름 변경 {rename.original} → {rename.renamed}")
            return EXIT_OK
        if command == "forget":
            count = ledger.forget(args.file.absolute())
            print(f"지운 기록: {count}건")
            return EXIT_OK if count else EXIT_USAGE
        if command == "export":
            text = json.dumps(ledger.export_rows(), ensure_ascii=False, indent=1)
            if args.output:
                atomic_write_text(args.output, text + "\n")
                print(f"내보냄: {args.output}")
            else:
                print(text)
            return EXIT_OK
        rows = json.loads(args.input.read_text(encoding="utf-8"))
        if not isinstance(rows, list):
            print("가져올 파일은 기록 목록(JSON 배열)이어야 한다", file=sys.stderr)
            return EXIT_USAGE
        print(f"가져온 기록: {ledger.import_rows(rows)}건")
        return EXIT_OK
    except LedgerError as exc:
        print(f"ledger 오류: {exc}", file=sys.stderr)
        return EXIT_USAGE
    finally:
        ledger.close()


def _probe(args: argparse.Namespace, config: AppConfig) -> int:
    path: Path = args.file.absolute()
    if not path.is_file():
        print(f"입력 파일이 없다: {path}", file=sys.stderr)
        return EXIT_USAGE
    try:
        result = probe(path)
    except MediaToolError as exc:
        print(f"검사 실패: {exc}", file=sys.stderr)
        return EXIT_FAILED
    print(f"{path} ({result.container}, 자막 트랙 {len(result.tracks)}개)")
    for track in result.tracks:
        flags = [
            name
            for name, on in (
                ("forced", track.forced),
                ("default", track.default),
                ("sdh", track.is_sdh),
            )
            if on
        ]
        language = track.effective_language or "미지정"
        print(
            f"  #{track.order} [{track.track_id}] {track.kind:<8} {language:<4} "
            f"{track.codec} {track.name}" + (f" ({', '.join(flags)})" if flags else "")
        )
    data = data_dir(args)
    ledger = Ledger(state_path(data), data, hash_bytes=config.ledger.hash_bytes)
    try:
        entry = ledger.find(path)
    finally:
        ledger.close()
    # 이 도구가 만든 사이드카는 외부 자막이 아니다 (워커의 판정과 같게, §21.11)
    own = {str(output).casefold() for output in own_outputs(entry)}
    target = config.translation.target_language
    evidence = target_evidence(
        result,
        None,
        target=target,
        image_counts=config.media.target_image_counts,
        tool_outputs=own_outputs(entry),
    )
    if evidence:
        print(f"대상 언어({target}) 자막 있음: {evidence}")
    for subtitle in external_subtitles(path):
        if str(subtitle).casefold() in own:
            print(f"이 도구의 출력: {subtitle.name}")
        else:
            print(f"외부 자막: {subtitle.name}")
    print(f"처리 기록: {entry.verdict} ({entry.reason})" if entry else "처리 기록: 없음")
    return EXIT_OK


def _media(args: argparse.Namespace, config: AppConfig, factory: AdapterFactory) -> int:
    data = data_dir(args)
    db = state_path(data)
    if args.targets[0] == "revert":
        return _media_revert(args.targets[1:], config, data)
    try:
        files = collect_media_files(args.targets, config.watch, recursive=args.recursive)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return EXIT_USAGE
    if not files:
        print("처리할 동영상이 없다 (*.mkv, *.mp4)", file=sys.stderr)
        return EXIT_USAGE
    queue = JobQueue(db, max_attempts=config.queue.max_attempts)
    try:
        jobs = []
        for path in files:
            target = media_target(config, data, path)
            jobs.append(
                queue.enqueue(
                    path,
                    force=args.force,
                    series_key=series_key_for(target),
                    detail={"origin": "media", "kind": target.kind, "slug": target.slug},
                )
            )
        if not args.foreground:
            for job in jobs:
                print(f"등록 {job.id}: {job.path}")
            print(f"큐 등록 {len(jobs)}건 (감시 데몬이 처리한다. 바로 처리하려면 --foreground)")
            return EXIT_OK
        return _media_foreground(config, data, queue, jobs, factory)
    finally:
        queue.close()


def _media_foreground(
    config: AppConfig, data: Path, queue: JobQueue, jobs: Sequence[Job], factory: AdapterFactory
) -> int:
    ledger = Ledger(state_path(data), data, hash_bytes=config.ledger.hash_bytes)
    failed = 0
    try:
        with _adapter(factory, config) as adapter:
            worker = MediaWorker(
                config, queue=queue, ledger=ledger, data_dir=data, adapter=adapter,
                guard=_guard(adapter), origin_resolver=create_origin_resolver(config.tmdb, data),
            )  # fmt: skip
            for job in jobs:
                claimed = queue.claim(job.id)
                if claimed is None:
                    print(
                        f"{job.path}: 다른 처리기가 맡았거나 대기 중이 아니다 "
                        f"({queue.get(job.id).status})"
                    )
                    continue
                outcome = worker.process(claimed)
                print(f"{job.path}: {outcome.verdict or outcome.status} — {outcome.reason}")
                for output in outcome.outputs:
                    print(f"  {output}")
                failed += outcome.status not in ("done", "skipped")
    finally:
        ledger.close()
    return EXIT_FAILED if failed else EXIT_OK


def _media_revert(files: Sequence[str], config: AppConfig, data: Path) -> int:
    if len(files) != 1:
        print("사용법: subtitle-robot media revert <file>", file=sys.stderr)
        return EXIT_USAGE
    ledger = Ledger(state_path(data), data, hash_bytes=config.ledger.hash_bytes)
    try:
        removed, restored, problems = revert_media(ledger, Path(files[0]).absolute())
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return EXIT_USAGE
    finally:
        ledger.close()
    for path in removed:
        print(f"지움 {path}")
    for path in restored:
        print(f"되돌림 {path}")
    for problem in problems:
        print(f"남김: {problem}", file=sys.stderr)
    return EXIT_OK


def _watch(args: argparse.Namespace, config: AppConfig, factory: AdapterFactory) -> int:
    stop = threading.Event()

    def request_stop(_signum: int, _frame: object) -> None:
        stop.set()

    signal.signal(signal.SIGTERM, request_stop)
    signal.signal(signal.SIGINT, request_stop)
    # 키·공급자 설정이 없어도 웹 Settings 로 넣을 수 있게 데몬은 띄운다 (§28.2)
    try:
        adapter: LlmAdapter | None = factory(config)
    except ConfigError as error:
        logging.getLogger(__name__).warning("LLM provider is not ready: %s", error)
        adapter = None
    try:
        restart = run_daemon(
            config,
            data_dir=data_dir(args),
            adapter=adapter,
            stop=stop,
            config_path=args.config or _env_config(),
        )
    finally:
        if adapter is not None:
            adapter.close()
    # 재기동 요청: 0 이 아닌 코드로 끝내 재시작 정책(on-failure 포함)이 다시 띄우게 한다
    return EXIT_RESTART if restart else EXIT_OK


def _health(args: argparse.Namespace) -> int:
    age = heartbeat_age(state_path(data_dir(args)))
    if age is None:
        print("heartbeat 없음 (데몬이 시작 전이거나 데이터 폴더가 다르다)", file=sys.stderr)
        return EXIT_FAILED
    if age > HEALTH_MAX_AGE_S:
        print(f"heartbeat 가 {age:.0f}초 전이다 (기준 {HEALTH_MAX_AGE_S:.0f}초)", file=sys.stderr)
        return EXIT_FAILED
    print(f"정상 (heartbeat {age:.0f}초 전)")
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
