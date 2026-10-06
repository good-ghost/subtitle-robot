// E2E 실행 환경 값과 브라우저 실행 헬퍼 (PROJECT-PLAN §25.7)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'

/** web/ 폴더 */
export const WEB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const REPO_DIR = path.dirname(WEB_DIR)

// 테스트·녹화에 반드시 로드해야 하는 브라우저 확장 (Salesforce Sandbox Bar Toggle, MV3)
export const EXTENSION_PATH = '/home/woomg/WebDEV/Web/salesforce-sandbox-bar-toggle-v1.0.0'

export const E2E_PORT = Number(process.env.E2E_PORT ?? 18190)
export const BASE_URL = `http://127.0.0.1:${E2E_PORT}/`
/** e2e/daemon/run.sh 가 데이터·설정·토큰을 두는 곳 (실행마다 새로 만든다) */
export const DAEMON_ROOT = path.join(WEB_DIR, 'test-results', 'e2e-daemon')
export const SCREENSHOT_DIR = path.join(REPO_DIR, 'docs', 'e2e', 'screenshots')
export const MOVIE_DIR = path.join(REPO_DIR, 'docs', 'e2e', 'movie')
// 녹화 해상도 (공통 규칙: 기본 1920×1080)
export const VIDEO_VIEWPORT = { width: 1920, height: 1080 }

export function webToken(): string {
  return fs.readFileSync(path.join(DAEMON_ROOT, 'token'), 'utf8').trim()
}

/** 확장 경로가 없으면 조용히 건너뛰지 않고 실패시킨다. */
export function requireExtensionPath(): string {
  if (!fs.existsSync(path.join(EXTENSION_PATH, 'manifest.json'))) {
    throw new Error(`브라우저 확장을 찾지 못했습니다: ${EXTENSION_PATH}`)
  }
  return EXTENSION_PATH
}

/** 확장을 로드한 persistent context (확장은 persistent context 에서만 로드된다), 녹화 포함. */
export async function launchRecorded(videoDir: string): Promise<BrowserContext> {
  const extensionPath = requireExtensionPath()
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'subtitle-robot-e2e-'))
  return chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    viewport: VIDEO_VIEWPORT,
    colorScheme: 'light',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    recordVideo: { dir: videoDir, size: VIDEO_VIEWPORT },
    permissions: ['clipboard-read', 'clipboard-write'],
  })
}

/** 로그인 화면을 거치지 않고 세션 쿠키를 받는다 (로그인 장면이 아닌 녹화에서 로그인 과정을 빼기 위해) */
export async function sessionCookie(): Promise<{ name: string; value: string }> {
  const response = await fetch(`${BASE_URL}api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: webToken() }),
  })
  if (!response.ok) throw new Error(`로그인 실패: ${response.status}`)
  const cookie = response.headers.getSetCookie()[0] ?? ''
  const [pair] = cookie.split(';')
  const index = pair.indexOf('=')
  return { name: pair.slice(0, index), value: pair.slice(index + 1) }
}
