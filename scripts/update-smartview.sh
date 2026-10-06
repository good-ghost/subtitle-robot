#!/bin/bash
# vue-smartview 배포본을 web/vendor/vue-smartview/dist 에 다시 만든다.
# 원본(VUE-SMARTVIEW)은 비공개라 이 저장소에는 화면이 쓰는 요소만 담은 부분 빌드를 둔다
# (원본의 npm run build:subset). 요소 목록은 web/src/elements.ts 의 import 다.
# 출처 커밋은 SOURCE_COMMIT 에 남긴다.
# 사용 (개발 컨테이너 안, 원본에서 npm ci 를 한 뒤):
#   scripts/update-smartview.sh <VUE-SMARTVIEW 체크아웃 경로>
set -euo pipefail
src=$(cd "${1:?VUE-SMARTVIEW 체크아웃 경로가 필요하다}" && pwd)
cd "$(dirname "$0")/.."
repo=$(pwd)
dest=web/vendor/vue-smartview
[ -f "$src/scripts/build-subset.mjs" ] || { echo "$src 에 scripts/build-subset.mjs 가 없다 (원본 WI-7.005b 이후 커밋이 필요하다)" >&2; exit 1; }
# 커밋하지 않은 변경이 있으면 SOURCE_COMMIT 과 내용이 어긋난다
if [ -n "$(git -C "$src" status --porcelain)" ]; then
    echo "원본에 커밋하지 않은 변경이 있다: 커밋한 뒤 다시 만든다" >&2
    exit 1
fi
commit=$(git -C "$src" rev-parse HEAD)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
(cd "$src" && npm run --silent build:subset -- --out "$work/dist" --elements-from "$repo/web/src/elements.ts")
rm -rf "$dest/dist"
mv "$work/dist" "$dest/dist"
printf '%s\n' "$commit" > "$dest/SOURCE_COMMIT"
echo "vue-smartview 부분 빌드 <- $commit ($(find "$dest/dist" -type f | wc -l) files)"
