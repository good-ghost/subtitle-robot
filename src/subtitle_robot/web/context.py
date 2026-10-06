"""요청 처리 컨텍스트와 로그인 검사 의존성 (PROJECT-PLAN §25.2, §25.3, WI-7.001).

서버(`server.py`)와 API 라우터(`api.py` 등)가 함께 쓴다.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Annotated, cast

from fastapi import Depends, HTTPException, Request

from subtitle_robot.config import AppConfig
from subtitle_robot.llm.logins import SubscriptionLogins
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.queue import JobQueue
from subtitle_robot.web.auth import SESSION_COOKIE, AccountStore, SessionSigner

# 로그인 실패 응답을 늦춰 비밀번호 대입을 느리게 한다 (§25.3)
FAILED_LOGIN_DELAY_S = 1.0


@dataclass(frozen=True)
class WebContext:
    """요청 처리에 필요한 데몬 객체와 인증 정보."""

    config: AppConfig
    queue: JobQueue
    ledger: Ledger
    data_dir: Path
    # 관리 계정 (비밀 저장소, §28.3)
    accounts: AccountStore
    signer: SessionSigner
    # 구독 로그인 (Settings 공급자 카드, §28.1)
    logins: SubscriptionLogins
    failed_login_delay_s: float = FAILED_LOGIN_DELAY_S
    # 데몬이 읽은 설정 파일 (없으면 Settings 는 보기 전용, §25.9)
    config_path: Path | None = None
    # 데몬 시작 시각: 이보다 늦게 저장한 설정은 아직 적용되지 않았다
    started_at: float = 0.0
    # 데몬 종료 요청 (재시작 정책이 다시 띄운다). 없으면 재기동 API 는 409
    request_restart: Callable[[], None] | None = None


def get_context(request: Request) -> WebContext:
    """앱에 붙인 컨텍스트 (FastAPI 의존성)."""
    return cast(WebContext, request.app.state.context)


Context = Annotated[WebContext, Depends(get_context)]


def require_session(request: Request, context: Context) -> None:
    """로그인한 요청만 통과시킨다 (FastAPI 의존성).

    Raises:
        HTTPException: 401, 세션 쿠키가 없거나 만료·변조됐다.
    """
    if not context.signer.verify(request.cookies.get(SESSION_COOKIE)):
        raise HTTPException(status_code=401, detail="not_authenticated")
