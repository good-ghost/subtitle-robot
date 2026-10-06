from collections.abc import Callable, Iterator
from dataclasses import dataclass
from pathlib import Path

import pytest
from fastapi import APIRouter
from fastapi.testclient import TestClient

from subtitle_robot.config import AppConfig, WebConfig, load_config
from subtitle_robot.llm.logins import SubscriptionLogins
from subtitle_robot.watch.ledger import Ledger
from subtitle_robot.watch.queue import JobQueue
from subtitle_robot.watch.state import state_path
from subtitle_robot.secret_store import SecretStore
from subtitle_robot.web.auth import AccountStore, SessionSigner
from subtitle_robot.web.context import WebContext
from subtitle_robot.web.server import api_routers, create_app

# 관리 계정 비밀번호 (0.8.0 전 토큰 로그인 테스트의 이름을 그대로 둔다)
TOKEN = "0123456789abcdef-token"


@dataclass
class WebEnv:
    client: TestClient
    context: WebContext
    queue: JobQueue
    ledger: Ledger
    data: Path

    def login(self) -> None:
        response = self.client.post(
            "/api/session", json={"username": "admin", "password": TOKEN}
        )
        assert response.status_code == 200


def make_env(
    tmp_path: Path,
    *,
    config: AppConfig | None = None,
    routers: tuple[APIRouter, ...] | None = None,
    static: Path | None = None,
    config_path: Path | None = None,
    started_at: float = 0.0,
    request_restart: Callable[[], None] | None = None,
    account: bool = True,
    executables: dict[str, str] | None = None,
) -> WebEnv:
    if static is None:
        static = tmp_path / "static"
        static.mkdir(parents=True, exist_ok=True)
        (static / "index.html").write_text("<!doctype html><title>Subtitle Robot</title>", "utf-8")
    base = config or load_config(None)
    config = base.model_copy(update={"web": WebConfig(static_dir=str(static))})
    data = tmp_path / "data"
    # 한 번 실패하면 failed (재시도·실패 지우기 테스트)
    queue = JobQueue(state_path(data), max_attempts=1)
    ledger = Ledger(state_path(data), data, hash_bytes=64)
    accounts = AccountStore(SecretStore.for_data_dir(data))
    if account:
        accounts.create("admin", TOKEN)
    context = WebContext(
        config=config,
        queue=queue,
        ledger=ledger,
        data_dir=data,
        accounts=accounts,
        signer=SessionSigner(accounts.session_key, max_age_s=3600),
        logins=SubscriptionLogins(data, SecretStore.for_data_dir(data), executables=executables),
        failed_login_delay_s=0.2,
        config_path=config_path,
        started_at=started_at,
        request_restart=request_restart,
    )
    app = create_app(context, api_routers() if routers is None else routers)
    return WebEnv(TestClient(app), context, queue, ledger, data)


@pytest.fixture
def web(tmp_path: Path) -> Iterator[WebEnv]:
    env = make_env(tmp_path)
    yield env
    env.queue.close()
    env.ledger.close()
