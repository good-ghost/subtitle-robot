# Subtitle Robot

[English](README.en.md) | 한국어

**Subtitle Robot**(`subtitle-robot`)은 자막을 번역하는 Python CLI 도구이자 감시 데몬이다. 원본은 어떤 언어든 되고(영어·일본어는 전용 규칙), 대상 언어는 기본 한국어이며 설정으로 바꾼다. 번역 전에 작품 전체를 분석해 인명·고유명사 용어집을 만들고, **TV 시리즈 전체에서 같은 인물·용어를 같은 표기로** 쓰게 한다. LLM은 Google Gemini(기본), NVIDIA NIM, 로컬 llama.cpp `llama-server`, Ollama, OpenRouter, OpenAI(ChatGPT), Anthropic Claude 중 하나를 쓴다.

현재 버전은 0.8.2이다. 주요 기능:

- 단일 작품과 TV 시리즈 번역: 시리즈 전체 용어집, 직전 화 요약(`story_so_far`), 반복 대사 메모리(`phrases`)
- SRT·ASS·VTT 입력, 스타일을 보존하는 ASS 출력
- 동영상(MKV·MP4) 자막 트랙 추출과 자동 번역, 미디어 폴더 감시 데몬과 컨테이너 운영
- 웹 운영 화면: 대시보드, 대기열, 완료 목록, 로그, 설정(공급자·키·관리 계정)
- 원본 언어 자동 판별, 대상 언어 설정, 작품 원어(TMDB) 기준 소스 트랙 선택
- LLM 공급자 7종과 Claude·ChatGPT 구독 계정(공식 CLI 실행)

## 동작 방식

```text
SRT → 정규화 → [Pass 1] 인명·고유명사 분석 → 용어집(glossary.yaml)
    → unit 묶기 → 배치 → [Pass 2] 번역 → 검증·재시도 → 원래 블록으로 재분리 → .<대상>.srt + report.json
```

- **SRT 구조를 그대로 둔다.** 블록 수·순서·타임스탬프는 바뀌지 않는다. LLM에는 타임스탬프 없이 내부 번호와 텍스트만 보낸다.
- **용어집이 표기를 정한다.** 엔티티 ID(`E0001`…)는 코드가 발급하고, 한 번 정한 표기는 파이프라인이 바꾸지 않는다(first-wins). 사람이 고친 표기(`manual`)와 공식 표기(`official`)가 LLM 제안보다 우선한다.
- **일본어 이름은 결정적으로 음역한다.** LLM은 가나 읽기만 판단하고, 일본계 이름의 한글 표기는 코드가 만든다(`common` 기본: 타나카, `standard`: 다나카). 가타카나로 쓴 서양계 이름(アンジェロ → 안젤로)은 LLM 제안을 용어집에 고정한다.
- **경칭은 따로 다룬다.** 용어집에는 이름 본체만 두고, さん·様·Mr. 같은 경칭은 정책(`transliterate` 기본: 상·사마 / `translate`: 씨·님 / `drop`)으로 붙인다.
- **언어마다 전용 로직을 먼저 쓴다.** 일본어 원본은 대상과 관계없이 일본어 규칙(가나 읽기, 경칭 분리, 1인칭으로 말투 판단), 한국어 대상은 원본과 관계없이 한국어 처리(한글 음역, 경칭 표, 조사 보정)를 쓴다. 전용 로직이 없는 언어는 문자 체계로 정한 공통 규칙을 쓴다.
- **멈추지 않는다.** 검증 error는 재시도 뒤 폴백을 적용하고 리포트에 `needs_review`로 남긴다. 중단돼도 체크포인트에서 이어 간다.

## 설치

