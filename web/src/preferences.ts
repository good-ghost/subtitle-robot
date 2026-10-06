// 화면 언어·테마를 브라우저에 저장한다 (PROJECT-PLAN §25.5). 서버에는 보내지 않는다.
import type { SupportedLocale } from 'vue-smartview'

export type Theme = 'light' | 'dark'

const LOCALE_KEY = 'subtitle-robot.locale'
const THEME_KEY = 'subtitle-robot.theme'
export const DEFAULT_LOCALE: SupportedLocale = 'ko'

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    // 사생활 보호 모드처럼 저장소를 막은 브라우저: 기본값을 쓴다
    return null
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // 저장하지 못해도 이번 화면에는 적용된다 (다음 방문 때만 기본값)
  }
}

export function storedLocale(): SupportedLocale {
  const value = read(LOCALE_KEY)
  return value === 'en' || value === 'ko' ? value : DEFAULT_LOCALE
}

/** 저장한 테마. 없으면 시스템 설정(prefers-color-scheme)을 따른다. */
export function storedTheme(): Theme {
  const value = read(THEME_KEY)
  if (value === 'light' || value === 'dark') return value
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function saveLocale(locale: string): void {
  if (locale === 'en' || locale === 'ko') write(LOCALE_KEY, locale)
}

export function saveTheme(theme: string): void {
  if (theme === 'light' || theme === 'dark') write(THEME_KEY, theme)
}
