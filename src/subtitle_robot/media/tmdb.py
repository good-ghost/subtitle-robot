"""TMDB 로 작품의 원어 찾기 (PROJECT-PLAN §26.6, REQ-042, NFR-008, WI-8.005).

동영상의 원어(original_language)를 소스 자막 트랙 선택에 쓴다.
1. 경로(파일·폴더 이름)의 ID: `{tmdb-123}`·`{tmdbid-123}`·`[tmdbid-123]` → `/movie|tv/{id}`,
   `{tvdb-123}`·`{imdb-tt123}` → `/find/{id}`
2. ID 가 없으면 제목·연도로 `/search/movie|tv` 첫 결과
3. 결과는 캐시 파일에 둔다. 찾지 못한 결과는 하루 뒤, 요청 오류는 10분 뒤 다시 묻는다

키는 환경 변수로만 받고 로그·캐시에 남기지 않는다 (NFR-008). 조회가 실패해도 예외를 내지 않고
원어 없음으로 돌려준다 (그때는 첫 자막 트랙을 쓴다).
"""

from __future__ import annotations

import json
import logging
import re
import threading
import time
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

import httpx

from subtitle_robot.config import TmdbConfig
from subtitle_robot.io.atomic import atomic_write_text
from subtitle_robot.lang.codes import normalize_language
from subtitle_robot.secret_store import SecretStore

logger = logging.getLogger(__name__)

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_TIMEOUT_S = 10.0
CACHE_FILE = "tmdb-cache.json"
# 비밀 저장소의 키 위치
TMDB_SECRET = "tmdb.api_key"  # noqa: S105 — 저장소 안 위치 이름이다 (값이 아니다)
# 찾지 못한 작품은 하루 뒤 다시 묻는다 (TMDB 에 나중에 등록될 수 있다)
NOT_FOUND_RETRY_S = 86_400
# 요청 오류(시간 초과·5xx·401)는 파일에 남기지 않고 이 시간 동안만 다시 묻지 않는다
ERROR_RETRY_S = 600

MediaKind = Literal["movie", "series"]
Clock = Callable[[], float]

_ID_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("tmdb", re.compile(r"[\[{]tmdb(?:id)?[-=](\d+)[\]}]", re.IGNORECASE)),
    ("tvdb", re.compile(r"[\[{]tvdb(?:id)?[-=](\d+)[\]}]", re.IGNORECASE)),
    ("imdb", re.compile(r"[\[{]imdb(?:id)?[-=](tt\d+)[\]}]", re.IGNORECASE)),
)
_ID_TAG_RE = re.compile(r"[\[{](?:tmdb|tvdb|imdb)(?:id)?[-=][^\]}]*[\]}]", re.IGNORECASE)
# 연도 앞뒤는 공백·괄호·하이픈 (`Kong-2021-1080p`처럼 하이픈으로 이은 릴리스 이름, WI-8.005b)
_YEAR_RE = re.compile(r"(?:^|[\s(\[-])((?:19|20)\d{2})(?=$|[\s)\]-])")
# 영화 폴더 이름의 `(연도)` (Radarr·Plex 이름 규칙 `Title (2021)`)
_FOLDER_YEAR_RE = re.compile(r"\((?:19|20)\d{2}\)")
# 제목 뒤에 오는 릴리스 표시 (여기부터 버린다)
_RELEASE_TOKEN_RE = re.compile(
    r"\b(?:2160p|1080p|1080i|720p|576p|480p|4k|uhd|bluray|blu-ray|bdrip|brrip|web-?dl|webrip|"
    r"web|hdtv|dvdrip|remux|x264|x265|h\.?264|h\.?265|hevc|proper|repack|extended|"
    r"unrated|remastered|multi|dual)\b",
    re.IGNORECASE,
)
_LEADING_GROUP_RE = re.compile(r"^(?:\s*[\[(【][^\])】]*[\])】])+")
_API_KEY_RE = re.compile(r"(api_key=)[^&\s\"]+")


