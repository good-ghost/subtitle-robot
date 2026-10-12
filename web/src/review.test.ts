import { describe, expect, it } from 'vitest'

import type { ReviewRow } from './api/types'
import { timecode } from './format'
import { filterRows, oneLine, rowStatus } from './review'

function row(index: number, extra: Partial<ReviewRow> = {}): ReviewRow {
  return { index, start: index, end: index + 1, source: 's', text: 't', needs_review: false, notes: [], reviewed: false, ...extra }
}

describe('review', () => {
  it('검수 상태: 저장한 것이 먼저, 검토 필요는 pending', () => {
    expect(rowStatus(row(1))).toBe('open')
    expect(rowStatus(row(1, { needs_review: true }))).toBe('pending')
    expect(rowStatus(row(1, { needs_review: true, reviewed: true }))).toBe('reviewed')
  })

  it('검토 필요만 걸러 본다', () => {
    const rows = [row(1), row(2, { needs_review: true }), row(3)]
    expect(filterRows(rows, true).map((item) => item.index)).toEqual([2])
    expect(filterRows(rows, false)).toHaveLength(3)
  })

  it('표의 칸은 줄바꿈을 표시로 바꾼 한 줄', () => {
    expect(oneLine('첫 줄\n둘째 줄')).toBe('첫 줄 ↵ 둘째 줄')
  })

  it('시각은 SRT 표기, 없으면 -', () => {
    expect(timecode(3723.5)).toBe('01:02:03,500')
    expect(timecode(0.0004)).toBe('00:00:00,000')
    expect(timecode(null)).toBe('-')
  })
})
