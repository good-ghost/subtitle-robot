"""THIRD-PARTY-NOTICES.md 를 만든다: 배포물에 들어가는 제3자 소프트웨어의 라이선스 고지.

입력 (모두 실제 설치본에서 읽는다):
- Python: `uv export --no-dev` 의 런타임 패키지와 지금 환경(.venv)의 라이선스 파일
- 웹 번들: `npm ls --omit=dev` 의 패키지(web/ 와 vue-smartview 원본 체크아웃)와
  node_modules 의 라이선스 파일
- 이미지: `apk list --installed` 출력
  (호스트에서 `podman run --rm --entrypoint apk <이미지> list --installed`)

vue-smartview 원본은 비공개라 공개 저장소만으로는 이 파일을 다시 만들 수 없다.
관리자가 원본 체크아웃(`npm ci --omit=dev` 한 것)을 주어 실행한다. npm 은 출력에서 UUID 모양
문자열을 가리므로 그런 이름이 든 경로(임시 폴더 등)에 체크아웃을 두지 않는다.

사용 (개발 컨테이너, 저장소 루트):
    uv run python scripts/gen_third_party_notices.py --smartview <원본 체크아웃> --apk-list <파일>
"""

from __future__ import annotations

import argparse
import importlib.metadata as metadata
import json
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

OUTPUT = Path("THIRD-PARTY-NOTICES.md")
LICENSE_FILE_RE = re.compile(r"^(licen[cs]e|copying|notice)([.-].*)?$", re.IGNORECASE)
APK_LINE_RE = re.compile(r"^(?P<pkg>\S+) \S+ \{(?P<origin>[^}]*)\} \((?P<license>[^)]*)\)")
APK_VERSION_RE = re.compile(r"^(?P<name>.+?)-(?P<version>\d[^-]*-r\d+)$")
# 이미지에는 있지만 apk 패키지가 아닌 것 (공식 Python 이미지가 /usr/local 에 설치한다)
PYTHON_RUNTIME = ("Python", "3.13 (python:3.13-alpine)", "PSF-2.0", "https://www.python.org/")


@dataclass
class Component:
    """제3자 구성 요소 하나."""

    name: str
    version: str
    license: str
    url: str = ""
    texts: list[str] = field(default_factory=list)


def _run(command: list[str], cwd: Path | None = None) -> str:
    result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, check=True)  # noqa: S603
    return result.stdout


def python_components() -> list[Component]:
    """런타임 Python 패키지 (개발 도구 제외)."""
    exported = _run(["uv", "export", "--no-dev", "--no-hashes", "--no-emit-project"])
    names = sorted(
        {
            re.split(r"[=<>; ]", line, maxsplit=1)[0].strip()
            for line in exported.splitlines()
            if line and not line.startswith(("#", " ", "-"))
        },
        key=str.lower,
    )
    components: list[Component] = []
    for name in names:
        dist = metadata.distribution(name)
        meta = dist.metadata
        license_name = meta.get("License-Expression") or _classifier_license(meta) or ""
        texts = [
            (Path(str(dist.locate_file(item)))).read_text("utf-8", errors="replace")
            for item in dist.files or []
            if LICENSE_FILE_RE.match(Path(str(item)).name) and "dist-info" in str(item)
        ]
        url = meta.get("Home-page") or _project_url(meta) or f"https://pypi.org/project/{name}/"
        components.append(Component(meta["Name"], dist.version, license_name, url, texts))
    return components


def _classifier_license(meta: metadata.PackageMetadata) -> str:
    for classifier in meta.get_all("Classifier") or []:
        if classifier.startswith("License :: OSI Approved :: "):
            return str(classifier).removeprefix("License :: OSI Approved :: ")
    first = str(meta.get("License") or "").splitlines()
    return first[0] if first and len(first[0]) < 60 else ""


def _project_url(meta: metadata.PackageMetadata) -> str:
    for entry in meta.get_all("Project-URL") or []:
        label, _, url = entry.partition(",")
        if label.strip().lower() in {"source", "homepage", "repository", "source code"}:
            return str(url).strip()
    return ""


def npm_components(root: Path) -> list[Component]:
    """`npm ls --omit=dev --all` 의 패키지와 라이선스 파일."""
    raw = subprocess.run(
        ["npm", "ls", "--omit=dev", "--all", "--parseable", "--long"],  # noqa: S607
        cwd=root,
        capture_output=True,
        text=True,
        check=False,
    ).stdout
    components: list[Component] = []
    for line in raw.splitlines()[1:]:
        directory = Path(line.split(":", 1)[0])
        manifest = json.loads((directory / "package.json").read_text("utf-8"))
        license_name = manifest.get("license") or ""
        if isinstance(license_name, dict):
            license_name = license_name.get("type", "")
        repository = manifest.get("repository") or ""
        url = repository.get("url", "") if isinstance(repository, dict) else repository
        texts = [
            item.read_text("utf-8", errors="replace")
            for item in sorted(directory.iterdir())
            if item.is_file() and LICENSE_FILE_RE.match(item.name)
        ]
        components.append(
            Component(manifest["name"], manifest["version"], license_name, url, texts)
        )
    return components


