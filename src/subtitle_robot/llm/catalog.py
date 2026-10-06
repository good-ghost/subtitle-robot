"""공급자 목록과 공급자별 고정 정보 (PROJECT-PLAN §6.1, §27.1, WI-9.001).

공급자는 `llm.provider` 하나로 고르고 폴백하지 않는다 (§22). 기본 주소·키 환경 변수는 설정 모듈이
파일에 없는 값을 채울 때 쓴다.
새 공급자 5종은 모델 이름의 기본값이 없다 (Q-20, Settings 에서 정한다).
"""

from __future__ import annotations

from typing import Literal

ProviderName = Literal["nim", "local", "ollama", "openrouter", "openai", "claude", "gemini"]
PROVIDER_NAMES: tuple[ProviderName, ...] = (
    "nim", "local", "ollama", "openrouter", "openai", "claude", "gemini",
)  # fmt: skip
# 키가 없으면 요청할 수 없는 공급자 (llama-server·Ollama 는 키 없이 띄우는 것이 보통이다)
KEY_REQUIRED: frozenset[ProviderName] = frozenset(
    {"nim", "openrouter", "openai", "claude", "gemini"}
)

# 구독 계정으로도 쓸 수 있는 공급자 (공식 CLI 실행, §28.1). openai 는 Codex CLI 다
AuthMode = Literal["api_key", "subscription"]
# Gemini CLI 는 개인 계정 로그인이 2026-06-18 종료돼 뺐다. Gemini 는 API 키로 쓴다 (WI-10.009g)
SUBSCRIPTION_PROVIDERS: frozenset[ProviderName] = frozenset({"claude", "openai"})

OLLAMA_BASE_URL = "http://127.0.0.1:11434"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENAI_BASE_URL = "https://api.openai.com/v1"
ANTHROPIC_BASE_URL = "https://api.anthropic.com"
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai"
# 기본 공급자 Gemini 의 기본 모델과 분당 요청 수 (사용자 결정 2026-10-06, WI-10.009l).
# 무료 등급 Flash 한도는 모델마다 분당 10~15회·25만~100만 TPM·하루 1,500회 안팎이라 낮은 값으로 둔다
GEMINI_DEFAULT_MODEL = "gemini-3.5-flash"
GEMINI_DEFAULT_RPM = 5
# 클라우드 공급자 요청 하나의 제한 시간 (NIM 과 같은 근거: 큰 배치는 2분을 넘는다)
CLOUD_DEFAULT_TIMEOUT_S = 300.0
# Ollama 기본 컨텍스트. Ollama 자체 기본(2048~4096)은 배치가 조용히 잘릴 만큼 작다 (§27.1)
OLLAMA_DEFAULT_CONTEXT = 8192
