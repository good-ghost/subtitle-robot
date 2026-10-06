#!/usr/bin/env bash
# 녹화 정지 구간 검사 (공통 규칙: 5초 이하). 호스트에서 실행한다 (podman 필요).
# ffmpeg 는 이 프로젝트의 컨테이너 이미지에 들어 있다 (개발 컨테이너에는 두지 않는다).
# 사용: bash web/e2e/check-freeze.sh [영상 폴더, 기본 docs/e2e/movie]
set -euo pipefail

MOVIE_DIR=$(cd "${1:-$(dirname "$0")/../../docs/e2e/movie}" && pwd)
IMAGE="${E2E_FFMPEG_IMAGE:-localhost/subtitle-robot:latest}"
MAX_FREEZE_S=5
# 화면 차이 문턱 (0~1). 0.001 이면 1080p 화면에서 가상 커서(28px)만 움직이는 구간도 정지로 잡는다
# (대기열 영상에서 커서·정렬 화살표가 바뀌는 5초를 정지로 판정, 프레임으로 확인). 커서 이동을 변화로 보는 값
NOISE=0.0005

status=0
for movie in "$MOVIE_DIR"/*.webm; do
  name=$(basename "$movie")
  report=$(podman run --rm --entrypoint ffmpeg -v "$MOVIE_DIR:/v:ro" "$IMAGE" \
    -hide_banner -nostats -i "/v/$name" -vf "freezedetect=n=$NOISE:d=$MAX_FREEZE_S" -map 0:v -f null - 2>&1 \
    | grep -o 'freeze_\(start\|duration\): [0-9.]*' || true)
  if [ -n "$report" ]; then
    echo "FREEZE $name"
    echo "$report" | paste - - | sed 's/^/  /'
    status=1
  else
    echo "ok     $name"
  fi
done
exit $status
