#!/usr/bin/env bash
# E2E 용 감시 데몬 (PROJECT-PLAN §25.7). 실행마다 새 데이터 폴더·설정·관리 계정·샘플 데이터로 띄운다.
# E2E_FIRST_RUN=1 이면 관리 계정을 만들지 않는다 (처음 설정 화면, §28.3). 공급자 키는 넣지 않는다:
# 키가 없으면 데몬은 웹만 띄우고 번역 워커를 시작하지 않는다.
# Playwright webServer 가 부른다 (web/ 에서, 개발 컨테이너 안). 화면은 web/dist 를 쓰므로 먼저 빌드한다.
set -euo pipefail

WEB_DIR=$(cd "$(dirname "$0")/../.." && pwd)
REPO_DIR=$(dirname "$WEB_DIR")
ROOT="$WEB_DIR/test-results/e2e-daemon"
PORT="${E2E_PORT:-18190}"

rm -rf "$ROOT"
mkdir -p "$ROOT"/{data,config,media/movies/Collection,media/tv}
# 관리 계정 admin 의 비밀번호 (테스트가 이 파일을 읽어 로그인한다)
token=$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')
printf '%s' "$token" > "$ROOT/token"

cat > "$ROOT/config/config.toml" <<TOML
# E2E 용 설정 (e2e/daemon/run.sh 가 만든다)
[watch]
# 녹화 중에 감시가 끼어들지 않게 시작 스캔을 끈다. 동영상은 화면에서 등록한다
scan_existing = false
stable_seconds = 5
# 개발 호스트의 inotify 한도가 차 있을 수 있다
polling = true

[[watch.paths]]
path = "$ROOT/media/movies"
kind = "movie"

[[watch.paths]]
path = "$ROOT/media/tv"
kind = "series"

[web]
host = "127.0.0.1"
port = $PORT
static_dir = "$WEB_DIR/dist"
TOML

cd "$REPO_DIR"
uv run python "$WEB_DIR/e2e/daemon/seed.py" "$ROOT"
if [ "${E2E_FIRST_RUN:-0}" != "1" ]; then
  uv run python "$WEB_DIR/e2e/daemon/seed.py" "$ROOT" --account
fi

# 화면의 적용(재기동)은 데몬을 종료 코드 4로 끝낸다. 컨테이너 재시작 정책 대신 여기서 다시 띄운다
while true; do
  set +e
  uv run subtitle-robot --config "$ROOT/config/config.toml" --data "$ROOT/data" watch
  code=$?
  set -e
  [ "$code" -eq 4 ] || exit "$code"
done
