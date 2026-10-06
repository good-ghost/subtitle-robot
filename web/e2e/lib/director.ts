// 녹화용 연출 헬퍼: 가상 마우스 커서, 클릭 리플, 하단 자막, 자동 스크린샷, WebVTT 자막 파일,
// 그리고 조작 커버리지 추적(Shadow DOM 포함).
// 원본: vue-smartview(VUE-X) e2e/lib/director.ts. 스크린샷 이름에 시나리오 접두어(`prefix`)를 붙이고
// 번호를 시나리오별 시작 번호에서 이어 매기도록 바꿨다 (여러 시나리오의 캡처를 한 폴더에 둔다).
import fs from 'node:fs'
import path from 'node:path'

import type { BrowserContext, Locator, Page } from '@playwright/test'

// 모든 문서 로드 시 주입되는 오버레이 (녹화 영상에 그대로 찍힌다). 1080p 기준 자막 28px.
const OVERLAY_SCRIPT = `(() => {
  const CSS = \`
    #e2e-cursor{position:fixed;left:-100px;top:-100px;width:28px;height:28px;z-index:2147483646;
      pointer-events:none;transform:translate(-4px,-3px)}
    #e2e-cursor svg{filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))}
    #e2e-cursor.down svg{transform:scale(.85);transform-origin:4px 3px}
    .e2e-ripple{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;
      border:3px solid #ffca28;background:rgba(255,202,40,.25);z-index:2147483645;pointer-events:none;
      animation:e2e-rip .7s ease-out forwards}
    @keyframes e2e-rip{from{transform:scale(.25);opacity:1}to{transform:scale(1.5);opacity:0}}
    #e2e-caption{position:fixed;left:50%;bottom:32px;transform:translateX(-50%);max-width:78%;
      padding:14px 30px 16px;border-radius:14px;background:rgba(8,12,26,.88);color:#fff;
      font:600 28px/1.45 'Noto Sans CJK KR','Noto Sans KR',system-ui,sans-serif !important;text-align:center;
      letter-spacing:normal !important;text-transform:none !important;box-sizing:border-box !important;
      z-index:2147483644;pointer-events:none;box-shadow:0 8px 28px rgba(0,0,0,.4);
      border:1px solid rgba(255,255,255,.12);transition:opacity .25s ease;opacity:1}
    #e2e-caption .e2e-step{display:block;font-size:17px;font-weight:700;color:#ffca28;font-family:inherit !important;line-height:1.4 !important;text-transform:none !important;
      letter-spacing:.4px;margin-bottom:2px}
    #e2e-caption.hidden{opacity:0}
    #e2e-title{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:18px;pointer-events:none;color:#fff;text-align:center;
      background:linear-gradient(135deg,#0d1b2a 0%,#1b2838 45%,#1a237e 100%);
      font-family:'Noto Sans CJK KR','Noto Sans KR',system-ui,sans-serif !important;letter-spacing:normal !important;
      text-transform:none !important;transition:opacity .5s}
    #e2e-title div{font-family:inherit !important;line-height:1.3 !important}
    #e2e-title.hidden{opacity:0}
    #e2e-title .t{font-size:60px;font-weight:800;letter-spacing:-.5px}
    #e2e-title .s{font-size:28px;font-weight:500;color:#b3c7ff;max-width:70%;line-height:1.5}
    #e2e-title .b{margin-top:10px;font-size:20px;font-weight:700;color:#ffca28;letter-spacing:1px}\`;

  // ── 조작 커버리지: 클릭·입력이 지나간 상호작용 요소를 기록한다 (Shadow DOM 안 포함) ──
  const INTERACTIVE = 'button, [role="button"], a[href], input, select, textarea, [contenteditable="true"], th[tabindex]';
  // 표·목록은 다시 그려질 때 DOM 노드가 새로 만들어진다. 노드가 아니라 안정적인 식별자로 기록한다.
  const touched = new Set();
  // 한 번이라도 보였고 누를 수 있던 식별자 (__e2eCoverage 가 부를 때마다 모은다)
  const seen = new Set();
  function keyOf(el) {
    const hosts = [];
    let root = el.getRootNode();
    while (root instanceof ShadowRoot) { const id = root.host.dataset.testid || root.host.dataset.test; hosts.unshift(root.host.tagName.toLowerCase() + (id ? '[' + id + ']' : '')); root = root.host.getRootNode(); }
    const dataAttrs = ['data-testid', 'data-test', 'data-part', 'data-action'].map((a) => el.getAttribute(a) ? a + '=' + el.getAttribute(a) : '').filter(Boolean);
    const tr = el.closest('tbody tr');
    const row = tr ? 'row=' + ((tr.querySelector('[data-part="name"]') || tr.cells[0] || {}).textContent || '').trim() : '';
    const col = el.matches('th') && el.parentElement ? 'col=' + [...el.parentElement.children].indexOf(el) : '';
    const input = el.closest('.v-input');
    const inField = input ? 'in:' + [...input.classList].filter((c) => /^v-(select|text-field)$/.test(c)).join('') : '';
    const fallback = dataAttrs.length ? '' : [inField, el.type || ''].filter(Boolean).join(' ');
    return [hosts.join(' > '), el.tagName.toLowerCase(), dataAttrs.join(' '), row, col, fallback].filter(Boolean).join(' | ');
  }
  function mark(e) {
    for (const n of e.composedPath()) {
      if (!(n instanceof Element)) continue;
      if (n.matches(INTERACTIVE)) touched.add(keyOf(n));
      // v-select·v-text-field 는 감싸는 .v-input 을 눌러 조작한다. 안쪽 입력 요소도 조작한 것으로 본다.
      if (n.classList.contains('v-input')) n.querySelectorAll(INTERACTIVE).forEach((c) => touched.add(keyOf(c)));
    }
  }
  ['click', 'input', 'change'].forEach((t) => document.addEventListener(t, mark, true));
  function* walk(root) {
    for (const el of root.querySelectorAll('*')) {
      yield el;
      if (el.shadowRoot) yield* walk(el.shadowRoot);
    }
  }
  window.__e2eCoverage = () => {
    const rows = [];
    for (const el of walk(document)) {
      if (!el.matches(INTERACTIVE) || el.closest('#e2e-caption, #e2e-title, #e2e-cursor')) continue;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const visible = r.width > 0 && r.height > 0 && cs.visibility !== 'hidden';
      // 로딩 중인 버튼(aria-busy)은 누를 수 없게 되어 있으므로 비활성과 같이 본다.
      const disabled = el.disabled === true || el.getAttribute('aria-disabled') === 'true' || el.getAttribute('aria-busy') === 'true';
      const key = keyOf(el);
      rows.push({ desc: key, touched: touched.has(key), visible, disabled });
    }
    // 갤러리는 한 번에 요소 하나만 그린다 (WI-6.008). 요소를 바꾸기 전에 부를 때마다 "보였고 누를 수 있던" 식별자를 모아 두고,
    // 판정은 모은 것 전체로 한다 (예전 한 페이지 갤러리에서 모든 섹션을 한꺼번에 본 것과 같다).
    for (const r of rows) if (r.visible && !r.disabled) seen.add(r.desc);
    const scope = [...seen];
    return {
      total: scope.length,
      touched: scope.filter((key) => touched.has(key)).length,
      untouched: scope.filter((key) => !touched.has(key)),
      disabled: rows.filter((r) => r.visible && r.disabled).map((r) => r.desc),
      seenKeys: scope,
      touchedKeys: [...touched],
    };
  };

  function install() {
    if (document.getElementById('e2e-cursor')) return;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const cursor = document.createElement('div');
    cursor.id = 'e2e-cursor';
    cursor.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28"><path d="M4 3 L4 23 L9.5 18 L13.5 26 L17 24.5 L13 16.8 L20.5 16.8 Z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(cursor);
    const caption = document.createElement('div');
    caption.id = 'e2e-caption';
    caption.className = 'hidden';
    document.body.appendChild(caption);
    const title = document.createElement('div');
    title.id = 'e2e-title';
    title.className = 'hidden';
    document.body.appendChild(title);
    // 페이지를 이동해도 자막이 끊기지 않게 마지막 자막을 이어받는다.
    const savedCaption = sessionStorage.getItem('e2e-caption');
    if (savedCaption) window.__e2eCaption(JSON.parse(savedCaption));
    const pos = sessionStorage.getItem('e2e-cursor');
    if (pos) { const p = JSON.parse(pos); cursor.style.left = p.x + 'px'; cursor.style.top = p.y + 'px'; }
    document.addEventListener('mousemove', (e) => { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; }, true);
    document.addEventListener('mousedown', (e) => {
      cursor.classList.add('down');
      const r = document.createElement('div');
      r.className = 'e2e-ripple';
      r.style.left = e.clientX + 'px';
      r.style.top = e.clientY + 'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 800);
    }, true);
    document.addEventListener('mouseup', () => cursor.classList.remove('down'), true);
  }
  window.__e2eCaption = (c) => {
    sessionStorage.setItem('e2e-caption', JSON.stringify(c || null));
    const el = document.getElementById('e2e-caption');
    if (!el) return;
    if (!c || !c.text) { el.className = 'hidden'; return; }
    el.textContent = '';
    if (c.step) {
      const s = document.createElement('span');
      s.className = 'e2e-step';
      s.textContent = c.step;
      el.appendChild(s);
    }
    el.appendChild(document.createTextNode(c.text));
    el.className = '';
  };
  window.__e2eTitle = (c) => {
    const el = document.getElementById('e2e-title');
    if (!el) return;
    if (!c) { el.className = 'hidden'; return; }
    el.textContent = '';
    for (const [cls, text] of [['b', c.badge], ['t', c.title], ['s', c.subtitle]]) {
      if (!text) continue;
      const d = document.createElement('div');
      d.className = cls;
      d.textContent = text;
      el.appendChild(d);
    }
    el.className = '';
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();`

