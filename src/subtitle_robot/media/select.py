"""번역 판정·소스 트랙 선택·영화/시리즈 판별·작업공간 (PROJECT-PLAN §21.5, §21.6, §26.6, WI-5.004).

- 대상 언어 자막이 이미 있으면 번역하지 않는다 (Q-19)
  (내장 트랙, `*.<대상>.*` 외부 자막, 언어 표시 없는 외부 자막의 내용)
- 소스는 작품 원어(TMDB)의 텍스트 트랙, 없으면 텍스트 트랙 중 컨테이너 순서상 첫 번째
  (대상 언어·forced·Signs/Songs 제외, WI-8.006)
- 내장 텍스트 트랙이 없으면 같은 규칙으로 외부 자막(SRT·ASS·VTT·SAMI 변환본)을 소스로 쓴다
  (WI-5.004b)
- 시리즈는 작품 폴더(시즌 폴더 위)로 식별해 `/data/series/<slug>/` 작업공간을 자동으로 만든다
"""

from __future__ import annotations

import re
import shutil
import unicodedata
from collections.abc import Callable, Collection, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from subtitle_robot.config import MediaConfig
from subtitle_robot.io.convert import SubtitleConversionError, ass_to_srt, vtt_to_srt
from subtitle_robot.io.langdetect import detect_content_language
from subtitle_robot.io.normalize import normalize_srt
from subtitle_robot.io.sami import SAMI_SUFFIXES, SamiError, read_sami
from subtitle_robot.lang.codes import (
    DEFAULT_TARGET,
    language_name,
    language_tokens,
    normalize_language,
)
from subtitle_robot.media.extract import ExtractedTrack, ExtractionResult
from subtitle_robot.media.probe import ProbeResult
from subtitle_robot.media.tmdb import OriginLanguage
from subtitle_robot.media.tracks import SubtitleTrack
from subtitle_robot.series.manifest import EpisodeId, split_episode_name
from subtitle_robot.series.workspace import SeriesWorkspace, init_series

Verdict = Literal["translate", "has_target", "no_source", "image_only"]
WatchKind = Literal["movie", "series", "auto"]
MediaKind = Literal["movie", "series"]

# §21.7: 영상 파일명으로 시작하는 이 확장자의 파일이 외부 자막이다 (언어 무관)
SUBTITLE_EXTENSIONS = frozenset(
    {".srt", ".ass", ".ssa", ".vtt", ".smi", ".sami", ".sub", ".idx", ".sup"}
)
_TEXT_SUBTITLE_EXTENSIONS = frozenset({".srt", ".ass", ".ssa", ".vtt", ".smi", ".sami"})
# 언어가 아닌 사이드카 이름 표시. 이것만 있으면 언어 표시가 없는 외부 자막이다
_FLAG_TOKENS = frozenset({"forced", "sdh", "cc", "hi", "default", "orig", "full", "signs", "songs"})
# §21.5: 일부 대사만 있는 트랙 (번역해도 불완전한 자막)
_PARTIAL_TRACK_NAME_RE = re.compile(r"\b(signs?|songs?|forced)\b", re.IGNORECASE)
# 시즌 폴더는 작품 이름이 아니다 (`Season 01`, `S2`, `Specials`, `第2期`)
_SEASON_DIR_RE = re.compile(r"^(?:season|series|s)[\s._-]*\d+$|^specials?$|^第.+期$", re.IGNORECASE)
# 시즌 폴더 이름에 붙은 릴리스 그룹·출처 표시 (`SEASON 02 [Sav1or]`, `Season 1 (BD)`)
_BRACKET_TAG_RE = re.compile(r"[\[(【][^\])】]*[\])】]")
# 원어 트랙이 없을 때(원어를 모름 포함) 다음으로 고르는 소스 언어 (§26.6, 2026-10-04 사용자 요청)
FALLBACK_SOURCE_LANGUAGE = "en"
_LEADING_TAGS_RE = re.compile(r"^(?:\s*[\[(【][^\])】]*[\])】])+")
_SLUG_SEPARATOR_RE = re.compile(r"[^\w]+|_+")
UNTITLED_SLUG = "untitled"


