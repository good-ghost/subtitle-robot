"""전역 설정(config.toml) → 번역 실행 옵션 (CLI·감시 데몬 공용)."""

from __future__ import annotations

from typing import Any

from subtitle_robot.checkpoint import ResumePolicy
from subtitle_robot.config import AppConfig
from subtitle_robot.io.langdetect import SourceOption
from subtitle_robot.pipeline.runner import RunOptions
from subtitle_robot.pipeline.validator import RetryLimits


def base_run_options(
    config: AppConfig,
    *,
    src: SourceOption = "auto",
    encoding: str | None = None,
    resume: ResumePolicy = "ask",
    extra_params: dict[str, Any] | None = None,
) -> RunOptions:
    """공급자·재시도 설정을 담은 실행 옵션.

    extra_params 는 fingerprint 에 들어간다 (§13).
    미디어 소스 트랙 선택(§21.5 6번)이 여기에 들어간다.
    """
    _, provider = config.active_provider()
    params: dict[str, Any] = {"temperature": provider.temperature, **(extra_params or {})}
    return RunOptions(
        src=src,
        target=config.translation.target_language,
        encoding=encoding,
        resume=resume,
        retry=RetryLimits(
            unit_retries=config.retry.max_retries_unit, batch_retries=config.retry.max_retries_batch
        ),
        max_output_tokens=provider.max_output_tokens,
        params=params,
    )
