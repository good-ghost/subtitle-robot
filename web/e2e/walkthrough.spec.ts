// 웹 운영 화면 전체 E2E·녹화 (WI-7.006, PROJECT-PLAN §25.7)
// - 조합: ko·라이트, en·다크. 장면마다 동영상 하나(docs/e2e/movie/<조합>-<장면>.webm + .vtt)
// - 스크린샷: docs/e2e/screenshots/NNNN-<조합>-<단계>.png (조합 1000·2000번대, 장면 100단위)
// - 모든 버튼을 누르고 모든 입력칸에 값을 넣는다. 장면이 끝나면 누르지 않은 요소를 커버리지 파일로 남긴다
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test'

import { MESSAGES, type MessageKey } from '../src/i18n'
import { Director, escapeRe, PACE } from './lib/director'
import {
  BASE_URL,
  DAEMON_ROOT,
  launchRecorded,
  MOVIE_DIR,
  REPO_DIR,
  SCREENSHOT_DIR,
  sessionCookie,
  WEB_DIR,
  webToken,
} from './lib/env'

type Locale = 'ko' | 'en'
type Theme = 'light' | 'dark'

interface Combo {
  locale: Locale
  theme: Theme
  base: number
  // 설정 장면에서 넣을 값 (조합마다 달라야 저장이 "바뀜"으로 보인다)
  stableSeconds: string
  sessionHours: string
  // 번역 탭에서 고를 대상 언어와 검색어 (PROJECT-PLAN §26.7)
  target: string
  targetSearch: string
}

const COMBOS: Combo[] = [
  { locale: 'ko', theme: 'light', base: 1000, stableSeconds: '30', sessionHours: '72', target: 'fr', targetSearch: '프랑스' },
  { locale: 'en', theme: 'dark', base: 2000, stableSeconds: '45', sessionHours: '96', target: 'ko', targetSearch: 'Kor' },
]
// 알림 건수를 숫자 아무거나로 본다 (Scene.toastText)
const ANY_COUNT = -1
const COVERAGE_DIR = path.join(REPO_DIR, 'docs', 'e2e', 'coverage')
const VIDEO_TMP = path.join(WEB_DIR, 'test-results', 'video')
const MOVIES = path.join(DAEMON_ROOT, 'media', 'movies')

interface SceneResult {
  combo: string
  label: string
  failed: boolean
  shots: Director['shots']
  seen: string[]
  touched: string[]
  seconds: number
}

/** 행마다 반복되는 요소(행 액션 아이콘)는 한 종류로 본다: 한 행에서 눌렀으면 그 기능은 확인했다 */
function coverageKey(key: string): string {
  return key.replace(/ \| row=[^|]*/, '')
}

/** 조합의 모든 장면을 합친 커버리지 (장면이 다른 화면을 지나가도 그 화면은 해당 장면에서 다룬다) */
function comboCoverage(combo: string): { total: number; touched: number; untouched: string[] } {
  const results = RESULTS.filter((r) => r.combo === combo)
  const seen = new Set(results.flatMap((r) => r.seen.map(coverageKey)))
  const touched = new Set(results.flatMap((r) => r.touched.map(coverageKey)))
  const untouched = [...seen].filter((key) => !touched.has(key)).sort()
  return { total: seen.size, touched: seen.size - untouched.length, untouched }
}
const RESULTS: SceneResult[] = []

test.beforeAll(() => {
  for (const dir of [SCREENSHOT_DIR, MOVIE_DIR, COVERAGE_DIR, VIDEO_TMP]) fs.mkdirSync(dir, { recursive: true })
})

/** 실행한 장면의 스크린샷 색인과 요약 (docs/e2e/README.md, screenshots/README.md) */
test.afterAll(() => {
  const cell = (v: string) => String(v || '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
  const shotLines = ['# 웹 화면 E2E 스크린샷', '', '`web/e2e/walkthrough.spec.ts`가 만든다. 번호: 조합(1000 ko·라이트, 2000 en·다크) + 장면(100 단위).', '']
  for (const result of RESULTS) {
    shotLines.push(`## ${result.label}`, '', '| 번호 | 파일 | 장면 | 설명 |', '|---|---|---|---|')
    for (const shot of result.shots) {
      shotLines.push(`| ${shot.file.slice(0, 4)} | [${shot.file}](${shot.file}) | ${cell(shot.scene)} | ${cell(shot.caption || shot.name)} |`)
    }
    shotLines.push('')
  }
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'README.md'), shotLines.join('\n'))
  const summary = [
    '# 웹 화면 E2E 결과',
    '',
    '`cd web && npm run test:e2e` (개발 컨테이너, Playwright `channel: chromium`, Sandbox Bar Toggle 확장 로드). 정지 구간 검사: `bash web/e2e/check-freeze.sh` (호스트).',
    '',
    '| 장면 | 결과 | 길이(초) | 스크린샷 | 동영상 |',
    '|---|---|---|---|---|',
    ...RESULTS.map((r) => {
      const movie = `${r.label}${r.failed ? '-FAILED' : ''}`
      return `| ${r.label} | ${r.failed ? '실패' : '통과'} | ${r.seconds} | ${r.shots.length} | [webm](movie/${movie}.webm) · [vtt](movie/${movie}.vtt) |`
    }),
    '',
    '## 조작 커버리지',
    '',
    '조합의 모든 장면에서 보인 상호작용 요소(버튼·링크·입력칸·표 머리글, Shadow DOM 포함) 중 누르거나 입력하지 않은 것이다. 행마다 반복되는 아이콘은 한 종류로 센다 (`coverage/<조합>.json`).',
    '',
    ...[...new Set(RESULTS.map((r) => r.combo))].flatMap((combo) => {
      const coverage = comboCoverage(combo)
      fs.writeFileSync(path.join(COVERAGE_DIR, `${combo}.json`), JSON.stringify(coverage, null, 2) + '\n')
      return [
        `### ${combo}: ${coverage.touched} / ${coverage.total}`,
        '',
        ...(coverage.untouched.length ? coverage.untouched.map((key) => `- \`${key}\``) : ['- 없음']),
        '',
      ]
    }),
  ]
  fs.writeFileSync(path.join(REPO_DIR, 'docs', 'e2e', 'README.md'), summary.join('\n'))
})

