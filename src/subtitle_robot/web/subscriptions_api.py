"""구독 로그인 API (PROJECT-PLAN §28.1, REQ-049, WI-10.008).

Settings 의 공급자 카드가 쓴다. 응답에는 자격 값이 없다 (Claude 토큰은 끝 4자리 힌트만).
Claude 토큰은 어댑터를 만들 때 읽으므로 재기동 뒤 적용된다. Codex 자격 파일(auth.json)은 요청마다
CLI 가 읽지만, 로그인 없이 시작한 데몬은 번역 워커가 없으므로 역시 재기동한다.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from subtitle_robot.llm.logins import (
    SUBSCRIPTION_LOGIN_PROVIDERS,
    DeviceLogin,
    DeviceState,
    LoginError,
    LoginStatus,
    SubscriptionLogins,
    SubscriptionProvider,
)
from subtitle_robot.web.context import Context

router = APIRouter(prefix="/api")

# 자격 파일(auth.json·oauth_creds.json)은 몇 KB 다. 이보다 크면 붙여넣기 실수다
MAX_CREDENTIAL_LENGTH = 64 * 1024


def get_logins(context: Context) -> SubscriptionLogins:
    """데몬의 구독 로그인 관리자 (FastAPI 의존성)."""
    return context.logins


Logins = Annotated[SubscriptionLogins, Depends(get_logins)]


class LoginStatusOut(BaseModel):
    """공급자 하나의 로그인 상태."""

    provider: SubscriptionProvider
    logged_in: bool
    hint: str | None = None
    updated_at: float | None = None
    # 이 이미지에 CLI 가 있는지 (없으면 화면이 공급자별 이미지 태그를 안내한다)
    cli_available: bool = True


class CredentialIn(BaseModel):
    """붙여넣은 자격 (Claude 토큰, Codex auth.json 내용)."""

    credential: str = Field(min_length=1, max_length=MAX_CREDENTIAL_LENGTH)


class DeviceLoginOut(BaseModel):
    """Codex 기기 코드 로그인 상태. 주소와 코드는 사용자가 브라우저에 넣는다."""

    state: DeviceState
    url: str | None = None
    code: str | None = None
    error: str | None = None


@router.get("/subscriptions")
def list_logins(logins: Logins) -> list[LoginStatusOut]:
    """구독 공급자 3종의 로그인 상태."""
    return [_status(logins.status(name)) for name in SUBSCRIPTION_LOGIN_PROVIDERS]


@router.put("/subscriptions/{provider}")
def save_login(
    provider: SubscriptionProvider, body: CredentialIn, logins: Logins
) -> LoginStatusOut:
    """붙여넣은 자격을 저장한다. 형식이 틀리면 400 `{detail: 코드}`."""
    try:
        return _status(logins.save(provider, body.credential))
    except LoginError as exc:
        raise HTTPException(status_code=400, detail=exc.code) from exc


@router.delete("/subscriptions/{provider}")
def clear_login(provider: SubscriptionProvider, logins: Logins) -> LoginStatusOut:
    """로그아웃 (저장한 자격을 지운다)."""
    return _status(logins.clear(provider))


@router.get("/subscriptions/openai/device")
def device_login(logins: Logins) -> DeviceLoginOut:
    """Codex 기기 코드 로그인 상태 (화면이 주기적으로 묻는다)."""
    return _device(logins.device_login())


@router.post("/subscriptions/openai/device")
def start_device_login(logins: Logins) -> DeviceLoginOut:
    """Codex 기기 코드 로그인을 시작한다. CLI 가 없으면 400 `cli_missing`."""
    try:
        return _device(logins.start_device_login())
    except LoginError as exc:
        raise HTTPException(status_code=400, detail=exc.code) from exc


@router.delete("/subscriptions/openai/device")
def cancel_device_login(logins: Logins) -> DeviceLoginOut:
    """진행 중인 기기 코드 로그인을 끝낸다."""
    return _device(logins.cancel_device_login())


def _status(status: LoginStatus) -> LoginStatusOut:
    return LoginStatusOut(
        provider=status.provider,
        logged_in=status.logged_in,
        hint=status.hint,
        updated_at=status.updated_at,
        cli_available=status.cli_available,
    )


def _device(device: DeviceLogin) -> DeviceLoginOut:
    return DeviceLoginOut(state=device.state, url=device.url, code=device.code, error=device.error)
