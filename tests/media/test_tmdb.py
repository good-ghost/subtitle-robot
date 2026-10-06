"""TMDB 원어 조회 (PROJECT-PLAN §26.6, WI-8.005). 실제 TMDB 에 요청하지 않는다."""

import json
import logging
from pathlib import Path

import httpx
import pytest

from subtitle_robot.config import TmdbConfig
from subtitle_robot.media.tmdb import (
    CACHE_FILE,
    ERROR_RETRY_S,
    NOT_FOUND_RETRY_S,
    ExternalIds,
    OriginLanguageResolver,
    TitleQuery,
    TmdbClient,
    create_origin_resolver,
    ids_from_path,
    movie_folder_query,
    title_query,
)
from subtitle_robot.secret_store import SecretStore

KEY = "v3-secret-key-123"


class Clock:
    def __init__(self) -> None:
        self.now = 1_000_000.0

    def __call__(self) -> float:
        return self.now


class FakeTmdb:
    """경로별 응답을 돌려주고 요청을 기록한다."""

    def __init__(self, routes: dict[str, object], status: int = 200) -> None:
        self.routes = routes
        self.status = status
        self.requests: list[httpx.Request] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        if self.status != 200:
            return httpx.Response(self.status, json={"status_message": "x"})
        body = self.routes.get(request.url.path.removeprefix("/3"))
        if body is None:
            return httpx.Response(404, json={"status_code": 34})
        return httpx.Response(200, json=body)


def _resolver(
    fake: FakeTmdb, tmp_path: Path, clock: Clock, key: str = KEY
) -> OriginLanguageResolver:
    client = TmdbClient(key, transport=httpx.MockTransport(fake))
    return OriginLanguageResolver(client, tmp_path / CACHE_FILE, clock=clock)


@pytest.mark.parametrize(
    ("path", "expected"),
    [
        ("/tv/Show (2005) {tvdb-81189}/Season 1/Show S01E01.mkv", ExternalIds(tvdb="81189")),
        ("/movies/Movie (2019) {tmdb-123}.mkv", ExternalIds(tmdb="123")),
        (
            "/movies/Movie [tmdbid-77] [imdbid-tt0245429]/m.mkv",
            ExternalIds("77", None, "tt0245429"),
        ),
        ("/movies/Movie {imdb-TT0245429}.mkv", ExternalIds(imdb="tt0245429")),
        ("/movies/Movie (2019).mkv", ExternalIds()),
    ],
)
def test_ids_from_path(path: str, expected: ExternalIds) -> None:
    assert ids_from_path(Path(path)) == expected


@pytest.mark.parametrize(
    ("name", "expected"),
    [
        ("Spirited.Away.2001.1080p.BluRay.x264-GROUP", TitleQuery("Spirited Away", 2001)),
        ("Spirited Away (2001) {tmdb-129}", TitleQuery("Spirited Away", 2001)),
        ("[Group] Your Name 1080p WEB-DL", TitleQuery("Your Name")),
        ("Breaking Bad (2008) [tvdbid-81189]", TitleQuery("Breaking Bad", 2008)),
        ("2012.2009.720p", TitleQuery("2012", 2009)),
        # 하이픈으로 이은 연도 (WI-8.005b)
        (
            "Godzilla.vs.Kong-2021-1080p.BluRay.x265.10bit.Tigole",
            TitleQuery("Godzilla vs Kong", 2021),
        ),
        ("Spider-Man.No.Way.Home.2021.1080p", TitleQuery("Spider-Man No Way Home", 2021)),
        ("Dark", TitleQuery("Dark")),
        ("1080p", None),
    ],
)
def test_title_query(name: str, expected: TitleQuery | None) -> None:
    assert title_query(name) == expected


def test_tmdb_id_is_looked_up_directly_and_cached(tmp_path: Path) -> None:
    fake = FakeTmdb({"/movie/129": {"id": 129, "original_language": "ja"}})
    clock = Clock()
    resolver = _resolver(fake, tmp_path, clock)
    video = Path("/movies/Spirited Away (2001) {tmdb-129}.mkv")

    first = resolver.resolve("movie", video, video.stem)
    second = _resolver(fake, tmp_path, clock).resolve("movie", video, video.stem)

    assert (first.language, first.source) == ("ja", "tmdb:movie/129")
    assert second.language == "ja"
    assert second.source.startswith("cache")
    assert len(fake.requests) == 1  # 두 번째는 캐시 (다른 조회기여도 파일을 읽는다)
    assert fake.requests[0].url.params["api_key"] == KEY


def test_tvdb_id_uses_find_with_tv_results(tmp_path: Path) -> None:
    fake = FakeTmdb(
        {
            "/find/81189": {
                "movie_results": [],
                "tv_results": [{"id": 1396, "original_language": "en"}],
            }
        }
    )
    video = Path("/tv/Breaking Bad (2008) {tvdb-81189}/Season 1/Breaking Bad S01E01.mkv")

    result = _resolver(fake, tmp_path, Clock()).resolve(
        "series", video, "Breaking Bad (2008) {tvdb-81189}"
    )

    assert (result.language, result.source) == ("en", "tmdb:tv/1396")
    assert fake.requests[0].url.params["external_source"] == "tvdb_id"


def test_title_search_with_year(tmp_path: Path) -> None:
    fake = FakeTmdb(
        {"/search/tv": {"results": [{"id": 70523, "original_language": "de"}, {"id": 1}]}}
    )

    result = _resolver(fake, tmp_path, Clock()).resolve(
        "series", Path("/tv/Dark (2017)/Dark S01E01.mkv"), "Dark (2017)"
    )

    assert (result.language, result.source) == ("de", "tmdb:tv/70523")
    params = fake.requests[0].url.params
    assert (params["query"], params["first_air_date_year"]) == ("Dark", "2017")


