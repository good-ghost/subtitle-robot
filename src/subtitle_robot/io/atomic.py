"""원자적 파일 쓰기: 같은 폴더의 임시 파일에 쓴 뒤 rename 한다 (PROJECT-PLAN §21.4).

쓰는 도중 중단돼도 대상 파일이 반쯤 쓰인 상태로 남지 않는다.
"""

from __future__ import annotations

import functools
import os
import tempfile
from pathlib import Path

# umask 를 읽을 수 없을 때 (Linux 가 아닌 환경) 쓰는 기본값
_FALLBACK_UMASK = 0o022
_PROC_STATUS = Path("/proc/self/status")


@functools.cache
def default_file_mode() -> int:
    """보통 파일을 만들 때의 권한 (0666 & ~umask).

    mkstemp 는 임시 파일을 0600 으로 만들고 rename 뒤에도 그대로라, 다른 사용자로 도는 미디어
    서버(Jellyfin·Plex)가 자막을 읽지 못한다 (컨테이너 E2E 에서 발견). os.umask 로 읽으면 잠깐
    바꿔야 해서 스레드에 안전하지 않으므로 /proc 에서 읽는다.
    """
    try:
        for line in _PROC_STATUS.read_text(encoding="ascii").splitlines():
            if line.startswith("Umask:"):
                return 0o666 & ~int(line.split()[1], 8)
    except (OSError, ValueError):
        pass
    return 0o666 & ~_FALLBACK_UMASK


def atomic_write_text(path: Path, text: str, *, encoding: str = "utf-8") -> None:
    """텍스트를 원자적으로 쓴다. 줄바꿈 변환은 하지 않는다 (호출자가 정한 그대로 쓴다).

    Args:
        path: 대상 파일. 폴더는 이미 있어야 한다.
        text: 쓸 내용.
        encoding: 인코딩.
    """
    path = Path(path)
    fd, tmp_name = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    tmp_path = Path(tmp_name)
    try:
        os.fchmod(fd, default_file_mode())
        with os.fdopen(fd, "w", encoding=encoding, newline="") as handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        tmp_path.replace(path)
    except BaseException:
        tmp_path.unlink(missing_ok=True)
        raise
