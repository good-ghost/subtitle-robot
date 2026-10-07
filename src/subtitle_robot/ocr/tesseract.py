"""Tesseract 로 자막 그림 읽기 (WI-5.004c).

그림을 PGM 으로 작업 폴더에 쓰고, 목록 파일 하나로 여러 장을 한 번에 넘긴다 (실행마다 언어 모델을
다시 읽는 비용을 줄인다). 출력은 그림마다 폼 피드(`\\f`)로 나뉜다. 그림 묶음을 여러 Tesseract
프로세스에 나눠 CPU 코어 수만큼 동시에 돌린다. Tesseract 자체의 OpenMP 스레드는 1로 묶는다
(프로세스 병렬이 더 빠르고, 둘을 겹치면 코어를 서로 빼앗는다).
"""

from __future__ import annotations

import functools
import os
import re
import shutil
from collections.abc import Sequence
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from subtitle_robot.lang.codes import language_info
from subtitle_robot.media.commands import (
    CommandResult,
    MediaToolError,
    Runner,
    StopCheck,
    run_command,
)
from subtitle_robot.ocr.bitmap import Bitmap

TESSERACT = "tesseract"
# 그림 묶음 하나의 제한 시간 (일본어 100장 실측 약 30초)
OCR_TIMEOUT_S = 600
# 묶음 크기: 프로세스마다 고르게 나누되 이 범위 안에서 (작으면 언어 모델을 자주 다시 읽는다)
CHUNK_SIZE = 100
MIN_CHUNK_SIZE = 10
# 자막 한 덩어리로 읽는다 (여러 줄 가능)
_PAGE_SEGMENTATION = "6"
_PAGE_SEPARATOR = "\f"
# Tesseract 언어 데이터 이름이 ISO 639-2/T 와 다른 언어
_TESSERACT_NAMES: dict[str, str] = {"zh": "chi_sim"}
# 한자·가나·전각 문장 부호 사이에 Tesseract 가 넣는 공백 (한글 띄어쓰기는 그대로 둔다)
_CJK = r"　-ヿ㐀-䶿一-鿿豈-﫿＀-￯"
_CJK_SPACE_RE = re.compile(rf"(?<=[{_CJK}])[ \t]+(?=[{_CJK}])")
# 라틴 문자 줄에서 Tesseract 가 대문자 I 를 `|`로 읽는다 (자막에 세로 막대는 거의 쓰지 않는다)
_LATIN_RE = re.compile(r"[A-Za-z]")


class OcrError(MediaToolError):
    """Tesseract 실행 실패."""


def tesseract_language(code: str) -> str | None:
    """ISO 639-1 → Tesseract 언어 데이터 이름 (`ja` → `jpn`). 모르는 코드면 None."""
    if code in _TESSERACT_NAMES:
        return _TESSERACT_NAMES[code]
    info = language_info(code)
    return info.terminology if info is not None else None


def tesseract_available() -> bool:
    """Tesseract 명령이 있는지 (`ocr` 이미지 태그·로컬 설치)."""
    return shutil.which(TESSERACT) is not None


def ocr_runner(*, low_priority: bool, should_stop: StopCheck | None = None) -> Runner:
    """Tesseract 실행기: OpenMP 스레드를 1로 묶고 종료 요청을 따른다."""
    env = {**os.environ, "OMP_THREAD_LIMIT": "1"}
    return functools.partial(
        run_command,
        timeout=OCR_TIMEOUT_S,
        low_priority=low_priority,
        should_stop=should_stop,
        env=env,
    )


def installed_languages(run: Runner) -> frozenset[str]:
    """설치된 언어 데이터 (`tesseract --list-langs`).

    Raises:
        OcrError: 명령이 실패했다.
    """
    result = run([TESSERACT, "--list-langs"])
    if result.returncode != 0:
        raise OcrError(f"tesseract --list-langs 실패: {result.tail()}")
    lines = (result.stdout or result.stderr).splitlines()
    return frozenset(line.strip() for line in lines if line.strip() and ":" not in line)


def recognize(
    bitmaps: Sequence[Bitmap],
    language: str,
    work_dir: Path,
    *,
    run: Runner,
    workers: int = 1,
) -> list[str]:
    """그림마다 읽은 글자 (순서 그대로, 읽지 못하면 빈 문자열).

    Args:
        bitmaps: 자막 그림.
        language: Tesseract 언어 데이터 이름 (`eng`, `jpn+eng` 도 된다).
        work_dir: 그림·목록 파일을 둘 폴더 (호출자가 정리한다).
        run: 실행기 (`ocr_runner`).
        workers: 동시에 돌릴 Tesseract 프로세스 수.

    Raises:
        OcrError: Tesseract 가 오류로 끝났거나 결과 수가 맞지 않는다.
    """
    work_dir.mkdir(parents=True, exist_ok=True)
    workers = max(1, workers)
    size = max(MIN_CHUNK_SIZE, min(CHUNK_SIZE, -(-len(bitmaps) // workers)))
    chunks = [
        list(range(start, min(start + size, len(bitmaps))))
        for start in range(0, len(bitmaps), size)
    ]

    def read_chunk(number: int) -> list[str]:
        indices = chunks[number]
        paths = []
        for index in indices:
            path = work_dir / f"{index:06d}.pgm"
            path.write_bytes(bitmaps[index].to_pgm())
            paths.append(path)
        listing = work_dir / f"chunk{number:04d}.txt"
        listing.write_text("".join(f"{path}\n" for path in paths), encoding="utf-8")
        result = run([
            TESSERACT, str(listing), "stdout", "-l", language, "--psm", _PAGE_SEGMENTATION,
            "-c", "preserve_interword_spaces=1",
        ])  # fmt: skip
        return _pages(result, len(indices))

    with ThreadPoolExecutor(max_workers=workers) as pool:
        texts = [text for page in pool.map(read_chunk, range(len(chunks))) for text in page]
    return [clean_text(text) for text in texts]


def _pages(result: CommandResult, expected: int) -> list[str]:
    if result.returncode != 0:
        raise OcrError(f"tesseract 실패: {result.tail()}")
    # 그림마다 뒤에 구분자가 붙는다 (마지막 그림 포함)
    pages = result.stdout.split(_PAGE_SEPARATOR)
    if not pages[-1].strip():
        pages = pages[:-1]
    if len(pages) != expected:
        raise OcrError(f"tesseract 결과 수가 맞지 않다 (그림 {expected}장, 결과 {len(pages)}개)")
    return pages


def clean_text(text: str) -> str:
    """줄 앞뒤 공백·빈 줄을 지우고, 한자·가나 사이 공백을 빼고, 라틴 줄의 `|`를 I 로 바꾼다."""
    lines = [_clean_line(line) for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def _clean_line(line: str) -> str:
    line = _CJK_SPACE_RE.sub("", line).strip()
    return line.replace("|", "I") if _LATIN_RE.search(line) else line
