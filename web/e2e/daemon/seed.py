"""E2E 샘플 데이터: 처리 기록 5건, 실패·대기 작업, 등록할 동영상 파일 (직접 만든 가짜 파일).

번역은 하지 않는다 (공급자 키 없음). 처리 기록은 화면에 보일 판정 종류를 고르게 둔다.
"""

import sys
from pathlib import Path

from subtitle_robot.media.sidecar import OutputFile, Rename, SidecarRecord
from subtitle_robot.secret_store import SecretStore
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.queue import JobQueue
from subtitle_robot.watch.state import state_path
from subtitle_robot.web.auth import AccountStore

E2E_USERNAME = "admin"


def add_failed_jobs(root: Path, count: int) -> None:
    """실패한 작업을 더한다 (화면의 실패 지우기를 보이려고, 재시도한 샘플 작업은 다시 실패하지 않는다)."""
    queue = JobQueue(state_path(root / "data"), max_attempts=1)
    for number in range(1, count + 1):
        job = queue.enqueue(root / "media" / "movies" / "old" / f"Damaged {number} (2021).mkv", detail={"kind": "movie"})
        queue.claim(job.id)
        queue.fail(job.id, "ProbeError: mkvmerge: 인식하지 못한 파일")
    queue.close()


def create_account(root: Path) -> None:
    """관리 계정 admin 을 만든다. 비밀번호는 run.sh 가 실행마다 만든 `<root>/token` (§28.3)."""
    password = (root / "token").read_text("utf-8")
    AccountStore(SecretStore.for_data_dir(root / "data")).create(E2E_USERNAME, password)


def main(root: Path) -> None:
    data = root / "data"
    movies = root / "media" / "movies"
    library = root / "library"
    ledger = Ledger(state_path(data), data, hash_bytes=64)
    records = [
        ("Arrival (2016).mkv", "translated", "en #0 (S_TEXT/UTF8)", True),
        ("Parasite (2019).mkv", "has_korean", "ko 트랙 #2", False),
        ("Show S01E01.mkv", "has_external", "외부 자막 Show S01E01.en.srt", False),
        ("Silent Film (1927).mp4", "no_source", "텍스트 자막 트랙 없음", False),
        ("Broken (2020).mkv", "failed", "MediaToolError: 트랙을 읽지 못함", False),
    ]
    for name, verdict, reason, translated in records:
        video = library / name
        video.parent.mkdir(parents=True, exist_ok=True)
        video.write_bytes(name.encode() * 64)
        sidecars = SidecarRecord()
        if translated:
            output = video.with_name(f"{video.stem}.ko.srt")
            sidecars = SidecarRecord(
                outputs=[OutputFile(path=str(output), sha256="0" * 64)],
                renames=[Rename(original=str(output), renamed=str(video.with_name(f"{video.stem}.ko.orig.srt")))],
            )
        ledger.record(
            video,
            verdict=verdict,
            reason=reason,
            provider="nim" if translated else None,
            model="deepseek-ai/deepseek-v4.1-flash" if translated else None,
            source={"track": 0, "language": "en", "codec": "S_TEXT/UTF8"} if translated else None,
            sidecars=sidecars,
        )
    ledger.close()

    queue = JobQueue(state_path(data), max_attempts=1)
    for name in ("Corrupt (2021).mkv", "Truncated (2022).mkv"):
        job = queue.enqueue(movies / "old" / name, detail={"kind": "movie"})
        queue.claim(job.id)
        queue.fail(job.id, "ProbeError: mkvmerge: 인식하지 못한 파일")
    queue.close()

    # 화면에서 등록할 동영상 (폴더 등록은 하위 폴더 포함 여부를 보인다).
    # 이름에 sample 을 넣지 않는다: 기본 제외 패턴 *sample* 에 걸려 폴더 등록에서 빠진다
    (movies / "Demo Movie (2024).mkv").write_bytes(b"demo" * 4096)
    (movies / "Collection" / "Extra Movie (2023).mp4").write_bytes(b"extra" * 4096)
    print(f"seeded {root}")


if __name__ == "__main__":
    # seed.py <root>            처음 데이터 (run.sh, 두 번째 조합 시작 전)
    # seed.py <root> --failed N 실패 작업만 더한다
    # seed.py <root> --account  관리 계정을 만든다 (처음 설정 장면을 찍을 때는 부르지 않는다)
    if len(sys.argv) == 4 and sys.argv[2] == "--failed":
        add_failed_jobs(Path(sys.argv[1]), int(sys.argv[3]))
    elif len(sys.argv) == 3 and sys.argv[2] == "--account":
        create_account(Path(sys.argv[1]))
    else:
        main(Path(sys.argv[1]))
