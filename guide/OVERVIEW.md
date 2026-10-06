# Subtitle Robot

**Subtitle Robot**은 영화·TV 폴더를 감시하다가 새 MKV/MP4 파일이 들어오면 자막 트랙을 꺼내 번역하고, 번역한 자막을 영상 옆에 만든다 (`Movie (2020).ko.srt`). 기본 대상 언어는 한국어이고 설정에서 바꿀 수 있다.

번역은 LLM으로 한다. 번역 전에 작품 전체를 읽어 인명·고유명사 용어집을 먼저 만든다. 그래서 **TV 시리즈 전체에서 같은 인물·지명이 같은 표기로** 나온다.

- **폴더 감시**: 복사가 끝난 새 영상을 찾아 처리한다. Sonarr·Radarr·다운로드 도구와 함께 쓸 수 있고, 이미 대상 언어 자막이 있는 영상은 건너뛴다.
- **타이밍 보존**: 자막 블록의 수·순서·타임스탬프를 바꾸지 않는다. SRT·ASS·VTT 원본을 받는다.
- **영상은 건드리지 않는다**: 영상 파일은 읽기만 한다. 이름이 같은 외부 자막이 이미 있으면 덮어쓰지 않고 `*.orig.srt`로 이름을 바꿔 둔다.
- **웹 화면**(포트 8949, 한국어·영어, 라이트·다크 테마):
  - 대시보드
  - 대기열 (재시도, 동영상 등록)
  - 완료 목록
  - 로그
  - 설정 (공급자, 모델, API 키, 계정)
- **LLM 공급자**: NVIDIA NIM(기본), 로컬 llama.cpp `llama-server`, Ollama, OpenRouter, OpenAI, Anthropic Claude, Google Gemini. Claude·ChatGPT는 공식 CLI를 통해 **구독 계정**으로도 쓸 수 있다.

현재 버전: **0.8.2**

## 이미지 태그

배포하는 이미지는 `latest` 하나다 (258MB). 앱, 웹 화면, mkvtoolnix, ffmpeg가 들어 있고 API 키(NIM·OpenAI·Claude·Gemini·OpenRouter), llama-server, Ollama 로 번역한다.

