"""작업 처리: probe → 추출 → 판정 → 번역 → 사이드카·ledger (PROJECT-PLAN §21.2, WI-5.008).

감시 데몬의 워커와 `media --foreground` 가 같은 처리를 쓴다. 단계마다 큐 상태를 남긴다.
- 처리한 적 있는 영상(ledger)은 건너뛰고, 이동·복사된 영상은 사이드카만 복원한다 (`--force` 면 다시)
- `media` 명령·백로그는 외부 자막이 있으면 건너뛴다 (`--force` 면 처리하고 이름 변경 규칙 적용)
- 영화는 단일 작품 파이프라인, 시리즈는 작업공간의 시리즈 파이프라인으로 번역한다
- 데몬은 사람에게 물을 수 없으므로 설정이 바뀐 미완료 번역은 다시 번역한다 (resume=redo)
"""

from __future__ import annotations

import logging
import shutil
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from subtitle_robot.checkpoint import StaleCheckpointError
from subtitle_robot.config import AppConfig
from subtitle_robot.io.convert import ass_to_srt
from subtitle_robot.io.encoding import EncodingDetectionError
from subtitle_robot.io.langdetect import LanguageDetectionError
from subtitle_robot.lang.codes import DEFAULT_TARGET
from subtitle_robot.llm.availability import GuardedAdapter, ProviderGuard
from subtitle_robot.llm.base import LlmAdapter
from subtitle_robot.llm.errors import LlmError
from subtitle_robot.media.commands import CommandCancelled, MediaToolError, tool_runner
from subtitle_robot.media.extract import (
    EXTRACT_TIMEOUT_S,
    ExtractedTrack,
    ExtractionResult,
    Installer,
    extract_subtitles,
)
from subtitle_robot.media.probe import PROBE_TIMEOUT_S, ProbeResult, probe
from subtitle_robot.media.select import (
    FALLBACK_SOURCE_LANGUAGE,
    Decision,
    MediaTarget,
    classify_media,
    decide,
    ensure_series_workspace,
    external_subtitles,
    first_candidate,
    stage_episode,
)
from subtitle_robot.media.sidecar import (
    SidecarRecord,
    SidecarWriter,
    file_sha256,
    revert_sidecars,
)
from subtitle_robot.media.tmdb import OriginLanguage, OriginLanguageResolver
from subtitle_robot.pipeline.report import model_display
from subtitle_robot.pipeline.runner import RunOptions, WorkPaths, translate_file
from subtitle_robot.run_config import base_run_options
from subtitle_robot.series.manifest import EpisodeId
from subtitle_robot.series.runner import analyze_series, run_series
from subtitle_robot.watch.cancel import OperationCancelled
from subtitle_robot.watch.ledger import Ledger, LedgerEntry, Verdict
from subtitle_robot.watch.queue import Job, JobQueue

logger = logging.getLogger(__name__)

# 영화 번역 출력 `out.<대상>.srt` (작업공간 안)
MOVIE_OUTPUT_PREFIX = "out"
EXTRACT_DIR = "extract"
# 작업 detail 의 진행 중 사이드카 기록 키
PARTIAL_KEY = "partial_sidecars"
REVERTED_REASON = "media revert 로 되돌림 (다시 처리하려면 ledger forget)"


class EpisodeBlockedError(RuntimeError):
    """시리즈 검토 대기열 때문에 번역하지 못한 에피소드 (검토 후 재시도된다)."""


@dataclass(frozen=True)
class JobOutcome:
    """작업 처리 결과."""

    status: str
    verdict: Verdict | None
    reason: str
    outputs: tuple[Path, ...] = ()


