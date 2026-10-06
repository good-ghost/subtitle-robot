"""웹 서버: FastAPI 앱과 데몬 안의 uvicorn 스레드 (PROJECT-PLAN §25.2~§25.4, WI-7.001).

데몬의 큐·처리 기록 객체를 그대로 받아 쓴다 (같은 `state.db`, 스레드 안전 잠금).
웹 서버가 실패해도 데몬(감시·번역)은 계속 돈다 (§25.2).
"""

from __future__ import annotations

import asyncio
import logging
import threading
from collections.abc import Awaitable, Callable
from pathlib import Path

import uvicorn
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from subtitle_robot.config import AppConfig
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.queue import JobQueue
from subtitle_robot.secret_store import SecretStore
from subtitle_robot.llm.logins import SubscriptionLogins
from subtitle_robot.web import account, api, logs, secrets_api, settings, subscriptions_api
from subtitle_robot.web.auth import SESSION_COOKIE, AccountError, AccountStore, SessionSigner
from subtitle_robot.web.context import Context, WebContext, require_session

logger = logging.getLogger(__name__)

# 데몬 종료 때 웹 스레드를 기다리는 시간
STOP_TIMEOUT_S = 10.0
# 다른 사이트의 폼 제출(text/plain·form)을 막는다. SameSite=Strict 쿠키와 함께 쓴다 (§25.3)
_WRITE_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})
_JSON_TYPE = "application/json"
_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
}


class LoginRequest(BaseModel):
    """로그인·처음 설정 요청."""

    username: str
    password: str


class SessionState(BaseModel):
    """로그인 상태. setup_required 면 관리 계정이 아직 없다 (처음 설정 화면, §28.3)."""

    authenticated: bool
    username: str | None = None
    setup_required: bool = False


session_router = APIRouter(prefix="/api/session")


@session_router.post("")
async def login(body: LoginRequest, response: Response, context: Context) -> SessionState:
    """사용자 이름·비밀번호를 확인하고 세션 쿠키를 준다."""
    if not context.accounts.exists():
        raise HTTPException(status_code=409, detail="setup_required")
    if not context.accounts.check(body.username, body.password):
        logger.warning("web login failed for user %r", body.username)
        await asyncio.sleep(context.failed_login_delay_s)
        raise HTTPException(status_code=401, detail="invalid_credentials")
    _set_session(response, context)
    return SessionState(authenticated=True, username=context.accounts.username())


@session_router.post("/setup")
def setup(body: LoginRequest, response: Response, context: Context) -> SessionState:
    """처음 설정: 관리 계정이 없을 때만 만든다 (Sonarr 방식, Q-25). 있으면 409."""
    try:
        context.accounts.create(body.username, body.password)
    except AccountError as exc:
        status = 409 if exc.code == "account_exists" else 400
        raise HTTPException(status_code=status, detail=exc.code) from exc
    _set_session(response, context)
    return SessionState(authenticated=True, username=context.accounts.username())


@session_router.get("")
def session_state(request: Request, context: Context) -> SessionState:
    """로그인 상태 (로그인하지 않아도 401 이 아니다: 화면이 처음에 묻는다)."""
    if not context.accounts.exists():
        return SessionState(authenticated=False, setup_required=True)
    if context.signer.verify(request.cookies.get(SESSION_COOKIE)):
        return SessionState(authenticated=True, username=context.accounts.username())
    return SessionState(authenticated=False)


def _set_session(response: Response, context: WebContext) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        context.signer.issue(),
        max_age=int(context.signer.max_age_s),
        httponly=True,
        samesite="strict",
        path="/",
    )


@session_router.delete("")
def logout(response: Response) -> SessionState:
    """세션 쿠키를 지운다."""
    response.delete_cookie(SESSION_COOKIE, path="/", httponly=True, samesite="strict")
    return SessionState(authenticated=False)


