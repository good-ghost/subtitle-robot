import { describe, expect, it } from 'vitest'

import { parseRoute, routeHref } from './router'

describe('router', () => {
  it('해시에서 화면 이름을 읽고 모르면 대시보드', () => {
    expect(parseRoute('#/queue')).toBe('queue')
    expect(parseRoute('#/settings?x=1')).toBe('settings')
    expect(parseRoute('#completed')).toBe('completed')
    expect(parseRoute('')).toBe('dashboard')
    expect(parseRoute('#/nope')).toBe('dashboard')
    expect(routeHref('logs')).toBe('#/logs')
  })
})
