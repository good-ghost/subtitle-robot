import { describe, expect, it } from 'vitest'

import { canRetry } from './jobs'

describe('canRetry', () => {
  it('실패와 재시도 대기만 다시 시도한다', () => {
    expect(canRetry({ status: 'failed', attempts: 5 })).toBe(true)
    expect(canRetry({ status: 'queued', attempts: 2 })).toBe(true)
    expect(canRetry({ status: 'queued', attempts: 0 })).toBe(false)
    expect(canRetry({ status: 'translating', attempts: 1 })).toBe(false)
    expect(canRetry({ status: 'done', attempts: 1 })).toBe(false)
  })
})