/** 한 장면: 녹화 context·연출·조합별 문구 */
class Scene {
  constructor(
    readonly context: BrowserContext,
    readonly page: Page,
    readonly d: Director,
    readonly combo: Combo,
    readonly name: string,
  ) {}

  t(key: MessageKey, params: Record<string, string | number> = {}): string {
    return MESSAGES[this.combo.locale][key].replace(/\{(\w+)\}/g, (w, k: string) => String(params[k] ?? w))
  }

  /** 알림 문구. 건수를 정할 수 없으면(앞 장면의 작업이 재시도 중 실패로 바뀐다) params 에 ANY_COUNT 를 준다 */
  toastText(key: MessageKey, params: Record<string, string | number>): string | RegExp {
    if (params.count !== ANY_COUNT) return this.t(key, params)
    const pattern = escapeRe(MESSAGES[this.combo.locale][key]).replace('\\{count\\}', '\\d+')
    return new RegExp(pattern)
  }

  byTest(id: string): Locator {
    return this.page.locator(`[data-testid="${id}"]`)
  }

  dialog(): Locator {
    return this.page.getByRole('dialog')
  }

  /**
   * 누르고 알림을 확인한다. 알림은 3초 뒤 사라지므로 누르기 전에 기다리기 시작한다
   * (누른 뒤 화면 전환 간격·커버리지 수집을 기다리면 놓친다).
   */
  async clickToast(
    target: Locator,
    key: MessageKey,
    params: Record<string, string | number> = {},
    shot?: string,
  ): Promise<void> {
    const toast = this.page.locator('[data-part="snackbar"]').filter({ hasText: this.toastText(key, params) })
    const seen = expect(toast).toBeVisible({ timeout: 30_000 })
    await this.d.click(target, null, { pace: 'input' })
    await seen
    if (shot) await this.d.shot(shot)
    await this.page.waitForTimeout(PACE.transition)
  }

  async closeToast(): Promise<void> {
    const close = this.page.locator('[data-part="snackbar"] [data-part="close"]')
    if (await close.isVisible()) await this.d.click(close, null, { pace: 'input' })
  }

  /** 필터 바·콤보박스 메뉴에서 글자가 같은 항목을 고른다 */
  async choose(field: Locator, label: string, shot?: string): Promise<void> {
    await this.d.select(field, label, shot ?? null)
  }

  async toggle(testId: string, shot?: string): Promise<void> {
    await this.d.click(this.byTest(testId).locator('[data-part="toggle"] .v-selection-control__input'), shot ?? null, {
      pace: 'input',
    })
  }

  async field(testId: string): Promise<Locator> {
    const input = this.byTest(testId).locator('input').first()
    await input.waitFor()
    return input
  }

  /** 정렬할 수 있는 머리글을 모두 한 번씩 누른다 (마지막에 첫 열로 돌아온다) */
  async sortAll(table: Locator): Promise<void> {
    const headers = table.locator('th[tabindex]')
    const count = await headers.count()
    for (let index = 0; index < count; index += 1) await this.d.click(headers.nth(index), null, { pace: 'input' })
    await this.d.click(headers.first(), null, { pace: 'input' })
  }

  /** 표 아래 페이지 단추(다음·이전·마지막·처음)를 누를 수 있으면 누른다 (행이 한 페이지보다 많을 때) */
  async pageAll(table: Locator): Promise<void> {
    const buttons = table.locator('.v-data-table-footer__pagination button')
    for (const index of [2, 1, 3, 0]) {
      const button = buttons.nth(index)
      if ((await button.count()) && (await button.isEnabled())) await this.d.click(button, null, { pace: 'input' })
    }
  }

  async navigate(key: string): Promise<void> {
    await this.d.click(this.page.locator(`smartview-app-shell [data-part="item"][data-key="${key}"]`), null)
  }
}

