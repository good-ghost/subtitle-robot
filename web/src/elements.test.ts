// 화면이 쓰는 vue-smartview 요소가 모두 elements.ts 에 등록돼 있는지 (빠지면 그 요소가 그려지지 않는다)
import { describe, expect, it } from 'vitest'

import elementsSource from './elements.ts?raw'

const VUE_SOURCES = import.meta.glob<string>('./**/*.vue', { query: '?raw', import: 'default', eager: true })

function tags(source: string, pattern: RegExp): string[] {
  return [...source.matchAll(pattern)].map((match) => match[1])
}

describe('elements.ts', () => {
  it('화면에 쓴 요소를 모두 등록하고 쓰지 않는 요소는 등록하지 않는다', () => {
    const used = new Set(Object.values(VUE_SOURCES).flatMap((source) => tags(source, /<(smartview-[a-z-]+)/g)))
    const registered = new Set(tags(elementsSource, /vue-smartview\/elements\/(smartview-[a-z-]+)/g))
    expect(used.size).toBeGreaterThan(0)
    expect([...used].filter((tag) => !registered.has(tag)).sort()).toEqual([])
    expect([...registered].filter((tag) => !used.has(tag)).sort()).toEqual([])
  })
})
