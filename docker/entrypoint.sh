#!/bin/sh
# 컨테이너 진입점 (PROJECT-PLAN §21.9).
# root 로 시작하면 /data 소유권을 PUID:PGID 로 맞춘다 (미디어 볼륨은 건드리지 않는다).
# 실행은 subtitle-robot 래퍼가 그 사용자로 낮춰서 한다. 처음부터 비root(--user, --userns=keep-id)면 그대로.
set -eu

if [ "$(id -u)" = "0" ] && [ "${1:-}" != "health" ]; then
    case "${PUID:-}" in ''|*[!0-9]*) echo "PUID 는 숫자여야 한다: ${PUID:-}" >&2; exit 2 ;; esac
    case "${PGID:-}" in ''|*[!0-9]*) echo "PGID 는 숫자여야 한다: ${PGID:-}" >&2; exit 2 ;; esac
    data="${SUBTITLE_ROBOT_DATA:-/data}"
    mkdir -p "$data"
    chown -R "$PUID:$PGID" "$data"
fi

exec /usr/local/bin/subtitle-robot "$@"
