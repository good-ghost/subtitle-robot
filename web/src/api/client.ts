// 데몬 API 호출. 세션은 HttpOnly 쿠키라 스크립트가 토큰을 다루지 않는다 (PROJECT-PLAN §25.3).
import type {
  AuthMode,
  BrowseResult,
  DaemonStatus,
  DeviceLogin,
  FieldError,
  Job,
  JobStatus,
  LedgerEntry,
  LogChunk,
  LogLevel,
  LoginStatus,
  ProviderName,
  QueuedJob,
  SecretState,
  SessionState,
  SettingsState,
  SettingsValues,
  SubscriptionProvider,
  Verdict,
} from './types'

/** API 오류. code 는 서버 detail 코드(화면이 번역한다), errors 는 설정 검증 오류, detail 은 보조 설명. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly errors: FieldError[] = [],
    readonly detail = '',
  ) {
    super(`${status} ${code}`)
    this.name = 'ApiError'
  }
}

let unauthorizedHandler: (() => void) | null = null

/** 로그인이 풀렸을 때(401) 부를 함수. 앱이 로그인 화면으로 돌아간다. */
export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

type Query = Record<string, string | number | boolean | string[] | undefined>

function queryString(query: Query | undefined): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, String(item))
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}

export async function parseError(response: Response): Promise<ApiError> {
  let detail: unknown = undefined
  try {
    detail = ((await response.json()) as { detail?: unknown }).detail
  } catch {
    // 본문이 JSON 이 아니다 (프록시 오류 페이지 등): 상태 코드로만 알린다
  }
  if (typeof detail === 'string') return new ApiError(response.status, detail)
  if (detail && typeof detail === 'object' && 'code' in detail) {
    const { code, errors, detail: extra } = detail as { code: string; errors?: FieldError[]; detail?: unknown }
    return new ApiError(response.status, code, errors ?? [], typeof extra === 'string' ? extra : '')
  }
  return new ApiError(response.status, `http_${response.status}`)
}

async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
  // 쓰기 요청은 JSON 만 받는다 (서버가 다른 형식을 415 로 거절한다)
  const headers: Record<string, string> = method === 'GET' ? {} : { 'Content-Type': 'application/json' }
  // 상대 경로: 리버스 프록시의 하위 경로에서도 같은 위치의 API 를 부른다
  const response = await fetch(`api/${path}${queryString(query)}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
  })
  if (!response.ok) {
    const error = await parseError(response)
    if (response.status === 401 && path !== 'session') unauthorizedHandler?.()
    throw error
  }
  return (await response.json()) as T
}

export const api = {
  session: () => request<SessionState>('GET', 'session'),
  // 처음 설정: 관리 계정 만들기 (§28.3)
  setup: (username: string, password: string) =>
    request<SessionState>('POST', 'session/setup', { username, password }),
  account: () => request<{ username: string | null }>('GET', 'account'),
  saveAccount: (currentPassword: string, username: string, newPassword: string | null) =>
    request<{ username: string | null }>('PUT', 'account', {
      current_password: currentPassword,
      username,
      new_password: newPassword,
    }),
  // 키 (§28.2): 값은 보내기만 하고 받지 않는다
  secrets: () => request<SecretState[]>('GET', 'secrets'),
  saveSecret: (key: string, value: string | null) => request<SecretState>('PUT', 'secrets', { key, value }),
  login: (username: string, password: string) => request<SessionState>('POST', 'session', { username, password }),
  logout: () => request<SessionState>('DELETE', 'session'),
  status: () => request<DaemonStatus>('GET', 'status'),
  jobs: (status?: JobStatus[]) => request<Job[]>('GET', 'jobs', undefined, { status }),
  retry: (jobId?: number) => request<{ count: number }>('POST', 'jobs/retry', { job_id: jobId ?? null }),
  clearFailed: () => request<{ count: number }>('POST', 'jobs/clear-failed'),
  ledger: (verdict: Verdict | undefined, history: boolean) =>
    request<LedgerEntry[]>('GET', 'ledger', undefined, { verdict, history }),
  forget: (path: string) => request<{ count: number }>('POST', 'ledger/forget', { path }),
  // 감시 경로 안의 폴더 내용. path 가 없으면 감시 경로 목록 (WI-7.004d)
  browse: (path: string | null) => request<BrowseResult>('GET', 'browse', undefined, { path: path ?? undefined }),
  registerMedia: (path: string, recursive: boolean, force: boolean) =>
    request<QueuedJob[]>('POST', 'media', { path, recursive, force }),
  logs: (level: LogLevel, after: string | undefined, limit?: number) =>
    request<LogChunk>('GET', 'logs', undefined, { level, after, limit }),
  settings: () => request<SettingsState>('GET', 'settings'),
  saveSettings: (values: SettingsValues) => request<SettingsState>('PUT', 'settings', { values }),
  restart: () => request<{ restarting: boolean }>('POST', 'daemon/restart'),
  // 공급자 모델 목록 (PROJECT-PLAN §27.3). baseUrl 은 아직 저장하지 않은 주소
  providerModels: (name: ProviderName, baseUrl: string, auth: AuthMode = 'api_key') =>
    request<{ models: string[] }>('GET', `providers/${name}/models`, undefined, { base_url: baseUrl, auth }),
  subscriptions: () => request<LoginStatus[]>('GET', 'subscriptions'),
  saveSubscription: (provider: SubscriptionProvider, credential: string) =>
    request<LoginStatus>('PUT', `subscriptions/${provider}`, { credential }),
  clearSubscription: (provider: SubscriptionProvider) => request<LoginStatus>('DELETE', `subscriptions/${provider}`),
  deviceLogin: () => request<DeviceLogin>('GET', 'subscriptions/openai/device'),
  startDeviceLogin: () => request<DeviceLogin>('POST', 'subscriptions/openai/device', {}),
  cancelDeviceLogin: () => request<DeviceLogin>('DELETE', 'subscriptions/openai/device'),
}