@dataclass(frozen=True)
class ExternalIds:
    """경로에서 찾은 작품 ID."""

    tmdb: str | None = None
    tvdb: str | None = None
    imdb: str | None = None


@dataclass(frozen=True)
class TitleQuery:
    """제목 검색어."""

    title: str
    year: int | None = None


@dataclass(frozen=True)
class OriginLanguage:
    """원어 조회 결과.

    Attributes:
        language: ISO 639-1. 찾지 못했으면 None.
        source: 근거 (`tmdb:tv/1399`, `cache …`, `not_found`, `no_key`, `error: …`).
            판정 사유에 남긴다.
    """

    language: str | None
    source: str


def ids_from_path(path: Path) -> ExternalIds:
    """파일·폴더 이름의 ID 표시 (`Show (2005) {tvdb-81189}`). 파일에 가까운 것이 우선."""
    found: dict[str, str] = {}
    for part in reversed(path.parts):
        for name, pattern in _ID_PATTERNS:
            match = pattern.search(part)
            if match and name not in found:
                found[name] = match.group(1).lower() if name == "imdb" else match.group(1)
    return ExternalIds(found.get("tmdb"), found.get("tvdb"), found.get("imdb"))


def title_query(name: str) -> TitleQuery | None:
    """이름에서 제목·연도 (`Spirited.Away.2001.1080p.BluRay` → Spirited Away, 2001)."""
    text = _ID_TAG_RE.sub(" ", name)
    text = _LEADING_GROUP_RE.sub("", text).replace(".", " ").replace("_", " ")
    year: int | None = None
    # 제목 첫 단어가 연도인 작품(`2012`)은 그 단어를 연도로 보지 않는다
    year_match = next((m for m in _YEAR_RE.finditer(text) if m.start(1) > 0), None)
    if year_match:
        year = int(year_match.group(1))
        text = text[: year_match.start(1)]
    release = _RELEASE_TOKEN_RE.search(text)
    if release:
        text = text[: release.start()]
    title = re.sub(r"\s+", " ", text).strip(" -([{")
    return TitleQuery(title, year) if title else None


def movie_folder_query(video: Path) -> TitleQuery | None:
    """영화 폴더 이름이 `제목 (연도)` 꼴이면 그 제목·연도. 아니면 None (감시 루트 등)."""
    folder = video.parent.name
    if not _FOLDER_YEAR_RE.search(folder):
        return None
    query = title_query(folder)
    return query if query is not None and query.year is not None else None


class TmdbError(RuntimeError):
    """TMDB 요청 실패 (시간 초과, 인증, 서버 오류, 응답 형식)."""


