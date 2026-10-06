from pathlib import Path

import pytest

from subtitle_robot.config import ConfigError, apply_timezone, load_config, parse_config
from subtitle_robot.llm.factory import create_adapter
from subtitle_robot.llm.llama_server import LlamaServerAdapter
from subtitle_robot.llm.nim import NimAdapter
from subtitle_robot.secret_store import SecretStore

EXAMPLE = Path(__file__).parent.parent / "examples" / "config.example.toml"
THINKING_OFF = {"chat_template_kwargs": {"enable_thinking": False}}


def _write(tmp_path: Path, text: str) -> Path:
    path = tmp_path / "config.toml"
    path.write_text(text, encoding="utf-8")
    return path


def test_example_file_loads_with_plan_values() -> None:
    config = load_config(EXAMPLE)
    name, nim = config.active_provider()

    assert name == "nim"
    assert nim.model == "deepseek-ai/deepseek-v4.1-flash"
    assert (nim.rpm, nim.timeout, nim.response_format) == (30, 300, "json_schema")
    assert nim.extra_body == THINKING_OFF
    local = config.providers["local"]
    assert (local.concurrency, local.timeout, local.rpm) == ("auto", 600, 0)
    assert config.retry.max_retries_unit == 2
    assert config.watch.stable_seconds == 60
    assert [(p.path, p.kind) for p in config.watch.paths] == [
        ("/media/movies", "movie"),
        ("/media/tv", "series"),
    ]
    assert (config.media.series_window, config.sidecar.rename_style) == (600, "orig")
    assert (config.ledger.hash_bytes, config.queue.max_attempts) == (4194304, 5)
    assert config.web.port == 8949


def test_defaults_without_file_select_nim() -> None:
    config = load_config(None)
    name, nim = config.active_provider()

    assert name == "nim"
    assert nim.base_url == "https://integrate.api.nvidia.com/v1"
    assert nim.api_key_env is None  # 예시 설정은 키 환경 변수를 쓰지 않는다 (§28.2)
    assert nim.extra_body == THINKING_OFF
    assert config.web.port == 8949  # 웹 화면 기본 포트 (WI-10.009b)


def test_partial_provider_section_keeps_defaults(tmp_path: Path) -> None:
    config = load_config(
        _write(
            tmp_path,
            '[llm]\nprovider = "local"\n[providers.local]\nbase_url = "http://127.0.0.1:8080/v1"\n',
        )
    )
    name, local = config.active_provider()

    assert name == "local"
    assert local.model == "Qwen3.8-27B-UD-Q4_K_XL"
    assert (local.concurrency, local.timeout) == ("auto", 600)
    assert local.extra_body == THINKING_OFF


def test_invalid_value_reports_location(tmp_path: Path) -> None:
    with pytest.raises(ConfigError, match=r"providers\.nim\.rpm"):
        load_config(_write(tmp_path, "[providers.nim]\nrpm = -1\n"))


def test_unknown_key_is_rejected(tmp_path: Path) -> None:
    with pytest.raises(ConfigError, match=r"providers\.nim\.timout"):
        load_config(_write(tmp_path, "[providers.nim]\ntimout = 30\n"))


def test_unknown_provider_name_is_rejected() -> None:
    with pytest.raises(ConfigError, match=r"llm\.provider"):
        parse_config({"llm": {"provider": "mistral"}}, source="test")


def test_toml_syntax_error(tmp_path: Path) -> None:
    with pytest.raises(ConfigError, match="TOML 문법 오류"):
        load_config(_write(tmp_path, "[llm\nprovider = nim\n"))


def test_missing_file(tmp_path: Path) -> None:
    with pytest.raises(ConfigError, match="설정 파일이 없다"):
        load_config(tmp_path / "nope.toml")


def test_local_without_section_is_error(tmp_path: Path) -> None:
    config = load_config(_write(tmp_path, '[llm]\nprovider = "local"\n'))

    with pytest.raises(ConfigError, match=r"\[providers\.local\]"):
        config.active_provider()


# ---------------------------------------------------------------- factory


