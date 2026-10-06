"""비밀(키) 관리 API (PROJECT-PLAN §28.2, REQ-046, NFR-010, WI-10.004).

화면은 키가 있는지와 끝 4자리만 본다. 값은 넣고 바꾸고 지울 뿐 내보내지 않는다.
바꾼 키는 데몬을 재기동한 뒤 적용된다 (어댑터는 시작할 때 만든다).
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from subtitle_robot.llm.catalog import PROVIDER_NAMES
from subtitle_robot.media.tmdb import TMDB_SECRET
from subtitle_robot.secret_store import SecretStore, mask
from subtitle_robot.web.context import Context

router = APIRouter(prefix="/api")

# 화면에서 다루는 키 위치 (그 밖의 위치는 거절한다: 계정·세션 키를 이 API 로 바꾸지 못하게)
SECRET_KEYS: tuple[str, ...] = (
    *(f"providers.{name}.api_key" for name in PROVIDER_NAMES),
    TMDB_SECRET,
)
# 키를 너무 길게 넣으면 실수다 (붙여넣기 오류)
MAX_SECRET_LENGTH = 4096


class SecretState(BaseModel):
    """키 하나의 상태 (값은 없다)."""

    key: str
    set: bool
    hint: str | None = None


class SecretIn(BaseModel):
    """키 하나 바꾸기. value 가 비면 지운다."""

    key: str
    value: str | None = Field(default=None, max_length=MAX_SECRET_LENGTH)


@router.get("/secrets")
def list_secrets(context: Context) -> list[SecretState]:
    """화면에서 다루는 키들의 상태."""
    store = SecretStore.for_data_dir(context.data_dir)
    return [_state(store, key) for key in SECRET_KEYS]


@router.put("/secrets")
def put_secret(body: SecretIn, context: Context) -> SecretState:
    """키 하나를 넣거나 지운다. 모르는 위치는 400."""
    if body.key not in SECRET_KEYS:
        raise HTTPException(status_code=400, detail="unknown_secret")
    store = SecretStore.for_data_dir(context.data_dir)
    value = (body.value or "").strip() or None
    store.set(body.key, value)
    return _state(store, body.key)


def _state(store: SecretStore, key: str) -> SecretState:
    value = store.get(key)
    return SecretState(key=key, set=value is not None, hint=mask(value))
