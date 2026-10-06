# Subtitle Robot (subtitle-robot) 감시 데몬 이미지 (PROJECT-PLAN §21.9, WI-5.009) — 태그 latest (구독 CLI 없음)
# 구독 CLI 를 넣은 태그는 이 이미지 위에 쌓는다: Dockerfile.claude·Dockerfile.codex (WI-10.009d)
# 빌드: podman build --format docker -t subtitle-robot:latest .
#   (Podman 은 OCI 형식에서 HEALTHCHECK 를 무시하므로 docker 형식으로 빌드한다)

# 기반: Alpine (musl). Alpine 저장소의 Python 은 3.13 이 아닐 수 있어 Python 3.13 이 든 공식 이미지를 쓴다.
# 빌드·실행 단계가 같은 이미지여야 .venv 의 Python 경로(/usr/local/bin/python3)가 맞는다.
# 컴파일 의존성(pydantic-core·pyyaml·charset-normalizer)은 musllinux 휠이 있어 소스 빌드가 없다.
ARG PYTHON_IMAGE=python:3.13-alpine3.24

# ---- 빌드: uv 로 의존성과 패키지를 .venv 에 설치 (편집 모드 아님)
FROM ${PYTHON_IMAGE} AS build
ENV UV_PYTHON_DOWNLOADS=never \
    UV_PYTHON=/usr/local/bin/python3 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1
COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock README.md LICENSE ./
RUN uv sync --frozen --no-dev --no-install-project
COPY src ./src
RUN uv sync --frozen --no-dev --no-editable

# ---- 웹 화면: web/ 를 Vite 로 빌드 (PROJECT-PLAN §25.6). vue-smartview 배포본(web/vendor/vue-smartview/dist)을 번들에 넣는다
# 결과는 정적 파일이라 실행 이미지와 libc 가 같을 필요가 없다. npm 잠금 파일의 네이티브 빌드 도구(glibc)를 그대로 쓴다
FROM node:22-slim AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
# 배포본이 빠진 채 빌드하면 화면 없이 끝나므로 여기서 멈춘다 (scripts/update-smartview.sh)
RUN test -f vendor/vue-smartview/dist/vue-smartview.js \
    || { echo 'web/vendor/vue-smartview/dist 가 없다: scripts/update-smartview.sh' >&2; exit 1; }
RUN npm run build

# ---- 실행: python3 + mkvtoolnix(mkvmerge·mkvextract) + ffmpeg(ffprobe)
#   setpriv: PUID/PGID 로 낮춰 실행 (docker/subtitle-robot), util-linux-misc: ionice (검사·추출 낮은 우선순위),
#   tzdata: TZ 환경 변수 (로그·queue list 시각)
FROM ${PYTHON_IMAGE}
ENV PATH=/usr/local/bin:/app/.venv/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    SUBTITLE_ROBOT_DATA=/data \
    PUID=1000 \
    PGID=1000
RUN apk add --no-cache mkvtoolnix ffmpeg setpriv util-linux-misc tzdata
COPY --from=build /app/.venv /app/.venv
# 웹 화면 ([web] static_dir 기본값)
COPY --from=web /web/dist /app/web
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
# exec 로 실행한 CLI 도 데몬과 같은 사용자로 돌게 하는 래퍼 (venv 의 subtitle-robot 보다 앞)
COPY docker/subtitle-robot /usr/local/bin/subtitle-robot
# srt-translate: 0.4.0 이전 명령 이름 (exec 스크립트 호환)
RUN chmod 0755 /usr/local/bin/entrypoint.sh /usr/local/bin/subtitle-robot \
    && ln -s /usr/local/bin/subtitle-robot /usr/local/bin/srt-translate \
    && mkdir -p /data /media /config
VOLUME ["/data"]
# 웹 화면 ([web] port). 처음 접속에서 관리 계정을 만든다 (§28.3). 키·구독 로그인은 Settings 에서 넣는다
EXPOSE 8949
# 워커 heartbeat 기준 (subtitle-robot health, 90초 안에 갱신돼야 정상)
HEALTHCHECK --interval=60s --timeout=10s --start-period=60s --retries=3 \
    CMD ["/usr/local/bin/subtitle-robot", "health"]
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["watch"]
