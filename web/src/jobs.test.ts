import { afterEach, describe, expect, it } from 'vitest'

import { setAppLocale } from './i18n'
import { canRetry, statusValue } from './jobs'

describe('canRetry', () => {
  it('실패와 재시도 대기만 다시 시도한다', () => {
    expect(canRetry({ status: 'failed', attempts: 5 })).toBe(true)
    expect(canRetry({ status: 'queued', attempts: 2 })).toBe(true)
    expect(canRetry({ status: 'queued', attempts: 0 })).toBe(false)
    expect(canRetry({ status: 'translating', attempts: 1 })).toBe(false)
    expect(canRetry({ status: 'done', attempts: 1 })).toBe(false)
  })
})

describe('statusValue', () => {
  afterEach(() => setAppLocale('ko'))

  it('번역 중이면 끝낸 블록과 전체 블록을 붙인다', () => {
    setAppLocale('ko')
    expect(statusValue({ status: 'translating', progress: { done: 2222, total: 3333 } })).toBe('번역 중 (2222/3333)')
    setAppLocale('en')
    expect(statusValue({ status: 'translating', progress: { done: 12, total: 40 } })).toBe('Translating (12/40)')
  })

  it('진행을 모르거나 다른 상태면 상태 값 그대로', () => {
    expect(statusValue({ status: 'translating', progress: null })).toBe('translating')
    expect(statusValue({ status: 'queued', progress: null })).toBe('queued')
  })
})