Python 3.13과 [uv](https://docs.astral.sh/uv/)가 필요하다.

```bash
uv sync                      # 저장소에서 개발용으로 실행: uv run subtitle-robot ...
uv tool install .            # 또는 명령으로 설치: subtitle-robot ...
```

## 설정

설정 없이 실행하면 Gemini 기본값(`gemini-3.5-flash`, 분당 5회)을 쓴다. 바꾸려면 [examples/config.example.toml](examples/config.example.toml)을 복사해 고치고 `--config` 또는 `SUBTITLE_ROBOT_CONFIG` 환경 변수로 지정한다.

| 공급자 (`llm.provider`) | 준비 | 비고 |
|---|---|---|
| Google Gemini (`gemini`, 기본) | AI Studio API 키. 기본 모델 `gemini-3.5-flash`, 분당 5회 | OpenAI 호환 엔드포인트. 개인 Google 계정의 Gemini CLI 로그인은 2026-06-18 종료돼 구독으로는 쓰지 않는다 |
| NVIDIA NIM (`nim`) | API 키. 기본 모델 `deepseek-ai/deepseek-v4.1-flash`, 30 RPM | |
| llama-server (`local`) | 별도로 띄운 서버의 `base_url`. `--api-key`로 띄웠으면 그 키 | `/props`·`/tokenize`로 컨텍스트·토큰 수 |
| Ollama (`ollama`) | 서버 주소(기본 `http://127.0.0.1:11434`), 모델 | 고유 API `/api/chat`. `context_tokens`(기본 8192)를 `num_ctx`로 보낸다. 생각 모델은 `extra_body = { think = false }` |
| OpenRouter (`openrouter`) | API 키, 모델 | 모델이 json_schema 를 받지 않으면 `response_format = "json_object"` |
| OpenAI (`openai`) | API 키 또는 ChatGPT 구독(Codex CLI), 모델 | `max_completion_tokens`로 보내고, `temperature`를 적지 않으면 보내지 않는다 (추론 모델) |
| Anthropic Claude (`claude`) | API 키 또는 Claude 구독(Claude Code CLI), 모델 | Messages API. 출력 스키마를 도구로 주고 그 호출을 강제해 JSON 을 받는다 |

- **Gemini 무료 등급 한도**: Flash 모델은 대략 분당 10~15회, 분당 25만~100만 토큰, 하루 1,500회 안팎이다 (모델마다 다르고 Google 이 바꾼다. AI Studio 의 사용량 화면에서 본다). 기본 분당 요청 수 5 는 이보다 낮게 잡은 값이다. 하루 한도에 닿으면 데몬이 이를 알아보고 한도가 초기화되는 태평양 시간 자정(한국 시간 16시, 겨울에는 17시)까지 대기열을 멈춘 뒤 이어서 처리한다 (작업 시도 횟수는 쓰지 않는다). 결제를 연결하면 한도가 크게 오른다. 선불 크레딧을 다 쓰는 등 결제 문제(HTTP 402)가 나면 대기열을 멈추고, 충전한 뒤 적용(재기동)하면 이어서 처리한다
- 키(공급자·TMDB)는 웹 Settings 의 **키** 탭에서 넣는다. 데이터 폴더의 `secrets.toml`(권한 600)에 저장되고 화면에는 끝 4자리만 보인다. **환경 변수의 키는 읽지 않는다**. 공급자는 하나만 쓰고 폴백하지 않는다. 바꾸려면 설정을 고치고 재기동한다
- 웹 화면 없이 CLI 만 쓰면 데이터 폴더(`--data` → `SUBTITLE_ROBOT_DATA` → `/data`)에 `secrets.toml`을 직접 만든다 (`chmod 600`):

  ```toml
  [providers.gemini]
  api_key = "AIza..."

  [tmdb]
  api_key = "..."
  ```

- Gemini·NIM·llama-server 밖의 공급자는 모델 기본값이 없다. `[providers.<이름>] model`을 적거나 웹 Settings 에서 "모델 목록"으로 고른다. 주소·제한 시간은 기본값이 있다
- 시간대: `[system] timezone`(IANA 이름, 예 `Asia/Seoul`)이 있으면 로그·큐 시각에 쓴다. 비우면 `TZ` 환경 변수 (Settings 웹 탭에서 검색해 고른다)
- 공급자를 바꾸면 이어 번역(체크포인트)은 설정이 바뀐 것으로 판정된다 (`--redo-stale` / `--accept-stale`)
- 확인: `uv run python scripts/llm_smoke.py --data ./data --provider claude --model <모델>` (짧은 구조화 출력 요청 1회)

### 구독 계정 (Claude·ChatGPT)

설정 순서(이미지 태그, 로그인, 문제 해결)는 [guide/HowToCloud.md](guide/HowToCloud.md)에 자세히 적었다.

`claude`·`openai`는 API 키 대신 구독 계정으로 쓸 수 있다 (`[providers.<이름>] auth = "subscription"`, Settings 공급자 카드의 "인증 방식"). 구독 토큰으로 회사 API 를 직접 부르지 않고 각 회사의 공식 CLI 를 요청마다 비대화형으로 실행한다. CLI 는 공급자별 이미지 태그(`claude`·`codex`)에만 들어 있고 `latest`에는 없다 (아래 "이미지 태그"). 직접 설치해 쓸 때는 `claude`·`codex`가 PATH 에 있어야 한다. Settings 의 "인증 방식" 칸은 그 공급자의 CLI 가 든 이미지에서만 보인다 (`latest`에서는 두 공급자 모두 API 키로 쓴다). 구독으로 저장한 설정을 CLI 가 없는 이미지로 띄우면 Settings 공급자 카드와 기동 로그가 필요한 태그를 알려 준다.

| 공급자 | CLI | 로그인 (Settings 공급자 카드 → 로그인) | 모델 |
|---|---|---|---|
| `claude` | Claude Code | Claude 구독 계정이 있는 PC 에서 `claude setup-token`을 실행해 받은 토큰(1년)을 붙여넣는다 | 별칭 `sonnet`·`opus`·`haiku`·`fable` 또는 전체 이름 |
| `openai` | Codex | **기기 코드로 로그인**: 화면에 나온 주소를 브라우저에서 열어 ChatGPT 로그인 후 코드 입력. 또는 로그인한 PC 의 `~/.codex/auth.json` 붙여넣기 | Codex 가 받는 모델 이름을 직접 적는다 |

- CLI 는 데이터 폴더의 `subscriptions/<공급자>/`를 HOME 으로 쓰고(권한 700), 이 프로세스의 다른 키 환경 변수를 넘기지 않는다 (API 과금으로 바뀌지 않게). 내장 도구·MCP 를 끄고 출력 스키마로 결과를 받는다
- 로그인이 만료·거부되면 큐를 멈추고 다시 로그인한 뒤 재기동하면 이어서 처리한다. 사용량 한도에 걸리면 풀리는 시각(모르면 15분)까지 큐를 멈춘다. 한도와 약관은 사용자 계정의 것이다
- 로그인을 바꾸면 적용(재기동)해야 쓴다. 로그인 없이 시작한 데몬은 웹 화면만 띄우고 번역 워커를 시작하지 않는다

번역 대상 언어는 `[translation] target_language`(ISO 639-1, 기본 `ko`)로 정하고, 명령마다 `--target`으로 바꿀 수 있다 (`subtitle-robot --target en translate …`). 원본은 `--src`(ISO 639-1 코드나 영어 이름, 기본 `auto`)로 정한다. `auto`는 문자 체계(한글·가나·한자·키릴·그리스·아랍·히브리·태국·데바나가리)와 라틴 문자 언어의 기능어로 판별하고, 확신이 없으면 영어로 본다.

## 단일 작품

```bash
# 키: 데이터 폴더의 secrets.toml (웹 Settings 키 탭, 또는 위 "설정"의 형식)
subtitle-robot translate movie.ja.srt            # → movie.ko.srt
subtitle-robot translate movie.ja.ass            # → movie.ko.ass (스타일·위치 보존)
subtitle-robot translate film.fr.srt             # 프랑스어 → movie.ko.srt (원본 자동 판별)
subtitle-robot --target en translate movie.ja.srt   # → movie.en.srt
subtitle-robot analyze movie.en.srt              # 용어집만 만든다
subtitle-robot translate movie.srt --src en -o out.srt --work-dir ./work
```

입력은 SRT·ASS·SSA·WebVTT다. ASS 입력은 원본 파일에서 번역한 대사의 Text 만 바꾼 `.ko.ass`를 낸다: [Script Info]·스타일·시각·위치·앞 override 태그와 번역하지 않은 줄(주석·원본 언어가 아닌 줄)은 그대로다. 출력 형식은 `--format auto|srt|ass`(auto 는 `-o` 확장자, 없으면 입력 형식)로 바꾼다. 원본 폰트가 일본어 전용이면 한글이 다른 폰트로 대체될 수 있어 리포트에 알리고, `--ass-font "Noto Sans CJK KR"`로 스타일 폰트를 바꿀 수 있다. 노래(OP·ED·가라오케) 줄은 `lyrics` 정책을 따른다.

작업 폴더(기본: 입력 옆 `.subtitle-robot/<이름>/`, 대상이 한국어가 아니면 `<이름>-<대상>/`)에 용어집, 체크포인트, `report.json`이 남는다. 같은 명령을 다시 실행하면 번역된 부분은 LLM 요청 없이 재사용한다. 모델·프롬프트·설정이 바뀌었으면 종료 코드 3으로 멈추고 차이를 보여준다. 이때 `--redo-stale`(다시 번역) 또는 `--accept-stale`(이전 번역 유지)을 준다.

## 시리즈

시리즈는 폴더 하나에 에피소드 SRT를 두고, 마스터 용어집 하나를 전 에피소드가 같이 쓴다.

```bash
subtitle-robot series init ./MySeries --src ja        # series.toml·glossary.yaml 생성, 에피소드 인식
subtitle-robot series translate ./MySeries            # 분석 → 번역 (out/S01E01.ko.srt …)
subtitle-robot series review ./MySeries               # 검토 대기열 보기
subtitle-robot series lint ./MySeries                 # 전 에피소드 표기 일관성 검사
```

```text
MySeries/
├── series.toml        시리즈 설정 (언어·모드·표기 스타일·경칭·검토)
├── glossary.yaml      마스터 용어집
├── *.srt              에피소드 원본 (하위 폴더도 찾는다)
├── out/               번역 결과 S01E01.ko.srt …
└── work/              에피소드별 작업 폴더, series_state.json(검토 대기열), index.json(출현 인덱스)
```

**에피소드 인식**: 파일 이름의 `S01E01`, `1x01`, `E01`·`EP01`, `第1話`, 팬섭 이름(`Show - 01 (`, `Show_-_01_(`)을 읽는다. 인식하지 못한 파일은 `series.toml`의 `[[episodes]]`에 `id`와 `file`로 지정한다.

**모드** (`series.toml`의 `mode`):

| 모드 | 흐름 | 쓰임 |
|---|---|---|
| `prescan` (기본) | 전 에피소드 분석 → 전역 reconcile → 전 에피소드 번역 | 완결된 시즌 |
| `incremental` | 에피소드마다 분석 → 번역 | 방영 중인 시리즈 |

`--episodes S01E01-S01E06`으로 범위를 정할 수 있다. 이미 분석·번역한 에피소드는 다시 요청하지 않는다.

**검토**: 기본(`review = false`)은 자동으로 진행하고, 충돌·읽기 신뢰도 낮음·같은 엔티티로 보이는 항목(reconcile)을 검토 대기열에 제안으로 남긴다. `review = true`면 새 항목을 확정하기 전까지 그 항목이 나오는 에피소드를 번역하지 않는다.

```bash
subtitle-robot series review ./MySeries --set E0007=다나카     # 표기 수정 (locked, 이전 표기는 avoid)
subtitle-robot series review ./MySeries --accept E0003        # 지금 표기로 확정
subtitle-robot series review ./MySeries --promote E0012       # 시리즈 주요 인물로 (scope series)
subtitle-robot series review ./MySeries --dismiss E0010       # 제안만 닫기
subtitle-robot series review ./MySeries --accept-all
```

**부분 재번역**: 표기를 고치면 그 엔티티의 rev가 오른다. 이미 번역한 에피소드에서 바뀐 엔티티가 쓰인 unit만 다시 번역한다.

```bash
subtitle-robot series retranslate ./MySeries --changed          # rev가 바뀐 엔티티의 unit
subtitle-robot series retranslate ./MySeries --entity E0007     # 표기가 그대로여도 이 엔티티의 unit
```

**공식 이름**: 정발판 이름이 있으면 CSV로 가져온다([examples/official.example.csv](examples/official.example.csv), 필수 열 `source`, `ko`). 사람이 고친 표기는 덮어쓰지 않는다.

```bash
subtitle-robot glossary import ./MySeries official.csv
```

**인물 관계**: `glossary.yaml`의 `relations`에 인물 사이 호칭과 말투(`해요체`, `해체` 등)를 적으면, 두 인물이 함께 나오는 배치에 넣는다. 예시는 [examples/glossary.example.yaml](examples/glossary.example.yaml).

**직전 화 요약 (`story_so_far`, 기본 꺼짐)**: `series.toml`에서 `[story] enabled = true`로 켜면, 에피소드를 분석한 직후 원문으로 한국어 요약을 만들어 `work/<화>/summary.json`에 두고 번역할 때 직전 2화의 요약을 문맥으로 넣는다 (`episodes`·`max_tokens`). 화자 이름이 없는 자막으로 만든 요약은 인물 관계를 틀리게 적을 수 있어 기본으로 꺼 두었다. 요약을 고치면 그 요약을 넣어 번역한 부분이 `retranslate --changed` 대상이 된다.

**반복 대사 (`phrases`)**: 여러 화에 반복된 짧은 대사(인사·캐치프레이즈)의 첫 번역을 `phrases.yaml`에 모아, 그 대사가 있는 배치에 참고로 넣는다 (`[phrases]`). 확정한 번역을 쓰지 않으면 `series lint`가 warning 을 낸다.

```bash
subtitle-robot series review ./MySeries --phrases                   # 반복 대사 목록
subtitle-robot series review ./MySeries --phrase-set P0001=잘 먹겠습니다   # 번역 고치고 확정
subtitle-robot series review ./MySeries --phrase-accept P0002       # 지금 번역으로 확정
```

에피소드 파일은 SRT·ASS·SSA·VTT 모두 된다. ASS 에피소드의 결과는 `out/S01E01.ko.ass`다 (`[ass]` 의 `exclude_styles`·`font`).

대상 언어마다 용어집·반복 대사·작업 폴더가 따로 있다. 한국어는 `glossary.yaml`·`phrases.yaml`·`work/`, 다른 대상은 `glossary.<언어>.yaml`·`phrases.<언어>.yaml`·`work-<언어>/`이고 출력은 `out/S01E01.<언어>.srt`다. 한 작업공간에서 여러 대상 언어로 번역해도 서로 건드리지 않는다. 용어집 항목의 표기 필드는 `target`·`target_source`·`title_target`이다.

## 동영상 (MKV·MP4)

동영상의 텍스트 자막 트랙을 사이드카로 추출하고, 대상 언어 자막이 없으면 번역해 `<영상 이름>.<대상>.srt`(기본 `.ko.srt`)를 옆에 둔다. `mkvtoolnix`(mkvmerge·mkvextract)와 `ffmpeg`(ffprobe)가 필요하다. 동영상 파일은 읽기만 한다.

```bash
subtitle-robot probe "Movie (2020).mkv"                 # 트랙 목록·외부 자막·처리 기록
subtitle-robot media "Movie (2020).mkv" --foreground    # 바로 처리
subtitle-robot media /media/tv/Show --recursive         # 큐에 등록 (감시 데몬이 처리)
subtitle-robot media "Movie (2020).mkv" --force         # 처리 기록·외부 자막이 있어도 다시
subtitle-robot media revert "Movie (2020).mkv"          # 도구가 만든 자막 삭제, 이름 바꾼 자막 복원
```

- **추출**: `[media] extract_langs`(기본 en·ja·ko)의 텍스트 트랙과 대상 언어·원어·영어 트랙, 소스 후보 첫 트랙을 사이드카로 뽑는다 (`Movie.en.srt`, `Movie.en.2.srt`, `Movie.en.forced.srt`, `Movie.en.sdh.srt`, `Movie.ja.ass`). 이미지 자막(PGS·VobSub)은 추출하지 않는다
- **번역 판정**: 대상 언어 내장 트랙, `*.<대상>.*` 외부 자막(`fr`·`fre`·`fra`·`french` 모두), 언어 표시 없는 외부 자막의 내용이 대상 언어면 번역하지 않는다 (`has_target`)
- **외부 자막으로 번역**: 내장 텍스트 자막이 없으면(이미지 자막만 있어도) 영상 옆 외부 자막(SRT·ASS·SSA·VTT·SAMI)을 내장 트랙과 같은 순서(원어 → 영어 → 첫 후보)로 골라 번역한다. 언어는 파일 이름 표시(`Movie.en.srt`)로, 없으면 내용으로 정한다. 레거시 인코딩(CP949 등)도 읽는다. 내장 텍스트 자막이 있으면 지금처럼 내장 트랙만 쓴다
- **SAMI(.smi)**: 언어 클래스(`KRCC`·`ENCC` 등)마다 언어를 감지해 `<영상>.<언어>.srt`로 바꿔 둔다 (한국어 포함, 미디어 서버 호환). 같은 이름의 파일이 이미 있으면 그대로 두고, 바꾼 파일은 도구 출력으로 기록돼 `media revert`로 지운다. 한국어가 든 SAMI 는 대상 언어 자막으로 본다
- **소스 트랙**: 작품의 원어(TMDB 의 original language) 텍스트 트랙 → 없으면(원어를 모를 때 포함) **영어** 트랙 → 그것도 없으면 컨테이너 순서상 첫 텍스트 트랙이다 (대상 언어·forced·Signs/Songs 제외). 여러 언어가 든 릴리스는 첫 트랙이 아랍어 등인 경우가 있어 영어를 먼저 쓴다. 판정 사유에 고른 근거(`원어 트랙`·`영어 트랙`·`첫 트랙`)와 원어가 남는다
- **원어 조회 (TMDB)**: TMDB 키(v3 API 키 또는 v4 읽기 토큰, Settings 키 탭)가 있으면 쓴다. 파일·폴더 이름의 `{tmdb-123}`·`{tvdb-123}`·`{imdb-tt123}`(Plex·Jellyfin 이름 규칙)을 먼저 보고, 없으면 제목·연도로 검색한다. 영화는 `제목 (연도)` 폴더(Radarr·Plex 규칙) 안이면 그 폴더 이름을, 아니면 파일 이름에서 연도·해상도·릴리스 표시 앞까지를 쓴다 (`Godzilla.vs.Kong-2021-1080p…` → Godzilla vs Kong, 2021). 결과는 `/data/tmdb-cache.json`에 두고 찾지 못한 작품은 하루 뒤 다시 묻는다. 키가 없거나 조회가 실패하면 원어를 모르는 것으로 보고 영어 트랙, 없으면 첫 텍스트 트랙을 쓴다 (`[tmdb]`)
- **기존 외부 자막**: 같은 이름의 파일이 있으면 덮어쓰지 않고 `Movie.en.orig.srt`로 이름을 바꿔 보존한다 (`[sidecar]`)
- **시리즈**: 파일명에 `S01E02` 등이 있으면 `/data/series/<작품>/` 작업공간을 만들어 시리즈 용어집으로 번역한다. 작품 이름은 시즌 폴더 위 폴더 이름이다. 시즌 폴더는 괄호 표시를 떼고 알아보고(`Season 01`, `SEASON 02 [Group]`, `Season 1 (BD)`), 그 위가 감시 경로면 파일 이름 앞부분(`[Group] Show - S02E01 …` → Show)을 쓴다
- **출력 형식**: 번역 결과는 기본 `.<대상>.srt`다 (미디어 서버 호환). `[media] output_format = "ass"`면 ASS 트랙은 스타일을 보존한 `.<대상>.ass`, `"both"`면 둘 다
- **대상 언어를 바꾸면**: 새로 처리하는 영상부터 적용된다. 이미 처리한 영상은 Completed List 의 다시 처리(또는 `ledger forget`) 뒤 다시 번역한다
- **처리 기록(ledger)**: 처리한 영상은 다시 보지 않는다. Radarr·Sonarr가 옮기거나 이름을 바꿔도 내용으로 같은 영상임을 알아보고 사이드카만 복원한다

```bash
subtitle-robot queue list | retry [작업] | clear-failed
subtitle-robot ledger list | show <file> | forget <file> | export [file] | import <file>
```

데이터 폴더(state.db, 작업공간, 보관본)는 `--data` → `SUBTITLE_ROBOT_DATA` → `/data` 순으로 정한다. 작업이 끝나면 그 영상의 추출 트랙(`extract/`)과 영화 작업 파일(체크포인트·정규화 원문·번역 사본)을 지우고, 용어집·리포트와 시리즈 기록(`work/`·`out/`·`episodes/`, 반복 대사·일관성 검사가 다시 읽는다)은 남긴다. 실패한 작업의 파일은 진단용으로 남는다.

## 감시 데몬과 컨테이너

`subtitle-robot watch`는 `[[watch.paths]]`의 새 영상을 감지해 처리한다. 복사가 끝난 뒤(`stable_seconds`) 처리하고, 처음 시작할 때 있던 라이브러리는 백로그로 순서대로 처리한다 (외부 자막과 내장 텍스트 자막이 모두 있으면 건너뜀. 내장 자막이 없으면 외부 자막으로 번역한다). 시즌팩이 `series_window` 안에 들어오면 전 에피소드를 먼저 분석한 뒤 번역한다.

컨테이너 이미지는 Podman·Docker 둘 다 쓴다. Podman은 OCI 형식에서 HEALTHCHECK를 무시하므로 docker 형식으로 빌드한다.

```bash
scripts/build-images.sh latest     # 이미지 태그를 고른다 (아래 표). podman build --format docker -t subtitle-robot:latest . 와 같다
mkdir -p config data && cp examples/config.example.toml config/config.toml
podman compose up -d              # compose.yaml: /media, ./data, ./config 볼륨
# 웹 화면(http://<호스트>:8949)에서 관리 계정을 만들고 Settings → 키 탭(또는 구독 로그인)을 채운 뒤 적용(재기동)
podman exec subtitle-robot subtitle-robot queue list
```

### 이미지 태그

모든 태그에 Python 패키지·mkvtoolnix·ffmpeg·웹 화면이 들어 있고, 구독 CLI 는 태그마다 하나만 넣는다 (CLI 실행 파일이 커서, 2026-10-04 측정). 배포하는 이미지는 `latest` 하나다. `claude`·`codex`는 이 저장소에서 직접 빌드한다 (`CONTAINER_ENGINE=docker scripts/build-images.sh claude`처럼 Docker 로도 된다).

| 태그 | Dockerfile | 쓰는 공급자 | 더 들어 있는 것 | 크기 |
|---|---|---|---|---|
| `latest` | `Dockerfile` | API 키(NIM·OpenAI·Claude·Gemini·OpenRouter), llama-server, Ollama | 없음 | 258MB |
| `claude` | `Dockerfile.claude` | Claude 구독 (`[providers.claude] auth = "subscription"`) | Claude Code (Node 없음) | 507MB |
| `codex` | `Dockerfile.codex` | ChatGPT 구독 (`[providers.openai] auth = "subscription"`) | Codex + Node | 767MB |

```bash
scripts/build-images.sh                # 세 태그 모두
scripts/build-images.sh latest claude  # 고른 태그만
# 직접 빌드: podman build --format docker -t subtitle-robot:latest . 다음 -f Dockerfile.claude|.codex -t subtitle-robot:<태그> .
# CLI 버전 고정: BUILD_ARGS="--build-arg CLAUDE_CODE_VERSION=2.1.289" scripts/build-images.sh claude
```

- 기본 `Dockerfile`이 `latest`이고, `Dockerfile.claude`·`Dockerfile.codex`는 `latest` 위에 CLI 층만 쌓는다 (`--build-arg BASE_IMAGE=…`로 기본 이미지를 바꾼다). 스크립트는 CLI 태그를 빌드할 때 `latest`를 먼저 빌드한다
- 공급자를 구독으로 바꾸면 그 공급자의 태그로 이미지를 바꿔 띄운다 (데이터·설정 볼륨은 그대로)

- 데몬은 `PUID`/`PGID` 사용자로 돈다 (기본 1000). `/data`만 그 사용자 소유로 맞추고 미디어 볼륨은 건드리지 않는다. 미디어 폴더에 그 사용자가 쓸 수 있어야 사이드카를 만든다
- `exec`로 실행한 `subtitle-robot`도 같은 사용자로 낮춰 실행한다 (`/data`에 root 소유 파일이 생기지 않게)
- healthcheck는 워커 heartbeat(`subtitle-robot health`)를 본다
- 시간대는 Settings 웹 탭(`[system] timezone`)이 앞서고, 비우면 `TZ` 환경 변수다 (compose 기본 `Asia/Seoul`). 둘 다 없으면 UTC 로 `queue list`의 대기 시각·로그가 표시된다
- 추출은 자막 블록이 영상 전체에 흩어져 있어 영상 파일을 끝까지 읽는다. 다운로드 도구(SABnzbd 등)와 같은 디스크를 쓰면 서버가 느려지므로 검사·추출 도구를 낮은 우선순위(`ionice -c3`·`nice 19`, `[media] tool_priority = "low"` 기본)로 실행한다. I/O 우선순위는 디스크 스케줄러가 다룰 때(mq-deadline·BFQ)만 효과가 있다. 서버 전체를 지키려면 컨테이너에 자원 제한을 함께 건다 (rootful Quadlet 이면 `[Service]`의 `CPUQuota`·`MemoryMax`·`IOReadBandwidthMax`)
- 다운로드 도구가 압축을 푸는 중인 폴더(`[watch] exclude_dirs`, 기본 `_UNPACK_*`·`_FAILED_*`) 안의 파일은 감시하지 않는다. 처음 기동할 때 기존 라이브러리가 크면 `[watch] scan_existing = false`로 두고 나눠 등록할 수 있다
- 종료(`podman stop`)하면 진행 중인 LLM 요청 하나를 끝내고 멈추며(실행 중인 검사·추출 도구는 바로 끝낸다), 작업은 다음 기동 때 이어서 처리한다. 요청은 최대 300초(클라우드 공급자 기본 제한 시간) 걸리므로 `podman stop -t 300`(`podman run --stop-timeout 300`, compose 는 `stop_grace_period: 5m`)을 쓴다. 기본 10초면 강제 종료되지만 체크포인트로 이어서 처리하므로 결과는 같다
- 시리즈 폴더의 새 화는 `[media] series_window`(기본 600초) 동안 같은 작품의 다른 화를 기다렸다가 함께 처리한다. 기다리는 동안 `queue list`에 `대기 HH:MM:SS까지`로 보인다
- llama-server는 compose에 넣지 않고 따로 띄운다. 같은 호스트에서 쓰는 방법은 둘이다
  - llama-server가 `127.0.0.1`에만 열려 있으면 컨테이너에서 `host.docker.internal`·`host.containers.internal`로 닿지 않는다 (rootless Podman에서 확인). 컨테이너를 호스트 네트워크로 띄우고(`--network host`, compose는 `network_mode: host`) `base_url = "http://127.0.0.1:8080/v1"`
  - 또는 llama-server를 `--host 0.0.0.0 --api-key <키>`로 띄우고 `base_url = "http://host.docker.internal:8080/v1"`, 키는 Settings 키 탭의 llama-server 키

## 웹 화면

감시 데몬(`watch`)은 웹 운영 화면을 함께 띄운다 (기본 포트 8949, `[web] enabled`). 처음 접속하면 Sonarr·Radarr 처럼 관리 계정(사용자 이름·비밀번호 8자 이상)을 만드는 **처음 설정** 화면이 열린다. 계정을 만들기 전에는 누구나 이 화면을 열 수 있으므로 띄운 뒤 바로 만든다. 공급자 키가 없어도 데몬은 웹 화면을 띄운다 (번역 워커는 키를 넣고 재기동한 뒤 시작한다).

| 메뉴 | 내용 |
|---|---|
| Dashboard | 데몬(heartbeat)·공급자 상태, 대기·실패·처리 기록 개수, 대상 언어·원어 조회 사용 여부, 감시 경로 |
| Queue List | 대기·처리 중·실패 작업, 재시도·실패 지우기, **동영상 등록**(감시 경로 안의 파일·폴더) |
| Completed List | 처리 기록(판정·사유·출력 파일), 상세, 다시 처리(기록 지우기) |
| Logs | 데몬 로그(`/data/logs/daemon.log`, 5MB × 3 회전), 레벨 필터·자동 갱신 |
| Settings | `config.toml` 편집·저장(주석 보존), 공급자 7개 중 고른 공급자 설정·**모델 목록**에서 고르기·**인증 방식**(API 키/구독)과 구독 로그인, **번역** 탭에서 대상 언어(검색)·TMDB 사용, **웹** 탭에서 시간대(검색), **키** 탭(공급자·TMDB 키, 끝 4자리만 보임), **계정** 탭(사용자 이름·비밀번호 변경), **적용**(데몬 재기동) |

- 로그인: 처음 설정에서 만든 사용자 이름과 비밀번호(scrypt 해시로 `secrets.toml`에 저장). 세션은 서명한 HttpOnly 쿠키이고 `[web] session_hours`(기본 168시간) 동안 유지된다. 계정 탭에서 비밀번호를 바꾸면 모든 세션이 끝난다. 비밀번호를 잊으면 데이터 폴더 `secrets.toml`의 `[account]` 표를 지우고 다시 처음 설정을 한다
- 화면은 한국어·영어, 라이트·다크 테마를 메뉴 아래에서 바꾼다 (브라우저에 저장)
- Settings 로 저장하려면 config 볼륨을 쓰기 가능으로 마운트한다 (`:ro`이면 보기 전용). 설정은 시작할 때 읽으므로 **적용**을 눌러 데몬을 재기동한다. 데몬은 종료 코드 4로 끝나고 컨테이너 재시작 정책(compose `restart: unless-stopped`, `podman run --restart=always`, Quadlet `Restart=always`)이 다시 띄운다. 재시작 정책이 없으면 다시 뜨지 않는다
- HTTPS 는 리버스 프록시에 맡긴다 (세션 쿠키에 `Secure`를 붙이지 않아 LAN HTTP 에서도 로그인된다)
- 판정 사유·작업 오류·로그 메시지는 데몬이 만든 한국어 문장이라 영어 화면에서도 한국어로 보인다

compose 는 `ports: ["8949:8949"]`과 쓰기 가능한 config 볼륨으로 띄운다. Podman 을 직접 쓰면 (rootless, 미디어 소유자 계정으로):

```bash
podman run -d --name subtitle-robot --userns=keep-id --restart=always --stop-timeout 300 \
  -e TZ=Asia/Seoul -p 8949:8949 \
  -v /srv/media:/media -v ./data:/data -v ./config:/config \
  subtitle-robot:latest
```

- rootless Podman 에서는 `PUID`/`PGID` 대신 `--userns=keep-id`로 호스트 계정과 같은 사용자로 돌린다 (자막·설정 파일이 그 계정 소유가 된다)
- `--restart=always`는 데몬이 끝났을 때(적용 버튼) 다시 띄우지만 호스트 재부팅 뒤에는 시작하지 않는다. 재부팅 뒤에도 띄우려면 systemd Quadlet(`~/.config/containers/systemd/subtitle-robot.container`에 `PublishPort=8949:8949`, `Restart=always`, `loginctl enable-linger`)을 쓴다
- 호스트의 inotify 감시 한도(`fs.inotify.max_user_watches`)가 다른 프로그램 때문에 차 있으면 자동으로 polling 으로 감시한다 (로그 `inotify unavailable … falling back to polling`). polling 은 주기 스캔이라 감지가 조금 늦다. 한도를 올리거나 처음부터 `[watch] polling = true`를 쓸 수 있다

### 운영 예: rootful Quadlet, pod, 리버스 프록시

다른 미디어 컨테이너(Sonarr·Radarr·Bazarr·다운로드 도구)와 함께 도는 서버에서 쓴 구성이다 (2026-10-04, Debian 13·Podman 5.4).

```ini
# /etc/containers/systemd/subtitle-robot.container
[Unit]
Description=Subtitle Robot (scanner pod)
After=network-online.target

[Container]
Image=localhost/subtitle-robot:latest
ContainerName=subtitle-robot
# Sonarr 등과 같은 pod. 포트는 열지 않고 리버스 프록시가 넘긴다
Pod=scanner.pod
Environment=PUID=1000
Environment=PGID=1000
Environment=TZ=Asia/Seoul
Volume=/srv/data1/podman/subtitle-robot/data:/data
Volume=/srv/data1/podman/subtitle-robot/config:/config
# Sonarr·Radarr 라이브러리 (/media/tv, /media/movie)
Volume=/srv/data2/scanner:/media
PidsLimit=512
StopTimeout=300

[Service]
Restart=always
TimeoutStopSec=330
# 다른 서비스와 자원을 나눈다. 추출이 미디어 디스크를 독점하지 않게 읽기 대역폭도 묶는다
MemoryMax=1G
CPUQuota=100%
CPUWeight=50
IOReadBandwidthMax=/srv/data2 40M

[Install]
WantedBy=multi-user.target
```

- 데이터·설정은 미디어와 다른 디스크에 둔다. 미디어 디스크는 다운로드 도구와 같이 쓰는 경우가 많다
- 리버스 프록시(Caddy)로 하위 경로에 연다. 화면은 상대 경로만 쓰므로 경로를 떼고 넘긴다 (Sonarr 처럼 URL Base 설정이 없다):

  ```caddy
  redir /subtitle-robot /subtitle-robot/ 308
  handle_path /subtitle-robot/* {
      reverse_proxy scanner:8949
  }
  ```

- 같은 라이브러리를 Bazarr 가 함께 쓰면 `[sidecar] on_conflict = "skip"`(같은 이름의 자막이 있으면 쓰지 않음)을 권한다
- 메모리 상한에는 영상을 읽으며 생긴 파일 캐시도 포함된다. 실제 프로세스 메모리는 약 60MB 이고, 상한에 닿으면 이 컨테이너의 캐시만 비운다
- 호스트에서 `localhost`가 IPv6(`::1`)로 풀리는데 rootless Podman 포트(pasta)로 접속이 끊기면 `[web] host = ""`(IPv4·IPv6 모두)로 둔다

## 종료 코드

| 코드 | 뜻 |
|---|---|
| 0 | 성공 |
| 1 | 실행 실패: LLM 오류, 검토 대기 때문에 번역하지 못한 에피소드, `series lint` error |
| 2 | 설정·입력 오류 (설정 파일, 인코딩·언어 감지 실패, `series.toml` 없음, 잘못된 인자) |
| 3 | 설정이 바뀌어 이어 실행을 멈춤 (`--redo-stale` / `--accept-stale`) |
| 4 | `watch`: 웹 화면의 적용(재기동) 요청으로 끝남 (재시작 정책이 다시 띄운다) |

## 제한

- ASS 출력에서 문장 가운데의 override 태그(`{\i1}…{\i0}`)는 보존하지 못한다 (줄 앞 태그는 보존). SRT 안의 ASS override 태그도 줄 앞 것만 보존한다.
- 원본 언어가 아닌 블록(예: 일본어 자막 속 중국어 주석)은 번역하지 않고 그대로 둔다.
- 음성 인식, 이미지 자막 OCR은 범위 밖이다.

## 문서

| 문서 | 내용 |
|---|---|
| `guide/HowToCloud.md` | 클라우드 LLM 계정 설정 (Claude·ChatGPT 구독, Gemini API 키) |
| `guide/OVERVIEW.md` | 컨테이너 이미지 소개·실행 방법 (Docker Hub 개요, 영어판 `OVERVIEW.en.md`) |

## 라이선스

[MIT](LICENSE). 함께 배포하는 제3자 소프트웨어(Python 패키지, 웹 화면 번들, 이미지의 Alpine 패키지·mkvtoolnix·ffmpeg, 구독용 CLI)는 각자의 라이선스를 따른다: [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

<img src="web/src/assets/tmdb-logo.svg" alt="TMDB" height="14">

이 프로그램은 TMDB 와 TMDB API 를 사용하지만 TMDB 의 보증·인증·승인을 받지 않았다 (This program uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.)

## 개발

```bash
uv sync
uv run ruff check && uv run ruff format --check
uv run mypy
uv run pytest
uv run python scripts/llm_smoke.py      # 공급자 실측 1회 (키·서버 필요)
```

웹 화면(`web/`, Vue 3 + Vite + TypeScript)은 UI 프레임워크 vue-smartview 의 배포본(`web/vendor/vue-smartview/dist`)을 쓴다. 원본 저장소는 공개하지 않고, 화면이 쓰는 요소만 담은 빌드 결과를 저장소에 둔다. 새 요소를 쓰려면 원본 저장소가 필요하다 (`scripts/update-smartview.sh <원본 체크아웃>`). 번들에는 쓰는 요소만 들어간다: 화면에 새 `smartview-*` 요소를 쓰면 `web/src/elements.ts`에 그 진입점 import 를 더한다 (`npm test`가 빠진 요소를 찾는다).

```bash
cd web && npm ci
npm run typecheck && npm run lint && npm test && npm run build   # 결과는 web/dist ([web] static_dir 로 지정)
npm run dev        # 개발 서버: /api 를 http://127.0.0.1:8949 (SUBTITLE_ROBOT_WEB_URL) 의 데몬으로 넘긴다
npm run test:e2e   # 빌드 + Playwright E2E·녹화 (데몬을 새 데이터로 띄운다). 결과 docs/e2e/, 정지 구간: bash e2e/check-freeze.sh (호스트)
```

테스트는 가짜 LLM 어댑터를 써서 네트워크 없이 돈다.