def test_movie_folder_title_comes_first(tmp_path: Path) -> None:
    """영화가 `제목 (연도)` 폴더 안이면 릴리스 파일 이름보다 폴더 이름으로 찾는다 (WI-8.005b)."""
    fake = FakeTmdb({"/search/movie": {"results": [{"id": 399566, "original_language": "en"}]}})
    folder = Path("/media/movie/Godzilla vs. Kong (2021)")
    video = folder / "Godzilla.vs.Kong-2021-1080p.BluRay.x265.10bit.Tigole.mkv"

    result = _resolver(fake, tmp_path, Clock()).resolve("movie", video, video.stem)

    assert (result.language, result.source) == ("en", "tmdb:movie/399566")
    params = fake.requests[0].url.params
    assert (params["query"], params["year"]) == ("Godzilla vs Kong", "2021")


@pytest.mark.parametrize(
    ("path", "expected"),
    [
        ("/media/movie/Godzilla vs. Kong (2021)/x.mkv", TitleQuery("Godzilla vs Kong", 2021)),
        ("/media/movie/x.mkv", None),  # 감시 루트 바로 아래 파일
        ("/media/movie/Collection/x.mkv", None),  # 연도 없는 폴더는 작품 이름이 아닐 수 있다
    ],
)
def test_movie_folder_query(path: str, expected: TitleQuery | None) -> None:
    assert movie_folder_query(Path(path)) == expected


def test_cantonese_cn_becomes_zh(tmp_path: Path) -> None:
    fake = FakeTmdb({"/search/movie": {"results": [{"id": 5, "original_language": "cn"}]}})

    result = _resolver(fake, tmp_path, Clock()).resolve(
        "movie", Path("/m/Movie.mkv"), "Infernal Affairs 2002"
    )

    assert result.language == "zh"


def test_not_found_is_retried_after_a_day(tmp_path: Path) -> None:
    fake = FakeTmdb({"/search/movie": {"results": []}})
    clock = Clock()
    resolver = _resolver(fake, tmp_path, clock)

    assert resolver.resolve("movie", Path("/m/x.mkv"), "Unknown Film").language is None
    assert resolver.resolve("movie", Path("/m/x.mkv"), "Unknown Film").language is None
    assert len(fake.requests) == 1
    clock.now += NOT_FOUND_RETRY_S
    resolver.resolve("movie", Path("/m/x.mkv"), "Unknown Film")
    assert len(fake.requests) == 2


@pytest.mark.parametrize("status", [401, 500, 503])
def test_errors_do_not_raise_and_are_not_written(tmp_path: Path, status: int) -> None:
    fake = FakeTmdb({}, status=status)
    clock = Clock()
    resolver = _resolver(fake, tmp_path, clock)

    result = resolver.resolve("movie", Path("/m/x.mkv"), "Some Film")

    assert result.language is None
    assert result.source == f"error: HTTP {status}"
    assert not (tmp_path / CACHE_FILE).exists()
    resolver.resolve("movie", Path("/m/x.mkv"), "Some Film")
    assert len(fake.requests) == 1  # 잠시 다시 묻지 않는다
    clock.now += ERROR_RETRY_S
    resolver.resolve("movie", Path("/m/x.mkv"), "Some Film")
    assert len(fake.requests) == 2


def test_timeout_does_not_raise(tmp_path: Path) -> None:
    def timeout(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("slow", request=request)

    client = TmdbClient(KEY, transport=httpx.MockTransport(timeout))
    result = OriginLanguageResolver(client, tmp_path / CACHE_FILE).resolve(
        "movie", Path("/m/x.mkv"), "Film"
    )

    assert (result.language, result.source) == (None, "error: ReadTimeout")


def test_v4_token_is_sent_as_bearer(tmp_path: Path) -> None:
    fake = FakeTmdb({"/movie/1": {"original_language": "fr"}})
    token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.signature"

    _resolver(fake, tmp_path, Clock(), key=token).resolve("movie", Path("/m/{tmdb-1}.mkv"), "x")

    request = fake.requests[0]
    assert request.headers["authorization"] == f"Bearer {token}"
    assert "api_key" not in request.url.params


def test_key_is_not_logged_or_cached(tmp_path: Path, caplog: pytest.LogCaptureFixture) -> None:
    fake = FakeTmdb({"/movie/1": {"original_language": "fr"}})
    caplog.set_level(logging.INFO)

    _resolver(fake, tmp_path, Clock()).resolve("movie", Path("/m/{tmdb-1}.mkv"), "x")

    assert any("HTTP Request" in record.getMessage() for record in caplog.records)
    assert KEY not in caplog.text
    assert KEY not in (tmp_path / CACHE_FILE).read_text(encoding="utf-8")
    assert json.loads((tmp_path / CACHE_FILE).read_text())["movie:tmdb:1"]["language"] == "fr"


def test_factory_reads_key_from_store_only(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """키는 Settings 의 비밀 저장소에서만 읽는다 (환경 변수는 무시, §28.2)."""
    monkeypatch.setenv("TMDB_API_KEY", KEY)
    resolver = create_origin_resolver(TmdbConfig(), tmp_path)
    assert resolver.resolve("movie", Path("/m/x.mkv"), "x").source == "no_key"

    store = SecretStore.for_data_dir(tmp_path)
    store.set("tmdb.api_key", KEY)
    disabled = create_origin_resolver(TmdbConfig(enabled=False), tmp_path)
    assert disabled.resolve("movie", Path("/m/x.mkv"), "x").source == "no_key"
    enabled = create_origin_resolver(TmdbConfig(), tmp_path, secrets=store)
    assert enabled._client is not None
