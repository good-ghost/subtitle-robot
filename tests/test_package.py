import tomllib
from pathlib import Path

import subtitle_robot

PYPROJECT = Path(__file__).parent.parent / "pyproject.toml"


def test_package_exposes_version() -> None:
    project = tomllib.loads(PYPROJECT.read_text(encoding="utf-8"))["project"]

    assert subtitle_robot.__version__ == project["version"]
