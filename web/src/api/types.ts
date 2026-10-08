// 데몬 API 응답 모양 (src/subtitle_robot/web/*.py 의 pydantic 모델과 같다, PROJECT-PLAN §25.4)

export interface SessionState {
  authenticated: boolean
  username: string | null
  // 관리 계정이 아직 없다: 처음 설정 화면 (PROJECT-PLAN §28.3)
  setup_required: boolean
}

// 키 하나의 상태 (값은 내려오지 않는다, §28.2)
export interface SecretState {
  key: string
  set: boolean
  hint: string | null
}

export type JobStatus = 'queued' | 'probing' | 'extracting' | 'translating' | 'done' | 'skipped' | 'failed'

export interface ProviderStatus {
  name: string
  model: string
  state: string
  reason: string
}

export interface DaemonStatus {
  version: string
  // 데몬 시작 시각 (epoch 초). 재기동 완료 판단에 쓴다
  started_at: number
  healthy: boolean
  heartbeat_age_s: number | null
  heartbeat_max_age_s: number
  provider: ProviderStatus
  queue: Record<JobStatus, number>
  // 처리 기록 개수 (Completed List)
  completed: number
  watch_enabled: boolean
  watch_paths: { path: string; kind: string }[]
  // 번역 대상 언어 (ISO 639-1)와 원어 조회(TMDB) 사용 여부 (PROJECT-PLAN §26)
  target_language: string
  tmdb_active: boolean
}

export interface Job {
  id: number
  path: string
  name: string
  status: JobStatus
  priority: string
  force: boolean
  attempts: number
  next_attempt_at: number
  error: string | null
  kind: string | null
  verdict: string | null
  reason: string | null
  outputs: string[]
  /** 번역 중일 때 끝낸 블록 / 전체 블록 (WI-7.004c) */
  progress: { done: number; total: number } | null
  created_at: number
  updated_at: number
}

// has_korean 은 0.6.0 전 기록의 값 (지금은 has_target)
export type Verdict =
  | 'translated'
  | 'has_target'
  | 'has_korean'
  | 'has_external'
  | 'no_source'
  | 'image_only'
  | 'failed'

export interface LedgerEntry {
  id: number
  content_id: string
  path: string
  name: string
  verdict: Verdict
  reason: string
  source: Record<string, unknown>
  provider: string | null
  model: string | null
  outputs: string[]
  renames: { original: string; renamed: string }[]
  attempts: number
  current: boolean
  processed_at: number
  updated_at: number
}

/** 동영상 등록 화면의 폴더 목록 (WI-7.004d). path 가 null 이면 감시 경로 목록 */
export interface BrowseResult {
  path: string | null
  parent: string | null
  entries: { name: string; path: string; kind: 'dir' | 'video' }[]
  truncated: boolean
}

export interface QueuedJob {
  id: number
  path: string
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

export interface LogEntry {
  time: string
  level: string
  thread: string
  logger: string
  message: string
}

export interface LogChunk {
  entries: LogEntry[]
  cursor: string
  reset: boolean
}

// LLM 공급자 (PROJECT-PLAN §27.1)
export type ProviderName = 'nim' | 'local' | 'ollama' | 'openrouter' | 'openai' | 'claude' | 'gemini'
// subscription 이면 API 대신 공식 CLI 를 구독 로그인으로 실행한다 (claude·openai, §28.1). Gemini 는 API 키만 (WI-10.009g)
export type AuthMode = 'api_key' | 'subscription'
export type SubscriptionProvider = 'claude' | 'openai'

// 구독 로그인 상태. 자격 값은 오지 않는다 (Claude 토큰은 끝 4자리 힌트)
export interface LoginStatus {
  provider: SubscriptionProvider
  logged_in: boolean
  hint: string | null
  // 자격 파일을 쓴 시각 (유닉스 초)
  updated_at: number | null
  // 이 이미지에 CLI 가 있는지 (없으면 공급자별 이미지 태그가 필요하다)
  cli_available: boolean
}

// Codex 기기 코드 로그인
export interface DeviceLogin {
  state: 'idle' | 'waiting' | 'done' | 'failed'
  url: string | null
  code: string | null
  error: string | null
}

export interface ProviderValues {
  base_url: string
  model: string
  pass1_model: string
  rpm: number
  concurrency: number | 'auto'
  timeout: number
  // null 이면 보내지 않는다 (OpenAI 추론 모델)
  temperature: number | null
  max_output_tokens: number
  // null 이면 공급자 정보·기본값
  context_tokens: number | null
  auth: AuthMode
}

export interface SettingsValues {
  llm: { provider: ProviderName }
  // 파일에 없는 공급자는 기본값에 빈 base_url 로 온다
  providers: Record<ProviderName, ProviderValues>
  retry: { max_retries_unit: number; max_retries_batch: number }
  translation: { target_language: string }
  system: { timezone: string }
  tmdb: { enabled: boolean; timeout: number }
  watch: {
    enabled: boolean
    scan_existing: boolean
    backlog_order: 'newest' | 'path'
    backlog_skip_if_external: boolean
    reconcile_interval: number
    stable_seconds: number
    polling: boolean
    polling_interval: number
    include: string[]
    exclude: string[]
    exclude_dirs: string[]
    paths: { path: string; kind: 'movie' | 'series' | 'auto' }[]
  }
  media: {
    extract_langs: string[]
    skip_forced: boolean
    target_image_counts: boolean
    output_mode: 'sidecar' | 'mirror'
    output_format: 'srt' | 'ass' | 'both'
    output_root: string
    series_window: number
    tool_priority: 'low' | 'normal'
    ocr: boolean
    ocr_workers: number
  }
  sidecar: { on_conflict: 'rename' | 'skip'; rename_style: 'orig' | 'backup' }
  ledger: { hash_bytes: number; restore_missing_outputs: boolean }
  queue: { workers: number; max_attempts: number }
  web: { enabled: boolean; host: string; port: number; session_hours: number }
}

export interface SettingsState {
  path: string | null
  writable: boolean
  reason: 'no_config_file' | 'read_only' | null
  restart_pending: boolean
  values: SettingsValues
  // 대상 언어로 고를 수 있는 언어 (ISO 639-1 과 영어 이름)
  languages: { code: string; name: string }[]
  // 시간대로 고를 수 있는 IANA 이름 (§28.4)
  timezones: string[]
  // 이 이미지에 CLI 가 있어 구독으로 쓸 수 있는 공급자 (latest 는 빈 목록)
  subscription_clis: SubscriptionProvider[]
}

export interface FieldError {
  loc: string
  message: string
  // pydantic 오류 종류와 기준값 (화면이 문구를 번역한다)
  type?: string
  ctx?: Record<string, string>
}
