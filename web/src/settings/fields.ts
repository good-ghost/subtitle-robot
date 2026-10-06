// Settings 화면의 필드 정의 (PROJECT-PLAN §25.9). path 는 values 안의 점 경로이고 서버 검증 오류 loc 과 같다.
import type { AuthMode, SubscriptionProvider } from '../api/types'
import type { MessageKey } from '../i18n'

export type FieldKind = 'text' | 'readonly' | 'number' | 'numberOrText' | 'toggle' | 'select' | 'tags' | 'chips' | 'paths'

export interface FieldOption {
  value: string
  // literal 이 아니면 번역 키 (MessageKey)
  label: string
  // label 이 번역 키가 아니라 그대로 보일 글자일 때 (언어 코드 등)
  literal?: boolean
}

// 화면이 실행 중에 채우는 선택지 (서버가 주는 목록)
export type DynamicOptions = 'languages' | 'timezones'


export interface SettingField {
  path: string
  kind: FieldKind
  label: MessageKey
  hint?: MessageKey
  suffix?: MessageKey
  options?: FieldOption[]
  // 선택지를 서버 응답으로 채운다 (options 대신)
  dynamicOptions?: DynamicOptions
  // 글자를 쳐서 선택지를 거른다 (긴 목록)
  searchable?: boolean
  // 숫자 칸을 비우면 null (없음)로 보낸다
  nullable?: boolean
  // 옆에 공급자 모델 목록 버튼을 둔다 (§27.3)
  modelPicker?: boolean
}

export type SettingsTab = 'provider' | 'translation' | 'watch' | 'media' | 'queue' | 'web' | 'keys' | 'account'
export const TABS: SettingsTab[] = ['provider', 'translation', 'watch', 'media', 'queue', 'web', 'keys', 'account']
// 키·계정 탭은 config.toml 칸이 아니라 자기 저장 버튼이 있는 패널이다 (§28.2, §28.3)
export type FieldTab = Exclude<SettingsTab, 'provider' | 'keys' | 'account'>
export const FIELD_TABS: FieldTab[] = ['translation', 'watch', 'media', 'queue', 'web']
export const PROVIDERS = ['nim', 'local', 'ollama', 'openrouter', 'openai', 'claude', 'gemini'] as const
// 구독 계정(공식 CLI)으로도 쓸 수 있는 공급자 (§28.1)
export const SUBSCRIPTION_PROVIDERS: readonly SubscriptionProvider[] = ['openai', 'claude']
// 구독 CLI 에 넘길 방법이 없는 칸 (구독이면 숨긴다)
const API_ONLY_FIELDS = new Set(['base_url', 'temperature', 'max_output_tokens'])

export function isSubscriptionProvider(name: string): name is SubscriptionProvider {
  return (SUBSCRIPTION_PROVIDERS as readonly string[]).includes(name)
}

function authField(base: string): SettingField {
  return {
    path: `${base}.auth`, kind: 'select', label: 'settings.provider.auth', hint: 'settings.provider.authHint',
    options: [
      { value: 'api_key', label: 'settings.provider.authApiKey' },
      { value: 'subscription', label: 'settings.provider.authSubscription' },
    ],
  }
}

/** 공급자 카드의 모든 칸 (오류 위치 찾기·문구 검사에 쓴다). */
export function providerFields(name: (typeof PROVIDERS)[number]): SettingField[] {
  const base = `providers.${name}`
  return [
    ...(isSubscriptionProvider(name) ? [authField(base)] : []),
    {
      path: `${base}.base_url`, kind: 'text', label: 'settings.provider.base_url',
      hint: name === 'local' ? 'settings.provider.localHint' : undefined,
    },
    { path: `${base}.model`, kind: 'text', label: 'settings.provider.model', modelPicker: true },
    { path: `${base}.pass1_model`, kind: 'text', label: 'settings.provider.pass1_model' },
    { path: `${base}.rpm`, kind: 'number', label: 'settings.provider.rpm' },
    { path: `${base}.concurrency`, kind: 'numberOrText', label: 'settings.provider.concurrency' },
    { path: `${base}.timeout`, kind: 'number', label: 'settings.provider.timeout', suffix: 'settings.unit.seconds' },
    {
      path: `${base}.temperature`, kind: 'number', label: 'settings.provider.temperature',
      hint: 'settings.provider.temperatureHint', nullable: true,
    },
    { path: `${base}.max_output_tokens`, kind: 'number', label: 'settings.provider.max_output_tokens' },
    {
      path: `${base}.context_tokens`, kind: 'number', label: 'settings.provider.context_tokens',
      hint: 'settings.provider.context_tokensHint', nullable: true,
    },
  ]
}

