<script setup lang="ts">
// 앱 셸: 사이드 메뉴(Dashboard·Queue List·Completed List·Archived List·Logs·Settings, Q-12·WI-7.010), 상단 바 데몬 상태
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { api } from '../api/client'
import { useNarrow } from '../composables/narrow'
import type { DaemonStatus } from '../api/types'
import { t, type MessageKey } from '../i18n'
import { route, routeHref, ROUTES, type RouteName } from '../router'
import ArchiveView from '../views/ArchiveView.vue'
import CompletedView from '../views/CompletedView.vue'
import DashboardView from '../views/DashboardView.vue'
import LogsView from '../views/LogsView.vue'
import QueueView from '../views/QueueView.vue'
import SettingsView from '../views/SettingsView.vue'

const emit = defineEmits<{ logout: []; relogin: [] }>()

// 상단 바 상태 칩 갱신 간격
const STATUS_INTERVAL_MS = 15_000

const ICONS: Record<RouteName, string> = {
  dashboard: 'mdi-view-dashboard-outline',
  queue: 'mdi-tray-full',
  completed: 'mdi-check-all',
  archive: 'mdi-archive-outline',
  logs: 'mdi-text-box-search-outline',
  settings: 'mdi-cog-outline',
}
const VIEWS = {
  dashboard: DashboardView,
  queue: QueueView,
  completed: CompletedView,
  archive: ArchiveView,
  logs: LogsView,
  settings: SettingsView,
} as const

// 좁은 화면(폰): 셸에 덮는 드로어가 없어 펼친 메뉴가 본문을 밀어낸다. 접은 메뉴(rail)로 시작하고
// 메뉴로 이동하면 다시 접는다 (WI-7.011)
const narrow = useNarrow()
const rail = ref(narrow.value)
const status = ref<DaemonStatus | null>(null)
const statusFailed = ref(false)
let timer: number | undefined

const items = computed(() =>
  ROUTES.map((name) => ({ key: name, label: t(`nav.${name}` as MessageKey), icon: ICONS[name], href: routeHref(name) })),
)
const footerItems = computed(() => [{ key: 'logout', label: t('nav.logout'), icon: 'mdi-logout', color: 'error' }])
const breadcrumbs = computed(() => [
  { label: t('app.name'), href: routeHref('dashboard') },
  { label: t(`nav.${route.value}` as MessageKey) },
])
const shellStatus = computed(() => {
  if (statusFailed.value) return 'error'
  if (!status.value) return 'unknown'
  return status.value.healthy ? 'ok' : 'error'
})
const statusLabel = computed(() => t(`shell.status.${shellStatus.value}` as MessageKey))

async function refreshStatus(): Promise<void> {
  try {
    status.value = await api.status()
    statusFailed.value = false
  } catch {
    // 401 은 클라이언트가 로그인 화면으로 돌린다. 나머지는 상태 칩으로만 알린다
    statusFailed.value = true
  }
}

function onNavigate(event: Event): void {
  const [{ href }] = (event as CustomEvent<[{ href?: string }]>).detail
  event.preventDefault()
  if (href) window.location.hash = href
  if (narrow.value) rail.value = true
}

function onRailChange(event: Event): void {
  rail.value = (event as CustomEvent<[boolean]>).detail[0]
}

function onFooterAction(event: Event): void {
  const [{ key }] = (event as CustomEvent<[{ key: string }]>).detail
  if (key === 'logout') emit('logout')
}

onMounted(() => {
  void refreshStatus()
  timer = window.setInterval(() => void refreshStatus(), STATUS_INTERVAL_MS)
})
onBeforeUnmount(() => window.clearInterval(timer))
watch(narrow, (value) => {
  rail.value = value
})
</script>

<template>
  <smartview-app-shell
    class="shell"
    :brand-name="t('app.name')"
    brand-icon="mdi-subtitles"
    :version="status?.version ?? ''"
    :current="route"
    :status="shellStatus"
    :status-label="statusLabel"
    :items="items"
    :footer-items="footerItems"
    :breadcrumbs="breadcrumbs"
    :rail="rail"
    @navigate="onNavigate"
    @rail-change="onRailChange"
    @footer-action="onFooterAction"
  >
    <main class="page">
      <component :is="VIEWS[route]" :status="status" @status-changed="refreshStatus" @relogin="emit('relogin')" />
    </main>
  </smartview-app-shell>
</template>

<style scoped>
.shell {
  height: 100vh;
}
.page {
  padding: 16px 24px 24px;
  box-sizing: border-box;
}
/* 폰: 접은 메뉴 옆 본문 폭을 넓힌다 */
@media (max-width: 839.98px) {
  .page {
    padding: 12px 12px 16px;
  }
}
</style>
