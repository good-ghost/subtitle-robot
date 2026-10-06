import { afterEach, describe, expect, it, vi } from 'vitest'

import { saveLocale, saveTheme, storedLocale, storedTheme } from './preferences'

describe('preferences', () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('저장한 언어·테마를 읽고 잘못된 값은 버린다', () => {
    expect(storedLocale()).toBe('ko')
    saveLocale('en')
    saveTheme('dark')
    expect(storedLocale()).toBe('en')
    expect(storedTheme()).toBe('dark')
    saveLocale('fr')
    expect(storedLocale()).toBe('en')
  })

  it('저장소를 막은 브라우저에서도 기본값으로 동작한다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => saveTheme('light')).not.toThrow()
    expect(storedLocale()).toBe('ko')
  })
})
