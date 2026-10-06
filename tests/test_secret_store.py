"""비밀 저장소 (PROJECT-PLAN §28.2, WI-10.001)."""

import stat
from pathlib import Path

import pytest

from subtitle_robot.secret_store import SecretStore, SecretStoreError, mask


def test_set_get_and_file_mode(tmp_path: Path) -> None:
    store = SecretStore.for_data_dir(tmp_path)

    assert store.get("providers.claude.api_key") is None
    store.set("providers.claude.api_key", "sk-ant-secret-1234")
    store.set("tmdb.api_key", "tmdb-key-0000000")

    path = tmp_path / "secrets.toml"
    assert stat.S_IMODE(path.stat().st_mode) == 0o600
    reread = SecretStore.for_data_dir(tmp_path)
    assert reread.provider_key("claude") == "sk-ant-secret-1234"
    assert reread.get("tmdb.api_key") == "tmdb-key-0000000"

    store.set("providers.claude.api_key", None)
    assert reread.provider_key("claude") is None
    assert "providers" not in path.read_text(encoding="utf-8")  # 빈 표는 지운다
    store.set("tmdb.api_key", "")
    assert reread.get("tmdb.api_key") is None


def test_broken_file_error_has_no_secret(tmp_path: Path) -> None:
    path = tmp_path / "secrets.toml"
    path.write_text('[tmdb]\napi_key = "very-secret-value\n', encoding="utf-8")

    with pytest.raises(SecretStoreError) as error:
        SecretStore(path).get("tmdb.api_key")
    assert "very-secret-value" not in str(error.value)
    assert error.value.__cause__ is None


def test_in_memory_and_mask() -> None:
    store = SecretStore.in_memory({"providers": {"nim": {"api_key": "nvapi-abcdef123456"}}})

    assert store.provider_key("nim") == "nvapi-abcdef123456"
    assert store.path is None
    assert mask("nvapi-abcdef123456") == "…3456"
    assert mask("short") == "…"
    assert mask(None) is None