async def _guard_requests(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    """쓰기 요청은 JSON 만 받고, 모든 응답에 보안 헤더를 붙인다."""
    if request.method in _WRITE_METHODS and request.url.path.startswith("/api/"):
        media_type = request.headers.get("content-type", "").split(";")[0].strip().lower()
        if media_type != _JSON_TYPE:
            return JSONResponse({"detail": "json_required"}, status_code=415)
    response = await call_next(request)
    for name, value in _SECURITY_HEADERS.items():
        response.headers.setdefault(name, value)
    return response


def create_app(context: WebContext, routers: tuple[APIRouter, ...] = ()) -> FastAPI:
    """웹 앱을 만든다.

    Args:
        context: 데몬 객체와 인증 정보.
        routers: 로그인이 필요한 API 라우터 (세션 검사를 붙여 넣는다, 보통 `api_routers()`).
    """
    app = FastAPI(title="Subtitle Robot", docs_url=None, redoc_url=None, openapi_url=None)
    app.state.context = context
    app.middleware("http")(_guard_requests)
    app.include_router(session_router)
    for router in routers:
        app.include_router(router, dependencies=[Depends(require_session)])
    static_dir = Path(context.config.web.static_dir)
    if (static_dir / "index.html").is_file():
        # API 라우트 뒤에 붙여야 /api 가 정적 파일에 가려지지 않는다
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="web")
    else:
        logger.warning("web UI files not found in %s; serving the API only", static_dir)
    return app


class WebServer:
    """uvicorn 을 별도 스레드에서 돌린다.

    신호는 데몬 주 스레드가 받는다 (uvicorn 은 주 스레드가 아니면 신호 처리기를 걸지 않는다).
    """

    def __init__(
        self, app: FastAPI, *, host: str, port: int, on_stop: Callable[[], None] | None = None
    ) -> None:
        # log_config=None: 데몬의 로그 형식을 그대로 쓴다 (uvicorn 기본 설정이 덮어쓰지 않게)
        config = uvicorn.Config(
            app, host=host, port=port, log_config=None, log_level="warning",
            access_log=False, lifespan="off",
        )  # fmt: skip
        self._server = uvicorn.Server(config)
        self._host = host
        self._port = port
        self._thread = threading.Thread(target=self._run, name="web", daemon=True)
        # 멈출 때 정리할 것 (진행 중인 구독 로그인 명령)
        self._on_stop = on_stop

    def start(self) -> None:
        """스레드를 시작한다 (바인딩 실패는 로그로 남기고 스레드만 끝난다)."""
        logger.info("web UI starting on http://%s:%d", self._host, self._port)
        self._thread.start()

    @property
    def started(self) -> bool:
        """요청을 받을 준비가 됐다."""
        return bool(self._server.started)

    @property
    def alive(self) -> bool:
        """스레드가 돌고 있다."""
        return self._thread.is_alive()

    def bound_port(self) -> int | None:
        """실제로 연 포트 (설정이 0 이면 운영체제가 고른 포트)."""
        for server in getattr(self._server, "servers", []):
            for sock in server.sockets:
                return int(sock.getsockname()[1])
        return None

    def stop(self, timeout: float = STOP_TIMEOUT_S) -> None:
        """종료를 요청하고 기다린다."""
        self._server.should_exit = True
        if self._thread.is_alive():
            self._thread.join(timeout)
        if self._on_stop is not None:
            self._on_stop()

    def _run(self) -> None:
        try:
            self._server.run()
        except SystemExit:
            # uvicorn 은 포트를 열지 못하면 sys.exit 한다. 데몬은 계속 돌아야 한다 (§25.2)
            logger.error("web UI stopped: could not start on %s:%d", self._host, self._port)


def api_routers() -> tuple[APIRouter, ...]:
    """로그인이 필요한 운영 API 라우터."""
    return (
        api.router,
        logs.router,
        settings.router,
        account.router,
        secrets_api.router,
        subscriptions_api.router,
    )


def start_web_server(
    config: AppConfig,
    *,
    queue: JobQueue,
    ledger: Ledger,
    data_dir: Path,
    config_path: Path | None = None,
    started_at: float = 0.0,
    request_restart: Callable[[], None] | None = None,
    routers: tuple[APIRouter, ...] = (),
) -> WebServer:
    """웹 서버 스레드를 만들어 시작한다."""
    accounts = AccountStore(SecretStore.for_data_dir(data_dir))
    signer = SessionSigner(accounts.session_key, max_age_s=config.web.session_hours * 3600)
    if not accounts.exists():
        logger.warning("web UI has no admin account yet: open it to create one (first-run setup)")
    logins = SubscriptionLogins(data_dir, SecretStore.for_data_dir(data_dir))
    context = WebContext(
        config=config,
        queue=queue,
        ledger=ledger,
        data_dir=data_dir,
        accounts=accounts,
        signer=signer,
        logins=logins,
        config_path=config_path,
        started_at=started_at,
        request_restart=request_restart,
    )
    app = create_app(context, routers or api_routers())
    server = WebServer(app, host=config.web.host, port=config.web.port, on_stop=logins.close)
    server.start()
    return server
