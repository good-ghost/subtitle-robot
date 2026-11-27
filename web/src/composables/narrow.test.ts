import { describe, expect, it } from 'vitest'

import { NARROW_TEXT_WIDTH, narrowHeaders } from './narrow'

describe('narrowHeaders', () => {
  const headers = [
    { key: 'name', maxWidth: '260px' },
    { key: 'status', width: '170px' },
    { key: 'priority', width: '104px' },
    { key: 'actions', width: '110px' },
  ]

  it('넓은 화면은 그대로', () => {
    expect(narrowHeaders(headers, ['name'], false)).toBe(headers)
  })

  it('좁은 화면은 남길 열만, 고정 폭을 풀고 긴 글자 열을 줄인다', () => {
    expect(narrowHeaders(headers, ['name', 'status', 'actions'], true)).toEqual([
      { key: 'name', width: undefined, maxWidth: NARROW_TEXT_WIDTH },
      { key: 'status', width: undefined, maxWidth: undefined },
      { key: 'actions', width: undefined, maxWidth: undefined },
    ])
  })
})