class _RedactApiKey(logging.Filter):
    """httpx 요청 로그의 URL 에서 v3 키를 가린다 (`-v` 일 때 httpx 가 URL 을 INFO 로 남긴다)."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.args, tuple) and record.args:
            record.args = tuple(_redact(arg) for arg in record.args)
        return True


def _redact(arg: object) -> object:
    text = str(arg)
    return _API_KEY_RE.sub(r"\1***", text) if "api_key=" in text else arg


_REDACT_FILTER = _RedactApiKey()


class TmdbClient:
    """TMDB API v3 클라이언트 (원어 조회만).

    Args:
        api_key: v3 API 키 또는 v4 읽기 토큰(JWT, Bearer 로 보낸다).
        transport: 테스트용 httpx 전송.
    """

    def __init__(
        self,
        api_key: str,
        *,
        base_url: str = TMDB_BASE_URL,
        timeout: float = TMDB_TIMEOUT_S,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        bearer = api_key.startswith("eyJ") and api_key.count(".") == 2
        logging.getLogger("httpx").addFilter(_REDACT_FILTER)
        self._client = httpx.Client(
            base_url=base_url,
            timeout=timeout,
            transport=transport,
            headers={"Authorization": f"Bearer {api_key}"} if bearer else {},
            params={} if bearer else {"api_key": api_key},
        )

    def close(self) -> None:
        """연결을 닫는다."""
        self._client.close()

    def by_id(self, kind: MediaKind, tmdb_id: str) -> OriginLanguage:
        """TMDB ID 로 조회한다."""
        endpoint = f"{'tv' if kind == 'series' else 'movie'}/{tmdb_id}"
        data = self._get(f"/{endpoint}")
        return _origin(data.get("original_language"), f"tmdb:{endpoint}")

    def find(self, kind: MediaKind, external_id: str, source: str) -> OriginLanguage:
        """TVDB·IMDb ID 로 찾는다 (`source`: tvdb_id | imdb_id)."""
        data = self._get(f"/find/{external_id}", {"external_source": source})
        preferred = "tv_results" if kind == "series" else "movie_results"
        other = "movie_results" if kind == "series" else "tv_results"
        for key in (preferred, other):
            results = data.get(key)
            if isinstance(results, list) and results and isinstance(results[0], dict):
                first = results[0]
                endpoint = f"{'tv' if key == 'tv_results' else 'movie'}/{first.get('id')}"
                return _origin(first.get("original_language"), f"tmdb:{endpoint}")
        return OriginLanguage(None, "not_found")

    def search(self, kind: MediaKind, query: TitleQuery) -> OriginLanguage:
        """제목·연도로 검색해 첫 결과를 쓴다."""
        endpoint = "tv" if kind == "series" else "movie"
        params: dict[str, Any] = {"query": query.title}
        if query.year is not None:
            params["first_air_date_year" if kind == "series" else "year"] = query.year
        data = self._get(f"/search/{endpoint}", params)
        results = data.get("results")
        if isinstance(results, list) and results and isinstance(results[0], dict):
            first = results[0]
            return _origin(first.get("original_language"), f"tmdb:{endpoint}/{first.get('id')}")
        return OriginLanguage(None, "not_found")

    def _get(self, path: str, params: Mapping[str, Any] | None = None) -> dict[str, Any]:
        try:
            response = self._client.get(path, params=dict(params or {}))
        except httpx.HTTPError as exc:
            raise TmdbError(f"{type(exc).__name__}") from exc
        if response.status_code == httpx.codes.NOT_FOUND:
            return {}
        if response.status_code != httpx.codes.OK:
            raise TmdbError(f"HTTP {response.status_code}")
        try:
            data = response.json()
        except ValueError as exc:
            raise TmdbError("JSON 이 아닌 응답") from exc
        if not isinstance(data, dict):
            raise TmdbError("응답 형식이 다르다")
        return data


def _origin(raw: object, source: str) -> OriginLanguage:
    language = normalize_language(raw) if isinstance(raw, str) else None
    return OriginLanguage(language, source if language else "not_found")


class OriginLanguageResolver:
    """경로 ID → 제목 검색 순서로 원어를 찾고 결과를 캐시한다.

    Args:
        client: TMDB 클라이언트. None 이면(키 없음·꺼짐) 조회하지 않는다.
        cache_path: 캐시 파일 (데이터 폴더의 `tmdb-cache.json`).
        clock: 시각 (테스트용).
    """

    def __init__(
        self, client: TmdbClient | None, cache_path: Path, *, clock: Clock = time.time
    ) -> None:
        self._client = client
        self._cache_path = Path(cache_path)
        self._clock = clock
        self._lock = threading.Lock()
        self._errors: dict[str, float] = {}

    def resolve(self, kind: MediaKind, video: Path, title: str) -> OriginLanguage:
        """원어를 찾는다. 예외를 내지 않는다.

        Args:
            kind: movie | series.
            video: 동영상 경로 (파일·폴더 이름의 ID 를 찾는다).
            title: 작품 이름 (영화는 파일 이름, 시리즈는 작품 폴더 이름). 영화가 `제목 (연도)`
                폴더 안에 있으면 그 폴더 이름을 먼저 쓴다 (릴리스 이름보다 정확하다).
        """
        if self._client is None:
            return OriginLanguage(None, "no_key")
        ids = ids_from_path(video)
        query = (movie_folder_query(video) if kind == "movie" else None) or title_query(title)
        key = _cache_key(kind, ids, query)
        if key is None:
            return OriginLanguage(None, "no_title")
        with self._lock:
            cached = self._cached(key)
            if cached is not None:
                return cached
            try:
                result = self._lookup(self._client, kind, ids, query)
            except TmdbError as exc:
                logger.warning("tmdb lookup failed for %s: %s", key, exc)
                self._errors[key] = self._clock()
                return OriginLanguage(None, f"error: {exc}")
            self._store(key, result)
        logger.info("tmdb original language %s: %s (%s)", key, result.language, result.source)
        return result

    @staticmethod
    def _lookup(
        client: TmdbClient, kind: MediaKind, ids: ExternalIds, query: TitleQuery | None
    ) -> OriginLanguage:
        if ids.tmdb:
            result = client.by_id(kind, ids.tmdb)
            if result.language:
                return result
        for external, source in ((ids.tvdb, "tvdb_id"), (ids.imdb, "imdb_id")):
            if external:
                result = client.find(kind, external, source)
                if result.language:
                    return result
        if query is not None:
            return client.search(kind, query)
        return OriginLanguage(None, "not_found")

    def _cached(self, key: str) -> OriginLanguage | None:
        now = self._clock()
        if now - self._errors.get(key, float("-inf")) < ERROR_RETRY_S:
            return OriginLanguage(None, "error (retry later)")
        item = self._load().get(key)
        if not isinstance(item, dict):
            return None
        language = item.get("language")
        if language is None and now - float(item.get("at", 0)) >= NOT_FOUND_RETRY_S:
            return None
        return OriginLanguage(language, f"cache {item.get('source', '')}".strip())

    def _store(self, key: str, result: OriginLanguage) -> None:
        cache = self._load()
        cache[key] = {"language": result.language, "source": result.source, "at": self._clock()}
        self._cache_path.parent.mkdir(parents=True, exist_ok=True)
        atomic_write_text(
            self._cache_path, json.dumps(cache, ensure_ascii=False, indent=1, sort_keys=True)
        )

    def _load(self) -> dict[str, Any]:
        try:
            data = json.loads(self._cache_path.read_text(encoding="utf-8"))
        except FileNotFoundError:
            return {}
        except (OSError, ValueError) as exc:
            logger.warning("tmdb cache unreadable, starting empty: %s", exc)
            return {}
        return data if isinstance(data, dict) else {}


def _cache_key(kind: MediaKind, ids: ExternalIds, query: TitleQuery | None) -> str | None:
    if ids.tmdb:
        return f"{kind}:tmdb:{ids.tmdb}"
    if ids.tvdb:
        return f"{kind}:tvdb:{ids.tvdb}"
    if ids.imdb:
        return f"{kind}:imdb:{ids.imdb}"
    if query is None:
        return None
    year = f":{query.year}" if query.year else ""
    return f"{kind}:title:{query.title.casefold()}{year}"


def create_origin_resolver(
    settings: TmdbConfig, data_dir: Path, *, secrets: SecretStore | None = None
) -> OriginLanguageResolver:
    """설정·비밀 저장소로 원어 조회기를 만든다. 꺼졌거나 키가 없으면 조회하지 않는 조회기.

    키는 비밀 저장소의 `tmdb.api_key`(Settings, §28.2)이고 환경 변수는 읽지 않는다.
    """
    store = secrets if secrets is not None else SecretStore.for_data_dir(Path(data_dir))
    key = (store.get(TMDB_SECRET) or "") if settings.enabled else ""
    if settings.enabled and not key:
        logger.info("tmdb lookup disabled: no TMDB key in Settings")
    client = TmdbClient(key, timeout=settings.timeout) if key else None
    return OriginLanguageResolver(client, Path(data_dir) / CACHE_FILE)