@dataclass(frozen=True)
class Decision:
    """번역 판정.

    Attributes:
        verdict: translate | has_target | no_source | image_only.
        source: 번역 소스 (translate 일 때만).
        reason: 판정 근거 (ledger·리포트 기록용).
    """

    verdict: Verdict
    source: ExtractedTrack | None
    reason: str


@dataclass(frozen=True)
class MediaTarget:
    """영화/시리즈 판별 결과와 작업공간 위치.

    Attributes:
        kind: movie | series.
        title: 작품 이름 (시리즈는 작품 폴더 이름).
        slug: 작업공간 이름.
        episode: 시리즈 에피소드. 영화면 None.
        workspace: 작업공간 경로 (`/data/movies/<slug>` 또는 `/data/series/<slug>`).
    """

    kind: MediaKind
    title: str
    slug: str
    episode: EpisodeId | None
    workspace: Path


# ---------------------------------------------------------------- 대상 언어 자막 존재 판정


def external_subtitles(video: Path) -> list[Path]:
    """영상 파일명으로 시작하는 외부 자막 (대소문자 무시, §21.7)."""
    prefix = f"{video.stem}.".casefold()
    if not video.parent.is_dir():
        return []
    return sorted(
        path
        for path in video.parent.iterdir()
        if path.is_file()
        and path.suffix.lower() in SUBTITLE_EXTENSIONS
        and path.name.casefold().startswith(prefix)
    )


def name_tokens(video: Path, subtitle: Path) -> list[str]:
    """사이드카 이름의 영상 이름과 확장자 사이 표시 (`Movie.ko.orig.srt` → ko, orig)."""
    middle = subtitle.name[len(video.stem) + 1 : len(subtitle.name) - len(subtitle.suffix)]
    return [token for token in middle.casefold().split(".") if token]


def target_evidence(
    probe: ProbeResult,
    extraction: ExtractionResult | None,
    *,
    target: str = DEFAULT_TARGET,
    image_counts: bool = True,
    tool_outputs: Collection[Path] = (),
) -> str | None:
    """대상 언어 자막이 이미 있다는 근거. 없으면 None (§21.5 1번, §26.6).

    tool_outputs 는 이 도구가 이전에 만든 파일이다 (재처리·릴리스 교체 때 이전 번역 결과를
    외부 자막으로 보지 않는다, §21.11·§21.12).
    """
    own = {str(path).casefold() for path in tool_outputs}
    label = _language_label(target)
    for track in probe.tracks:
        counts = track.is_text or (track.is_image and image_counts)
        if counts and track.effective_language == target:
            return f"내장 {label} 트랙 #{track.order} ({track.codec})"
    if extraction is not None:
        for item in extraction.extracted:
            if item.language == target:
                return f"내장 {label} 트랙 #{item.track.order} (내용 감지)"
    tokens_for_target = language_tokens(target)
    for subtitle in external_subtitles(probe.path):
        if str(subtitle).casefold() in own:
            continue
        tokens = name_tokens(probe.path, subtitle)
        if any(token in tokens_for_target or normalize_language(token) == target
               for token in tokens if token not in _FLAG_TOKENS):  # fmt: skip
            return f"외부 자막 {subtitle.name}"
        unmarked = all(token in _FLAG_TOKENS or token.isdigit() for token in tokens)
        if unmarked and target in _content_languages(subtitle):
            return f"외부 자막 {subtitle.name} (내용 {label})"
    return None


def _language_label(code: str) -> str:
    """판정 사유에 쓰는 언어 이름 (한국어는 0.6.0 전 문구 그대로)."""
    return "한국어" if code == DEFAULT_TARGET else f"{language_name(code)}({code})"