function slug(s: string): string {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function vttTime(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const r = Math.floor(ms % 1000)
  const p = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${p(h)}:${p(m)}:${p(s)}.${p(r, 3)}`
}

// 녹화 액션 간격(ms). 공통 E2E 규칙:
//  - 모달이 뜨거나 화면이 전환되는 버튼 액션 사이 1.5초
//  - 같은 화면에서 값을 입력·선택하는 액션 사이 0.3~0.5초
export const PACE = { transition: 1500, input: 400 } as const
export type Pace = keyof typeof PACE

export function escapeRe(s: string): string {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

interface Cue {
  start: number
  end: number | null
  step: string
  text: string
}

interface ShotRecord {
  file: string
  name: string
  scene: string
  caption: string
}

export class Director {
  readonly page: Page
  readonly screenshotDir: string
  shotNo: number
  cues: Cue[]
  t0: number
  mouse: { x: number; y: number }
  scene: string
  shots: ShotRecord[]
  timeline: { t: number; label: string }[]
  // 페이지를 새로 읽으면 브라우저 쪽 기록이 사라진다. 조작할 때마다 여기에 모은다
  readonly seenAll = new Set<string>()
  readonly touchedAll = new Set<string>()
  readonly disabledAll = new Set<string>()

  readonly prefix: string

  constructor(
    page: Page,
    { screenshotDir, prefix = '', firstShot = 1 }: { screenshotDir: string; prefix?: string; firstShot?: number },
  ) {
    this.page = page
    this.screenshotDir = screenshotDir
    this.prefix = prefix
    this.shotNo = firstShot - 1
    this.cues = []
    this.t0 = Date.now()
    this.mouse = { x: 960, y: 540 }
    this.scene = ''
    this.shots = []
    // 동작 타임라인 (정지 구간 검사용): 화면이 바뀌는 동작마다 시각을 남긴다.
    this.timeline = []
  }

  static async install(context: BrowserContext): Promise<void> {
    await context.addInitScript(OVERLAY_SCRIPT)
  }

  markVideoStart(): void {
    this.t0 = Date.now()
  }

  mark(label: string): void {
    this.timeline.push({ t: Date.now() - this.t0, label })
  }

  async pause(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms)
  }

  setScene(scene: string): void {
    this.scene = scene
  }

  /** 하단 자막을 동작 직전에 표시하고 읽을 시간만큼 머문다. */
  async say(text: string, holdMs = 1800): Promise<void> {
    const now = Date.now() - this.t0
    const last = this.cues[this.cues.length - 1]
    if (last && last.end == null) last.end = now
    this.cues.push({ start: now, end: null, step: this.scene, text })
    this.mark(`caption: ${text}`)
    await this.page.evaluate((c) => window.__e2eCaption?.(c), { step: this.scene, text })
    await this.pause(holdMs)
  }

  async titleCard({ badge, title, subtitle }: E2eTitleCard, holdMs = 3000): Promise<void> {
    this.mark(`title: ${title}`)
    await this.page.evaluate((c) => window.__e2eTitle?.(c), { badge, title, subtitle })
    await this.page.waitForTimeout(holdMs)
    await this.page.evaluate(() => window.__e2eTitle?.(null))
    await this.page.waitForTimeout(600)
    this.mark('title closed')
  }

  async clearCaption(): Promise<void> {
    const last = this.cues[this.cues.length - 1]
    if (last && last.end == null) last.end = Date.now() - this.t0
    await this.page.evaluate(() => window.__e2eCaption?.(null))
  }

  /** 화면 스크린샷 (번호-이름.png) */
  async shot(name: string): Promise<string> {
    this.shotNo += 1
    const label = this.prefix ? `${this.prefix}-${slug(name)}` : slug(name)
    const file = path.join(this.screenshotDir, `${String(this.shotNo).padStart(4, '0')}-${label}.png`)
    await this.page.waitForTimeout(300)
    await this.page.screenshot({ path: file })
    const cue = this.cues[this.cues.length - 1]
    this.shots.push({
      file: path.basename(file),
      name,
      scene: this.scene,
      caption: cue && cue.end == null && cue.step === this.scene ? cue.text : '',
    })
    return file
  }

  /** 지금 화면의 상호작용 요소와 조작 기록을 Node 쪽에 모은다 (새로고침·화면 교체에도 남게) */
  async checkpoint(): Promise<void> {
    const result = await this.page
      .evaluate(() => window.__e2eCoverage?.() ?? null)
      .catch(() => null)
    if (!result) return
    result.seenKeys.forEach((key) => this.seenAll.add(key))
    result.touchedKeys.forEach((key) => this.touchedAll.add(key))
    result.disabled.forEach((key) => this.disabledAll.add(key))
  }

  /** 장면 전체의 커버리지 (보였던 요소 중 조작하지 않은 것) */
  async coverageSummary(): Promise<E2eCoverage> {
    await this.checkpoint()
    const seen = [...this.seenAll]
    const untouched = seen.filter((key) => !this.touchedAll.has(key))
    return {
      total: seen.length,
      touched: seen.length - untouched.length,
      untouched,
      disabled: [...this.disabledAll].filter((key) => !this.seenAll.has(key)),
      seenKeys: seen,
      touchedKeys: [...this.touchedAll],
    }
  }

  /** 가상 커서를 요소 중앙으로 부드럽게 이동 */
  async moveTo(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded()
    const box = await locator.boundingBox()
    if (!box) return
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    const dist = Math.hypot(x - this.mouse.x, y - this.mouse.y)
    const steps = Math.max(8, Math.min(40, Math.round(dist / 18)))
    await this.page.mouse.move(x, y, { steps })
    this.mouse = { x, y }
    await this.page.evaluate((p) => sessionStorage.setItem('e2e-cursor', JSON.stringify(p)), this.mouse)
    await this.pause(160)
  }

  /**
   * 클릭. 모달·화면 전환은 'transition'(1.5초), 같은 화면 안의 조작은 'input'(0.4초).
   */
  async click(
    locator: Locator,
    shot?: string | null,
    {
      pace = 'transition',
      position,
      modifiers,
    }: { pace?: Pace; position?: { x: number; y: number }; modifiers?: ('Shift' | 'ControlOrMeta' | 'Alt')[] } = {}
  ): Promise<void> {
    await locator.waitFor({ state: 'visible' })
    await this.moveTo(locator)
    this.mark(`click ${shot || ''}`)
    // position: 요소 안의 특정 지점(예: 다이얼로그 바깥 scrim 모서리)을 누른다. modifiers: Ctrl·Shift 누르기 (목록 여러 개 표시)
    await locator.click({ ...(position ? { position } : {}), ...(modifiers ? { modifiers } : {}) })
    // 커버리지 수집(Shadow DOM 전체 훑기)은 액션 간격 대기와 함께 한다. 따로 하면 녹화가 그만큼 멈춘다
    await Promise.all([this.pause(PACE[pace]), this.checkpoint()])
    if (shot) await this.shot(shot)
  }

  /** 두 번 누르기 (같은 화면 안의 조작) */
  async dblclick(locator: Locator, shot?: string | null): Promise<void> {
    await locator.waitFor({ state: 'visible' })
    await this.moveTo(locator)
    this.mark(`dblclick ${shot || ''}`)
    await locator.dblclick()
    await this.pause(PACE.input)
    if (shot) await this.shot(shot)
  }

  async hover(locator: Locator, shot?: string): Promise<void> {
    await this.moveTo(locator)
    this.mark(`hover ${shot || ''}`)
    await this.pause(700)
    if (shot) await this.shot(shot)
  }

  /**
   * 파일 고르기: 입력칸을 누르고 뜨는 파일 선택 창에 파일을 넣는다.
   * Playwright 가 filechooser 를 기다리는 동안에는 실제 창이 뜨지 않는다.
   */
  async chooseFile(
    fieldLocator: Locator,
    files: { name: string; mimeType: string; buffer: Buffer },
    shot?: string | null
  ): Promise<void> {
    await this.moveTo(fieldLocator)
    const chooser = this.page.waitForEvent('filechooser')
    this.mark(`choose file ${files.name}`)
    await fieldLocator.click()
    await (await chooser).setFiles(files)
    await this.pause(PACE.transition)
    if (shot) await this.shot(shot)
  }

  /** 사람이 타이핑하듯 입력 */
  async type(
    locator: Locator,
    text: string | number,
    { shot, clear = true, delay = 60 }: { shot?: string; clear?: boolean; delay?: number } = {}
  ): Promise<void> {
    await this.moveTo(locator)
    await locator.click()
    if (clear) {
      await locator.press('ControlOrMeta+a')
      await locator.press('Backspace')
    }
    this.mark(`type ${text}`)
    await locator.pressSequentially(String(text), { delay })
    await Promise.all([this.pause(PACE.input), this.checkpoint()])
    if (shot) await this.shot(shot)
  }

  /** Vuetify v-select 선택 (메뉴는 요소의 Shadow Root 안에 뜬다. Playwright CSS 셀렉터는 Shadow DOM 을 관통한다) */
  async select(fieldLocator: Locator, optionText: string, shot?: string | null): Promise<void> {
    await this.click(fieldLocator, null, { pace: 'input' })
    const option = this.page
      .locator('.v-overlay--active .v-list-item')
      .filter({ has: this.page.locator('.v-list-item-title', { hasText: new RegExp(`^\\s*${escapeRe(optionText)}\\s*$`) }) })
      .first()
    await option.waitFor({ state: 'visible' })
    await this.pause(300)
    if (shot) await this.shot(`${shot}-menu`)
    await this.click(option, null, { pace: 'input' })
    await this.page.locator('.v-overlay--active .v-list').waitFor({ state: 'hidden' }).catch(() => {})
    if (shot) await this.shot(shot)
  }

  /** 지금 화면의 상호작용 요소를 커버리지 판정 대상에 모은다 (갤러리에서 다른 요소로 옮기기 전에 부른다) */
  async collectCoverage(): Promise<void> {
    await this.coverage()
  }

  async coverage(): Promise<E2eCoverage> {
    return this.page.evaluate(() => {
      if (!window.__e2eCoverage) throw new Error('커버리지 추적 스크립트가 주입되지 않았습니다 (Director.install)')
      return window.__e2eCoverage()
    })
  }

  writeIndex(file: string, title: string, extraLines: string[] = []): void {
    const cell = (v: string) => String(v || '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
    const lines = [`# ${title}`, '', '| 번호 | 파일 | 장면 | 설명 |', '|---|---|---|---|']
    this.shots.forEach((s) => {
      lines.push(`| ${s.file.slice(0, 4)} | [${s.file}](${s.file}) | ${cell(s.scene)} | ${cell(s.caption || s.name)} |`)
    })
    fs.writeFileSync(file, [...lines, '', ...extraLines].join('\n') + '\n')
  }

  writeVtt(file: string): void {
    const end = Date.now() - this.t0
    const lines = ['WEBVTT', '']
    this.cues.forEach((c, i) => {
      lines.push(String(i + 1))
      lines.push(`${vttTime(c.start)} --> ${vttTime(c.end ?? end)}`)
      if (c.step) lines.push(`[${c.step}]`)
      lines.push(c.text, '')
    })
    fs.writeFileSync(file, lines.join('\n'))
  }
}