**Claude·ChatGPT 구독**으로 쓰려면 구독용 CLI가 든 이미지를 소스(https://github.com/good-ghost/subtitle-robot)에서 직접 빌드한다. CLI 실행 파일이 커서 태그마다 하나씩만 넣는다.

```bash
git clone https://github.com/good-ghost/subtitle-robot.git && cd subtitle-robot
scripts/build-images.sh claude     # Claude 구독 (Claude Code, 507MB). ChatGPT 구독은 codex (767MB)
# Docker: CONTAINER_ENGINE=docker scripts/build-images.sh claude
```

빌드한 이미지 이름은 `localhost/subtitle-robot:claude`(Podman) 또는 `subtitle-robot:claude`(Docker)다. 이 태그도 API 키로 쓸 수 있다.

## 1. 이미지 등록

이미지는 압축 파일로 배포한다. `latest` 파일을 불러온다.

```bash
sha256sum -c SHA256SUMS                                   # 선택: 받은 파일 확인

podman load -i subtitle-robot-0.8.2-latest.tar.gz         # Podman
docker load -i subtitle-robot-0.8.2-latest.tar.gz         # Docker
# Loaded image: localhost/subtitle-robot:latest
```

이미지 이름은 `localhost/subtitle-robot:latest`다. 아래 예시는 이 이름을 쓴다.

## 2. 폴더와 설정 파일 준비

```bash
mkdir -p subtitle-robot/config subtitle-robot/data
cd subtitle-robot
```

`config/config.toml`에 감시할 폴더만 적으면 된다. 나머지는 나중에 웹 화면에서 바꿀 수 있다.

```toml
# config/config.toml
[[watch.paths]]
path = "/media/movies"
kind = "movie"      # movie | series | auto (파일 이름에 S01E01 이 있으면 시리즈)

[[watch.paths]]
path = "/media/tv"
kind = "series"
```

설정 파일이 없어도 데몬은 기본값으로 뜬다. 다만 감시할 폴더가 없고 설정 화면이 읽기 전용이 된다.

### 볼륨·포트·환경 변수

| 컨테이너 경로 | 내용 | 비고 |
|---|---|---|
| `/media` | 미디어 라이브러리. 새 영상을 여기서 찾고, 번역 자막을 영상 옆에 쓴다 | 데몬 사용자가 쓸 수 있어야 한다 |
| `/data` | 대기열·처리 기록(`state.db`), 용어집, 로그, 키(`secrets.toml`, 권한 600) | 모든 상태가 들어 있으니 유지한다 |
| `/config` | `config.toml` | 웹 화면에서 저장하려면 쓰기 가능하게 마운트한다 |

| 항목 | 기본값 | 의미 |
|---|---|---|
| 포트 `8949` | | 웹 화면 |
| `PUID` / `PGID` | `1000` | 데몬을 실행할 사용자. 미디어 파일 소유자와 맞춘다 |
| `TZ` | UTC | 로그·대기열 시각의 시간대 (예: `Asia/Seoul`). 설정 → 웹 탭의 시간대가 있으면 그것이 먼저다 |

API 키는 환경 변수로 읽지 **않는다**. 웹 화면에서 넣는다 (4단계).

## 3. 실행

### Podman (rootless)

`--userns=keep-id`를 주면 데몬이 내 계정으로 돌아서 자막 파일의 소유자가 나로 남는다. 이때는 `PUID`/`PGID`를 주지 않는다.

```bash
podman run -d --name subtitle-robot --userns=keep-id \
  --restart=always --stop-timeout 300 \
  -e TZ=Asia/Seoul -p 8949:8949 \
  -v /srv/media:/media \
  -v ./data:/data \
  -v ./config:/config \
  localhost/subtitle-robot:latest
```

### Docker

컨테이너는 root로 시작해서 `/data`의 소유자를 `PUID:PGID`로 맞춘 뒤 그 사용자로 낮춰 실행한다. 미디어 폴더의 소유자는 바꾸지 않는다.

```bash
docker run -d --name subtitle-robot \
  --restart unless-stopped --stop-timeout 300 \
  -e PUID=1000 -e PGID=1000 -e TZ=Asia/Seoul \
  -p 8949:8949 \
  --add-host host.docker.internal:host-gateway \
  -v /srv/media:/media \
  -v ./data:/data \
  -v ./config:/config \
  localhost/subtitle-robot:latest
```

### Compose (Docker Compose 또는 `podman compose`)

```yaml
services:
  subtitle-robot:
    image: localhost/subtitle-robot:latest
    container_name: subtitle-robot
    restart: unless-stopped
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Seoul
    volumes:
      - /srv/media:/media
      - ./data:/data
      - ./config:/config
    ports:
      - "8949:8949"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    stop_grace_period: 5m
```

참고:

- **재시작 정책을 둔다.** 설정 화면의 **적용 (재기동)** 버튼은 데몬을 끝내고 재시작 정책으로 다시 띄운다.
- **정지 대기 시간을 길게 준다.** 정지 요청을 받으면 진행 중인 LLM 요청 하나를 끝내고 멈추는데, 최대 300초가 걸린다. 작업은 다음 기동 때 이어서 처리한다. 그 전에 강제로 끝나도 체크포인트에서 이어 가므로 잃는 것은 없다.
- **헬스체크**: 이미지에 워커 하트비트 기반 헬스체크(`subtitle-robot health`)가 들어 있다.

## 4. 처음 시작

1. `http://<호스트>:8949`를 연다. 처음 접속하면 **관리 계정**(사용자 이름, 8자 이상 비밀번호)을 만든다. 계정을 만들기 전에는 누구나 이 화면을 열 수 있으니 바로 만든다.
2. **설정 → 공급자**에서 공급자와 모델을 고른다. **모델 목록** 버튼을 누르면 그 키로 쓸 수 있는 모델이 나온다.
3. **설정 → 키**에서 API 키를 넣는다 (다시 볼 때는 끝 4자리만 보인다).
4. **저장**을 누른 뒤 **적용 (재기동)**을 누른다.

로그에 `daemon started: 1 workers`가 나오면 준비가 끝난 것이다. 키가 없으면 데몬은 웹 화면만 띄우고 번역 워커는 시작하지 않는다.

새 영상은 자동으로 처리된다. 바로 처리하려면 **대기열 → 동영상 등록**을 쓴다. 명령으로는 다음과 같다.

```bash
podman exec subtitle-robot subtitle-robot queue list       # Docker 는 docker exec …
podman exec subtitle-robot subtitle-robot probe "/media/movies/Movie (2020)/Movie (2020).mkv"
```

## 공급자별 인증

공급자는 한 번에 하나만 쓰고, 다른 공급자로 넘어가는 폴백은 없다. 키는 `/data/secrets.toml`에 저장되고 로그에는 남지 않는다.

| 공급자 | 이미지 | 인증 방법 |
|---|---|---|
| **NVIDIA NIM** (기본) | `latest` | build.nvidia.com 에서 받은 API 키(`nvapi-…`). 기본 모델 `deepseek-ai/deepseek-v4.1-flash`, 분당 30회 제한 |
| **llama-server** (로컬 llama.cpp) | `latest` | 키는 필요 없다. 설정에서 주소를 넣는다. 예: `http://host.docker.internal:8080/v1`(Docker), `http://host.containers.internal:8080/v1`(Podman). 서버를 `--api-key`로 띄웠으면 그 키를 넣는다 |
| **Ollama** | `latest` | 키 없음. 주소(예: `http://host.docker.internal:11434`)와 모델을 넣는다 |
| **OpenRouter** | `latest` | API 키와 모델 |
| **OpenAI** | `latest` | API 키와 모델 |
| **OpenAI – ChatGPT 구독** | 직접 빌드한 `codex` | 인증 방식: 구독. 공급자 카드의 **로그인**을 누르면 기기 코드가 나온다. 주소를 브라우저에서 열어 ChatGPT에 로그인하고 코드를 넣는다 (15분 안에). 또는 Codex에 로그인한 PC의 `~/.codex/auth.json` 내용을 붙여넣는다. 모델 이름은 Codex가 받는 이름을 직접 적는다 |
| **Anthropic Claude** | `latest` | API 키와 모델 |
| **Claude 구독** | 직접 빌드한 `claude` | 인증 방식: 구독. Claude Code가 설치되고 Claude 계정으로 로그인한 PC에서 `claude setup-token`을 실행해 받은 토큰(1년 유효)을 붙여넣는다. 모델은 `sonnet`·`opus`·`haiku` 또는 전체 모델 이름 |
| **Google Gemini** | `latest` | Google AI Studio 에서 만든 API 키(`AIza…`) |

공급자 참고:

- **구독**: 데몬이 요청마다 공식 CLI를 실행한다. 구독 토큰을 꺼내 API를 직접 부르지 않는다. 사용량 한도와 약관은 사용자 계정을 따른다.
  - 한도에 걸리면 풀릴 때까지 대기열이 멈춘다.
  - 로그인이 만료되면 다시 로그인하고 **적용 (재기동)**을 누른다.
  - **인증 방식** 칸은 그 CLI가 든 이미지에서만 보인다.
- **Gemini 무료 등급**:
  - 공급자 카드의 **분당 요청 수**를 모델 한도에 맞춘다 (예: `5`).
  - 목록에 보여도 새 계정은 쓸 수 없는 모델이 있다 (HTTP 404). 일시적인 과부하로 거절하는 모델도 있다 (HTTP 503). 이때는 다른 모델을 고른다. 시험에서는 `gemini-3.5-flash`가 동작했다.
- **같은 호스트의 llama-server**: `127.0.0.1`에만 열려 있으면 컨테이너가 `host.docker.internal`로 닿지 못한다. 컨테이너를 `--network host`로 띄우고 `http://127.0.0.1:8080/v1`을 쓰거나, llama-server를 `--host 0.0.0.0 --api-key <키>`로 띄운다.
- **원어 조회 (선택)**: **설정 → 키**에 TMDB 키를 넣으면 작품의 원어를 찾아 그 언어 트랙을 원본으로 쓴다. 키가 없으면 영어 트랙, 영어도 없으면 첫 텍스트 트랙을 쓴다.

## 업그레이드

새 압축 파일을 불러오고 같은 볼륨으로 컨테이너를 다시 만든다. 대기열·처리 기록·용어집·키·계정은 `/data`와 `/config`에 있어 그대로 남는다.

```bash
podman load -i subtitle-robot-<버전>-latest.tar.gz
podman stop -t 300 subtitle-robot && podman rm subtitle-robot
podman run …                     # 처음과 같은 명령
```

## 만들어지는 파일

| 파일 | 언제 |
|---|---|
| `<영상>.ko.srt` (대상 언어) | 영상에 대상 언어 자막이 없을 때 |
| `<영상>.en.srt`, `<영상>.ja.ass`, … | 영상에서 꺼낸 텍스트 자막 트랙 (`[media] extract_langs`) |
| `<영상>.en.orig.srt` | 이름이 겹치던 기존 외부 자막을 이름만 바꿔 보존한 것 |

이미지 자막(PGS, VobSub)은 꺼내지 않는다. 데몬의 메시지·판정 사유·오류는 영어 화면에서도 한국어로 나온다.

## 라이선스

Subtitle Robot 은 MIT 라이선스다. 이미지에 들어 있는 제3자 소프트웨어(Python 패키지, 웹 화면 번들, Alpine 패키지·mkvtoolnix·ffmpeg 등 GPL·LGPL 프로그램, 구독용 CLI)는 각자의 라이선스를 따른다. 직접 빌드하는 `claude` 태그의 Claude Code 는 Anthropic 의 독점 소프트웨어이고 Anthropic 약관을 따른다.

<img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" alt="TMDB" height="14">

이 프로그램은 TMDB 와 TMDB API 를 사용하지만 TMDB 의 보증·인증·승인을 받지 않았다 (This program uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.)
