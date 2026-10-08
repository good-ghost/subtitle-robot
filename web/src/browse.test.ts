import { afterEach, describe, expect, it } from 'vitest'

import type { BrowseResult } from './api/types'
import { breadcrumb, folderToOpen, pickerOptions, UP_PREFIX, watchBase } from './browse'
import { setAppLocale } from './i18n'

const ROOTS: BrowseResult = {
  path: null,
  parent: null,
  entries: [
    { name: '/media/movies', path: '/media/movies', kind: 'dir' },
    { name: '/media/tv', path: '/media/tv', kind: 'dir' },
  ],
  truncated: false,
}
const MOVIES: BrowseResult = {
  path: '/media/movies',
  parent: null,
  entries: [
    { name: 'Sea Lark (2026)', path: '/media/movies/Sea Lark (2026)', kind: 'dir' },
    { name: 'a.mkv', path: '/media/movies/a.mkv', kind: 'video' },
  ],
  truncated: false,
}

describe('browse', () => {
  afterEach(() => setAppLocale('ko'))

  it('경로를 브레드크럼으로: 감시 경로들의 공통 상위 폴더 이름부터', () => {
    expect(breadcrumb('/media/movies/Sea Lark (2026)')).toBe('media › movies › Sea Lark (2026)')
    expect(breadcrumb('/srv/data/media/movies/Sea Lark (2026)', '/srv/data/media')).toBe('media › movies › Sea Lark (2026)')
    expect(breadcrumb('/other/x', '/srv/data/media')).toBe('other › x') // 밖이면 전체
    expect(watchBase(['/srv/data/media/movies', '/srv/data/media/tv'])).toBe('/srv/data/media')
    expect(watchBase(['/media/movies'])).toBe('/media')
    expect(watchBase(['/movies', '/tv'])).toBe('/')
    expect(watchBase([])).toBe('')
  })

  it('감시 경로 목록: 폴더만, 모두 keepOpen', () => {
    expect(pickerOptions(ROOTS, '')).toEqual([
      { label: 'media › movies', value: '/media/movies', icon: 'mdi-folder-outline', keepOpen: true },
      { label: 'media › tv', value: '/media/tv', icon: 'mdi-folder-outline', keepOpen: true },
    ])
  })

  it('폴더: 지금 폴더(브레드크럼) → 상위 → 하위 폴더(keepOpen) → 동영상, 고른 동영상은 브레드크럼', () => {
    setAppLocale('en')
    const options = pickerOptions(MOVIES, '/media/movies/a.mkv')
    expect(options.map((o) => [o.label, o.value, o.keepOpen === true])).toEqual([
      ['media › movies', '/media/movies', false],
      ['Up one folder', `${UP_PREFIX}`, true],
      ['Sea Lark (2026)', '/media/movies/Sea Lark (2026)', true],
      ['media › movies › a.mkv', '/media/movies/a.mkv', false],
    ])
    expect(pickerOptions(MOVIES, '/media/movies')[3].label).toBe('a.mkv')
  })

  it('잘린 목록은 고를 수 없는 안내 항목', () => {
    const last = pickerOptions({ ...MOVIES, truncated: true }, '').at(-1)
    expect(last).toMatchObject({ label: '2개까지만 보입니다. 하위 폴더로 들어가세요', disabled: true })
  })

  it('갈 폴더: 상위 항목·하위 폴더, 동영상과 지금 폴더는 아니다', () => {
    expect(folderToOpen(MOVIES, `${UP_PREFIX}`)).toBe('')
    expect(folderToOpen(MOVIES, `${UP_PREFIX}/media`)).toBe('/media')
    expect(folderToOpen(MOVIES, '/media/movies/Sea Lark (2026)')).toBe('/media/movies/Sea Lark (2026)')
    expect(folderToOpen(MOVIES, '/media/movies/a.mkv')).toBeNull()
    expect(folderToOpen(MOVIES, '/media/movies')).toBeNull()
    expect(folderToOpen(ROOTS, '/media/tv')).toBe('/media/tv')
  })
})