def _content_languages(subtitle: Path) -> set[str]:
    """언어 표시 없는 외부 자막의 내용 언어. SAMI 는 클래스마다 (여러 언어). 못 읽으면 빈 집합."""
    if subtitle.suffix.lower() in SAMI_SUFFIXES:
        try:
            return {t.language for t in read_sami(subtitle.read_bytes()) if t.language}
        except (SamiError, ValueError):
            return set()
    language = _content_language(subtitle)
    return {language} if language else set()


def _content_language(subtitle: Path) -> str | None:
    """언어 표시 없는 외부 자막의 내용 언어. 읽을 수 없는 형식(이미지)이면 None."""
    suffix = subtitle.suffix.lower()
    if suffix not in _TEXT_SUBTITLE_EXTENSIONS or suffix in SAMI_SUFFIXES:
        return None
    data = subtitle.read_bytes()
    try:
        if suffix in (".ass", ".ssa"):
            data = ass_to_srt(data.decode("utf-8-sig", errors="replace")).encode("utf-8")
        elif suffix == ".vtt":
            data = vtt_to_srt(data.decode("utf-8-sig", errors="replace")).encode("utf-8")
    except SubtitleConversionError:
        return None
    doc = normalize_srt(data, source_path=str(subtitle))
    return detect_content_language(block.text for block in doc.blocks)


# ---------------------------------------------------------------- 소스 선택·판정


def is_partial_track(track: SubtitleTrack) -> bool:
    """forced 이거나 이름이 Signs·Songs·Forced 인 트랙 (일부 대사만 있음)."""
    return track.forced or bool(_PARTIAL_TRACK_NAME_RE.search(track.name))


def first_candidate(
    probe: ProbeResult, *, target: str = DEFAULT_TARGET, skip_forced: bool = True
) -> SubtitleTrack | None:
    """추출 전 트랙 정보로 본 첫 소스 후보 (원어 트랙이 없을 때 쓰는 트랙, §26.6 3번).

    언어가 표시되지 않은 트랙도 후보다 (추출 뒤 내용으로 판별한다).
    """
    for track in sorted(probe.tracks, key=lambda item: item.order):
        if not track.is_text or (skip_forced and is_partial_track(track)):
            continue
        if track.effective_language == target:
            continue
        return track
    return None


def select_source(
    extraction: ExtractionResult,
    *,
    original: str | None = None,
    target: str = DEFAULT_TARGET,
    skip_forced: bool = True,
) -> ExtractedTrack | None:
    """번역 소스 트랙 (§26.6): 원어 트랙 → 영어 트랙 → 첫 후보. 후보가 없으면 None.

    후보는 대상 언어가 아니고 일부 대사 트랙(forced·Signs/Songs)이 아닌 텍스트 트랙이다.
    원어를 모르거나 원어 트랙이 없으면 영어를 쓴다: 여러 언어가 든 릴리스는 첫 트랙이
    아랍어 등인 경우가 있고, 영어 자막은 대개 원본에서 직접 만든 번역이다.
    """
    return pick_source(
        extraction.extracted, original=original, target=target, skip_forced=skip_forced
    )


def pick_source(
    sources: Sequence[ExtractedTrack],
    *,
    original: str | None = None,
    target: str = DEFAULT_TARGET,
    skip_forced: bool = True,
) -> ExtractedTrack | None:
    """후보 중 소스 (원어 → 영어 → 순서상 첫 후보). 내장 트랙과 외부 자막이 같은 규칙을 쓴다."""
    candidates = [
        item
        for item in sorted(sources, key=lambda item: item.track.order)
        if item.language != target and not (skip_forced and is_partial_track(item.track))
    ]
    for language in dict.fromkeys(code for code in (original, FALLBACK_SOURCE_LANGUAGE) if code):
        preferred = [item for item in candidates if item.language == language]
        if preferred:
            return preferred[0]
    return candidates[0] if candidates else None


