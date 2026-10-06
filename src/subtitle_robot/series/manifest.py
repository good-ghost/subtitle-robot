"""에피소드 파일 인식과 매니페스트 (PROJECT-PLAN §12.3, WI-4.001).

파일명에서 시즌·에피소드 번호를 읽는다: S01E01, s1e1, 1x01, E01·EP01, 第1話,
`… - 01 (`·`…_-_01_(`(팬섭 이름).
시즌 표기가 없으면 시즌 1. 인식하지 못한 파일은 series.toml `[[episodes]]` 로 지정한다.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from subtitle_robot.io.subtitle_input import subtitle_format
from subtitle_robot.series.settings import SeriesSettings

# 시리즈 폴더 안에서 에피소드 자막으로 보지 않는 곳과 파일
# extract: 미디어 워커가 추출한 트랙 (WI-5.008)
EXCLUDED_DIRS = frozenset({"out", "work", "extract", ".subtitle-robot"})
_OUTPUT_SUFFIXES = (".ko.srt", ".ko.ass", ".ko.ssa", ".ko.vtt")


def _excluded_dir(name: str) -> bool:
    """에피소드를 찾지 않는 폴더 (대상 언어별 작업 폴더 `work-<언어>` 포함, §26.5)."""
    return name in EXCLUDED_DIRS or name.startswith("work-")


_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"[Ss](?P<season>\d{1,3})[ ._-]?[Ee](?P<episode>\d{1,4})"),
    re.compile(r"(?<!\d)(?P<season>\d{1,2})[xX](?P<episode>\d{1,3})(?!\d)"),
    re.compile(r"第\s*(?P<episode>\d{1,4})\s*[話话回]"),
    re.compile(r"(?<![A-Za-z])(?:EP?|Ep|ep)[ ._-]?(?P<episode>\d{1,4})(?!\d)"),
    # 팬섭 이름은 공백 대신 밑줄을 쓰기도 한다 (`91_Days_-_01_(…`)
    re.compile(r"[ _]-[ _](?P<episode>\d{1,4})(?:[ _]|v\d|\(|\[|$)"),
)


@dataclass(frozen=True, order=True)
class EpisodeId:
    """시즌·에피소드 번호."""

    season: int
    episode: int

    def __str__(self) -> str:
        return f"S{self.season:02d}E{self.episode:02d}"

    @classmethod
    def parse(cls, text: str) -> EpisodeId:
        """`S01E02` 형식을 읽는다."""
        match = re.fullmatch(r"S(\d+)E(\d+)", text)
        if match is None:
            raise ValueError(f"에피소드 ID 형식이 아니다: {text!r}")
        return cls(int(match.group(1)), int(match.group(2)))


def split_episode_name(name: str) -> tuple[str, EpisodeId] | None:
    """파일 이름을 (에피소드 표시 앞부분, 에피소드)로 나눈다. 인식하지 못하면 None.

    앞부분은 작품 이름 추정에 쓴다 (`Show S01E02.mp4` → `Show `).
    """
    stem = Path(name).stem
    for pattern in _PATTERNS:
        match = pattern.search(stem)
        if match is None:
            continue
        groups = match.groupdict()
        season = int(groups["season"]) if groups.get("season") else 1
        return stem[: match.start()], EpisodeId(season, int(groups["episode"]))
    return None


def episode_id_from_name(name: str) -> EpisodeId | None:
    """파일 이름에서 에피소드를 읽는다. 읽지 못하면 None."""
    split = split_episode_name(name)
    return split[1] if split else None


@dataclass(frozen=True)
class Episode:
    """시리즈의 에피소드 파일 하나."""

    id: EpisodeId
    path: Path
    src_lang: str | None = None

    @property
    def key(self) -> str:
        """`S01E01`."""
        return str(self.id)


@dataclass(frozen=True)
class EpisodeScan:
    """에피소드 인식 결과."""

    episodes: tuple[Episode, ...]
    unrecognized: tuple[Path, ...]
    duplicates: tuple[tuple[str, Path], ...]


def scan_episodes(root: Path, settings: SeriesSettings | None = None) -> EpisodeScan:
    """시리즈 폴더의 자막(SRT·ASS·VTT)을 에피소드 순서로 모은다.

    매니페스트(`[[episodes]]`)가 파일명 인식보다 우선한다. 같은 에피소드 ID 가 둘 이상이면
    앞의 것(경로 순서)을 쓰고 나머지는 duplicates 로 알린다.
    """
    root = Path(root)
    manifest = {
        (root / entry.file).resolve(): entry for entry in (settings.episodes if settings else ())
    }
    found: dict[str, Episode] = {}
    unrecognized: list[Path] = []
    duplicates: list[tuple[str, Path]] = []
    for path in sorted(_srt_files(root)):
        entry = manifest.get(path.resolve())
        episode_id = EpisodeId.parse(entry.id) if entry else episode_id_from_name(path.name)
        if episode_id is None:
            unrecognized.append(path)
            continue
        episode = Episode(episode_id, path, entry.src_lang if entry else None)
        if episode.key in found:
            duplicates.append((episode.key, path))
            continue
        found[episode.key] = episode
    ordered = tuple(sorted(found.values(), key=lambda episode: episode.id))
    return EpisodeScan(ordered, tuple(unrecognized), tuple(duplicates))


def _srt_files(root: Path) -> list[Path]:
    """에피소드 자막 후보: SRT·ASS·SSA·VTT (WI-6.001). 출력·작업 폴더와 번역 결과는 뺀다."""
    files = []
    for path in root.rglob("*"):
        if not path.is_file() or subtitle_format(path) is None:
            continue
        relative = path.relative_to(root)
        if any(_excluded_dir(part) for part in relative.parts[:-1]):
            continue
        if path.name.lower().endswith(_OUTPUT_SUFFIXES):
            continue
        files.append(path)
    return files
