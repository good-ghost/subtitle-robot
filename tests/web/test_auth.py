"""관리 계정·세션 (PROJECT-PLAN §28.3, WI-10.002)."""

from pathlib import Path

import pytest

from subtitle_robot.secret_store import SecretStore
from subtitle_robot.web.auth import (
    ACCOUNT_PASSWORD,
    AccountError,
    AccountStore,
    SessionSigner,
    hash_password,
    verify_password,
)

PASSWORD = "correct horse battery"


class Clock:
    def __init__(self) -> None:
        self.now = 1_000_000.0

    def __call__(self) -> float:
        return self.now


def test_password_hash_roundtrip() -> None:
    stored = hash_password(PASSWORD)

    assert stored.startswith("scrypt$32768$8$1$")
    assert PASSWORD not in stored
    assert verify_password(PASSWORD, stored)
    assert not verify_password(PASSWORD + "x", stored)
    assert hash_password(PASSWORD) != stored  # 솔트가 다르다
    assert not verify_password(PASSWORD, "plain")
    assert not verify_password(PASSWORD, "scrypt$x$8$1$AA==$AA==")


def test_account_create_check_and_rules(tmp_path: Path) -> None:
    store = SecretStore.for_data_dir(tmp_path)
    accounts = AccountStore(store)
    assert not accounts.exists()

    with pytest.raises(AccountError, match="password_too_short"):
        accounts.create("admin", "short")
    with pytest.raises(AccountError, match="invalid_username"):
        accounts.create("   ", PASSWORD)
    accounts.create(" admin ", PASSWORD)

    assert accounts.exists()
    assert accounts.username() == "admin"
    assert PASSWORD not in (tmp_path / "secrets.toml").read_text(encoding="utf-8")
    assert store.get(ACCOUNT_PASSWORD) is not None
    assert accounts.check("admin", PASSWORD)
    assert not accounts.check("admin", "wrong-password")
    assert not accounts.check("root", PASSWORD)
    with pytest.raises(AccountError, match="account_exists"):
        accounts.create("other", PASSWORD)


def test_change_rotates_session_key(tmp_path: Path) -> None:
    accounts = AccountStore(SecretStore.for_data_dir(tmp_path))
    accounts.create("admin", PASSWORD)
    clock = Clock()
    signer = SessionSigner(accounts.session_key, max_age_s=3600, clock=clock)
    cookie = signer.issue()
    assert signer.verify(cookie)

    with pytest.raises(AccountError, match="wrong_password"):
        accounts.change("nope-nope", username="admin", new_password="new password 1")
    accounts.change(PASSWORD, username="root", new_password="new password 1")

    assert not signer.verify(cookie)  # 다른 세션은 끝난다
    assert accounts.check("root", "new password 1")
    accounts.change("new password 1", username="boss", new_password=None)
    assert accounts.check("boss", "new password 1")  # 비밀번호는 그대로


def test_session_expiry_and_tamper() -> None:
    clock = Clock()
    key = b"k" * 32
    signer = SessionSigner(lambda: key, max_age_s=60, clock=clock)
    value = signer.issue()

    assert signer.verify(value)
    assert not signer.verify(value + "0")
    assert not signer.verify("abc.def")
    assert not signer.verify(None)
    assert not SessionSigner(lambda: b"x" * 32, max_age_s=60, clock=clock).verify(value)
    clock.now += 61
    assert not signer.verify(value)
