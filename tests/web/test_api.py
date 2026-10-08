import time
from pathlib import Path

import pytest

from subtitle_robot.cli import EXIT_OK, main
from subtitle_robot.config import AppConfig, WatchConfig, WatchPath, load_config
from subtitle_robot.media.sidecar import OutputFile, SidecarRecord
from subtitle_robot.watch.heartbeat import HEARTBEAT_KEY
from subtitle_robot.watch.queue import Job, JobQueue
from subtitle_robot.watch.state import state_path
from tests.web.conftest import WebEnv, make_env


@pytest.fixture
def media(tmp_path: Path) -> Path:
    root = tmp_path / "media"
    (root / "movies" / "sub").mkdir(parents=True)
    (root / "tv").mkdir()
    return root


@pytest.fixture
def api(tmp_path: Path, media: Path) -> WebEnv:
    base = load_config(None)
    config: AppConfig = base.model_copy(
        update={
            "watch": WatchConfig(
                paths=[
                    WatchPath(path=str(media / "movies"), kind="movie"),
                    WatchPath(path=str(media / "tv"), kind="series"),
                ]
            )
        }
    )
    env = make_env(tmp_path, config=config)
    env.login()
    return env


def _video(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(path.name.encode() * 40)
    return path


def _failed_job(env: WebEnv, path: Path) -> Job:
    job = env.queue.enqueue(path)
    assert env.queue.claim(job.id) is not None
    return env.queue.fail(job.id, "ProbeError: broken")


@pytest.mark.parametrize(
    ("method", "url"),
    [
        ("GET", "/api/status"),
        ("GET", "/api/jobs"),
        ("POST", "/api/jobs/retry"),
        ("POST", "/api/jobs/clear-failed"),
        ("GET", "/api/ledger"),
        ("POST", "/api/ledger/forget"),
        ("POST", "/api/media"),
        ("GET", "/api/browse"),
    ],
)
def test_api_requires_login(tmp_path: Path, method: str, url: str) -> None:
    env = make_env(tmp_path)
    response = env.client.request(method, url, json={})
    assert response.status_code == 401


def test_status(api: WebEnv, media: Path) -> None:
    api.queue.enqueue(media / "movies" / "a.mkv")
    _failed_job(api, media / "movies" / "b.mkv")

    body = api.client.get("/api/status").json()

    assert body["healthy"] is False  # heartbeat 없음
    assert body["started_at"] == api.context.started_at
    assert body["heartbeat_age_s"] is None
    assert body["provider"] == {
        "name": "gemini",
        "model": api.context.config.active_provider()[1].model,
        "state": "available",
        "reason": "",
    }
    assert body["queue"]["queued"] == 1
    assert body["queue"]["failed"] == 1
    assert body["queue"]["done"] == 0
    assert body["completed"] == 0
    assert body["watch_paths"] == [
        {"path": str(media / "movies"), "kind": "movie"},
        {"path": str(media / "tv"), "kind": "series"},
    ]

    api.queue.set_meta({HEARTBEAT_KEY: repr(time.time())})
    api.queue.on_unavailable("503 loading")
    body = api.client.get("/api/status").json()
    assert body["healthy"] is True
    assert body["provider"]["state"] == "unavailable"
    assert body["provider"]["reason"] == "503 loading"


def test_jobs_filter_and_finished_detail(api: WebEnv, media: Path) -> None:
    waiting = api.queue.enqueue(media / "movies" / "a.mkv", detail={"kind": "movie"})
    _failed_job(api, media / "movies" / "b.mkv")
    done = api.queue.enqueue(media / "movies" / "c.mkv")
    api.queue.claim(done.id)
    api.queue.complete(
        done.id, "done", {"verdict": "translated", "reason": "en", "outputs": ["/x/c.ko.srt"]}
    )

    every = api.client.get("/api/jobs").json()
    assert [job["name"] for job in every] == ["a.mkv", "b.mkv", "c.mkv"]
    pending = api.client.get("/api/jobs", params={"status": ["queued", "failed"]}).json()
    assert [(job["id"], job["status"]) for job in pending] == [
        (waiting.id, "queued"),
        (waiting.id + 1, "failed"),
    ]
    assert pending[0]["kind"] == "movie"
    assert pending[1]["error"] == "ProbeError: broken"
    finished = api.client.get("/api/jobs", params={"status": "done"}).json()[0]
    assert (finished["verdict"], finished["reason"], finished["outputs"]) == (
        "translated",
        "en",
        ["/x/c.ko.srt"],
    )
    assert api.client.get("/api/jobs", params={"status": "nope"}).status_code == 422


def test_translating_job_shows_progress(api: WebEnv, media: Path) -> None:
    """번역 중인 작업만 진행(끝낸 블록 / 전체 블록)을 보인다 (WI-7.004c)."""
    job = api.queue.enqueue(media / "movies" / "a.mkv")
    api.queue.claim(job.id)
    api.queue.advance(job.id, "translating")

    def progress() -> object:
        return api.client.get("/api/jobs").json()[0]["progress"]

    assert progress() is None  # 분석 중 (아직 배치 전)
    api.queue.update_detail(job.id, {"progress": {"done": 2222, "total": 3333}})
    assert progress() == {"done": 2222, "total": 3333}
    api.queue.complete(job.id, "done", {**api.queue.get(job.id).detail})
    assert progress() is None  # 끝난 작업은 보이지 않는다


def test_retry_and_clear_failed(api: WebEnv, media: Path) -> None:
    first = _failed_job(api, media / "movies" / "a.mkv")
    _failed_job(api, media / "movies" / "b.mkv")
    queued = api.queue.enqueue(media / "movies" / "c.mkv")

    assert api.client.post("/api/jobs/retry", json={"job_id": first.id}).json() == {"count": 1}
    assert api.queue.get(first.id).status == "queued"
    conflict = api.client.post("/api/jobs/retry", json={"job_id": queued.id})
    assert (conflict.status_code, conflict.json()) == (409, {"detail": "job_not_failed"})
    # 재시도를 기다리는 작업(실패 기록이 있는 대기)은 바로 다시 처리한다 (WI-10.004c)
    retrying = JobQueue(state_path(api.data), max_attempts=3)
    waiting = retrying.enqueue(media / "movies" / "w.mkv")
    assert retrying.claim(waiting.id) is not None
    assert retrying.fail(waiting.id, "HTTP 503").status == "queued"
    assert api.client.post("/api/jobs/retry", json={"job_id": waiting.id}).json() == {"count": 1}
    assert api.queue.get(waiting.id).next_attempt_at == 0

    _failed_job(api, media / "movies" / "d.mkv")
    assert api.client.post("/api/jobs/clear-failed", json={}).json() == {"count": 2}
    assert api.queue.jobs("failed") == []
    assert api.client.post("/api/jobs/retry", json={}).json() == {"count": 0}


def test_ledger_list_forget_matches_cli(
    api: WebEnv, media: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    first = _video(media / "movies" / "A.mkv")
    second = _video(media / "movies" / "B.mkv")
    sidecars = SidecarRecord(
        outputs=[OutputFile(path=str(first.with_suffix(".ko.srt")), sha256="0")]
    )
    api.ledger.record(
        first, verdict="translated", reason="en #0", provider="nim", sidecars=sidecars
    )
    api.ledger.record(second, verdict="has_korean", reason="ko 트랙")

    assert api.client.get("/api/status").json()["completed"] == 2
    rows = api.client.get("/api/ledger").json()
    assert [row["name"] for row in rows] == ["B.mkv", "A.mkv"]  # 최근 것부터
    assert rows[1]["outputs"] == [str(first.with_suffix(".ko.srt"))]
    assert rows[1]["provider"] == "nim"
    only = api.client.get("/api/ledger", params={"verdict": "has_korean"}).json()
    assert [row["path"] for row in only] == [str(second)]
    # has_target 필터는 0.6.0 전 값 has_korean 도 낸다
    target = api.client.get("/api/ledger", params={"verdict": "has_target"}).json()
    assert [row["path"] for row in target] == [str(second)]

    data = ["--data", str(api.data)]
    assert main([*data, "ledger", "list"]) == EXIT_OK
    assert "기록 2건" in capsys.readouterr().out

    assert api.client.post("/api/ledger/forget", json={"path": str(first)}).json() == {"count": 1}
    missing = api.client.post("/api/ledger/forget", json={"path": str(first)})
    assert (missing.status_code, missing.json()) == (404, {"detail": "ledger_not_found"})
    assert main([*data, "ledger", "list"]) == EXIT_OK
    assert "기록 1건" in capsys.readouterr().out


def test_register_file_and_folder(api: WebEnv, media: Path) -> None:
    movie = _video(media / "movies" / "Movie (2020).mkv")
    nested = _video(media / "movies" / "sub" / "Other (2021).mp4")
    _video(media / "movies" / "notes.txt")
    episode = _video(media / "tv" / "Show" / "Show S01E01.mkv")

    one = api.client.post("/api/media", json={"path": str(movie), "force": True}).json()
    assert [item["path"] for item in one] == [str(movie)]
    assert api.queue.get(one[0]["id"]).force is True

    flat = api.client.post("/api/media", json={"path": str(media / "movies")}).json()
    assert [item["path"] for item in flat] == [str(movie)]  # 같은 대기 작업을 돌려준다
    deep = api.client.post("/api/media", json={"path": str(media / "movies"), "recursive": True})
    assert sorted(item["path"] for item in deep.json()) == sorted([str(movie), str(nested)])

    show = api.client.post("/api/media", json={"path": str(episode)}).json()
    job = api.queue.get(show[0]["id"])
    assert job.series_key is not None
    assert job.detail["origin"] == "web"


@pytest.mark.parametrize(
    ("path", "detail"),
    [
        ("relative/movie.mkv", "path_not_absolute"),
        ("{media}/../outside.mkv", "path_outside_watch"),
        ("{media}/movies/../../outside.mkv", "path_outside_watch"),
        ("/etc", "path_outside_watch"),
        ("{media}/movies/none.mkv", "path_not_found"),
        ("{media}/tv", "no_media_files"),
    ],
)
def test_register_rejects(api: WebEnv, media: Path, path: str, detail: str) -> None:
    _video(media.parent / "outside.mkv")
    response = api.client.post("/api/media", json={"path": path.format(media=media)})
    assert (response.status_code, response.json()) == (400, {"detail": detail})
    assert api.queue.jobs() == []


def test_register_rejects_symlink_out_of_watch(api: WebEnv, media: Path) -> None:
    outside = _video(media.parent / "secret" / "x.mkv")
    (media / "movies" / "link").symlink_to(outside.parent)
    response = api.client.post("/api/media", json={"path": str(media / "movies" / "link")})
    assert response.json() == {"detail": "path_outside_watch"}


def test_register_without_watch_paths(tmp_path: Path) -> None:
    env = make_env(tmp_path)
    env.login()
    response = env.client.post("/api/media", json={"path": "/media/a.mkv"})
    assert (response.status_code, response.json()) == (400, {"detail": "no_watch_paths"})


# ---------------------------------------------------------------- 폴더 목록 (WI-7.004d)


def test_browse_lists_watch_roots_then_folders_and_videos(api: WebEnv, media: Path) -> None:
    movies = media / "movies"
    _video(movies / "Sea Lark (2026)" / "Sea Lark (2026).mkv")
    _video(movies / "b.MP4")
    _video(movies / "a.mkv")
    (movies / "notes.txt").write_text("x")
    (movies / ".hidden").mkdir()
    (movies / "_UNPACK_x").mkdir()  # exclude_dirs 기본값
    _video(movies / "clip.sample.mkv")  # exclude 기본값 *sample*

    roots = api.client.get("/api/browse").json()
    assert roots == {
        "path": None,
        "parent": None,
        "entries": [
            {"name": str(movies), "path": str(movies), "kind": "dir"},
            {"name": str(media / "tv"), "path": str(media / "tv"), "kind": "dir"},
        ],
        "truncated": False,
    }

    body = api.client.get("/api/browse", params={"path": str(movies)}).json()
    assert body["path"] == str(movies)
    assert body["parent"] is None  # 감시 경로의 위는 감시 경로 목록
    assert [(e["name"], e["kind"]) for e in body["entries"]] == [
        ("Sea Lark (2026)", "dir"),
        ("sub", "dir"),
        ("a.mkv", "video"),
        ("b.MP4", "video"),
    ]

    inner = api.client.get("/api/browse", params={"path": str(movies / "Sea Lark (2026)")}).json()
    assert inner["parent"] == str(movies)
    assert [e["path"] for e in inner["entries"]] == [str(movies / "Sea Lark (2026)" / "Sea Lark (2026).mkv")]


@pytest.mark.parametrize(
    ("path", "detail"),
    [
        ("relative/path", "path_not_absolute"),
        ("/etc", "path_outside_watch"),
        ("{media}/movies/../../", "path_outside_watch"),
        ("{media}/movies/missing", "path_not_found"),
        ("{media}/movies/a.mkv", "path_not_found"),  # 파일은 폴더가 아니다
    ],
)
def test_browse_rejects(api: WebEnv, media: Path, path: str, detail: str) -> None:
    _video(media / "movies" / "a.mkv")

    response = api.client.get("/api/browse", params={"path": path.format(media=media)})

    assert response.status_code == 400
    assert response.json()["detail"] == detail


def test_browse_hides_symlinks_out_of_watch(api: WebEnv, media: Path, tmp_path: Path) -> None:
    outside = tmp_path / "outside"
    outside.mkdir()
    (media / "movies" / "escape").symlink_to(outside)
    (media / "movies" / "inside").symlink_to(media / "tv")

    body = api.client.get("/api/browse", params={"path": str(media / "movies")}).json()

    assert [e["name"] for e in body["entries"]] == ["inside", "sub"]
    escaped = api.client.get("/api/browse", params={"path": str(media / "movies" / "escape")})
    assert escaped.json()["detail"] == "path_outside_watch"


def test_browse_truncates_large_folders(
    api: WebEnv, media: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("subtitle_robot.web.api.BROWSE_LIMIT", 2)
    for name in ("c.mkv", "a.mkv", "b.mkv"):
        _video(media / "tv" / name)

    body = api.client.get("/api/browse", params={"path": str(media / "tv")}).json()

    assert [e["name"] for e in body["entries"]] == ["a.mkv", "b.mkv"]
    assert body["truncated"] is True