def _how(language: str, original: str | None, noun: str) -> str:
    """고른 근거: 원어 → 영어 → 첫 후보."""
    if language == original:
        return f"원어 {noun}"
    if language == FALLBACK_SOURCE_LANGUAGE:
        return f"영어 {noun}"
    return f"첫 {noun}"


def decide(
    probe: ProbeResult,
    extraction: ExtractionResult,
    settings: MediaConfig | None = None,
    *,
    target: str = DEFAULT_TARGET,
    origin: OriginLanguage | None = None,
    tool_outputs: Collection[Path] = (),
    external: Callable[[], Sequence[ExtractedTrack]] | None = None,
) -> Decision:
    """번역할지 정하고 소스를 고른다 (§21.5, §26.6). tool_outputs 는 이 도구의 이전 출력이다.

    Args:
        target: 번역 대상 언어.
        origin: 작품 원어 조회 결과 (TMDB). 없으면 영어 트랙, 그것도 없으면 첫 후보 트랙.
        external: 외부 자막 소스 후보를 만드는 함수. 내장 텍스트 트랙이 없을 때만 부른다
            (WI-5.004b: 내장 자막이 있으면 지금처럼 내장 트랙만 본다).
    """
    settings = settings or MediaConfig()
    evidence = target_evidence(
        probe,
        extraction,
        target=target,
        image_counts=settings.target_image_counts,
        tool_outputs=tool_outputs,
    )
    if evidence:
        return Decision("has_target", None, evidence)
    original = origin.language if origin is not None else None
    origin_note = f"원어 {original or '모름'}" + (f", {origin.source}" if origin else "")
    source = select_source(
        extraction, original=original, target=target, skip_forced=settings.skip_forced
    )
    if source is not None:
        track = source.track
        how = _how(source.language, original, "트랙")
        return Decision(
            "translate",
            source,
            f"소스 트랙 #{track.order} "
            f"({source.language}, {track.codec}, {track.name or '이름 없음'}) — "
            f"{how} ({origin_note})",
        )
    if external is not None and not any(track.is_text for track in probe.tracks):
        source = pick_source(
            external(), original=original, target=target, skip_forced=settings.skip_forced
        )
        if source is not None:
            how = _how(source.language, original, "외부 자막")
            return Decision(
                "translate",
                source,
                f"외부 자막 {source.track.name} ({source.language}) — 내장 텍스트 자막 없음, "
                f"{how} ({origin_note})",
            )
    if probe.tracks and all(track.is_image for track in probe.tracks):
        note = "" if settings.ocr else " (OCR 꺼짐)"
        return Decision("image_only", None, f"이미지 자막만 있음{note}")
    if not probe.tracks:
        return Decision("no_source", None, "자막 트랙 없음")
    return Decision(
        "no_source", None, "소스로 쓸 텍스트 트랙 없음 (대상 언어·forced·Signs/Songs 제외)"
    )


# ---------------------------------------------------------------- 영화/시리즈·작업공간


def slugify(title: str) -> str:
    """작업공간 이름 (`91 Days` → `91-days`). 한글·가나 등은 그대로 둔다."""
    text = unicodedata.normalize("NFKC", title).casefold()
    slug = _SLUG_SEPARATOR_RE.sub("-", text).strip("-")
    return slug or UNTITLED_SLUG


def classify_media(
    video: Path,
    data_root: Path,
    *,
    kind: WatchKind = "auto",
    watch_root: Path | None = None,
) -> MediaTarget:
    """영화/시리즈를 판별하고 작업공간 위치를 정한다 (§21.6).

    auto 는 파일명에 에피소드 표시(S01E01, 1x01, 第1話 …)가 있으면 시리즈다.
    에피소드 번호를 읽지 못한 시리즈 경로의 파일은 영화처럼 처리한다
    (작업공간이 에피소드를 둘 자리가 없다).
    """
    split = split_episode_name(video.name)
    if kind == "movie" or split is None:
        title = video.stem
        return MediaTarget(
            "movie", title, slugify(title), None, data_root / "movies" / slugify(title)
        )
    prefix, episode = split
    title = _series_title(video, watch_root) or _clean_title(prefix) or video.parent.name
    slug = slugify(title)
    return MediaTarget("series", title, slug, episode, data_root / "series" / slug)


