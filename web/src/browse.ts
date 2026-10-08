// 동영상 등록 화면의 폴더 탐색 콤보박스 항목 (WI-7.004d, 사용자 요청 2026-10-08)
// 폴더는 keepOpen 이라 골라도 목록이 열린 채 그 폴더 내용으로 바뀐다 (vue-smartview WI-6.017b).
// 입력칸에는 고른 폴더·동영상의 경로를 브레드크럼으로 보인다.
import type { BrowseResult } from './api/types'
import { t } from './i18n'

/** 상위 폴더 항목의 value 앞머리. 뒤는 갈 곳 (빈 문자열이면 감시 경로 목록) */
export const UP_PREFIX = 'up:'
const TRUNCATED_VALUE = 'truncated:'

export interface PickerOption {
  label: string
  value: string
  icon?: string
  keepOpen?: boolean
  disabled?: boolean
}

/**
 * 경로를 브레드크럼으로. base(감시 경로들의 공통 상위 폴더) 아래면 그 폴더 이름부터 보인다:
 * base `/srv/media` 이면 `/srv/media/movies/Foo (2024)` → `media › movies › Foo (2024)`.
 * 입력칸이 좁아 앞이 잘리므로 감시 경로 위의 깊은 경로는 뺀다.
 */
export function breadcrumb(path: string, base = ''): string {
  const parts = path.split('/').filter(Boolean)
  const baseParts = base.split('/').filter(Boolean)
  const under = baseParts.length > 0 && baseParts.every((part, index) => parts[index] === part)
  return (under ? parts.slice(baseParts.length - 1) : parts).join(' › ')
}

/** 감시 경로들의 공통 상위 폴더 (`/media/movies`, `/media/tv` → `/media`, 하나면 그 위 폴더) */
export function watchBase(roots: readonly string[]): string {
  const split = roots.map((root) => root.split('/').filter(Boolean))
  if (split.length === 0) return ''
  const common: string[] = []
  for (let index = 0; index < split[0].length - 1; index += 1) {
    const part = split[0][index]
    if (!split.every((parts) => parts.length - 1 > index && parts[index] === part)) break
    common.push(part)
  }
  return `/${common.join('/')}`
}

/**
 * 지금 폴더의 항목: 지금 폴더(고르면 그 폴더를 등록), 상위 폴더, 하위 폴더, 동영상 순.
 * 감시 경로 목록(path 가 null)이면 감시 경로만. 고른 동영상은 입력칸에 경로가 보이게 브레드크럼으로 쓴다.
 */
export function pickerOptions(listing: BrowseResult, selected: string, base = ''): PickerOption[] {
  if (listing.path === null) {
    return listing.entries.map((entry) => ({ label: breadcrumb(entry.path, base), value: entry.path, icon: 'mdi-folder-outline', keepOpen: true }))
  }
  const options: PickerOption[] = [
    { label: breadcrumb(listing.path, base), value: listing.path, icon: 'mdi-folder-open-outline' },
    { label: t('register.up'), value: `${UP_PREFIX}${listing.parent ?? ''}`, icon: 'mdi-arrow-up', keepOpen: true },
  ]
  for (const entry of listing.entries) {
    if (entry.kind === 'dir') {
      options.push({ label: entry.name, value: entry.path, icon: 'mdi-folder-outline', keepOpen: true })
    } else {
      options.push({ label: entry.path === selected ? breadcrumb(entry.path, base) : entry.name, value: entry.path, icon: 'mdi-movie-outline' })
    }
  }
  if (listing.truncated) {
    options.push({ label: t('register.truncated', { count: listing.entries.length }), value: TRUNCATED_VALUE, icon: 'mdi-dots-horizontal', disabled: true })
  }
  return options
}

/** 고른 값이 갈 폴더: 상위 폴더 항목이면 그 위치('' = 감시 경로 목록), 하위 폴더면 그 폴더, 아니면 null */
export function folderToOpen(listing: BrowseResult | null, value: string): string | null {
  if (value.startsWith(UP_PREFIX)) return value.slice(UP_PREFIX.length)
  const entry = listing?.entries.find((item) => item.path === value)
  return entry?.kind === 'dir' ? entry.path : null
}
