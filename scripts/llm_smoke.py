"""LLM 공급자 실측 확인 (WI-1.013).

설정의 공급자에 짧은 구조화 출력 요청을 한 번 보내고 결과를 요약한다. API 키는 출력하지 않는다.

사용:
    uv run python scripts/llm_smoke.py --data ./data   # 기본값(NIM). 키는 secrets.toml (Settings)
    uv run python scripts/llm_smoke.py --config config.toml
    uv run python scripts/llm_smoke.py --provider local --base-url http://127.0.0.1:8080/v1
    uv run python scripts/llm_smoke.py --provider claude --model <모델>   # Settings 의 Claude 키
    uv run python scripts/llm_smoke.py --provider ollama --model qwen3     # 키 없이 (§27.1)
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from pydantic import BaseModel, ValidationError

from subtitle_robot.config import ConfigError, load_config, parse_config
from subtitle_robot.llm.base import ChatMessage, ChatRequest
from subtitle_robot.llm.catalog import PROVIDER_NAMES
from subtitle_robot.llm.errors import LlmError
from subtitle_robot.llm.factory import create_adapter
from subtitle_robot.secret_store import SecretStore

SOURCE_LINES = {1: "I don't know where it came from,", 2: "but Starbuck was all freaked out."}


class OutBlock(BaseModel):
    idx: int
    ko: str


class Output(BaseModel):
    blocks: list[OutBlock]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="LLM 공급자 실측 확인")
    parser.add_argument("--config", type=Path, help="config.toml (없으면 기본값)")
    parser.add_argument(
        "--data", type=Path, default=Path("/data"), help="키가 있는 데이터 폴더 (secrets.toml)"
    )
    parser.add_argument("--provider", choices=PROVIDER_NAMES, help="llm.provider 덮어쓰기")
    parser.add_argument("--model", help="선택한 공급자의 model 덮어쓰기 (새 공급자는 필수)")
    parser.add_argument("--base-url", help="선택한 공급자의 base_url 덮어쓰기")
    args = parser.parse_args(argv)

    try:
        config = load_config(args.config)
        if args.provider or args.base_url or args.model:
            raw = config.model_dump(mode="json")
            provider = args.provider or config.llm.provider
            raw["llm"]["provider"] = provider
            if args.base_url:
                raw["providers"].setdefault(provider, {})["base_url"] = args.base_url
            if args.model:
                raw["providers"].setdefault(provider, {})["model"] = args.model
            config = parse_config(raw, source="명령줄")
        adapter = create_adapter(config, secrets=SecretStore.for_data_dir(args.data))
    except ConfigError as exc:
        print(f"설정 오류: {exc}", file=sys.stderr)
        return 2

    request = ChatRequest(
        messages=[
            ChatMessage(
                role="system",
                content=(
                    "Translate each subtitle block into natural Korean. The two blocks form one "
                    "sentence; translate it as a whole and split it back. Output JSON only."
                ),
            ),
            ChatMessage(
                role="user", content=json.dumps({"blocks": SOURCE_LINES}, ensure_ascii=False)
            ),
        ],
        output_schema=Output.model_json_schema(),
        schema_name="smoke",
        max_tokens=512,
    )
    try:
        info = adapter.describe()
        healthy = adapter.health_check()
        result = adapter.chat(request)
        parsed = Output.model_validate_json(result.json_text)
    except (LlmError, ValidationError) as exc:
        print(f"실패: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    finally:
        adapter.close()

    summary = {
        "provider": info.provider,
        "model": info.model,
        "model_label": info.model_label,
        "context_tokens": info.context_tokens,
        "slots": info.slots,
        "notes": list(info.notes),
        "health_check": healthy,
        "latency_s": round(result.latency_s, 2),
        "attempts": result.attempts,
        "prompt_tokens": result.prompt_tokens,
        "completion_tokens": result.completion_tokens,
        "reasoning_tokens": result.reasoning_tokens,
        "finish_reason": result.finish_reason,
        "idx_preserved": sorted(b.idx for b in parsed.blocks) == sorted(SOURCE_LINES),
        "blocks": {b.idx: b.ko for b in parsed.blocks},
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
