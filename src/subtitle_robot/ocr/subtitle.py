"""이미지 자막 파일 → SRT (WI-5.004c).

PGS(`.sup`)와 VobSub(`.idx`+`.sub`)를 그림으로 풀고, Tesseract 로 읽어 원래 시각을 붙인다.
읽은 글자가 없는 그림은 버리고, 앞 자막과 글자가 같고 바로 이어지면 하나로 합친다.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path

from subtitle_robot.media.commands import Runner
from subtitle_robot.ocr.bitmap import ImageEvent
from subtitle_robot.ocr.pgs import read_pgs
from subtitle_robot.ocr.tesseract import recognize
from subtitle_robot.ocr.vobsub import read_vobsub

PGS_SUFFIX = ".sup"
VOBSUB_SUFFIXES = (".idx", ".sub")
# 이 간격(ms) 안에 이어지는 같은 글자는 한 자막으로 합친다
_MERGE_GAP_MS = 50


@dataclass(frozen=True)
class OcrResult:
    """읽은 자막.

    Attributes:
        srt: SRT 내용.
        images: 그림 수.
        blocks: SRT 블록 수 (빈 그림·합친 것 제외).
        language: `.idx`에 적힌 언어 (VobSub). 없으면 None.
    """

    srt: str
    images: int
    blocks: int
    language: str | None = None


def read_image_events(path: Path) -> tuple[list[ImageEvent], str | None]:
    """이미지 자막 파일의 그림 (`.sup`, 또는 `.idx`/`.sub` 중 하나)과 적힌 언어.

    VobSub 는 짝 파일(`.idx`↔`.sub`)이 같은 이름으로 옆에 있어야 한다. 여러 언어가 든
    VobSub 는 첫 언어를 쓴다.

    Raises:
        ValueError: 읽을 수 없는 파일이다 (PgsError·VobSubError 포함).
        OSError: 파일을 열 수 없다.
    """
    suffix = path.suffix.lower()
    if suffix == PGS_SUFFIX:
        return read_pgs(path.read_bytes()), None
    if suffix in VOBSUB_SUFFIXES:
        idx = vobsub_pair(path, ".idx")
        sub = vobsub_pair(path, ".sub")
        if idx is None or sub is None:
            raise ValueError(f"VobSub 짝 파일(.idx/.sub)이 없다: {path.name}")
        # .idx 는 ASCII 다 (언어 코드·16진수)
        tracks = read_vobsub(idx.read_bytes().decode("latin-1"), sub.read_bytes())
        return tracks[0].events, tracks[0].language
    raise ValueError(f"이미지 자막이 아니다: {path.name}")


def vobsub_pair(path: Path, suffix: str) -> Path | None:
    """VobSub 짝 파일 (확장자 대소문자 무시)."""
    for candidate in (path.with_suffix(suffix), path.with_suffix(suffix.upper())):
        if candidate.is_file():
            return candidate
    return None


def ocr_events(
    events: Sequence[ImageEvent],
    language: str,
    work_dir: Path,
    *,
    run: Runner,
    workers: int = 1,
) -> OcrResult:
    """그림을 읽어 SRT 로 만든다. language 는 Tesseract 언어 데이터 이름이다."""
    texts = recognize([event.bitmap for event in events], language, work_dir, run=run,
                      workers=workers)  # fmt: skip
    blocks: list[tuple[int, int, str]] = []
    for event, text in zip(events, texts, strict=True):
        if not text:
            continue
        if blocks and blocks[-1][2] == text and event.start_ms - blocks[-1][1] <= _MERGE_GAP_MS:
            blocks[-1] = (blocks[-1][0], event.end_ms, text)
            continue
        blocks.append((event.start_ms, event.end_ms, text))
    srt = "".join(
        f"{number}\n{_time(start)} --> {_time(end)}\n{text}\n\n"
        for number, (start, end, text) in enumerate(blocks, start=1)
    )
    return OcrResult(srt, len(events), len(blocks))


def _time(ms: int) -> str:
    hours, rest = divmod(max(ms, 0), 3_600_000)
    minutes, rest = divmod(rest, 60_000)
    seconds, millis = divmod(rest, 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{millis:03d}"