class MediaWorker:
    """큐의 작업 하나를 끝까지 처리한다.

    Args:
        config: 전역 설정.
        queue: 작업 큐.
        ledger: 처리 기록.
        data_dir: 데이터 폴더 (작업공간).
        adapter: LLM 어댑터.
        guard: 공급자 가드 (불가 시 일시 정지·재개).
        stop: 데몬 종료 요청. 있으면 실행 중인 검사·추출 도구를 끝내고 작업을 다시 대기시킨다.
        origin_resolver: 작품 원어 조회기 (TMDB, §26.6). 없으면 조회하지 않고 첫 트랙을 쓴다.
    """

    def __init__(
        self,
        config: AppConfig,
        *,
        queue: JobQueue,
        ledger: Ledger,
        data_dir: Path,
        adapter: LlmAdapter,
        guard: ProviderGuard | None = None,
        stop: threading.Event | None = None,
        origin_resolver: OriginLanguageResolver | None = None,
    ) -> None:
        self._config = config
        self._language = config.translation.target_language
        self._origins = origin_resolver
        self._queue = queue
        self._ledger = ledger
        self._data_dir = Path(data_dir)
        # Pass 1·요약·reconcile 요청도 공급자 장애 때 일시 정지한다 (시도 횟수를 쓰지 않음, §6.3)
        self._adapter = GuardedAdapter(adapter, guard) if guard else adapter
        # Pass 2 배치는 이미 가드를 거친 어댑터로 보내므로 따로 감싸지 않는다
        self._guard: ProviderGuard | None = None
        low_priority = config.media.tool_priority == "low"
        should_stop = stop.is_set if stop is not None else None
        self._probe_run = tool_runner(
            PROBE_TIMEOUT_S, low_priority=low_priority, should_stop=should_stop
        )
        self._extract_run = tool_runner(
            EXTRACT_TIMEOUT_S, low_priority=low_priority, should_stop=should_stop
        )
        self._roots = sorted(
            ((Path(item.path), item.kind) for item in config.watch.paths),
            key=lambda item: len(item[0].parts),
            reverse=True,
        )

    def run_once(self) -> JobOutcome | None:
        """큐에서 작업 하나를 꺼내 처리한다. 꺼낼 작업이 없으면 None."""
        job = self._queue.claim()
        return self.process(job) if job is not None else None

    def process(self, job: Job) -> JobOutcome:
        """작업을 처리하고 큐·ledger 에 결과를 남긴다. 예외를 밖으로 내지 않는다.

        종료 요청으로 멈추면 시도 횟수를 늘리지 않고 다시 대기로 돌린다 (다음 기동 때 이어서).
        """
        logger.info("job %s started: %s", job.id, job.path)
        try:
            outcome = self._process(job)
        except (OperationCancelled, CommandCancelled) as exc:
            self._queue.defer(job.id, str(exc))
            logger.info("job %s deferred until next start: %s", job.id, exc)
            return JobOutcome("queued", None, str(exc))
        except (
            MediaToolError,
            LlmError,
            StaleCheckpointError,
            EncodingDetectionError,
            LanguageDetectionError,
            EpisodeBlockedError,
            OSError,
        ) as exc:
            return self._failed(job, f"{type(exc).__name__}: {exc}")
        self._queue.complete(
            job.id,
            "done" if outcome.status == "done" else "skipped",
            {
                **job.detail,
                "verdict": outcome.verdict,
                "reason": outcome.reason,
                "outputs": [str(path) for path in outcome.outputs],
            },
        )
        logger.info(
            "job %s %s (%s): %s%s",
            job.id,
            outcome.status,
            outcome.verdict or "-",
            outcome.reason,
            f" -> {', '.join(path.name for path in outcome.outputs)}" if outcome.outputs else "",
        )
        self._clean_work_files(job.path)
        return outcome

    def _clean_work_files(self, path: Path) -> None:
        """처리가 끝난 영상의 작업 파일을 지운다. 용어집·리포트·시리즈 기록은 남긴다 (WI-5.008c).

        - 추출 트랙(`extract/<화>`·`extract/movie`): 작업마다 다시 뽑으므로 다시 읽는 곳이 없다
        - 영화의 정규화 원문·unit 구성·체크포인트·번역 사본: 다시 처리하면 처음부터 번역한다
          (resume=redo). 용어집(`glossary.yaml`)과 리포트는 남긴다
        - 시리즈의 `work/`·`out/`·`episodes/`는 남긴다: 반복 대사 수집·일관성 검사·부분 재번역이
          끝난 화의 파일을 다시 읽는다
        실패하거나 미뤄진 작업은 지우지 않는다 (진단·이어 처리). 지우지 못해도 작업 결과는 그대로다.
        """
        target = self._target(path)
        removed: list[Path] = []
        try:
            extract = self._work_dir(target)
            if extract.is_dir():
                removed.extend(item for item in extract.rglob("*") if item.is_file())
                shutil.rmtree(extract)
            if target.kind == "movie":
                work = WorkPaths(self._movie_work_dir(target))
                outputs = sorted(work.root.glob(f"{MOVIE_OUTPUT_PREFIX}.*"))
                for item in (work.normalized, work.units, work.checkpoint, *outputs):
                    if item.is_file():
                        item.unlink()
                        removed.append(item)
        except OSError as exc:
            logger.warning("could not clean work files of %s: %s", path, exc)
            return
        if removed:
            logger.info("cleaned %d work files of %s", len(removed), path)

    # ------------------------------------------------------------ 단계

    def _process(self, job: Job) -> JobOutcome:
        path = job.path
        if not path.is_file():
            return JobOutcome("skipped", None, "파일이 없다")
        lookup = self._ledger.lookup(path)
        # 같은 영상(재처리)이나 같은 경로의 이전 내용(릴리스 교체)이 남긴 출력은 이 도구의 것이다
        previous = lookup.entry if lookup.kind in ("same", "changed") else None
        # 중단된 이 작업이 기록 전에 쓴 사이드카 (재시작 뒤 이어서 처리할 때)
        partial = _partial_record(job)
        known = partial or (previous.sidecars if previous else None)
        if not job.force:
            if lookup.kind == "same" and previous is not None:
                return JobOutcome("skipped", previous.verdict, f"이미 처리함 ({previous.verdict})")
            if lookup.kind in ("moved", "copied"):
                entry = self._ledger.relocate(
                    lookup, path, restore=self._config.ledger.restore_missing_outputs
                )
                outputs = tuple(Path(o.path) for o in entry.sidecars.outputs)
                return JobOutcome(
                    "skipped", entry.verdict, f"{lookup.kind}: 사이드카 복원", outputs
                )
            skip_external = job.priority == "backlog" or job.detail.get("origin") == "media"
            own = {str(p).casefold() for p in own_outputs(known)}
            external = (
                [p for p in external_subtitles(path) if str(p).casefold() not in own]
                if skip_external
                else []
            )
            if external:
                self._ledger.record(
                    path,
                    verdict="has_external",
                    reason=f"외부 자막 {external[0].name}",
                    identity=lookup.content_id,
                )
                return JobOutcome("skipped", "has_external", f"외부 자막 {external[0].name}")

        target = self._target(path)
        writer = SidecarWriter(
            style=self._config.sidecar.rename_style,
            on_conflict=self._config.sidecar.on_conflict,
            previous=known,
        )
        probed = probe(path, run=self._probe_run)
        self._queue.advance(job.id, "extracting")
        origin = self._origin(target, path)
        extraction = self._extract(
            probed, target, origin, sidecar_dir=self._sidecar_dir(path), install=writer
        )
        self._save_partial(job, writer)
        decision = decide(
            probed,
            extraction,
            self._config.media,
            target=self._language,
            origin=origin,
            tool_outputs=own_outputs(writer.record),
        )
        if decision.verdict != "translate" or decision.source is None:
            return self._settle(job, decision, writer.record, lookup.content_id, probed.segment_uid)

        self._queue.advance(job.id, "translating")
        source = decision.source
        text, provider, model = self._translate(job, target, source)
        sidecar_dir = self._sidecar_dir(path)
        stem = f"{path.stem}.{self._language}"
        if self._translation_input(source).suffix.lower() == ".ass":
            writer.write_text(sidecar_dir / f"{stem}.ass", text)
            if self._config.media.output_format == "both":
                writer.write_text(sidecar_dir / f"{stem}.srt", ass_to_srt(text))
        else:
            writer.write_text(sidecar_dir / f"{stem}.srt", text)
        self._save_partial(job, writer)
        self._ledger.record(
            path,
            verdict="translated",
            reason=decision.reason,
            identity=lookup.content_id,
            segment_uid=probed.segment_uid,
            source=_source_info(source),
            provider=provider,
            model=model,
            sidecars=writer.record,
            attempts=job.attempts,
        )
        outputs = tuple(Path(o.path) for o in writer.record.outputs)
        return JobOutcome("done", "translated", decision.reason, outputs)

    def _origin(self, target: MediaTarget, path: Path) -> OriginLanguage | None:
        """작품 원어 (TMDB). 조회기가 없으면 None."""
        if self._origins is None:
            return None
        return self._origins.resolve(target.kind, path, target.title)

    def _extract(
        self,
        probed: ProbeResult,
        target: MediaTarget,
        origin: OriginLanguage | None,
        *,
        sidecar_dir: Path | None,
        install: Installer,
    ) -> ExtractionResult:
        """설정 언어 + 대상 언어·원어·영어 트랙과 소스 후보 첫 트랙을 뽑는다 (§26.6)."""
        media = self._config.media
        langs = [*media.extract_langs, self._language]
        if origin is not None and origin.language:
            langs.append(origin.language)
        # 원어 트랙이 없을 때의 소스 (설정 extract_langs 에서 영어를 빼도 뽑는다)
        langs.append(FALLBACK_SOURCE_LANGUAGE)
        first = first_candidate(probed, target=self._language, skip_forced=media.skip_forced)
        return extract_subtitles(
            probed,
            self._work_dir(target),
            langs=list(dict.fromkeys(langs)),
            always=(first.order,) if first is not None else (),
            sidecar_dir=sidecar_dir,
            install=install,
            run=self._extract_run,
        )

    def _save_partial(self, job: Job, writer: SidecarWriter) -> None:
        """지금까지 쓴 사이드카를 작업에 남긴다 (처리 기록 전에 중단돼도 다음에 알아보게)."""
        self._queue.update_detail(job.id, {PARTIAL_KEY: writer.record.model_dump(mode="json")})

    def _settle(
        self,
        job: Job,
        decision: Decision,
        record: SidecarRecord,
        identity: str | None,
        segment_uid: str | None,
    ) -> JobOutcome:
        verdict: Verdict = "no_source" if decision.verdict == "translate" else decision.verdict
        self._ledger.record(
            job.path,
            verdict=verdict,
            reason=decision.reason,
            identity=identity,
            segment_uid=segment_uid,
            sidecars=record,
            attempts=job.attempts,
        )
        outputs = tuple(Path(o.path) for o in record.outputs)
        return JobOutcome("done", verdict, decision.reason, outputs)

    def _translate(
        self, job: Job, target: MediaTarget, source: ExtractedTrack
    ) -> tuple[str, str | None, str | None]:
        """번역 결과 텍스트(입력이 ASS 면 ASS, 아니면 SRT)와 공급자·모델."""
        language = source.language
        options = base_run_options(
            self._config,
            src=language,
            resume="redo",
            extra_params={"media_source": _source_info(source)},
        )
        if target.kind == "series" and target.episode is not None:
            return self._translate_episode(job, target, target.episode, source, options)
        work = self._movie_work_dir(target)
        work.mkdir(parents=True, exist_ok=True)
        source_path = self._translation_input(source)
        suffix = ".ass" if source_path.suffix == ".ass" else ".srt"
        output = work / f"{MOVIE_OUTPUT_PREFIX}.{self._language}{suffix}"
        result = translate_file(
            source_path, output, work, self._adapter, options, guard=self._guard
        )
        report = result.report
        return (
            result.output_path.read_text(encoding="utf-8"),
            report.provider,
            model_display(report),
        )

    def _translate_episode(
        self,
        job: Job,
        target: MediaTarget,
        episode: EpisodeId,
        source: ExtractedTrack,
        options: RunOptions,
    ) -> tuple[str, str | None, str | None]:
        language = source.language
        workspace = ensure_series_workspace(target, language, language=self._language)
        stage_episode(workspace, episode, self._translation_input(source), language)
        siblings = self._queue.queued_siblings(job)
        # 백로그는 등록 때 정했고, 감시 배치 창의 새 화는 같은 시리즈 대기 작업이 있으면 prescan
        mode = job.detail.get("series_mode") or ("prescan" if siblings else "incremental")
        if mode == "prescan":
            self._stage_batch_siblings(siblings)
            analyze_series(workspace, self._adapter)
        result = run_series(
            workspace, self._adapter, options, episodes=str(episode), guard=self._guard,
        )  # fmt: skip
        key = str(episode)
        if key in result.blocked:
            raise EpisodeBlockedError("; ".join(result.blocked[key]))
        report = result.translated.get(key)
        if report is None:
            raise EpisodeBlockedError(f"{key} 를 번역하지 못했다")
        output = workspace.output_path(next(e for e in workspace.scan().episodes if e.key == key))
        return output.read_text(encoding="utf-8"), report.provider, model_display(report)

    def _stage_batch_siblings(self, siblings: list[Job]) -> None:
        """prescan 묶음의 다른 대기 에피소드 소스를 작업공간에 먼저 둔다 (사이드카는 쓰지 않음).

        모든 에피소드를 분석한 뒤 번역해야 뒤 에피소드에서 처음 나오는 이름도 용어집에 있다 (§20).
        """
        for other in siblings:
            other_target = self._target(other.path)
            if other_target.episode is None or not other.path.is_file():
                continue
            try:
                probed = probe(other.path, run=self._probe_run)
                origin = self._origin(other_target, other.path)
                extraction = self._extract(
                    probed,
                    other_target,
                    origin,
                    sidecar_dir=None,
                    install=lambda _temp, _target: None,
                )
            except MediaToolError as exc:
                logger.warning("prescan staging skipped %s: %s", other.path, exc)
                continue
            decision = decide(
                probed, extraction, self._config.media, target=self._language, origin=origin
            )
            if decision.verdict == "translate" and decision.source is not None:
                language = decision.source.language
                workspace = ensure_series_workspace(other_target, language, language=self._language)
                stage_episode(
                    workspace, other_target.episode, self._translation_input(decision.source),
                    language,
                )  # fmt: skip

    def _translation_input(self, source: ExtractedTrack) -> Path:
        """번역 입력: ASS 출력을 원하고 ASS 트랙이면 원본 ASS, 아니면 SRT 변환본 (WI-6.003)."""
        wants_ass = self._config.media.output_format in ("ass", "both")
        raw = source.raw
        if wants_ass and raw is not None and raw.suffix.lower() == ".ass":
            return raw
        return source.translation_input

    # ------------------------------------------------------------ 위치

    def _target(self, path: Path) -> MediaTarget:
        return media_target(self._config, self._data_dir, path)

    def _movie_work_dir(self, target: MediaTarget) -> Path:
        """영화 번역 작업 폴더: 대상 ko 는 작업공간 자체, 다른 대상은 work-<언어>/ (§26.5)."""
        if self._language == DEFAULT_TARGET:
            return target.workspace
        return target.workspace / f"work-{self._language}"

    def _work_dir(self, target: MediaTarget) -> Path:
        name = str(target.episode) if target.episode is not None else "movie"
        return target.workspace / EXTRACT_DIR / name

    def _sidecar_dir(self, video: Path) -> Path:
        """사이드카 폴더: sidecar 모드는 영상 옆, mirror 모드는 output_root 아래 같은 상대 경로."""
        media = self._config.media
        if media.output_mode == "sidecar":
            return video.parent
        root = next((root for root, _ in self._roots if video.is_relative_to(root)), None)
        relative = video.parent.relative_to(root) if root else Path(video.parent.name)
        return Path(media.output_root) / relative

    def _failed(self, job: Job, error: str) -> JobOutcome:
        logger.warning("job %s failed: %s", job.id, error)
        current = self._queue.get(job.id)
        if current.status in ("probing", "extracting", "translating"):
            current = self._queue.fail(job.id, error)
        if current.status == "failed" and job.path.is_file():
            self._ledger.record(job.path, verdict="failed", reason=error, attempts=current.attempts)
        return JobOutcome(current.status, "failed" if current.status == "failed" else None, error)