/**
 * 인증 방식과 이미지에 따라 보이는 칸.
 * - 이 이미지에 그 공급자의 구독 CLI 가 없으면 인증 방식 칸을 숨긴다 (API 키만, latest 이미지).
 *   이미 구독으로 저장돼 있으면 API 키로 되돌릴 수 있게 남긴다 (구독 카드가 필요한 이미지 태그를 알린다)
 * - 구독이면 CLI 에 넘기지 않는 API 전용 칸을 숨긴다
 */
export function visibleProviderFields(
  name: (typeof PROVIDERS)[number],
  auth: AuthMode | undefined,
  subscriptionClis: readonly string[],
): SettingField[] {
  const canSubscribe = subscriptionClis.includes(name) || auth === 'subscription'
  const fields = providerFields(name).filter((field) => canSubscribe || !field.path.endsWith('.auth'))
  if (auth !== 'subscription') return fields
  return fields.filter((field) => !API_ONLY_FIELDS.has(field.path.split('.').at(-1) ?? ''))
}

export const PROVIDER_CHOICE: SettingField = {
  path: 'llm.provider', kind: 'select', label: 'settings.llm.provider', hint: 'settings.llm.providerHint',
  options: PROVIDERS.map((value) => ({ value, label: `settings.provider.${value}` })),
}

const KINDS: FieldOption[] = [
  { value: 'movie', label: 'kind.movie' },
  { value: 'series', label: 'kind.series' },
  { value: 'auto', label: 'kind.auto' },
]
export const WATCH_KINDS = KINDS

