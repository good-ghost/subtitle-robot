import { afterEach, describe, expect, it } from 'vitest'

import { ApiError } from './api/client'
import { agoText, compactTime, errorText, fieldErrorText, isoFromEpoch, localTime, numberOrText } from './format'
import { setAppLocale } from './i18n'

describe('format', () => {
  afterEach(() => setAppLocale('ko'))

  it('epoch 초를 ISO·로컬 시각으로', () => {
    expect(isoFromEpoch(0)).toBe('')
    expect(isoFromEpoch(1_700_000_000)).toBe('2023-11-14T22:13:20.000Z')
    expect(localTime(0)).toBe('-')
    expect(localTime(1_700_000_000)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('경과 시간', () => {
    expect(agoText(12.4)).toBe('12초 전')
    expect(agoText(null)).toBe('-')
    setAppLocale('en')
    expect(agoText(3)).toBe('3 s ago')
  })

  it('오류 코드를 문구로', () => {
    expect(errorText(new ApiError(400, 'path_outside_watch'))).toBe('감시 경로 안의 경로만 등록할 수 있습니다')
    expect(errorText(new ApiError(500, 'http_500'))).toBe('알 수 없는 오류 (http_500)')
    expect(errorText(new TypeError('Failed to fetch'))).toBe('데몬에 연결할 수 없습니다')
    setAppLocale('en')
    expect(errorText(new ApiError(404, 'ledger_not_found'))).toBe('No processing record')
  })

  it('숫자 칸 값', () => {
    expect(numberOrText('30')).toBe(30)
    expect(numberOrText(' 0.2 ')).toBe(0.2)
    expect(numberOrText('auto')).toBe('auto')
    expect(numberOrText('')).toBe('')
    expect(numberOrText(5)).toBe(5)
  })

  it('설정 검증 오류 문구', () => {
    expect(fieldErrorText({ loc: 'watch.stable_seconds', message: 'x', type: 'greater_than_equal', ctx: { ge: '0' } })).toBe(
      '0 이상이어야 합니다',
    )
    expect(fieldErrorText({ loc: 'a', message: 'server text', type: 'unknown_type' })).toBe('server text')
    setAppLocale('en')
    expect(fieldErrorText({ loc: 'a', message: 'x', type: 'int_parsing' })).toBe('Enter a whole number')
  })

  it('표 칸 시각은 오늘이면 시각만', () => {
    const now = new Date(2026, 9, 3, 20, 0, 0)
    expect(compactTime('2026-10-03 19:47:59', now)).toBe('19:47:59')
    expect(compactTime('2026-10-02 19:47:59', now)).toBe('2026-10-02 19:47:59')
    expect(compactTime(0, now)).toBe('-')
  })
})
