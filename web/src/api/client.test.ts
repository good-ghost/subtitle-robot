import { afterEach, describe, expect, it, vi } from 'vitest'

import { api, ApiError, onUnauthorized } from './client'

function respond(status: number, body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status }))),
  )
}

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    onUnauthorized(null)
  })

  it('쓰기 요청은 JSON 이고 상대 경로·쿼리를 쓴다', async () => {
    respond(200, [])
    await api.jobs(['queued', 'failed'])
    await api.forget('/media/a.mkv')
    const calls = vi.mocked(fetch).mock.calls
    expect(calls[0][0]).toBe('api/jobs?status=queued&status=failed')
    expect(calls[0][1]?.method).toBe('GET')
    expect(calls[1][0]).toBe('api/ledger/forget')
    expect(calls[1][1]?.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(calls[1][1]?.body).toBe(JSON.stringify({ path: '/media/a.mkv' }))
  })

  it('오류 코드와 설정 검증 오류를 읽는다', async () => {
    respond(400, { detail: 'path_outside_watch' })
    await expect(api.registerMedia('/etc', false, false)).rejects.toMatchObject({
      status: 400,
      code: 'path_outside_watch',
    })
    respond(400, { detail: { code: 'invalid_settings', errors: [{ loc: 'web.port', message: 'bad' }] } })
    const error = await api.restart().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).errors).toEqual([{ loc: 'web.port', message: 'bad' }])
  })

  it('401 이면 로그인 화면으로 돌린다 (로그인 요청 자체는 제외)', async () => {
    const handler = vi.fn()
    onUnauthorized(handler)
    respond(401, { detail: 'not_authenticated' })
    await expect(api.status()).rejects.toBeInstanceOf(ApiError)
    expect(handler).toHaveBeenCalledTimes(1)
    respond(401, { detail: 'invalid_credentials' })
    await expect(api.login('admin', 'x')).rejects.toMatchObject({ code: 'invalid_credentials' })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('JSON 이 아닌 오류 본문', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('<html>bad gateway', { status: 502 }))))
    await expect(api.status()).rejects.toMatchObject({ status: 502, code: 'http_502' })
  })
})
