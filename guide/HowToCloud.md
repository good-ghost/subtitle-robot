# 클라우드 LLM 계정 설정 (Claude·ChatGPT 구독, Gemini API 키)

Subtitle Robot 은 API 키 대신 **개인 구독 계정**(Claude Pro/Max, ChatGPT Plus/Pro)으로 번역할 수 있다. Google Gemini 는 **AI Studio API 키**로 쓴다: 개인 Google 계정의 Gemini CLI 로그인이 2026-06-18 에 종료돼 구독 방식으로는 쓸 수 없다 ([7장](#7-google-gemini-ai-studio-api-키)). 이 문서는 세 공급자를 설정하는 순서를 처음부터 끝까지 설명한다.

- 대상 버전: 0.8.5

> **시험 상태**: Claude 구독은 실제 계정으로 영상 번역까지 확인했다 (2026-10-05, Claude Code 2.1.289, `claude` 이미지). 내장 도구를 모두 끈 상태에서 구조화 출력이 정상으로 나오고, `setup-token` 토큰만으로 컨테이너 안에서 로그인된다. ChatGPT(Codex) 구독은 아직 실제 계정으로 시험하지 않았다. 아래 절차는 구현과 각 CLI 공식 문서를 기준으로 썼고, 가짜 CLI 로 자동 시험했다. 확인이 필요한 항목은 [10. 아직 확인하지 않은 것](#10-아직-확인하지-않은-것)에 모았다.

## 목차

1. [동작 방식](#1-동작-방식)
2. [준비물](#2-준비물)
3. [공급자에 맞는 이미지로 띄우기](#3-공급자에-맞는-이미지로-띄우기)
4. [Settings 에서 공급자와 인증 방식 고르기](#4-settings-에서-공급자와-인증-방식-고르기)
5. [Claude 구독 (Claude Code)](#5-claude-구독-claude-code)
6. [ChatGPT 구독 (Codex)](#6-chatgpt-구독-codex)
7. [Google Gemini (AI Studio API 키)](#7-google-gemini-ai-studio-api-키)
8. [적용하고 동작 확인하기](#8-적용하고-동작-확인하기)
9. [로그아웃, API 키로 되돌리기, 공급자 바꾸기](#9-로그아웃-api-키로-되돌리기-공급자-바꾸기)
10. [아직 확인하지 않은 것](#10-아직-확인하지-않은-것)
11. [문제 해결](#11-문제-해결)
12. [보안과 약관](#12-보안과-약관)

---

## 1. 동작 방식

구독 토큰으로 회사 API 를 직접 부르지 않는다. 각 회사 모두 구독 로그인은 자기 앱과 공식 도구에서 쓰도록 정해 두었기 때문이다. 대신 컨테이너 안에 **각 회사의 공식 CLI** 를 넣고, 번역 요청마다 그 CLI 를 비대화형으로 한 번씩 실행한다.

| 공급자 (Settings 이름) | 설정 이름 | 실행하는 CLI | 이미지 태그 |
|---|---|---|---|
| Anthropic Claude | `claude` | Claude Code (`claude -p`) | `subtitle-robot:claude` |
| OpenAI (ChatGPT) | `openai` | Codex (`codex exec`) | `subtitle-robot:codex` |
| Google Gemini | `gemini` | 없음. **AI Studio API 키**로 Gemini API 를 직접 부른다 (구독 아님, [7장](#7-google-gemini-ai-studio-api-키)) | `subtitle-robot:latest` |

- 공급자는 한 번에 하나만 쓴다. 폴백은 없다.
- CLI 는 데이터 폴더 안의 전용 폴더(`/data/subscriptions/<공급자>/`, 권한 700)를 홈으로 쓴다. 데몬의 다른 키 환경 변수(`ANTHROPIC_API_KEY` 등)는 CLI 에 넘기지 않는다. 넘기면 구독 대신 API 과금으로 바뀔 수 있다.
- CLI 의 내장 도구·MCP·슬래시 명령은 끈다. 번역 결과만 JSON 으로 받는다.
- 같은 공급자를 **API 키**로 쓸 때는 CLI 가 필요 없다 (`latest` 이미지로 충분하다). 이 문서는 구독만 다룬다.

## 2. 준비물

| 공급자 | 계정 | 로그인용 PC (브라우저가 있는 곳) |
|---|---|---|
| Claude | Claude Code 를 쓸 수 있는 구독 (Pro·Max 등. 무료 플랜은 안 된다) | Claude Code 를 설치한 PC (토큰을 만들 때만 필요) |
| ChatGPT | Codex 를 쓸 수 있는 ChatGPT 구독 | 브라우저만 있으면 된다 (기기 코드 로그인). 또는 Codex 를 설치해 로그인한 PC |
| Gemini | Google 계정 (AI Studio 에서 API 키 발급) | 브라우저만 있으면 된다 |

- 서버의 Subtitle Robot 웹 화면에 관리 계정으로 로그인할 수 있어야 한다.
- 웹 화면은 HTTPS 리버스 프록시 뒤에서 여는 것을 권한다. 로그인 토큰과 자격 파일을 웹 화면에 붙여넣기 때문이다 ([12. 보안과 약관](#12-보안과-약관)).

## 3. 공급자에 맞는 이미지로 띄우기

구독 CLI 는 공급자별 이미지 태그에 하나씩 들어 있다. `latest`에는 없다. 배포하는 이미지는 `latest` 하나이므로 `claude`·`codex` 태그는 소스에서 직접 빌드한다.

| 태그 | 들어 있는 CLI | 크기 (2026-10-05) |
|---|---|---|
| `latest` | 없음 (API 키·NIM·llama-server·Ollama 전용) | 258MB |
| `claude` | Claude Code (Node 없음) | 507MB |
| `codex` | Codex + Node | 767MB |

### 3.1 이미지 준비

```bash
git clone https://github.com/good-ghost/subtitle-robot.git && cd subtitle-robot
scripts/build-images.sh claude     # 또는 codex (latest 를 먼저 빌드한다)
# Docker: CONTAINER_ENGINE=docker scripts/build-images.sh claude
```

### 3.2 컨테이너를 그 태그로 바꾸기

데이터·설정 볼륨은 그대로 두고 이미지만 바꾼다. 키·관리 계정·처리 기록은 데이터 폴더에 있으므로 이어서 쓴다.

**podman run 으로 띄운 경우**

```bash
podman stop -t 300 subtitle-robot && podman rm subtitle-robot
podman run -d --name subtitle-robot --userns=keep-id --restart=always --stop-timeout 300 \
  -e TZ=Asia/Seoul -p 8949:8949 \
  -v ~/subtitle/config:/config -v ~/subtitle/data:/data -v ~/subtitle/media:/media \
  localhost/subtitle-robot:claude
```

**rootful Quadlet 으로 띄운 경우** (`/etc/containers/systemd/subtitle-robot.container`)

```ini
[Container]
Image=localhost/subtitle-robot:claude
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart subtitle-robot.service
```

**compose 로 띄운 경우**: `compose.yaml`의 `image:`를 `subtitle-robot:claude`로 바꾸고 `podman compose up -d`.

### 3.3 이미지에 CLI 가 있는지 확인

```bash
podman exec subtitle-robot claude --version     # 2.1.289 (Claude Code)
podman exec subtitle-robot codex --version      # codex-cli 0.160.0
```

웹 화면에서도 알 수 있다. 공급자 카드의 **인증 방식** 칸은 그 공급자의 CLI 가 든 이미지에서만 보인다.

## 4. Settings 에서 공급자와 인증 방식 고르기

1. 웹 화면에 로그인하고 **설정 → 공급자** 탭을 연다.
2. **사용할 공급자**에서 `Anthropic Claude` 또는 `OpenAI (ChatGPT)`를 고른다 (Gemini 는 [7장](#7-google-gemini-ai-studio-api-키)).
3. 공급자 카드의 **인증 방식**을 `구독 계정`으로 바꾼다.
   - 이 칸이 없으면 지금 이미지에 그 CLI 가 없다 ([3장](#3-공급자에-맞는-이미지로-띄우기)).
   - 구독으로 바꾸면 CLI 에 넘기지 않는 칸(주소, temperature, 최대 출력 토큰)은 숨겨진다.
4. **모델**을 정한다.
   - Claude: **모델 목록** 버튼을 누르면 Claude Code 별칭 `sonnet`·`opus`·`haiku`·`fable`이 나온다. 별칭 대신 전체 모델 이름을 적어도 된다.
   - Codex: 모델 목록을 주지 않는다 ("구독 CLI 는 모델 목록을 주지 않습니다"). **로그인용 PC 의 CLI 에서 쓰는 모델 이름을 그대로 적는다.** 구독 플랜마다 쓸 수 있는 모델이 다르다.
5. 나머지 칸 권장값:
   - **동시 요청**: `1`. CLI 는 요청마다 프로세스 하나라 동시 요청을 늘려도 이득이 적고, 구독 사용량 한도에 빨리 닿는다.
   - **요청 제한 시간**: 기본 300초. 큰 배치가 오래 걸리면 늘린다. 시간 안에 끝나지 않은 요청은 공급자 불가로 처리된다.
   - **분당 요청 수**: `0`(제한 없음)이면 된다. 구독 한도는 CLI 쪽에서 알려 준다.
6. 오른쪽 위 **저장**을 누른다. 설정은 재기동해야 적용된다 ([8장](#8-적용하고-동작-확인하기)). 로그인은 저장 전에 해도 되고 뒤에 해도 된다.

인증 방식을 구독으로 바꾸면 카드 아래에 로그인 영역이 나타난다:

- 로그인 상태 배지: `로그인 안 됨` / `로그인됨 (…abcd)` / `로그인됨 (<시각> 저장)`
- **로그인**(또는 **다시 로그인**) 버튼, **로그아웃** 버튼
- "사용량 한도와 약관은 계정을 따릅니다. 로그인을 바꾸면 재기동해야 적용됩니다" 안내

## 5. Claude 구독 (Claude Code)

Claude 는 **1년짜리 토큰**을 붙여넣는 방식이다. 토큰은 Claude Code 가 설치된 PC 에서 한 번 만든다.

### 5.1 PC 에서 토큰 만들기

1. Claude Code 를 설치한다 (이미 있으면 건너뛴다). 설치 방법은 Claude Code 문서의 "Advanced setup"을 따른다.

   ```bash
   curl -fsSL https://claude.ai/install.sh | bash     # macOS·Linux·WSL
   # 또는: npm install -g @anthropic-ai/claude-code   (Node.js 22 이상)
   ```

2. 터미널에서 실행한다.

   ```bash
   claude setup-token
   ```

3. 브라우저가 열리면 **Claude 구독 계정**으로 로그인하고 승인한다.
4. 터미널에 긴 토큰이 출력된다. 토큰은 저장되지 않고 화면에만 나오므로 바로 복사한다.

### 5.2 Subtitle Robot 에 넣기

1. Claude 공급자 카드에서 **로그인**을 누른다 → "Anthropic Claude 구독 로그인" 창.
2. **토큰** 칸에 복사한 토큰을 **통째로** 붙여넣는다 (앞뒤 공백은 지워진다).
3. **로그인 저장**을 누른다.
4. 배지가 `로그인됨 (…abcd)`(토큰 끝 4자리)로 바뀐다.

- 토큰은 데이터 폴더의 `secrets.toml`(`[providers.claude] oauth_token`, 권한 600)에 저장된다. 화면·API 응답·로그에는 끝 4자리만 보인다.
- 형식이 틀리면 "토큰 형식이 아닙니다. setup-token 이 출력한 토큰 전체를 넣으세요". 짧거나 공백이 섞인 값은 받지 않는다.
- 토큰은 **1년** 유효하다. 만료되면 같은 절차로 다시 만들어 **다시 로그인** 한다.

### 5.3 실행 방식 (참고)

요청마다 다음처럼 실행한다. 사용자 프롬프트는 표준 입력으로 보낸다.

```text
claude -p --output-format json --model <모델> --tools "" --strict-mcp-config
       --disable-slash-commands --no-session-persistence
       --system-prompt-file <파일> --json-schema <출력 스키마>
환경: CLAUDE_CODE_OAUTH_TOKEN=<토큰>, CLAUDE_CONFIG_DIR=/data/subscriptions/claude/config,
      HOME=/data/subscriptions/claude/home, DISABLE_AUTOUPDATER=1
```

- `--bare`는 쓰지 않는다. bare 모드는 구독 로그인을 읽지 않는다.
- 결과는 `structured_output`(없으면 `result` 문자열에서 JSON)으로 받는다.
- 실제로 쓴 모델(별칭이 가리킨 모델)을 응답에서 읽어 번역 기록(fingerprint)에 남긴다.

## 6. ChatGPT 구독 (Codex)

Codex 는 두 가지 방법이 있다. **방법 A (기기 코드)** 가 간단하다. 서버 데몬이 Codex 로그인을 실행하고, 사용자는 브라우저에서 코드만 넣는다.

### 6.1 방법 A — 기기 코드로 로그인 (권장)

1. OpenAI (ChatGPT) 공급자 카드에서 **로그인**을 누른다 → "OpenAI (ChatGPT) 구독 로그인" 창.
2. 창 왼쪽 아래 **기기 코드로 로그인**을 누른다.
3. 잠시 뒤 창에 **주소**와 **코드**가 나온다 (예: `https://auth.openai.com/codex/device`, `ABCD-12345`).
4. **주소 열기**를 누르거나, 아무 기기(휴대폰 포함)의 브라우저에서 그 주소를 연다.
5. **ChatGPT 계정**으로 로그인하고 화면의 코드를 넣어 승인한다.
6. 창은 1.5초마다 상태를 확인한다. 승인이 끝나면 창이 닫히고 배지가 `로그인됨 (<시각> 저장)`이 된다.

- 코드는 **15분** 안에 넣어야 한다. 지나면 "코드가 만료됐습니다. 다시 시작하세요" → **기기 코드로 로그인**을 다시 누른다.
- 창의 **취소**를 누르면 진행 중인 로그인 명령을 끝낸다.
- 실패하면 Codex 가 낸 마지막 메시지를 "기기 코드 로그인에 실패했습니다: …"로 보여 준다. ChatGPT 계정 설정에서 기기 코드 로그인을 막아 두었으면 거절될 수 있다 ([10장](#10-아직-확인하지-않은-것)).
- "데몬에 Codex CLI 가 없습니다"가 나오면 `codex` 태그 이미지가 아니다.

### 6.2 방법 B — 다른 PC 의 auth.json 붙여넣기

1. PC 에 Codex 를 설치하고 로그인한다.

   ```bash
   npm install -g @openai/codex
   codex login            # 브라우저에서 "Sign in with ChatGPT"
   ```

2. PC 의 `~/.codex/auth.json` 내용을 연다 (Windows: `%USERPROFILE%\.codex\auth.json`). 이 파일은 로그인 자격이므로 다른 사람에게 보내지 않는다.
3. Subtitle Robot 의 로그인 창에서 **auth.json 내용** 칸에 파일 내용을 통째로 붙여넣고 **로그인 저장**을 누른다.

- `tokens` 항목이 있어야 받는다. 없으면 "auth.json 형식이 아닙니다 (tokens 항목이 필요합니다)".
- PC 에서 Codex 를 계속 쓰면서 같은 auth.json 을 서버에도 쓰면, 한쪽에서 토큰을 새로 고칠 때 다른 쪽 토큰이 무효가 될 수 있다. 서버 전용으로는 방법 A 를 권한다.

### 6.3 저장 위치와 실행 방식 (참고)

- 자격: `/data/subscriptions/openai/codex/auth.json` (권한 600, 폴더 700). Codex 가 토큰을 새로 고치면 이 파일을 갱신한다.
- 실행:

  ```text
  codex exec --model <모델> --ephemeral --skip-git-repo-check --sandbox read-only
             --color never --json --output-last-message <파일> --output-schema <스키마 파일> -
  환경: CODEX_HOME=/data/subscriptions/openai/codex, HOME=/data/subscriptions/openai/home
  ```

- Codex 에는 시스템 프롬프트를 바꾸는 인자가 없어 시스템 프롬프트를 사용자 프롬프트 앞에 붙여 표준 입력으로 보낸다.
- 출력 스키마는 OpenAI 엄격 구조화 출력 규칙(모든 속성 required, 추가 속성 금지)에 맞춰 바꿔 넘긴다.

## 7. Google Gemini (AI Studio API 키)

Gemini 는 구독이 아니라 **Google AI Studio 에서 만든 API 키**로 쓴다. CLI 가 필요 없으므로 `latest` 이미지로 충분하다. Gemini 는 Subtitle Robot 의 **기본 공급자**다: 설정 파일에 공급자를 적지 않으면 Gemini·`gemini-3.5-flash`·분당 5회로 시작하므로, 키만 넣으면 바로 쓸 수 있다.

### 7.1 왜 구독(Gemini CLI)이 아닌가

- Google 은 2026-06-18 부터 개인 Google 계정(무료·Google AI Pro·Ultra)의 **Gemini CLI Google 로그인**을 종료했다. 로그인하면 "This client is no longer supported for Gemini Code Assist for individuals. To continue using Gemini, please migrate to the Antigravity suite of products"가 나오고, 다시 설치하거나 다른 계정으로 해도 같다.
- Gemini CLI 는 지금 유료 Gemini API 키나 기업용(Code Assist Standard·Enterprise)으로만 쓸 수 있다. API 키를 쓸 바에는 CLI 없이 API 를 직접 부르는 이 방식이 간단하다.
- Google 이 안내하는 대체품 Antigravity CLI(`agy`)는 비대화형 실행을 지원한다고 밝혔지만, 터미널이 아닌 곳에서 출력이 사라지는 문제가 열려 있고 서버 로그인 방법이 확인되지 않아 이 도구는 아직 쓰지 않는다.
- 그래서 Gemini CLI 를 넣은 이미지는 만들지 않는다. Gemini 는 `latest` 이미지와 API 키로 쓴다.

### 7.2 API 키 만들기

1. 브라우저에서 Google AI Studio(<https://aistudio.google.com>)에 Google 계정으로 로그인한다.
2. **Get API key**(API 키 받기)에서 키를 만든다. 처음이면 Google Cloud 프로젝트를 함께 만든다.
3. 만든 키(`AIza…`로 시작)를 복사한다. 키는 비밀번호처럼 다룬다.

- **무료 등급**: 결제 설정 없이 쓸 수 있지만 분당·일일 요청 수 한도가 낮다. 한도는 모델마다 다르고 AI Studio 의 사용량 화면에서 본다.
- **유료 등급**: 프로젝트에 결제를 연결하면 한도가 크게 오르고 사용량만큼 과금된다.
- 무료 등급은 입력 내용이 Google 제품 개선에 쓰일 수 있다고 약관에 안내돼 있다. 자막 내용을 보내도 되는지 Gemini API 약관을 확인한다.

### 7.3 Subtitle Robot 에 넣기

1. 컨테이너는 `latest` 이미지로 띄운다 (이미 `claude`·`codex` 태그여도 API 키 방식은 동작한다).
2. **설정 → 키** 탭의 **Google Gemini API 키** 칸에 키를 붙여넣고 **저장**을 누른다. 화면에는 끝 4자리만 보인다 (`secrets.toml`의 `[providers.gemini] api_key`, 권한 600).
3. **설정 → 공급자** 탭:
   - **사용할 공급자**: `Google Gemini` (기본값)
   - **인증 방식**: 칸이 없다 (Gemini 는 API 키만).
   - **모델**: 기본값은 `gemini-3.5-flash`다. 바꾸려면 **모델 목록** 버튼으로 고르거나 직접 적는다. 다만 이 목록은 Google `/models` 응답을 그대로 보이므로 **새 계정이 쓸 수 없는 모델도 섞여 있다** (아래 7.4).
   - **주소**: 기본값(`https://generativelanguage.googleapis.com/v1beta/openai`)을 그대로 둔다.
   - **분당 요청 수**: 기본값 `5`. 무료 등급 Flash 모델의 한도(대략 분당 10~15회, 분당 25만~100만 토큰, 하루 1,500회 안팎, 모델마다 다르다)보다 낮게 잡은 값이다. 한도를 넘으면 429 로 재시도하다 대기열을 잠시 멈추고, 같은 요청이 계속 실패하면 작업이 실패로 넘어간다. 하루 한도에 닿으면(429 의 quotaId 가 하루 단위) 한도가 초기화되는 태평양 시간 자정(한국 시간 16시, 겨울에는 17시)까지 대기열을 멈추고, 그 뒤 같은 작업을 이어서 처리한다. 로그에 `gemini daily request quota reached; pausing the queue until …`이 남고 작업 시도 횟수는 쓰지 않는다. 결제를 연결한 유료 등급은 값을 올리거나 `0`(제한 없음)으로 둔다.
4. 오른쪽 위 **저장** → **적용 (재기동)**. 로그에 `daemon started: 1 workers`가 나오면 준비가 끝났다.

### 7.4 모델 고르기 (2026-10-05 실측)

무료 등급 키로 작은 구조화 출력 요청을 보내 본 결과다. 모델의 공급 상황은 자주 바뀌므로 404·503 이 나면 다른 모델로 바꿔 본다.

| 모델 | 결과 | 의미 |
|---|---|---|
| `gemini-2.5-flash` | 404 "This model models/gemini-2.5-flash is no longer available to new users" | 목록에는 보이지만 새 계정은 쓸 수 없다 |
| `gemini-3.8-flash` | 503 "This model is currently experiencing high demand", 이어 429 (무료 등급 분당 5회) | Google 쪽 과부하. 404 안내문이 권하는 모델이지만 지금은 받지 않는다 |
| `gemini-3.7-flash` | 503 (위와 같음) | Google 쪽 과부하 |
| `gemini-3.5-flash` | **200**, 5초 안팎, JSON 스키마 출력 정상. 분당 요청 수 `5`로 10블록 테스트 영상을 9초에 번역했고 인명·배 이름 표기가 끝까지 같았다 | 지금 권하는 모델 |

- 404 는 시도 횟수만 쓰고 계속 실패한다. 로그의 `job … failed: LlmHttpError: HTTP 404`를 보면 모델을 바꾼다.
- 503 은 공급자 불가로 보고 대기열을 60초씩 멈추며 다시 시도한다. 같은 요청이 3번 실패하면 작업이 실패로 넘어가고, 재시도 간격을 두고 다시 처리된다 (`[queue] max_attempts`, 기본 5). 계속되면 모델을 바꾼다.
- 모델을 바꾼 뒤 **저장 → 적용 (재기동)**. 실패한 작업과 다음 시도를 기다리는 작업(오류가 보이는 대기)은 **대기열**의 재시도 아이콘(**지금 다시 시도**)이나 **모두 다시 시도**로 기다리지 않고 바로 다시 처리한다.

### 7.5 동작 방식 (참고)

- Gemini 의 OpenAI 호환 endpoint(`/v1beta/openai/chat/completions`)를 부른다. 키는 요청 헤더로만 보내고 로그·응답에 넣지 않는다.
- 출력은 JSON 스키마(`response_format: json_schema`)로 받는다. 모델이 스키마를 받지 않으면 공급자 설정에서 `response_format = "json_object"`로 바꾼다 (`config.toml`).
- 공급자 상태 확인과 모델 목록은 같은 키로 `/models`를 부른다.

## 8. 적용하고 동작 확인하기

1. 설정 화면 오른쪽 위 **적용 (재기동)** → **재기동**. 데몬이 다시 뜨고 웹 화면이 새로 고쳐진다.
   - 로그인(토큰·자격 파일)을 바꿨을 때도 재기동해야 적용된다.
   - 진행 중인 번역이 있으면 LLM 요청 하나를 끝낸 뒤 멈추므로 최대 몇 분 걸린다.
2. **대시보드**에서 공급자 상태를 본다.
3. **로그** 화면에서 확인한다.
   - 정상: `daemon started: 1 workers`, 이어서 `job … started`, `job … done (translated)`.
   - 키·로그인 없이 시작됨: `LLM provider is not ready …; translation workers are not started` → 로그인을 확인하고 다시 재기동한다.
   - CLI 없는 이미지: `… 구독 CLI 가 이 이미지에 없다. subtitle-robot:<태그> 이미지를 쓴다` ([3장](#3-공급자에-맞는-이미지로-띄우기)).
4. 짧은 영상 하나를 **대기열 → 동영상 등록**으로 넣어 끝까지 번역되는지 본다. **완료 목록**의 상세에서 공급자와 모델을 확인할 수 있다.

저장소가 있는 PC 에서는 명령으로 한 번 시험해 볼 수도 있다 (짧은 구조화 출력 요청 1회). 이미지에는 `scripts/`가 없으므로 컨테이너 안에서는 쓸 수 없고, 그 PC 에 CLI 와 로그인 자격이 있는 데이터 폴더가 필요하다:

```bash
uv run python scripts/llm_smoke.py --config <config.toml> --data <데이터 폴더>   # 설정에 auth = "subscription"
```

### 8.1 로그인 만료·사용량 한도일 때

| 상황 | 데몬 동작 | 할 일 |
|---|---|---|
| 로그인 만료·거부 (`authentication`, `401`, `Please run /login` 등) | 대기열을 **멈춘다**. 로그 `… login failed or expired; sign in again in the web Settings and restart` | 해당 공급자를 **다시 로그인**하고 재기동한다. 멈춘 작업은 이어서 처리한다 |
| 사용량 한도 (`usage limit`, `rate limit`, `429`, `quota` 등) | 풀리는 시각까지 대기열을 멈춘다. 시각을 모르면 15분 뒤 다시 시도한다. 로그 `… usage limit reached; pausing until <시각>` | 기다리면 자동으로 이어진다 |
| 시간 초과·과부하 (`overloaded`, `5xx`) | 공급자 불가로 보고 상태를 확인하며 다시 시도한다 | 계속되면 요청 제한 시간을 늘린다 |
| 결제·크레딧 문제 (API 키 공급자의 `HTTP 402`, OpenAI `insufficient_quota`) | 재시도하지 않고 대기열을 **멈춘다**. 로그 `… billing problem (credits depleted or no quota) …` | 공급자 콘솔에서 충전·결제를 확인한 뒤 재기동한다. 멈춘 작업은 이어서 처리한다 |
| CLI 실행 파일 없음 | 공급자 불가 | 이미지 태그를 확인한다 |

대기열이 멈춰 있는 동안 작업의 시도 횟수는 늘지 않는다.

## 9. 로그아웃, API 키로 되돌리기, 공급자 바꾸기

- **로그아웃**: 공급자 카드의 **로그아웃** → 저장한 토큰·자격 파일을 지운다. CLI 쪽 세션 만료는 하지 않는다 (Claude 는 claude.ai 계정 설정에서, ChatGPT·Google 은 각 계정의 연결된 앱 설정에서 직접 해제한다). 재기동하면 번역 워커가 서지 않는다.
- **API 키로 되돌리기**: 인증 방식을 `API 키`로 바꾸고 **키** 탭에 API 키를 넣은 뒤 저장 → 재기동. 이미지는 `latest`로 바꿔도 된다.
  - 구독으로 저장된 설정을 CLI 없는 이미지로 띄우면 인증 방식 칸이 남아 있고 "이 이미지에는 … 가 없습니다. 구독으로 쓰려면 subtitle-robot:<태그> 이미지로 바꾸세요" 안내가 보인다. 여기서 `API 키`로 바꾸면 된다.
- **다른 공급자의 구독으로 바꾸기**: 이미지를 그 공급자의 태그로 바꾸고 ([3장](#3-공급자에-맞는-이미지로-띄우기)), 공급자·인증 방식·모델을 바꾼 뒤 로그인 → 재기동.
- 공급자나 모델을 바꾸면 이어 번역(체크포인트)은 "설정이 바뀜"으로 판정된다. 감시 데몬은 처음부터 다시 번역하므로 따로 할 일은 없다.

## 10. 아직 확인하지 않은 것

실제 구독 계정으로 아직 확인하지 못한 항목이다. 확인되는 대로 이 문서와 구현을 고친다.

| 항목 | 내용 |
|---|---|
| Codex 엄격 스키마 | 번역 스키마를 엄격 규칙으로 바꾼 것을 Codex 가 받아들이는지 |
| Codex 샌드박스 | 컨테이너 안에서 `--sandbox read-only`가 오류 없이 도는지 |
| Codex 기기 코드 | ChatGPT 계정 설정에 따라 기기 코드 로그인이 막히는지, 출력에서 주소·코드를 제대로 읽는지 |
| 오류 문구 | 각 CLI 의 실제 만료·한도 메시지가 위 분류에 맞게 잡히는지 |
| 모델 이름 | Codex 구독 플랜에서 쓸 수 있는 모델 이름 |

## 11. 문제 해결

| 증상 | 원인과 조치 |
|---|---|
| 공급자 카드에 **인증 방식** 칸이 없다 | 지금 이미지에 그 공급자의 CLI 가 없다. 구독으로 쓰려면 `claude`·`codex` 태그 이미지로 바꾼다 (3장). Gemini 는 칸이 없는 것이 정상이다 (API 키) |
| "이 이미지에는 Codex 가 없습니다 …" | 구독으로 저장했지만 이미지에 CLI 가 없다. 이미지를 바꾸거나 인증 방식을 `API 키`로 되돌린다 |
| "토큰 형식이 아닙니다" | `claude setup-token` 출력의 토큰 전체를 넣지 않았다. 줄바꿈·공백이 섞였는지 확인한다 |
| "auth.json 형식이 아닙니다" | 파일 일부만 붙여넣었거나 API 키 로그인용 auth.json 이다. ChatGPT 로그인으로 만든 파일을 통째로 넣는다 |
| PC 의 Gemini CLI 로그인에서 "This client is no longer supported for Gemini Code Assist for individuals" | 개인 계정의 Gemini CLI 로그인이 종료됐다. AI Studio API 키를 쓴다 (7장) |
| Gemini 요청이 429 로 자주 멈춘다 | 무료 등급 한도에 닿았다. 분당 요청 수를 모델 한도 이하(예: `5`)로 두거나 결제를 연결한다 |
| Gemini `HTTP 404` "no longer available to new users" | 새 계정이 쓸 수 없는 모델이다 (목록에는 보인다). 다른 모델로 바꾼다 (7.4) |
| Gemini `HTTP 503` "experiencing high demand" | Google 쪽 과부하다. 기다리거나 다른 모델로 바꾼다 (7.4) |
| `HTTP 402` "prepayment credits are depleted" 등 결제·크레딧 오류 | 결제를 연결한 프로젝트의 선불 크레딧을 다 썼거나 결제가 막혔다 (OpenRouter 크레딧 부족 402, OpenAI `insufficient_quota`도 같다). 데몬은 재시도하지 않고 대기열을 멈춘다 (작업 시도 횟수는 쓰지 않는다). 공급자 콘솔(Gemini 는 https://ai.studio/projects)에서 충전·결제를 확인한 뒤 **적용 (재기동)**. 결제를 연결하지 않은 프로젝트의 키로 바꾸면 무료 등급으로 쓴다 |
| "데몬에 Codex CLI 가 없습니다" | 기기 코드 로그인은 서버의 `codex`가 필요하다. `codex` 태그로 바꾼다 |
| "코드가 만료됐습니다" | 15분 안에 코드를 넣지 못했다. 다시 시작한다 |
| 로그인했는데 번역이 시작되지 않는다 | 재기동하지 않았다. **적용 (재기동)**. 로그에 `translation workers are not started`가 있으면 그 줄 앞의 이유를 본다 |
| 대기열이 계속 멈춰 있다 | 로그에서 `login failed or expired`(다시 로그인 후 재기동) 또는 `usage limit reached; pausing until`(기다림)을 찾는다 |
| 모델 목록에 "구독 CLI 는 모델 목록을 주지 않습니다" | Codex 는 정상이다. 모델 이름을 직접 적는다 |
| 번역이 느리다 | 구독 CLI 는 요청마다 프로세스를 띄워 몇 초가 더 든다. 동시 요청은 1 을 권한다 |

로그는 웹 화면의 **로그** 메뉴 또는 데이터 폴더의 `logs/daemon.log`에서 본다. 토큰·자격 값은 로그에 남지 않는다.

## 12. 보안과 약관

- **자격 보관**: Claude 토큰과 Gemini API 키는 `secrets.toml`(권한 600), Codex 자격 파일은 `/data/subscriptions/openai/`(폴더 700, 파일 600)에 둔다. 화면·API 응답·로그·오류 메시지에 값을 넣지 않는다. 데이터 폴더를 백업할 때 이 파일들도 함께 보호한다.
- **전송 구간**: 토큰과 자격 파일을 웹 화면에 붙여넣으므로 HTTPS 리버스 프록시 뒤에서 여는 것을 권한다. 세션 쿠키에는 `Secure`를 붙이지 않으므로 LAN HTTP 에서도 동작하지만, 신뢰하지 않는 네트워크에서는 HTTP 로 로그인하지 않는다.
- **관리 계정**: 웹 화면에 로그인할 수 있는 사람은 구독 로그인을 바꿀 수 있다. 관리 계정 비밀번호를 강하게 둔다.
- **한도와 약관**: 사용량 한도와 이용 약관은 사용자 계정의 것이다. 여러 사람이 쓰는 서비스에 개인 구독을 쓰는 것이 약관에 맞는지 각 회사 약관을 확인한다. 구독 토큰으로 회사 API 를 직접 부르는 방식은 약관상 쓰지 않는다 ([1장](#1-동작-방식)).
- **토큰 유출 시**: 공급자 카드에서 **로그아웃**하고, 각 회사 계정 설정에서 해당 토큰·연결된 앱을 해제한 뒤 새로 로그인한다.