def media_target(config: AppConfig, data_dir: Path, path: Path) -> MediaTarget:
    """영화/시리즈 판별: 속한 감시 경로(가장 깊은 것)의 kind 를 쓴다. 감시 경로 밖이면 auto."""
    roots = sorted(
        ((Path(item.path), item.kind) for item in config.watch.paths),
        key=lambda item: len(item[0].parts),
        reverse=True,
    )
    root, kind = next(
        ((root, kind) for root, kind in roots if path.is_relative_to(root)), (path.parent, "auto")
    )
    return classify_media(path, Path(data_dir), kind=kind, watch_root=root)


def series_key_for(target: MediaTarget) -> str | None:
    """큐의 시리즈 키 (같은 시리즈는 한 번에 하나)."""
    return f"series:{target.slug}" if target.kind == "series" else None


def _partial_record(job: Job) -> SidecarRecord | None:
    """이 작업이 중단되기 전에 쓴 사이드카 기록."""
    raw = job.detail.get(PARTIAL_KEY)
    return SidecarRecord.model_validate(raw) if raw else None


def own_outputs(record: LedgerEntry | SidecarRecord | None) -> list[Path]:
    """기록의 출력 중 지금도 내용이 같은 파일 (사용자가 고친 파일은 외부 자막이다)."""
    if record is None:
        return []
    sidecars = record.sidecars if isinstance(record, LedgerEntry) else record
    return [
        Path(output.path)
        for output in sidecars.outputs
        if Path(output.path).is_file() and file_sha256(Path(output.path)) == output.sha256
    ]


