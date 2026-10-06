"""관리 계정 변경 API (PROJECT-PLAN §28.3, REQ-047, WI-10.002).

로그인한 사용자가 지금 비밀번호를 확인한 뒤 사용자 이름·비밀번호를 바꾼다. 바꾸면 세션 서명 키도
새로 만들어 모든 세션(지금 것 포함)이 끝난다. 화면은 다시 로그인한다.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from subtitle_robot.web.auth import AccountError
from subtitle_robot.web.context import Context

router = APIRouter(prefix="/api")


class AccountOut(BaseModel):
    """계정 정보 (비밀번호는 내보내지 않는다)."""

    username: str | None


class AccountIn(BaseModel):
    """계정 변경 요청. new_password 가 없으면 비밀번호는 그대로."""

    current_password: str
    username: str
    new_password: str | None = None


@router.get("/account")
def get_account(context: Context) -> AccountOut:
    """지금 사용자 이름."""
    return AccountOut(username=context.accounts.username())


@router.put("/account")
def put_account(body: AccountIn, context: Context) -> AccountOut:
    """사용자 이름·비밀번호를 바꾼다. 틀린 지금 비밀번호는 403, 규칙 위반은 400."""
    try:
        context.accounts.change(
            body.current_password, username=body.username, new_password=body.new_password or None
        )
    except AccountError as exc:
        status = 403 if exc.code == "wrong_password" else 400
        raise HTTPException(status_code=status, detail=exc.code) from exc
    return AccountOut(username=context.accounts.username())