def _series_title(video: Path, watch_root: Path | None) -> str | None:
    """작품 폴더 이름: 영상 폴더부터 위로 올라가며 시즌 폴더가 아닌 첫 폴더 (감시 루트는 제외)."""
    stop = watch_root.resolve() if watch_root else None
    folder = video.parent.resolve()
    while folder != folder.parent:
        if stop is not None and folder == stop:
            return None
        if not _is_season_dir(folder.name):
            return folder.name
        folder = folder.parent
    return None


def _is_season_dir(name: str) -> bool:
    """시즌 폴더인지. 이름의 괄호 표시(릴리스 그룹·출처)는 떼고 본다."""
    return bool(_SEASON_DIR_RE.match(_BRACKET_TAG_RE.sub(" ", name).strip()))


def _clean_title(prefix: str) -> str:
    """파일명 앞부분에서 작품 이름 (`[Group] 91 Days - ` → `91 Days`)."""
    text = _LEADING_TAGS_RE.sub("", prefix).replace("_", " ").replace(".", " ")
    return text.strip(" -_.")


def ensure_series_workspace(
    target: MediaTarget, src_lang: str, *, language: str = DEFAULT_TARGET
) -> SeriesWorkspace:
    """시리즈 작업공간을 만든다. 이미 있으면 그대로 쓴다 (src_lang 은 첫 에피소드의 소스 언어).

    Args:
        target: 영화/시리즈 판별 결과.
        src_lang: 소스 트랙 언어.
        language: 번역 대상 언어 (대상 언어별 용어집·작업 폴더, §26.5).

    Raises:
        ValueError: 시리즈 대상이 아니다.
    """
    if target.kind != "series":
        raise ValueError(f"시리즈가 아니다: {target.title}")
    target.workspace.mkdir(parents=True, exist_ok=True)
    workspace, _ = init_series(target.workspace, src_lang, title=target.title, target=language)
    return workspace


def stage_episode(
    workspace: SeriesWorkspace,
    episode: EpisodeId,
    translation_input: Path,
    src_lang: str,
) -> Path:
    """에피소드 번역 입력을 작업공간 `episodes/<S01E02>.<확장자>` 에 둔다 (SRT 또는 ASS).

    시리즈 기본과 소스 언어가 다르면 `[[episodes]]` 로 에피소드 언어를 지정한다 (§21.6:
    일부 에피소드만 일본어 트랙일 수 있다).
    """
    key = str(episode)
    suffix = translation_input.suffix.lower() or ".srt"
    target = workspace.root / "episodes" / f"{key}{suffix}"
    target.parent.mkdir(parents=True, exist_ok=True)
    # 출력 형식을 바꾸면 같은 에피소드의 다른 형식 파일이 남아 중복 인식된다 (WI-6.003)
    for other in target.parent.glob(f"{key}.*"):
        if other != target and other.suffix.lower() in (".srt", ".ass", ".ssa", ".vtt"):
            other.unlink()
    temp = target.with_name(f".{target.name}.tmp")
    shutil.copyfile(translation_input, temp)
    temp.replace(target)
    settings = workspace.settings()
    listed = {entry.id for entry in settings.episodes}
    if src_lang != settings.src_lang and key not in listed:
        relative = target.relative_to(workspace.root).as_posix()
        with workspace.settings_path.open("a", encoding="utf-8") as handle:
            handle.write(
                f'\n[[episodes]]\nid = "{key}"\nfile = "{relative}"\nsrc_lang = "{src_lang}"\n'
            )
    return target
