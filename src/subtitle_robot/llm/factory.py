"""설정으로 공급자 어댑터 하나를 만든다 (PROJECT-PLAN §6.1, WI-1.007).

공급자는 `llm.provider` 하나로 정해지고 폴백은 없다 (§22). 바꾸려면 설정을 고치고 재기동한다.
"""

from __future__ import annotations

from pathlib import Path

import httpx
from pydantic import SecretStr

from subtitle_robot.config import AppConfig, ConfigError, ProviderConfig
from subtitle_robot.llm.anthropic import ClaudeAdapter
from subtitle_robot.llm.base import LlmAdapter
from subtitle_robot.llm.catalog import KEY_REQUIRED
from subtitle_robot.llm.claude_code import CLAUDE_TOKEN_SECRET, ClaudeCodeAdapter
from subtitle_robot.llm.cloud import PROFILES, CloudCompatAdapter
from subtitle_robot.llm.codex import CodexAdapter
from subtitle_robot.llm.limiter import Runtime
from subtitle_robot.llm.llama_server import LlamaServerAdapter
from subtitle_robot.llm.logins import IMAGE_TAGS, cli_available
from subtitle_robot.llm.nim import NimAdapter
from subtitle_robot.llm.ollama import OllamaAdapter
from subtitle_robot.llm.subscription import subscription_home
from subtitle_robot.secret_store import SecretStore


def create_adapter(
    config: AppConfig,
    *,
    secrets: SecretStore | None = None,
    data_dir: Path | None = None,
    http: httpx.Client | None = None,
    runtime: Runtime | None = None,
) -> LlmAdapter:
    """설정의 공급자 어댑터를 만든다. 네트워크 호출·CLI 실행은 하지 않는다.

    Args:
        config: 전역 설정.
        secrets: 비밀 저장소 (공급자 키·구독 토큰, §28.2). 없으면 키 없음. 환경 변수는 읽지 않는다
            (Q-24).
        data_dir: 구독 CLI 전용 폴더를 둘 데이터 폴더. 없으면 비밀 저장소 파일이 있는 폴더.
        http: 공유할 httpx 클라이언트.
        runtime: 시간 의존성.

    Raises:
        ConfigError: 공급자 설정이 없거나, 키(구독은 로그인)가 필요한데 비어 있다.
    """
    name, provider = config.active_provider()
    if provider.auth == "subscription":
        return _subscription_adapter(name, provider, secrets, data_dir, runtime)
    key_value = (secrets.provider_key(name) if secrets is not None else None) or ""
    if name in KEY_REQUIRED and not key_value:
        raise ConfigError(f"{name} 의 API 키가 없다. 웹 Settings 의 키 탭에서 넣는다")
    settings = provider.to_settings(SecretStr(key_value) if key_value else None)
    if name == "nim":
        return NimAdapter(settings, http=http, runtime=runtime)
    if name == "local":
        return LlamaServerAdapter(settings, http=http, runtime=runtime)
    if name == "ollama":
        return OllamaAdapter(settings, http=http, runtime=runtime)
    if name == "claude":
        return ClaudeAdapter(settings, http=http, runtime=runtime)
    if name in PROFILES:
        return CloudCompatAdapter(PROFILES[name], settings, http=http, runtime=runtime)
    raise ConfigError(f"모르는 공급자: {name}")


def _subscription_adapter(
    name: str,
    provider: ProviderConfig,
    secrets: SecretStore | None,
    data_dir: Path | None,
    runtime: Runtime | None,
) -> LlmAdapter:
    """구독 CLI 어댑터 (§28.1). 자격이 없으면 설정 오류: 데몬은 워커 없이 뜬다."""
    root = data_dir or (secrets.path.parent if secrets is not None and secrets.path else None)
    if root is None:
        raise ConfigError(f"{name} 구독은 데이터 폴더가 필요하다 (--data)")
    if not cli_available(name):
        tag = IMAGE_TAGS.get(name, name)  # type: ignore[call-overload]
        raise ConfigError(
            f"{name} 구독 CLI 가 이 이미지에 없다. subtitle-robot:{tag} 이미지를 쓴다 "
            "(README 이미지 태그)"
        )
    settings = provider.to_settings(None)
    home = subscription_home(root, name)
    if name == "claude":
        token = secrets.get(CLAUDE_TOKEN_SECRET) if secrets is not None else None
        if not token:
            raise ConfigError("claude 구독 토큰이 없다. 웹 Settings 의 공급자 카드에서 로그인한다")
        return ClaudeCodeAdapter(settings, home=home, token=SecretStr(token), runtime=runtime)
    if name == "openai":
        codex = CodexAdapter(settings, home=home, runtime=runtime)
        if not codex.has_credentials():
            raise ConfigError(
                "openai(Codex) 구독 로그인이 없다. 웹 Settings 의 공급자 카드에서 로그인한다"
            )
        return codex
    raise ConfigError(f"{name} 구독은 지원하지 않는다")
