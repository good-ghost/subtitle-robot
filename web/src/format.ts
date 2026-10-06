// 표시용 변환 (시각·오류 코드)
import { ApiError } from './api/client'
import type { FieldError } from './api/types'
import { locale, t, type MessageKey, MESSAGES } from './i18n'

/** 데몬의 epoch 초 → ISO 문자열 (vue-smartview date 열이 로컬 시각으로 보인다). 0·없음은 ''. */
export function isoFromEpoch(seconds: number | null | undefined): string {
  return seconds ? new Date(seconds * 1000).toISOString() : ''
}

const pad = (n: number) => String(n).padStart(2, '0')

/** epoch 초 → 보는 사람의 로컬 시각 `YYYY-MM-DD HH:mm:ss`. 0·없음은 '-'. */
export function localTime(seconds: number | null | undefined): string {
  if (!seconds) return t('common.none')
  const date = new Date(seconds * 1000)
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

/** 표 칸용 짧은 시각: 오늘이면 `HH:mm:ss`, 아니면 날짜까지 (`YYYY-MM-DD HH:mm:ss` 문자열도 받는다). */
export function compactTime(value: number | string | null | undefined, now: Date = new Date()): string {
  const text = typeof value === 'number' || value === null || value === undefined ? localTime(value) : value
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
  return text.startsWith(today) ? text.slice(today.length) : text
}

/**
 * 언어 코드 → 화면 언어로 쓴 이름과 코드 ("프랑스어 (fr)"). 브라우저가 이름을 모르면 서버가 준 영어 이름.
 */
export function languageLabel(code: string, fallback = code): string {
  let name = fallback
  try {
    name = new Intl.DisplayNames([locale.value], { type: 'language' }).of(code) ?? fallback
  } catch (error) {
    // 브라우저가 코드를 받지 않으면(RangeError) 서버 이름을 쓴다
    if (!(error instanceof RangeError)) throw error
  }
  return `${name} (${code})`
}

/** 경과 초 → "12초 전". */
export function agoText(seconds: number | null): string {
  return seconds === null ? t('common.none') : t('common.secondsAgo', { n: Math.max(0, Math.round(seconds)) })
}

/** API 오류를 화면 문구로. 서버 detail 코드에 문구가 있으면 그것, 없으면 일반 문구. */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    const key = `error.${error.code}`
    if (key in MESSAGES.ko) return t(key as MessageKey)
    return t('common.unknownError', { code: error.code })
  }
  if (error instanceof TypeError) return t('common.unreachable') // fetch 네트워크 오류
  return t('common.error', { message: error instanceof Error ? error.message : String(error) })
}

/** 숫자 칸 값: 숫자로 읽히면 숫자, 아니면 그대로 (서버가 검증해 오류를 돌려준다). */
export function numberOrText(value: string | number): string | number {
  if (typeof value === 'number') return value
  const trimmed = value.trim()
  return trimmed !== '' && Number.isFinite(Number(trimmed)) ? Number(trimmed) : value
}

/** 설정 검증 오류 문구. 아는 pydantic 오류 종류는 번역하고, 모르면 서버 원문. */
export function fieldErrorText(error: FieldError): string {
  const key = `validation.${error.type ?? ''}`
  if (key in MESSAGES.ko) return t(key as MessageKey, error.ctx ?? {})
  return error.message
}