def test_factory_creates_nim_with_key_from_store(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", "nvapi-from-env")
    adapter = create_adapter(
        load_config(EXAMPLE),
        secrets=SecretStore.in_memory({"providers": {"nim": {"api_key": "nvapi-from-store"}}}),
    )

    assert isinstance(adapter, NimAdapter)
    assert adapter.describe().model == "deepseek-ai/deepseek-v4.1-flash"
    key = adapter._client.settings.api_key
    assert key is not None
    assert key.get_secret_value() == "nvapi-from-store"  # 환경 변수는 읽지 않는다 (Q-24)
    assert "nvapi-from-store" not in repr(adapter._client.settings)
    adapter.close()


def test_factory_requires_nim_key() -> None:
    with pytest.raises(ConfigError, match="Settings"):
        create_adapter(load_config(EXAMPLE), secrets=SecretStore.in_memory())


def test_factory_creates_local_without_key(tmp_path: Path) -> None:
    config = load_config(
        _write(
            tmp_path,
            '[llm]\nprovider = "local"\n[providers.local]\nbase_url = "http://h:8080/v1"\n',
        )
    )

    adapter = create_adapter(config, secrets=SecretStore.in_memory())

    assert isinstance(adapter, LlamaServerAdapter)
    assert adapter.root_url == "http://h:8080"
    adapter.close()


def test_pass1_model_override() -> None:
    _, nim = load_config(EXAMPLE).active_provider()

    assert nim.to_settings(None, model="other/model").model == "other/model"


def test_translation_target_language() -> None:
    assert parse_config({}, source="t").translation.target_language == "ko"
    config = parse_config({"translation": {"target_language": "fr"}}, source="t")
    assert config.translation.target_language == "fr"
    with pytest.raises(ConfigError, match="639-1"):
        parse_config({"translation": {"target_language": "xx"}}, source="t")
    with pytest.raises(ConfigError, match="639-1"):
        parse_config({"translation": {"target_language": "fre"}}, source="t")


def test_new_providers_fill_defaults_and_need_a_model() -> None:
    """새 공급자 5종: 주소·키 환경 변수는 기본값, 모델은 설정에서 정한다 (§27.1, Q-20)."""
    config = parse_config({"llm": {"provider": "claude"}}, source="t")
    claude = config.providers["claude"]
    assert (claude.base_url, claude.api_key_env, claude.timeout) == (
        "https://api.anthropic.com",
        None,
        300.0,
    )
    with pytest.raises(ConfigError, match=r"providers\.claude\.model"):
        config.active_provider()

    config = parse_config(
        {"llm": {"provider": "openai"}, "providers": {"openai": {"model": "m"}}}, source="t"
    )
    name, openai = config.active_provider()
    assert (name, openai.temperature, openai.base_url) == (
        "openai",
        None,
        "https://api.openai.com/v1",
    )
    assert openai.to_settings(None).temperature is None
    ollama = parse_config({"providers": {"ollama": {"model": "qwen3"}}}, source="t").providers[
        "ollama"
    ]
    assert (ollama.base_url, ollama.context_tokens) == ("http://127.0.0.1:11434", 8192)
    assert ollama.to_settings(None).context_tokens == 8192
    for name in ("openrouter", "gemini"):
        provider = parse_config({"providers": {name: {"model": "m"}}}, source="t").providers[name]
        assert provider.base_url.startswith("https://")


def test_existing_providers_unchanged() -> None:
    nim = parse_config({}, source="t").providers["nim"]
    assert (nim.model, nim.temperature, nim.context_tokens) == (
        "deepseek-ai/deepseek-v4.1-flash",
        0.2,
        None,
    )


def test_factory_requires_keys_for_cloud_providers() -> None:
    config = parse_config(
        {"llm": {"provider": "claude"}, "providers": {"claude": {"model": "m"}}}, source="t"
    )
    with pytest.raises(ConfigError, match="claude 의 API 키"):
        create_adapter(config, secrets=SecretStore.in_memory())
    ollama = parse_config(
        {"llm": {"provider": "ollama"}, "providers": {"ollama": {"model": "m"}}}, source="t"
    )
    ollama.active_provider()  # 키 없이 쓸 수 있다 (어댑터는 WI-9.004)


def test_system_timezone(monkeypatch: pytest.MonkeyPatch) -> None:
    """시간대 (§28.4): IANA 이름만 받고, 적용하면 지역 시각이 바뀐다."""
    import time as time_module

    assert parse_config({}, source="t").system.timezone == ""
    with pytest.raises(ConfigError, match="시간대"):
        parse_config({"system": {"timezone": "Mars/Base"}}, source="t")
    monkeypatch.setenv("TZ", "UTC")
    time_module.tzset()
    try:
        apply_timezone(parse_config({"system": {"timezone": "Asia/Seoul"}}, source="t"))
        assert time_module.localtime(0).tm_hour == 9
        apply_timezone(parse_config({}, source="t"))  # 비우면 그대로
        assert time_module.localtime(0).tm_hour == 9
    finally:
        monkeypatch.setenv("TZ", "UTC")
        time_module.tzset()
