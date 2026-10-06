"""시리즈 작업공간 구조와 series init (PROJECT-PLAN §4.2, §15, WI-4.001).

```text
MySeries/
├── series.toml   glossary.yaml (마스터 용어집)   phrases.yaml
├── S01/ S01E01.srt ...
├── out/ S01E01.ko.srt (ASS 에피소드는 .ko.ass) ...
└── work/ index.json  series_state.json  S01E01/ (에피소드 작업 폴더)
```

대상 언어마다 용어집·반복 대사·작업 폴더를 나눈다 (§26.5). 대상 ko 는 위 이름 그대로이고,
다른 대상은 `glossary.<언어>.yaml`, `phrases.<언어>.yaml`, `work-<언어>/`, `out/S01E01.<언어>.srt`.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from subtitle_robot.glossary.model import Glossary
from subtitle_robot.glossary.store import save_glossary
from subtitle_robot.lang.codes import DEFAULT_TARGET, is_language_code
from subtitle_robot.series.manifest import Episode, EpisodeScan, scan_episodes
from subtitle_robot.series.settings import (
    SERIES_FILE,
    SeriesSettings,
    load_series_settings,
    render_series_toml,
)


class SeriesInitError(ValueError):
    """series init 을 할 수 없다."""


@dataclass(frozen=True)
class SeriesWorkspace:
    """시리즈 폴더의 파일 위치.

    Attributes:
        root: 시리즈 폴더.
        target: 번역 대상 언어 (ISO 639-1). 대상 언어별 파일 위치를 정한다.
    """

    root: Path
    target: str = DEFAULT_TARGET

    def _per_target(self, stem: str, suffix: str = "") -> Path:
        """대상 ko 는 지금 이름, 다른 대상은 `<이름>.<언어>` 또는 `<이름>-<언어>`."""
        if self.target == DEFAULT_TARGET:
            return self.root / f"{stem}{suffix}"
        separator = "." if suffix else "-"
        return self.root / f"{stem}{separator}{self.target}{suffix}"

    @property
    def settings_path(self) -> Path:
        """series.toml."""
        return self.root / SERIES_FILE

    @property
    def glossary_path(self) -> Path:
        """마스터 용어집 (대상 언어별)."""
        return self._per_target("glossary", ".yaml")

    @property
    def phrases_path(self) -> Path:
        """반복 대사 메모리 (대상 언어별, §24.4)."""
        return self._per_target("phrases", ".yaml")

    @property
    def out_dir(self) -> Path:
        """번역 출력 폴더."""
        return self.root / "out"

    @property
    def work_dir(self) -> Path:
        """작업 폴더 (대상 언어별)."""
        return self._per_target("work")

    @property
    def state_path(self) -> Path:
        """시리즈 진행 상태."""
        return self.work_dir / "series_state.json"

    @property
    def index_path(self) -> Path:
        """출현 인덱스 (§12.4)."""
        return self.work_dir / "index.json"

    def episode_work_dir(self, episode: Episode) -> Path:
        """에피소드 작업 폴더."""
        return self.work_dir / episode.key

    def output_path(self, episode: Episode) -> Path:
        """에피소드 번역 출력 `<키>.<대상>.srt`. ASS·SSA 에피소드는 `.ass` (Q-07, WI-6.002)."""
        suffix = ".ass" if episode.path.suffix.lower() in (".ass", ".ssa") else ".srt"
        return self.out_dir / f"{episode.key}.{self.target}{suffix}"

    def settings(self) -> SeriesSettings:
        """series.toml."""
        return load_series_settings(self.root)

    def scan(self) -> EpisodeScan:
        """에피소드 목록."""
        return scan_episodes(self.root, self.settings())


def init_series(
    root: Path, src_lang: str, *, title: str = "", target: str = DEFAULT_TARGET
) -> tuple[SeriesWorkspace, EpisodeScan]:
    """시리즈 작업공간을 만든다: series.toml(없을 때만), 빈 마스터 용어집(없을 때만), out·work 폴더.

    용어집·작업 폴더는 대상 언어(target)의 것이다.
    다른 대상으로 다시 실행하면 그 대상의 파일을 더 만든다.

    이미 있는 파일은 건드리지 않는다 (다시 실행하면 에피소드 인식 결과만 다시 보여준다).

    Raises:
        SeriesInitError: 폴더가 없거나 src_lang 이 639-1 코드가 아니다.
    """
    root = Path(root)
    if not root.is_dir():
        raise SeriesInitError(f"시리즈 폴더가 없다: {root}")
    if not is_language_code(src_lang):
        raise SeriesInitError(f"src_lang 은 ISO 639-1 코드여야 한다 (en, ja, fr …): {src_lang}")
    workspace = SeriesWorkspace(root, target)
    if not workspace.settings_path.exists():
        workspace.settings_path.write_text(
            render_series_toml(src_lang, title or root.name), encoding="utf-8"
        )
    if not workspace.glossary_path.exists():
        save_glossary(Glossary(series=title or root.name), workspace.glossary_path)
    workspace.out_dir.mkdir(exist_ok=True)
    workspace.work_dir.mkdir(exist_ok=True)
    return workspace, workspace.scan()
