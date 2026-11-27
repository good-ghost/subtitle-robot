import { describe, expect, it } from 'vitest'

import { MESSAGES } from '../i18n'
import { allFields, duplicateModel, getPath, jsonValue, modelRows, modelsValue, setPath, visibleProviderFields } from './fields'

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

  it('JSON 칸: 객체만 객체로 보내고, 아니면 글자 그대로 보내 서버가 오류를 붙이게 한다', () => {
    expect(jsonValue('{"think": false}')).toEqual({ think: false })
    expect(jsonValue('  ')).toEqual({})
    expect(jsonValue('{not json')).toBe('{not json')
    expect(jsonValue('[1]')).toBe('[1]')
    expect(jsonValue({ a: 1 })).toEqual({ a: 1 })
  })

  it('모델별 설정: 저장된 객체 ↔ 카드 목록 (빈 칸은 보내지 않는다)', () => {
    const saved = { 'z-ai/glm-5.3-flash': { reasoning_tokens: 16384, extra_body: {} } }
    const rows = modelRows(saved)
    expect(rows).toEqual([
      { model: 'z-ai/glm-5.3-flash', reasoning_tokens: 16384, max_output_tokens: null, temperature: null, extra_body: '{}' },
    ])
    expect(modelsValue(rows)).toEqual(saved)
    expect(
      modelsValue([
        ...rows,
        { model: '  ', reasoning_tokens: 1, max_output_tokens: null, temperature: null, extra_body: '' },
        { model: 'm', reasoning_tokens: '', max_output_tokens: '2048', temperature: 0, extra_body: '{bad' },
      ]),
    ).toEqual({ ...saved, m: { max_output_tokens: 2048, temperature: 0, extra_body: '{bad' } })
  })

  it('모델별 설정: 같은 모델 이름이 두 번이면 그 이름 (빈 이름·앞뒤 공백은 무시)', () => {
    const row = (model: string) => ({ model, reasoning_tokens: null, max_output_tokens: null, temperature: null, extra_body: '' })
    expect(duplicateModel([row('a'), row(' b'), row('')])).toBeNull()
    expect(duplicateModel([row('a'), row(''), row(''), row('a ')])).toBe('a')
    expect(duplicateModel({ a: {} })).toBeNull()
  })

  it('점 경로로 읽고 쓴다', () => {
    const values: Record<string, unknown> = { watch: { stable_seconds: 60 }, providers: { nim: { rpm: 30 } } }
    expect(getPath(values, 'providers.nim.rpm')).toBe(30)
    expect(getPath(values, 'providers.local.rpm')).toBeUndefined()
    setPath(values, 'watch.stable_seconds', '30')
    expect(getPath(values, 'watch.stable_seconds')).toBe('30')
  })
})