def apk_packages(path: Path) -> list[tuple[str, str, str, str]]:
    """`apk list --installed` 출력 → (이름, 버전, 라이선스, 원본 패키지)."""
    rows: list[tuple[str, str, str, str]] = []
    for line in path.read_text("utf-8").splitlines():
        match = APK_LINE_RE.match(line)
        if not match:
            continue
        version = APK_VERSION_RE.match(match["pkg"])
        name, ver = (version["name"], version["version"]) if version else (match["pkg"], "")
        rows.append((name, ver, match["license"], match["origin"]))
    return sorted(rows)


def _unique(components: list[Component]) -> list[Component]:
    seen: dict[tuple[str, str], Component] = {}
    for component in components:
        seen.setdefault((component.name, component.version), component)
    return sorted(seen.values(), key=lambda c: c.name.lower())


def _table(components: list[Component]) -> list[str]:
    lines = ["| Package | Version | License |", "|---|---|---|"]
    lines += [f"| {c.name} | {c.version} | {c.license or 'see text'} |" for c in components]
    return lines


def _texts(components: list[Component]) -> list[str]:
    """같은 본문은 한 번만 싣고, 그 본문을 쓰는 패키지를 모두 적는다."""
    groups: dict[str, list[Component]] = {}
    missing: list[Component] = []
    for component in components:
        if not component.texts:
            missing.append(component)
            continue
        groups.setdefault("\n\n".join(t.strip() for t in component.texts), []).append(component)
    lines: list[str] = []
    for text, members in sorted(groups.items(), key=lambda item: item[1][0].name.lower()):
        names = ", ".join(f"{c.name} {c.version}" for c in members)
        lines += [f"### {names}", "", "```text", text.replace("```", "'''"), "```", ""]
    if missing:
        lines += [
            "### Packages without a license file in their distribution",
            "",
            "These packages declare the license below in their metadata but ship no license file.",
            "",
            *[f"- {c.name} {c.version}: {c.license} ({c.url})" for c in missing],
            "",
        ]
    return lines


def render(
    python: list[Component], web: list[Component], apk: list[tuple[str, str, str, str]]
) -> str:
    """고지 문서 본문."""
    lines = [
        "# Third-party notices",
        "",
        "Subtitle Robot is licensed under the MIT License (see `LICENSE`). It uses and "
        "redistributes the third-party software listed here, each under its own license.",
        "",
        "This file is generated by `scripts/gen_third_party_notices.py`; do not edit it by hand.",
        "",
        "## 1. Python packages",
        "",
        "Installed by `uv sync` and included in every container image.",
        "",
        *_table(python),
        "",
        "## 2. Web console bundle",
        "",
        "Bundled into `web/vendor/vue-smartview/dist` and the built web console (`web/dist`). "
        "vue-smartview itself is part of this project (MIT).",
        "",
        *_table(web),
        "",
        "## 3. Container images",
        "",
        "### All tags",
        "",
        f"- {PYTHON_RUNTIME[0]} {PYTHON_RUNTIME[1]}: {PYTHON_RUNTIME[2]} ({PYTHON_RUNTIME[3]})",
        "- Alpine Linux packages, listed below. Some are licensed under the GNU GPL or LGPL "
        "(for example mkvtoolnix, ffmpeg, x264, x265). Their complete corresponding source code "
        "for the listed versions is published by the Alpine Linux project "
        "(https://gitlab.alpinelinux.org/alpine/aports and https://dl-cdn.alpinelinux.org/"
        "alpine/). For at least three years after we distribute an image, the source for any "
        "GPL or LGPL package in it is also available on request from the maintainer of this "
        "project.",
        "",
        "| Package | Version | License | Origin |",
        "|---|---|---|---|",
        *[f"| {n} | {v} | {lic} | {o} |" for n, v, lic, o in apk],
        "",
        "### `codex` tag",
        "",
        "- Codex CLI (`@openai/codex`): Apache-2.0 (https://github.com/openai/codex)",
        "- Node.js: MIT and other permissive licenses (https://github.com/nodejs/node)",
        "",
        "### `claude` tag",
        "",
        "- Claude Code (`@anthropic-ai/claude-code`): proprietary, (c) Anthropic PBC, all rights "
        "reserved. It is installed from npm when the image is built and is not covered by this "
        "project's license. Its use is subject to Anthropic's terms "
        "(https://code.claude.com/docs/en/legal-and-compliance).",
        "",
        "## 4. License texts",
        "",
        *_texts(python + web),
    ]
    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    """고지 문서를 만든다."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smartview", type=Path, required=True, help="vue-smartview 원본 체크아웃")
    parser.add_argument("--apk-list", type=Path, required=True, help="apk list --installed 출력")
    parser.add_argument("--web", type=Path, default=Path("web"))
    args = parser.parse_args()
    web = _unique(npm_components(args.web) + npm_components(args.smartview))
    text = render(_unique(python_components()), web, apk_packages(args.apk_list))
    OUTPUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUTPUT} ({len(text.splitlines())} lines)")


if __name__ == "__main__":
    main()