async function openScene(combo: Combo, name: string, sceneNo: number, route: string, loggedIn = true): Promise<Scene> {
  const context = await launchRecorded(VIDEO_TMP)
  await Director.install(context)
  // 처음 한 번만 언어·테마를 정한다 (장면 안에서 메뉴로 바꾼 값은 새로고침해도 유지)
  await context.addInitScript(
    ([locale, theme]) => {
      if (sessionStorage.getItem('e2e-prefs')) return
      localStorage.setItem('subtitle-robot.locale', locale)
      localStorage.setItem('subtitle-robot.theme', theme)
      sessionStorage.setItem('e2e-prefs', '1')
    },
    [combo.locale, combo.theme],
  )
  if (loggedIn) {
    const cookie = await sessionCookie()
    await context.addCookies([{ ...cookie, url: BASE_URL }])
  }
  const page = context.pages()[0] ?? (await context.newPage())
  const d = new Director(page, {
    screenshotDir: SCREENSHOT_DIR,
    prefix: `${combo.locale}-${combo.theme}`,
    firstShot: combo.base + sceneNo * 100 + 1,
  })
  d.markVideoStart()
  await page.goto(`${BASE_URL}#/${route}`)
  await page.locator(loggedIn ? 'smartview-app-shell [data-part="main"]' : 'smartview-login [data-part="form"]').waitFor()
  await Promise.all([page.waitForTimeout(800), d.checkpoint()])
  return new Scene(context, page, d, combo, name)
}

async function closeScene(scene: Scene, failed: boolean): Promise<void> {
  const label = `${scene.combo.locale}-${scene.combo.theme}-${scene.name}`
  // 페이지가 이미 닫혔으면(실패) 그때까지 모은 것만 쓴다
  await scene.d.coverageSummary().catch(() => undefined)
  const seen = [...scene.d.seenAll]
  const touched = [...scene.d.touchedAll]
  RESULTS.push({
    combo: `${scene.combo.locale}-${scene.combo.theme}`,
    label,
    failed,
    shots: scene.d.shots,
    seen,
    touched,
    seconds: Math.round((Date.now() - scene.d.t0) / 1000),
  })
  await scene.d.clearCaption().catch(() => undefined)
  scene.d.writeVtt(path.join(MOVIE_DIR, `${label}${failed ? '-FAILED' : ''}.vtt`))
  const video = scene.page.video()
  await scene.context.close()
  if (video) {
    // persistent context 는 닫으면 브라우저도 닫혀 saveAs 를 쓸 수 없다. 끝난 파일을 옮긴다
    const recorded = await video.path()
    fs.copyFileSync(recorded, path.join(MOVIE_DIR, `${label}${failed ? '-FAILED' : ''}.webm`))
    fs.rmSync(recorded)
  }
}

/** 장면 하나를 녹화한다. 실패하면 영상 이름에 -FAILED 를 붙이고 다시 던진다 */
async function record(
  combo: Combo,
  name: string,
  sceneNo: number,
  route: string,
  body: (scene: Scene) => Promise<void>,
  loggedIn = true,
): Promise<void> {
  const scene = await openScene(combo, name, sceneNo, route, loggedIn)
  try {
    await body(scene)
  } catch (error) {
    // 실패한 실행도 영상을 남긴다 (-FAILED). 정리 중 오류가 원래 오류를 가리지 않게 한다
    await closeScene(scene, true).catch((closeError: unknown) => console.error('closeScene failed', closeError))
    throw error
  }
  await closeScene(scene, false)
}

/** 두 번째 조합 전에 샘플 작업·기록을 다시 넣는다 (첫 조합에서 지웠다) */
function reseed(...extra: string[]): void {
  execFileSync('uv', ['run', 'python', path.join(WEB_DIR, 'e2e', 'daemon', 'seed.py'), DAEMON_ROOT, ...extra], {
    cwd: REPO_DIR,
  })
}