export const TAB_FIELDS: Record<FieldTab, SettingField[]> = {
  translation: [
    {
      path: 'translation.target_language', kind: 'select', label: 'settings.translation.target_language',
      hint: 'settings.translation.target_languageHint', dynamicOptions: 'languages', searchable: true,
    },
    { path: 'tmdb.enabled', kind: 'toggle', label: 'settings.tmdb.enabled', hint: 'settings.tmdb.enabledHint' },
    { path: 'tmdb.timeout', kind: 'number', label: 'settings.tmdb.timeout', suffix: 'settings.unit.seconds' },
  ],
  watch: [
    { path: 'watch.enabled', kind: 'toggle', label: 'settings.watch.enabled' },
    { path: 'watch.scan_existing', kind: 'toggle', label: 'settings.watch.scan_existing' },
    { path: 'watch.backlog_skip_if_external', kind: 'toggle', label: 'settings.watch.backlog_skip_if_external' },
    { path: 'watch.polling', kind: 'toggle', label: 'settings.watch.polling' },
    { path: 'watch.polling_interval', kind: 'number', label: 'settings.watch.polling_interval', suffix: 'settings.unit.seconds' },
    {
      path: 'watch.backlog_order', kind: 'select', label: 'settings.watch.backlog_order',
      options: [
        { value: 'newest', label: 'settings.watch.order.newest' },
        { value: 'path', label: 'settings.watch.order.path' },
      ],
    },
    { path: 'watch.reconcile_interval', kind: 'number', label: 'settings.watch.reconcile_interval', suffix: 'settings.unit.seconds' },
    { path: 'watch.stable_seconds', kind: 'number', label: 'settings.watch.stable_seconds', suffix: 'settings.unit.seconds' },
    { path: 'watch.include', kind: 'tags', label: 'settings.watch.include' },
    { path: 'watch.exclude', kind: 'tags', label: 'settings.watch.exclude' },
    { path: 'watch.exclude_dirs', kind: 'tags', label: 'settings.watch.exclude_dirs', hint: 'settings.watch.exclude_dirsHint' },
    { path: 'watch.paths', kind: 'paths', label: 'settings.watch.paths' },
  ],
  media: [
    {
      path: 'media.extract_langs', kind: 'chips', label: 'settings.media.extract_langs',
      options: ['en', 'ja', 'ko'].map((value) => ({ value, label: value, literal: true })),
    },
    {
      path: 'media.output_format', kind: 'select', label: 'settings.media.output_format',
      options: [
        { value: 'srt', label: 'settings.media.format.srt' },
        { value: 'ass', label: 'settings.media.format.ass' },
        { value: 'both', label: 'settings.media.format.both' },
      ],
    },
    {
      path: 'media.output_mode', kind: 'select', label: 'settings.media.output_mode',
      options: [
        { value: 'sidecar', label: 'settings.media.mode.sidecar' },
        { value: 'mirror', label: 'settings.media.mode.mirror' },
      ],
    },
    { path: 'media.output_root', kind: 'text', label: 'settings.media.output_root' },
    { path: 'media.series_window', kind: 'number', label: 'settings.media.series_window', suffix: 'settings.unit.seconds' },
    {
      path: 'media.tool_priority', kind: 'select', label: 'settings.media.tool_priority', hint: 'settings.media.tool_priorityHint',
      options: [
        { value: 'low', label: 'settings.media.priority.low' },
        { value: 'normal', label: 'settings.media.priority.normal' },
      ],
    },
    { path: 'media.skip_forced', kind: 'toggle', label: 'settings.media.skip_forced' },
    { path: 'media.target_image_counts', kind: 'toggle', label: 'settings.media.target_image_counts' },
  ],
  queue: [
    { path: 'queue.workers', kind: 'number', label: 'settings.queue.workers' },
    { path: 'queue.max_attempts', kind: 'number', label: 'settings.queue.max_attempts' },
    { path: 'retry.max_retries_unit', kind: 'number', label: 'settings.retry.max_retries_unit' },
    { path: 'retry.max_retries_batch', kind: 'number', label: 'settings.retry.max_retries_batch' },
    { path: 'ledger.hash_bytes', kind: 'number', label: 'settings.ledger.hash_bytes' },
    { path: 'ledger.restore_missing_outputs', kind: 'toggle', label: 'settings.ledger.restore_missing_outputs' },
    {
      path: 'sidecar.on_conflict', kind: 'select', label: 'settings.sidecar.on_conflict',
      options: [
        { value: 'rename', label: 'settings.sidecar.conflict.rename' },
        { value: 'skip', label: 'settings.sidecar.conflict.skip' },
      ],
    },
    {
      path: 'sidecar.rename_style', kind: 'select', label: 'settings.sidecar.rename_style',
      options: [
        { value: 'orig', label: 'Movie.en.orig.srt', literal: true },
        { value: 'backup', label: 'Movie.en.srt.orig', literal: true },
      ],
    },
  ],
  web: [
    { path: 'web.enabled', kind: 'toggle', label: 'settings.web.enabled', hint: 'settings.web.hint' },
    { path: 'web.host', kind: 'text', label: 'settings.web.host' },
    { path: 'web.port', kind: 'number', label: 'settings.web.port' },
    { path: 'web.session_hours', kind: 'number', label: 'settings.web.session_hours', suffix: 'settings.unit.hours' },
    {
      path: 'system.timezone', kind: 'select', label: 'settings.system.timezone', hint: 'settings.system.timezoneHint',
      dynamicOptions: 'timezones', searchable: true,
    },
  ],
}

export function allFields(): SettingField[] {
  return [PROVIDER_CHOICE, ...PROVIDERS.flatMap(providerFields), ...Object.values(TAB_FIELDS).flat()]
}

export function getPath(values: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown> | null)?.[key], values)
}

export function setPath(values: object, path: string, value: unknown): void {
  const keys = path.split('.')
  const last = keys.pop() as string
  const parent = keys.reduce<Record<string, unknown>>(
    (node, key) => node[key] as Record<string, unknown>,
    values as Record<string, unknown>,
  )
  parent[last] = value
}
