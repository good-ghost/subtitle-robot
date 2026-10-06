"""영상 식별 (PROJECT-PLAN §21.12, WI-5.006).

내용 식별값은 크기와 파일 앞·뒤 일부(기본 각 4MB)의 해시다. 파일 전체를 읽지 않으므로 대용량
영상도 빠르게 확인하고, 관리 도구가 영상을 옮기거나 이름을 바꿔도 같은 값이 나온다.
"""

from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from pathlib import Path

DEFAULT_HASH_BYTES = 4 * 1024 * 1024
_SIZE_BYTES = 8


@dataclass(frozen=True)
class QuickKey:
    """빠른 확인 값 (해시 없이 비교)."""

    size: int
    mtime_ns: int


def quick_key(path: Path) -> QuickKey:
    """크기와 수정 시각."""
    stat = Path(path).stat()
    return QuickKey(stat.st_size, stat.st_mtime_ns)


def content_id(path: Path, *, hash_bytes: int = DEFAULT_HASH_BYTES) -> str:
    """내용 식별값: sha256(크기 ‖ 앞 hash_bytes ‖ 뒤 hash_bytes).

    파일이 2 × hash_bytes 보다 작으면 앞·뒤가 겹쳐도 그대로 읽는다 (결과는 결정적이다).

    Raises:
        ValueError: hash_bytes 가 0 이하다.
    """
    if hash_bytes <= 0:
        raise ValueError(f"hash_bytes 는 양수여야 한다: {hash_bytes}")
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        size = os.fstat(handle.fileno()).st_size
        digest.update(size.to_bytes(_SIZE_BYTES, "big"))
        digest.update(handle.read(hash_bytes))
        handle.seek(max(size - hash_bytes, 0))
        digest.update(handle.read(hash_bytes))
    return digest.hexdigest()
