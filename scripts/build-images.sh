#!/bin/bash
# 컨테이너 이미지 태그별 빌드 (PROJECT-PLAN §28.1, WI-10.009d).
#   latest: Dockerfile         — 구독 CLI 없음 (API 키·NIM·llama-server·Ollama)
#   claude: Dockerfile.claude  — Claude Code (Claude 구독)
#   codex:  Dockerfile.codex   — Codex (ChatGPT 구독)
#   ocr:    Dockerfile.ocr     — 이미지 자막 OCR 용 Tesseract (성능 좋은 PC 용, 이름을 줄 때만 빌드)
# Gemini 는 AI Studio API 키로 latest 에서 쓴다 (개인 계정 Gemini CLI 로그인 종료, WI-10.009f)
# CLI·ocr 태그는 latest 위에 층 하나만 쌓으므로, 이 태그를 빌드할 때는 latest 를 먼저 빌드한다 (코드가 바뀌었으면 반영).
# 사용: scripts/build-images.sh [latest|claude|codex|ocr ...]   (인자가 없으면 latest·claude·codex)
#   IMAGE_NAME(기본 subtitle-robot), CONTAINER_ENGINE(기본 podman)
#   추가 빌드 인자는 BUILD_ARGS 로 넘긴다 (예: BUILD_ARGS="--build-arg CLAUDE_CODE_VERSION=2.1.289",
#   BUILD_ARGS="--build-arg OCR_LANGS=eng,jpn,kor,fra")
set -euo pipefail
cd "$(dirname "$0")/.."
name=${IMAGE_NAME:-subtitle-robot}
engine=${CONTAINER_ENGINE:-podman}
requested=("$@")
[ ${#requested[@]} -eq 0 ] && requested=(latest claude codex)

# latest 를 맨 앞에 한 번만 둔다 (CLI·ocr 태그가 있으면 꼭 넣는다)
tags=()
needs_base=false
for tag in "${requested[@]}"; do
    case "$tag" in
        latest) ;;
        claude | codex | ocr) needs_base=true ;;
        *) echo "모르는 태그: $tag (latest|claude|codex|ocr)" >&2; exit 2 ;;
    esac
done
for tag in "${requested[@]}"; do
    [ "$tag" = latest ] && needs_base=true
done
$needs_base && tags+=(latest)
for tag in "${requested[@]}"; do
    [ "$tag" != latest ] && tags+=("$tag")
done

for tag in "${tags[@]}"; do
    if [ "$tag" = latest ]; then
        file=Dockerfile
        base=()
    else
        file=Dockerfile.$tag
        base=(--build-arg "BASE_IMAGE=$name:latest")
    fi
    echo "== $name:$tag ($file)"
    # Podman 은 OCI 형식에서 HEALTHCHECK 를 무시하므로 docker 형식으로 빌드한다 (Docker 는 늘 docker 형식이고 이 옵션이 없다)
    format=()
    [ "$(basename "$engine")" = podman ] && format=(--format docker)
    # shellcheck disable=SC2086 # BUILD_ARGS 는 여러 인자로 나눈다
    "$engine" build "${format[@]}" -f "$file" "${base[@]}" ${BUILD_ARGS:-} -t "$name:$tag" .
done
"$engine" images --filter "reference=$name" --format '{{.Repository}}:{{.Tag}} {{.Size}}'
