import { describe, expect, it } from 'vitest'

import { MESSAGES } from '../i18n'
import { allFields, getPath, setPath, visibleProviderFields } from './fields'

describe('settings fields', () => {
  it('필드 문구 키가 모두 있다', () => {
    const keys = allFields().flatMap((field) => [
      field.label,
      ...(field.hint ? [field.hint] : []),
      ...(field.suffix ? [field.suffix] : []),
      ...(field.options ?? []).filter((o) => !o.literal).map((o) => o.label),
    ])
    expect(keys.filter((key) => !(key in MESSAGES.ko))).toEqual([])
    expect(new Set(allFields().map((f) => f.path)).size).toBe(allFields().length)
  })

  it('이미지에 구독 CLI 가 없으면 인증 방식 칸을 숨긴다 (latest)', () => {
    const paths = (name: 'claude' | 'openai' | 'nim', auth: 'api_key' | 'subscription', clis: string[]) =>
      visibleProviderFields(name, auth, clis).map((field) => field.path.split('.').at(-1))
    expect(paths('claude', 'api_key', [])).not.toContain('auth')
    expect(paths('claude', 'api_key', ['claude'])).toContain('auth')
    expect(paths('openai', 'api_key', ['claude'])).not.toContain('auth')
    // 이미 구독으로 저장됐으면 API 키로 되돌릴 수 있게 남기고, API 전용 칸은 숨긴다
    expect(paths('claude', 'subscription', [])).toContain('auth')
    expect(paths('claude', 'subscription', [])).not.toContain('base_url')
    expect(paths('nim', 'api_key', ['claude'])).not.toContain('auth')
  })

  it('점 경로로 읽고 쓴다', () => {
    const values: Record<string, unknown> = { watch: { stable_seconds: 60 }, providers: { nim: { rpm: 30 } } }
    expect(getPath(values, 'providers.nim.rpm')).toBe(30)
    expect(getPath(values, 'providers.local.rpm')).toBeUndefined()
    setPath(values, 'watch.stable_seconds', '30')
    expect(getPath(values, 'watch.stable_seconds')).toBe('30')
  })
})

