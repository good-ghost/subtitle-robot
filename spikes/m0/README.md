# M0 모델 스파이크

PROJECT-PLAN §16 M0. Pass 2 형태의 요청(unit 번역 → 원래 idx로 재분리, JSON 출력)을 공급자 × 모델 × 출력 방식 × 언어 조합마다 보내고 **기술 지표만** 측정한다. 본 구현과 코드를 공유하지 않는 독립 스크립트다(PEP 723 인라인 의존성).

## 준비

| 항목 | 설정 |
|---|---|
| NIM | 컨테이너 셸에서 `NVIDIA_API_KEY`를 export한다 (없으면 nim은 건너뜀) |
| llama-server | `--jinja --alias Qwen3.8-27B-UD-Q4_K_XL`로 띄우고 `m0.toml`의 `[providers.local].base_url`에 주소를 넣는다. `--api-key`를 쓰면 `LLAMA_API_KEY`도 export |
| 일본어 샘플 | `m0.toml`의 `lang = "ja"` 항목 `path`에 200블록 이상 SRT 경로를 넣는다 |

## 실행

```bash
distrobox enter gen-dev -- bash -lic 'cd /home/woomg/WebDEV/Python/SUB_ROBOT && uv run spikes/m0/m0_spike.py --dry-run'   # 샘플·unit·배치 구성만 확인
distrobox enter gen-dev -- bash -lic 'cd /home/woomg/WebDEV/Python/SUB_ROBOT && uv run spikes/m0/m0_spike.py --max-batches 1'  # 조합당 1배치로 빠른 확인
distrobox enter gen-dev -- bash -lic 'cd /home/woomg/WebDEV/Python/SUB_ROBOT && uv run spikes/m0/m0_spike.py'                  # 전체
```

- `--only nim|local`, `--lang en|ja`로 범위를 줄인다.
- 결과는 `spikes/m0/results/<시각>/`에 남는다: `report.md`(요약 표), `metrics.json`(배치별 상세), `raw/*.jsonl`(요청·응답 원문, 인증 헤더 제외), `outputs/*.ko.srt`(눈으로 확인용).
- 실행할 조합이 하나도 없으면(키·서버 미설정) 종료 코드 2.

## 테스트

```bash
distrobox enter gen-dev -- bash -lic 'cd /home/woomg/WebDEV/Python/SUB_ROBOT && uv run --no-project --with httpx --with pydantic --with pytest pytest spikes/m0 -q'
```

실제 공급자를 부르지 않고 `httpx.MockTransport`로 출력 방식 거부(400), 코드펜스·`<think>`, idx 누락, 429 재시도, 원문 잔존, llama-server `/props`·로딩 503·alias 불일치를 흉내 낸다.

## 측정 범위와 한계

- 출력 방식: `json_schema`(response_format), `guided_json`(NIM `nvext`), `json_object`, `prompt`(제약 없음). 첫 배치가 400/422면 "미지원"으로 기록한다. 서버가 제약을 조용히 무시하는 경우는 구분하지 못하므로 `JSON(원문) %`와 펜스 수를 함께 본다.
- 오류 재시도는 HTTP 429/5xx/타임아웃만 한다. JSON·idx 오류는 재시도하지 않고 원래 발생률을 잰다.
- unitizer와 배처는 측정용 단순 버전이다 (unit 상한은 §10.1 기본값, 배치는 블록 수 기준 40). 토큰 예산 배처는 M6.
- 용어집이 없으므로 원문 잔존(error)에는 번역하지 않은 이름도 포함된다. 리포트의 `residual_examples`로 확인한다.
