import { afterEach, describe, expect, it } from 'vitest'

import { locale, MESSAGES, setAppLocale, t } from './i18n'

const HANGUL = /[가-힣]/

describe('i18n', () => {
  afterEach(() => setAppLocale('ko'))

  it('두 언어의 키가 같다', () => {
    expect(Object.keys(MESSAGES.en).sort()).toEqual(Object.keys(MESSAGES.ko).sort())
  })

  it('영어 문구에 한글이 없다', () => {
    const mixed = Object.entries(MESSAGES.en).filter(([, text]) => HANGUL.test(text))
    expect(mixed).toEqual([])
  })

  it('자리 표시를 채우고 언어를 바꾼다', () => {
    expect(t('login.failed', { message: 'x' })).toBe('로그인하지 못했습니다: x')
    setAppLocale('en')
    expect(locale.value).toBe('en')
    expect(t('nav.queue')).toBe('Queue List')
    setAppLocale('fr')
    expect(locale.value).toBe('en')
  })
})