def _source_info(source: ExtractedTrack) -> dict[str, Any]:
    track = source.track
    return {
        "order": track.order,
        "track_id": track.track_id,
        "language": source.language,
        "codec": track.codec,
        "name": track.name,
    }


def revert_media(ledger: Ledger, video: Path) -> tuple[list[Path], list[Path], list[str]]:
    """`media revert`: 도구가 만든 사이드카를 지우고 이름을 바꾼 외부 자막을 되돌린다.

    기록은 지우지 않고 되돌렸다고 남긴다 (감시가 다시 처리하지 않게).
    다시 처리하려면 `ledger forget`.

    Returns:
        (지운 파일, 되돌린 파일, 되돌리지 못한 사유).

    Raises:
        FileNotFoundError: 처리 기록이 없다.
    """
    entry = ledger.find(video)
    if entry is None:
        raise FileNotFoundError(f"처리 기록이 없다: {video}")
    result = revert_sidecars(entry.sidecars)
    ledger.record(
        video,
        verdict="has_external",
        reason=REVERTED_REASON,
        identity=entry.content_id,
        segment_uid=entry.segment_uid,
    )
    problems = [
        *result.not_restored,
        *(f"{p} 은 사용자가 고쳐서 남겼다" for p in result.kept_modified),
    ]
    return result.removed, result.restored, problems