for (const combo of COMBOS) {
  test.describe(`${combo.locale}-${combo.theme}`, () => {
    test.beforeAll(() => {
      if (combo.base !== COMBOS[0].base) reseed()
    })

    test('01 로그인·셸', async () => {
      await record(
        combo,
        'login-shell',
        1,
        'dashboard',
        async (s) => {
          const { d, page } = s
          s.d.setScene('로그인')
          await d.titleCard({
            badge: `${combo.locale.toUpperCase()} · ${combo.theme}`,
            title: 'Subtitle Robot',
            subtitle: '감시 데몬 웹 운영 화면 — 로그인과 화면 구성',
          })
          await d.say('웹 화면은 사용자 이름과 서버의 웹 토큰으로 로그인합니다')
          await d.shot('login')
          const login = page.locator('smartview-login')
          await d.say('빈 칸으로 로그인하면 필수 항목 안내가 보입니다')
          await d.click(login.locator('[data-part="submit"]'), 'login-empty', { pace: 'input' })
          await d.say('사용자 이름과 틀린 토큰을 넣어 봅니다')
          await d.type(login.locator('[data-part="username"] input'), 'admin')
          await d.type(login.locator('[data-part="password"] input'), 'wrong-token-for-demo')
          await d.say('눈 아이콘으로 입력한 토큰을 확인합니다')
          await d.click(login.locator('[data-part="toggle"]'), 'login-token-visible', { pace: 'input' })
          await d.click(login.locator('[data-part="submit"]'), null)
          await expect(login.locator('[data-part="error"]')).toContainText(s.t('login.invalid'))
          await d.say('토큰이 틀리면 1초 늦게 거절됩니다 (대입 공격 완화)')
          await d.shot('login-invalid')
          await d.click(login.locator('[data-part="error"] button').first(), null, { pace: 'input' })
          await d.say('토큰을 다시 가리고 맞는 토큰으로 로그인합니다')
          await d.click(login.locator('[data-part="toggle"]'), null, { pace: 'input' })
          await d.type(login.locator('[data-part="password"] input'), webToken(), { delay: 15 })
          await d.click(login.locator('[data-part="submit"]'), null)
          await page.locator('smartview-app-shell [data-part="main"]').waitFor()
          await d.shot('dashboard-after-login')

          s.d.setScene('셸')
          await d.say('왼쪽 메뉴: 대시보드, 대기열, 완료 목록, 로그, 설정')
          for (const key of ['queue', 'completed', 'logs', 'settings', 'dashboard']) {
            await s.navigate(key)
            await d.shot(`nav-${key}`)
          }
          await d.say('상단 바의 메뉴 버튼으로 메뉴를 접고 펼칩니다')
          await d.click(page.locator('smartview-app-shell [data-part="menu"]'), 'rail-collapsed', { pace: 'input' })
          await d.click(page.locator('smartview-app-shell [data-part="menu"]'), null, { pace: 'input' })
          await d.say('메뉴 아래의 접기 항목도 같은 동작입니다')
          await d.click(page.locator('smartview-app-shell [data-part="footer-item"][data-key="rail"]'), null, { pace: 'input' })
          await d.click(page.locator('smartview-app-shell [data-part="footer-item"][data-key="rail"]'), 'rail-expanded', { pace: 'input' })
          await d.say('브레드크럼의 첫 항목은 대시보드로 돌아갑니다')
          await s.navigate('logs')
          await d.click(page.locator('smartview-app-shell [data-part="crumb"] a').first(), 'breadcrumb-home')
          await d.say('언어를 바꾸면 메뉴와 화면 문구가 함께 바뀝니다')
          await d.click(page.locator('smartview-app-shell [data-part="footer-item"][data-key="locale"]'), 'locale-switched')
          await d.click(page.locator('smartview-app-shell [data-part="footer-item"][data-key="locale"]'), 'locale-restored')
          await d.say('테마도 바꿀 수 있습니다. 브라우저에 저장되어 새로고침 뒤에도 유지됩니다')
          await d.click(page.locator('smartview-app-shell [data-part="footer-item"][data-key="theme"]'), 'theme-switched')
          await d.checkpoint()
          await page.reload()
          await page.locator('smartview-app-shell [data-part="main"]').waitFor()
          await page.waitForTimeout(PACE.transition)
          await d.shot('theme-after-reload')
          await d.click(page.locator('smartview-app-shell [data-part="footer-item"][data-key="theme"]'), 'theme-restored')
          await d.say('로그아웃하면 로그인 화면으로 돌아갑니다')
          await d.click(page.locator('smartview-app-shell [data-part="footer-item"][data-key="logout"]'), 'logged-out')
          await page.locator('smartview-login [data-part="form"]').waitFor()
        },
        false,
      )
    })

    test('02 대시보드', async () => {
      await record(combo, 'dashboard', 2, 'dashboard', async (s) => {
        const { d, page } = s
        d.setScene('대시보드')
        await d.say('대시보드는 데몬 heartbeat, 공급자 상태, 작업 개수와 감시 경로를 보입니다')
        await d.shot('dashboard')
        await d.say('번역 카드는 대상 언어와 원어 조회(TMDB) 사용 여부를 보입니다')
        await expect(s.byTest('translation-card')).toBeVisible()
        await d.say('새로 고침 버튼으로 바로 다시 불러옵니다 (10초마다 자동 갱신)')
        await d.click(s.byTest('refresh'), 'dashboard-refreshed', { pace: 'input' })
        await d.say('카드를 누르면 해당 목록으로 이동합니다: 대기·처리 중 → 대기열')
        await d.click(s.byTest('stat-pending').locator('[data-part="root"]'), 'card-pending')
        await expect(page).toHaveURL(/#\/queue$/)
        await s.navigate('dashboard')
        await d.say('실패 카드도 대기열로 이동합니다')
        await d.click(s.byTest('stat-failed').locator('[data-part="root"]'), 'card-failed')
        await s.navigate('dashboard')
        await d.say('처리 기록 카드는 완료 목록으로 이동합니다')
        await d.click(s.byTest('stat-completed').locator('[data-part="root"]'), 'card-completed')
        await expect(page).toHaveURL(/#\/completed$/)
      })
    })

    test('03 대기열', async () => {
      await record(combo, 'queue', 3, 'queue', async (s) => {
        const { d, page } = s
        const bar = s.byTest('queue-filter')
        const table = s.byTest('queue-table')
        d.setScene('대기열')
        await d.say('대기열은 대기·처리 중·실패한 작업을 보입니다')
        await d.shot('queue')
        await d.say('상태 필터로 작업을 거릅니다')
        for (const key of ['queue.filter.failed', 'queue.filter.queued', 'queue.filter.active', 'queue.filter.all', 'queue.filter.open'] as const) {
          await s.choose(bar.locator('[data-part="filter"]'), s.t(key), `filter-${key.split('.').pop()}`)
        }
        await d.say('이름이나 경로로 검색합니다')
        await d.type(bar.locator('[data-part="search"] input'), 'Corrupt', { shot: 'search' })
        await d.type(bar.locator('[data-part="search"] input'), '')
        await d.click(bar.locator('[data-part="refresh"]'), null, { pace: 'input' })
        await d.say('머리글을 눌러 정렬하고, 페이지당 행 수를 바꿉니다')
        await s.sortAll(table)
        await d.shot('sorted')
        await s.choose(table.locator('.v-data-table-footer__items-per-page .v-select'), '25', 'per-page')
        await s.pageAll(table)

        d.setScene('재시도·실패 지우기')
        await d.say('실패한 작업의 재시도 아이콘은 그 작업을 다시 대기시킵니다')
        await s.clickToast(table.locator('[data-part="icon-action"][data-action="retry"]').first(), 'queue.retried', { count: 1 }, 'retried-one')
        await s.closeToast()
        await d.say('[모두 다시 시도]는 실패했거나 재시도를 기다리는 작업을 바로 다시 대기시킵니다')
        await s.clickToast(s.byTest('retry-all'), 'queue.retried', { count: ANY_COUNT }, 'retried-all')
        // 다시 대기시킨 샘플 작업은 파일이 없어 "건너뜀"으로 끝난다. 실패 지우기를 보이려고 실패 작업을 더 넣는다
        reseed('--failed', '2')
        await d.say('실패한 작업이 다시 생겼습니다. 실패 작업은 큐에서 지울 수 있습니다')
        await d.click(bar.locator('[data-part="refresh"]'), null, { pace: 'input' })
        await expect(s.byTest('clear-failed')).toHaveJSProperty('disabled', false)
        await d.click(s.byTest('clear-failed'), 'clear-prompt')
        await d.say('확인 창에서 취소하면 아무것도 지우지 않습니다')
        await d.click(s.dialog().locator('[data-part="cancel"]'), null)
        await d.click(s.byTest('clear-failed'), null)
        await d.say('지우기를 누르면 큐에서 실패 작업 기록을 지웁니다 (완료 목록의 판정은 남습니다)')
        await s.clickToast(s.dialog().locator('[data-part="confirm"]'), 'queue.cleared', { count: ANY_COUNT }, 'cleared')
        await s.closeToast()

        d.setScene('동영상 등록')
        const modal = s.dialog()
        await d.say('[동영상 등록]은 감시 경로 안의 파일이나 폴더를 큐에 넣습니다')
        await d.click(page.locator('smartview-page-header [data-part="action"]'), 'register-modal')
        await d.say('취소하면 등록하지 않고 닫힙니다')
        await d.click(modal.locator('[data-part="cancel"]'), null)
        await d.click(page.locator('smartview-page-header [data-part="action"]'), null)
        const pathInput = s.byTest('register-path').locator('input')
        await d.say('감시 경로 밖의 경로는 거절됩니다')
        await d.type(pathInput, '/etc/passwd')
        await d.click(modal.locator('[data-part="confirm"]'), null, { pace: 'input' })
        await expect(s.byTest('register-path')).toHaveJSProperty('errorMessage', s.t('error.path_outside_watch'))
        await d.shot('register-outside')
        await d.say('감시 경로 안의 동영상 파일을 등록합니다')
        await d.type(pathInput, path.join(MOVIES, 'Demo Movie (2024).mkv'), { delay: 10 })
        await s.clickToast(modal.locator('[data-part="confirm"]'), 'register.done', { count: 1 }, 'registered-file')
        await s.closeToast()
        await d.say('폴더를 하위 폴더까지, 이미 처리한 영상도 다시 처리하도록 등록합니다')
        await d.click(page.locator('smartview-page-header [data-part="action"]'), null)
        await d.type(pathInput, MOVIES, { delay: 10 })
        await d.click(s.byTest('register-recursive').locator('.v-selection-control__input'), null, { pace: 'input' })
        await d.click(s.byTest('register-force').locator('.v-selection-control__input'), 'register-folder', { pace: 'input' })
        await s.clickToast(modal.locator('[data-part="confirm"]'), 'register.done', { count: 2 }, 'registered-folder')
        await s.closeToast()
      })
    })

    test('04 완료 목록', async () => {
      await record(combo, 'completed', 4, 'completed', async (s) => {
        const { d } = s
        const bar = s.byTest('completed-filter')
        const table = s.byTest('completed-table')
        d.setScene('완료 목록')
        await d.say('완료 목록은 처리 기록입니다: 판정, 사유, 공급자, 처리 시각')
        await d.shot('completed')
        await d.say('판정으로 거릅니다')
        for (const key of ['verdict.translated', 'verdict.has_korean', 'verdict.failed', 'completed.filter.all'] as const) {
          await s.choose(bar.locator('[data-part="filter"]'), s.t(key), `verdict-${key.split('.').pop()}`)
        }
        await d.say('이력 포함을 켜면 같은 경로의 이전 기록도 보입니다')
        await d.click(bar.locator('[data-part="switch"] .v-selection-control__input'), 'history-on', { pace: 'input' })
        await d.click(bar.locator('[data-part="switch"] .v-selection-control__input'), null, { pace: 'input' })
        await d.type(bar.locator('[data-part="search"] input'), 'Arrival', { shot: 'search' })
        await d.type(bar.locator('[data-part="search"] input'), '')
        await d.click(bar.locator('[data-part="refresh"]'), null, { pace: 'input' })
        await s.sortAll(table)
        await d.shot('sorted')
        await s.choose(table.locator('.v-data-table-footer__items-per-page .v-select'), '25')
        await s.pageAll(table)

        d.setScene('상세·다시 처리')
        const row = (name: string) => table.locator('tbody tr').filter({ hasText: name })
        await d.say('상세 아이콘: 경로, 내용 식별값, 출력 파일, 보존한 파일까지 봅니다')
        await d.click(row('Arrival').locator('[data-part="icon-action"][data-action="detail"]'), 'detail')
        await d.say('닫기')
        await d.click(s.dialog().locator('[data-part="cancel"]'), null)
        await d.say('상세에서 [다시 처리]를 누르면 확인 단계로 넘어갑니다')
        await d.click(row('Arrival').locator('[data-part="icon-action"][data-action="detail"]'), null)
        await d.click(s.dialog().locator('[data-part="confirm"]'), 'forget-prompt')
        await d.say('취소하면 기록을 지우지 않습니다')
        await d.click(s.dialog().locator('[data-part="cancel"]'), null)
        await d.say('행의 다시 처리 아이콘으로 기록을 지웁니다. 다음 이벤트나 등록 때 다시 처리됩니다')
        await d.click(row('Silent Film').locator('[data-part="icon-action"][data-action="forget"]'), null)
        await s.clickToast(s.dialog().locator('[data-part="confirm"]'), 'completed.forgotten', {}, 'forgotten')
        await s.closeToast()
      })
    })

    test('05 로그', async () => {
      await record(combo, 'logs', 5, 'logs', async (s) => {
        const { d } = s
        const bar = s.byTest('logs-filter')
        const table = s.byTest('logs-table')
        d.setScene('로그')
        await d.say('로그는 데몬 로그 파일(data/logs/daemon.log)의 최근 항목입니다. 재기동 뒤에도 남습니다')
        await d.shot('logs')
        await d.say('레벨로 거릅니다')
        for (const level of ['WARNING', 'ERROR', 'DEBUG', 'INFO'] as const) {
          await s.choose(bar.locator('[data-part="filter"]'), s.t(`logs.level.${level}`), `level-${level.toLowerCase()}`)
        }
        await d.type(bar.locator('[data-part="search"] input'), 'job', { shot: 'search' })
        await d.type(bar.locator('[data-part="search"] input'), '')
        await d.say('자동 갱신(5초)을 끄고 켭니다. 머리글의 일시 정지 버튼도 같습니다')
        await d.click(bar.locator('[data-part="switch"] .v-selection-control__input'), 'auto-off', { pace: 'input' })
        await d.click(bar.locator('[data-part="switch"] .v-selection-control__input'), null, { pace: 'input' })
        await d.click(s.byTest('logs-pause'), 'paused', { pace: 'input' })
        await d.click(s.byTest('logs-pause'), null, { pace: 'input' })
        await d.click(bar.locator('[data-part="refresh"]'), null, { pace: 'input' })
        await s.sortAll(table)
        await s.choose(table.locator('.v-data-table-footer__items-per-page .v-select'), '25')
        await s.pageAll(table)
        await d.say('행을 누르면 전체 메시지를 봅니다')
        await d.click(table.locator('[data-part="row"]').first(), 'log-entry')
        await d.say('메시지를 복사합니다')
        await s.clickToast(s.dialog().locator('[data-part="confirm"]'), 'logs.copied', {}, 'copied')
        await d.click(s.dialog().locator('[data-part="cancel"]'), null)
      })
    })

    test('06 설정', async () => {
      await record(combo, 'settings', 6, 'settings', async (s) => {
        const { d, page } = s
        const tab = (value: string) => s.byTest('settings-tabs').locator(`[data-tab="${value}"]`)
        const type = async (id: string, value: string) => d.type(await s.field(id), value, { delay: 25 })
        // literal 이면 label 을 그대로, 아니면 문구 키로 읽는다
        const select = (id: string, label: string, literal = false) =>
          s.choose(s.byTest(id).locator('[data-part="field"]'), literal ? label : s.t(label as MessageKey))
        d.setScene('설정 · 공급자')
        await d.say('설정은 데몬이 읽은 config.toml 을 고칩니다. 저장한 값은 재기동 뒤에 적용됩니다')
        await d.shot('settings')
        await d.say('사용할 공급자를 고릅니다 (하나만 쓰고 폴백하지 않습니다)')
        await select('field-llm.provider', 'settings.provider.local')
        await select('field-llm.provider', 'settings.provider.nim')
        await d.say('NIM 의 모델·요청 수·제한 시간 등을 고칩니다. API 키는 환경 변수라 화면에 없습니다')
        await type('field-providers.nim.base_url', 'https://integrate.api.nvidia.com/v1')
        await type('field-providers.nim.model', 'deepseek-ai/deepseek-v4.1-flash')
        await type('field-providers.nim.pass1_model', '')
        await type('field-providers.nim.rpm', '25')
        await type('field-providers.nim.concurrency', '1')
        await type('field-providers.nim.timeout', '300')
        await type('field-providers.nim.temperature', '0.2')
        await type('field-providers.nim.max_output_tokens', '8192')
        await d.say('로컬 llama-server 주소를 넣으면 local 공급자 설정이 생깁니다')
        await type('field-providers.local.base_url', 'http://127.0.0.1:8080/v1')
        await type('field-providers.local.model', 'Qwen3.8-27B-UD-Q4_K_XL')
        await type('field-providers.local.pass1_model', '')
        await type('field-providers.local.rpm', '0')
        await type('field-providers.local.concurrency', 'auto')
        await type('field-providers.local.timeout', '600')
        await type('field-providers.local.temperature', '0.2')
        await type('field-providers.local.max_output_tokens', '8192')
        await d.shot('provider-filled')

        d.setScene('설정 · 번역')
        await d.click(tab('translation'), 'tab-translation')
        await d.say('대상 언어: 번역 결과의 언어입니다. 이름으로 검색해 고릅니다')
        const target = s.byTest('field-translation.target_language')
        await d.click(target.locator('input:not([type="hidden"])').first(), null, { pace: 'input' })
        await page.keyboard.press('Control+A')
        await page.keyboard.press('Backspace')
        await page.keyboard.type(combo.targetSearch, { delay: 80 })
        const targetOption = page
          .locator('.v-overlay--active .v-list-item')
          .filter({ hasText: `(${combo.target})` })
          .first()
        await targetOption.waitFor({ state: 'visible' })
        await d.shot('target-search')
        await d.click(targetOption, 'target-chosen', { pace: 'input' })
        await d.say('원어 조회: TMDB 로 작품 원어를 찾아 그 언어 자막 트랙을 번역 소스로 씁니다')
        await s.toggle('field-tmdb.enabled')
        await s.toggle('field-tmdb.enabled')
        await type('field-tmdb.timeout', '10')
        await d.say('TMDB 키는 환경 변수 이름만 보입니다 (값은 화면에 없습니다)')
        await d.shot('translation-filled')

        d.setScene('설정 · 감시')
        await d.click(tab('watch'), 'tab-watch')
        await d.say('켜기·끄기 항목을 눌러 봅니다 (두 번 눌러 원래대로)')
        for (const id of ['enabled', 'scan_existing', 'backlog_skip_if_external', 'polling']) {
          await s.toggle(`field-watch.${id}`)
          await s.toggle(`field-watch.${id}`)
        }
        await select('field-watch.backlog_order', 'settings.watch.order.path')
        await type('field-watch.reconcile_interval', '600')
        await type('field-watch.polling_interval', '30')
        await d.say('포함·제외 패턴은 Enter 로 더하고 칩의 X 로 뺍니다')
        await d.type(s.byTest('field-watch.include').locator('input[type="text"]'), '*.m2ts', { clear: false })
        await page.keyboard.press('Enter')
        await page.waitForTimeout(PACE.input)
        await d.click(s.byTest('field-watch.include').locator('.v-chip', { hasText: '*.m2ts' }).locator('.v-chip__close'), null, { pace: 'input' })
        await d.type(s.byTest('field-watch.exclude').locator('input[type="text"]'), '*.!ut', { clear: false })
        await page.keyboard.press('Enter')
        await page.waitForTimeout(PACE.input)
        await d.say('제외 폴더: 다운로드 도구가 압축을 푸는 중인 폴더는 감시하지 않습니다')
        await d.type(s.byTest('field-watch.exclude_dirs').locator('input[type="text"]'), '__ADMIN__', { clear: false })
        await page.keyboard.press('Enter')
        await page.waitForTimeout(PACE.input)
        await d.say('감시 경로를 더하고 종류를 고른 뒤 다시 지웁니다')
        const paths = s.byTest('field-watch.paths')
        await d.click(paths.locator('[data-part="add"]'), null, { pace: 'input' })
        const newRow = paths.locator('[data-part="row"]').last()
        await d.type(newRow.locator('[data-part="cell"][data-key="path"] input'), '/media/anime')
        await s.choose(newRow.locator('[data-part="cell"][data-key="kind"] .v-select'), s.t('kind.series'), 'path-added')
        await d.click(newRow.locator('[data-part="remove"]'), null, { pace: 'input' })
        await d.say('잘못된 값(음수)을 넣고 저장하면 해당 칸에 오류가 보입니다')
        await type('field-watch.stable_seconds', '-1')
        await d.click(s.byTest('settings-save'), null)
        await expect(s.byTest('field-watch.stable_seconds')).toHaveJSProperty('errorMessage', s.t('validation.greater_than_equal', { ge: 0 }))
        await d.shot('invalid')
        await s.closeToast()
        await type('field-watch.stable_seconds', combo.stableSeconds)

        d.setScene('설정 · 미디어')
        await d.click(tab('media'), 'tab-media')
        await d.say('추출 언어 칩을 끄고 켭니다 (대상 언어·원어 트랙은 늘 추출합니다)')
        const chip = s.byTest('field-media.extract_langs').locator('[data-part="chip"][data-value="ko"]')
        await d.click(chip, null, { pace: 'input' })
        await d.click(chip, null, { pace: 'input' })
        await select('field-media.output_format', 'settings.media.format.both')
        await select('field-media.output_mode', 'settings.media.mode.mirror')
        await select('field-media.output_mode', 'settings.media.mode.sidecar')
        await type('field-media.output_root', '/output')
        await type('field-media.series_window', '300')
        await d.say('검사·추출 도구를 낮은 우선순위로 실행해 다운로드 등에 디스크를 양보합니다')
        await select('field-media.tool_priority', 'settings.media.priority.normal')
        await select('field-media.tool_priority', 'settings.media.priority.low')
        await s.toggle('field-media.skip_forced')
        await s.toggle('field-media.skip_forced')
        await s.toggle('field-media.target_image_counts')
        await s.toggle('field-media.target_image_counts', 'media-filled')

        d.setScene('설정 · 큐·기록')
        await d.click(tab('queue'), 'tab-queue')
        await type('field-queue.workers', '1')
        await type('field-queue.max_attempts', '4')
        await type('field-retry.max_retries_unit', '2')
        await type('field-retry.max_retries_batch', '3')
        await type('field-ledger.hash_bytes', '4194304')
        await s.toggle('field-ledger.restore_missing_outputs')
        await s.toggle('field-ledger.restore_missing_outputs')
        await select('field-sidecar.on_conflict', 'settings.sidecar.conflict.skip')
        await select('field-sidecar.on_conflict', 'settings.sidecar.conflict.rename')
        await select('field-sidecar.rename_style', 'Movie.en.srt.orig', true)
        await select('field-sidecar.rename_style', 'Movie.en.orig.srt', true)
        await d.shot('queue-filled')

        d.setScene('설정 · 웹')
        await d.click(tab('web'), 'tab-web')
        await s.toggle('field-web.enabled')
        await s.toggle('field-web.enabled')
        await type('field-web.host', '127.0.0.1')
        await type('field-web.port', String(new URL(BASE_URL).port))
        await type('field-web.username', 'admin')
        await type('field-web.session_hours', combo.sessionHours)
        await d.shot('web-filled')
        await d.click(tab('provider'), null, { pace: 'input' })

        d.setScene('설정 · 저장·적용')
        await d.say('저장하면 주석과 다른 키를 그대로 둔 채 바뀐 값만 파일에 씁니다')
        await s.clickToast(s.byTest('settings-save'), 'settings.saved', {}, 'saved')
        await s.closeToast()
        await d.say('아직 적용되지 않았다는 안내와 함께 [적용] 버튼이 강조됩니다')
        await d.click(s.byTest('settings-apply'), 'restart-prompt')
        await d.say('취소하면 재기동하지 않습니다')
        await d.click(s.dialog().locator('[data-part="cancel"]'), null)
        await d.say('적용: 데몬을 재기동하고 다시 응답하면 화면을 새로 불러옵니다')
        await d.click(s.byTest('settings-apply'), null)
        await s.clickToast(s.dialog().locator('[data-part="confirm"]'), 'settings.restarted', {}, 'restarted')
        await d.say('다시 읽은 값: 저장한 안정화 대기 시간이 적용되었습니다')
        await d.click(tab('watch'), null)
        await expect(s.byTest('field-watch.stable_seconds').locator('input')).toHaveValue(combo.stableSeconds)
        await d.shot('reloaded-values')
        const saved = fs.readFileSync(path.join(DAEMON_ROOT, 'config', 'config.toml'), 'utf8')
        expect(saved).toContain('# E2E 용 설정 (e2e/daemon/run.sh 가 만든다)') // 주석 보존
        expect(saved).toContain(`stable_seconds = ${combo.stableSeconds}`)
        expect(saved).toMatch(new RegExp(`session_hours = ${escapeRe(combo.sessionHours)}`))
        expect(saved).toContain(`target_language = "${combo.target}"`)
      })
    })
  })
}
