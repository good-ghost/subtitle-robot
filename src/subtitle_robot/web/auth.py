"""웹 화면 인증: 관리 계정과 서명한 세션 쿠키 (PROJECT-PLAN §25.3, §28.3, REQ-047, WI-10.002).

관리 계정은 Sonarr·Radarr 처럼 처음 접속할 때 만든다 (Q-25). 계정과 세션 서명 키는 비밀 저장소
(`secrets.toml`, §28.2)에 둔다. 비밀번호는 scrypt 로 해시하고, 비밀번호를 바꾸면 서명 키도 바꿔
다른 세션을 끝낸다. 서버에 세션을 저장하지 않는다: 쿠키 값은 `발급 시각.서명`이다.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import secrets
import threading
import time
from collections.abc import Callable

from subtitle_robot.secret_store import SecretStore

logger = logging.getLogger(__name__)

SESSION_COOKIE = "subtitle_robot_session"
# LAN 에 여는 화면이라 짧은 비밀번호를 막는다
MIN_PASSWORD_LENGTH = 8
MAX_USERNAME_LENGTH = 64
# scrypt 매개변수 (OWASP 권장 최소: N=2^15, r=8, p=1 → 약 32MB)
_SCRYPT_N = 2**15
_SCRYPT_R = 8
_SCRYPT_P = 1
_SCRYPT_MAXMEM = 64 * 1024 * 1024
_SALT_BYTES = 16
_HASH_BYTES = 32
_SESSION_KEY_BYTES = 32
# 서버와 브라우저 시계가 조금 어긋나도 막 발급한 쿠키를 받는다
_CLOCK_SKEW_S = 60

ACCOUNT_USERNAME = "account.username"
ACCOUNT_PASSWORD = "account.password_hash"  # noqa: S105 — 저장소 안 위치 이름이다 (값이 아니다)
SESSION_KEY = "web.session_key"


class AccountError(ValueError):
    """계정 요청이 규칙에 맞지 않는다. code 는 화면이 문구로 바꾼다."""

    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


def hash_password(password: str) -> str:
    """scrypt 해시 문자열 `scrypt$N$r$p$솔트$해시` (base64)."""
    salt = secrets.token_bytes(_SALT_BYTES)
    digest = _scrypt(password, salt, _SCRYPT_N, _SCRYPT_R, _SCRYPT_P)
    return "$".join(
        ["scrypt", str(_SCRYPT_N), str(_SCRYPT_R), str(_SCRYPT_P), _b64(salt), _b64(digest)]
    )


def verify_password(password: str, stored: str) -> bool:
    """비밀번호가 해시와 맞으면 참 (상수 시간 비교). 형식이 틀리면 거짓."""
    parts = stored.split("$")
    if len(parts) != 6 or parts[0] != "scrypt":  # noqa: PLR2004 — 해시 문자열의 칸 수
        return False
    try:
        n, r, p = (int(value) for value in parts[1:4])
        salt, expected = base64.b64decode(parts[4]), base64.b64decode(parts[5])
    except ValueError:
        return False
    return hmac.compare_digest(_scrypt(password, salt, n, r, p), expected)


class AccountStore:
    """관리 계정 하나 (비밀 저장소의 `account`, `web.session_key`)."""

    def __init__(self, store: SecretStore) -> None:
        self._store = store
        self._lock = threading.Lock()

    def exists(self) -> bool:
        """계정이 있는지."""
        return bool(self._store.get(ACCOUNT_USERNAME) and self._store.get(ACCOUNT_PASSWORD))

    def username(self) -> str | None:
        """사용자 이름."""
        return self._store.get(ACCOUNT_USERNAME)

    def create(self, username: str, password: str) -> None:
        """처음 계정을 만든다.

        Raises:
            AccountError: `account_exists`, `invalid_username`, `password_too_short`.
        """
        with self._lock:
            if self.exists():
                raise AccountError("account_exists")
            self._save(_valid_username(username), _valid_password(password))
        logger.warning("web admin account %r created from the first-run setup", username.strip())

    def check(self, username: str, password: str) -> bool:
        """로그인 확인. 사용자 이름과 비밀번호를 모두 계산해 어느 쪽이 틀렸는지 새지 않게 한다."""
        stored_name = self._store.get(ACCOUNT_USERNAME) or ""
        stored_hash = self._store.get(ACCOUNT_PASSWORD) or ""
        name_ok = hmac.compare_digest(username.strip().encode(), stored_name.encode())
        password_ok = verify_password(password, stored_hash) if stored_hash else False
        return bool(stored_name) and name_ok and password_ok

    def change(self, current_password: str, *, username: str, new_password: str | None) -> None:
        """사용자 이름·비밀번호를 바꾸고 세션 서명 키를 새로 만든다 (다른 세션이 끝난다).

        Raises:
            AccountError: `wrong_password`, `invalid_username`, `password_too_short`.
        """
        with self._lock:
            stored_hash = self._store.get(ACCOUNT_PASSWORD) or ""
            if not stored_hash or not verify_password(current_password, stored_hash):
                raise AccountError("wrong_password")
            password = current_password if new_password is None else new_password
            self._save(_valid_username(username), _valid_password(password))
        logger.info("web admin account updated")

    def session_key(self) -> bytes:
        """세션 서명 키. 없으면 만든다."""
        value = self._store.get(SESSION_KEY)
        if value is None:
            with self._lock:
                value = self._store.get(SESSION_KEY)
                if value is None:
                    value = secrets.token_hex(_SESSION_KEY_BYTES)
                    self._store.set(SESSION_KEY, value)
        return bytes.fromhex(value)

    def _save(self, username: str, password: str) -> None:
        self._store.set(ACCOUNT_USERNAME, username)
        self._store.set(ACCOUNT_PASSWORD, hash_password(password))
        self._store.set(SESSION_KEY, secrets.token_hex(_SESSION_KEY_BYTES))


class SessionSigner:
    """세션 쿠키 값을 만들고 검사한다. 서명 키는 요청마다 읽는다 (바뀌면 이전 쿠키가 무효).

    Args:
        key: 서명 키를 돌려주는 함수 (`AccountStore.session_key`).
        max_age_s: 세션 유지 시간(초).
        clock: 현재 시각 (테스트용).
    """

    def __init__(
        self,
        key: Callable[[], bytes],
        *,
        max_age_s: float,
        clock: Callable[[], float] = time.time,
    ) -> None:
        self._key = key
        self._max_age_s = max_age_s
        self._clock = clock

    @property
    def max_age_s(self) -> float:
        """세션 유지 시간(초). 쿠키 `Max-Age` 에도 쓴다."""
        return self._max_age_s

    def issue(self) -> str:
        """지금 발급한 세션 값."""
        issued = str(int(self._clock()))
        return f"{issued}.{self._sign(issued)}"

    def verify(self, value: str | None) -> bool:
        """서명이 맞고 만료되지 않았으면 참."""
        if not value or value.count(".") != 1:
            return False
        issued, signature = value.split(".")
        if not issued.isdigit() or not hmac.compare_digest(signature, self._sign(issued)):
            return False
        age = self._clock() - int(issued)
        return -_CLOCK_SKEW_S <= age < self._max_age_s

    def _sign(self, issued: str) -> str:
        return hmac.new(self._key(), issued.encode(), hashlib.sha256).hexdigest()


def _valid_username(username: str) -> str:
    name = username.strip()
    if not name or len(name) > MAX_USERNAME_LENGTH:
        raise AccountError("invalid_username")
    return name


def _valid_password(password: str) -> str:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise AccountError("password_too_short")
    return password


def _scrypt(password: str, salt: bytes, n: int, r: int, p: int) -> bytes:
    return hashlib.scrypt(
        password.encode(), salt=salt, n=n, r=r, p=p, maxmem=_SCRYPT_MAXMEM, dklen=_HASH_BYTES
    )


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")
