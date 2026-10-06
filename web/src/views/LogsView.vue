<script setup lang="ts">
// Logs: 데몬 로그 파일의 최근 항목, 레벨 필터·자동 갱신 (PROJECT-PLAN §25.8, Q-14)
import { computed, ref } from 'vue'

import { api } from '../api/client'
import type { DaemonStatus, LogEntry } from '../api/types'
import { usePolling } from '../composables/polling'
import { compactTime, errorText } from '../format'
import { t } from '../i18n'
import { showError, showSuccess } from '../notify'

defineProps<{ status: DaemonStatus | null }>()
defineEmits<{ 'status-changed': [] }>()

const REFRESH_MS = 5_000
// 화면에 두는 최대 항목 수 (오래된 것부터 버린다)
const MAX_ENTRIES = 2_000
// 필터로 고르는 최소 레벨 (CRITICAL 은 ERROR 이상에 들어간다)
const LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR'] as const
type FilterLevel = (typeof LEVELS)[number]
const LEVEL_COLORS: Record<string, { color: string; icon: string }> = {
  DEBUG: { color: 'grey', icon: 'mdi-bug-outline' },
  INFO: { color: 'info', icon: 'mdi-information-outline' },
  WARNING: { color: 'warning', icon: 'mdi-alert-outline' },
  ERROR: { color: 'error', icon: 'mdi-alert-circle-outline' },
  CRITICAL: { color: 'error', icon: 'mdi-alert-octagon-outline' },
}

interface LogRow extends LogEntry {
  id: number
}

const level = ref<FilterLevel>('INFO')
const autoRefresh = ref(true)
const search = ref('')
const rows = ref<LogRow[]>([])
let cursor: string | undefined
let nextId = 1

const { loading, refreshedAt, refresh } = usePolling(
  async () => {
    try {
      const chunk = await api.logs(level.value, cursor)
      const fresh = chunk.entries.map((entry) => ({ ...entry, id: nextId++ })).reverse()
      rows.value = (chunk.reset ? fresh : [...fresh, ...rows.value]).slice(0, MAX_ENTRIES)
      cursor = chunk.cursor || undefined
    } catch (error) {
      showError(errorText(error))
    }
  },
  REFRESH_MS,
  autoRefresh,
)

// 템플릿에 객체 리터럴로 쓰면 다시 그릴 때마다(자동 갱신) 새 값이 요소에 들어간다. 내용이 같으면 요소가 무시하지만
// (vue-smartview dfcb3945), 사용자가 바꾼 값과 내용이 다른 리터럴(처음 정렬)은 사용자 값을 되돌린다
const filterValues = computed(() => ({ level: level.value, auto: autoRefresh.value }))
const filters = computed(() => [
  {
    key: 'level',
    label: t('logs.level'),
    items: LEVELS.map((value) => ({ title: t(`logs.level.${value}`), value })),
  },
])
const switches = computed(() => [{ key: 'auto', label: t('logs.auto') }])
const headers = computed(() => [
  { title: t('logs.col.time'), key: 'time', width: '110px', value: (row: LogRow) => compactTime(row.time) },
  {
    title: t('logs.col.level'), key: 'level', type: 'status', width: '120px',
    statusMap: Object.fromEntries(Object.entries(LEVEL_COLORS).map(([name, look]) => [name, { ...look, label: name }])),
  },
  { title: t('logs.col.thread'), key: 'thread', width: '110px' },
  { title: t('logs.col.logger'), key: 'logger', width: '220px', value: (row: LogRow) => row.logger.replace(/^subtitle_robot\./, '') },
  { title: t('logs.col.message'), key: 'message', maxWidth: '560px', value: (row: LogRow) => row.message.split('\n')[0] },
])

async function reload(): Promise<void> {
  // 레벨을 바꾸면 이어 받기 위치를 버리고 처음부터 다시 읽는다
  cursor = undefined
  await refresh()
}

async function onFilterChange(event: Event): Promise<void> {
  const [{ key, value }] = (event as CustomEvent<[{ key: string; value: string | boolean }]>).detail
  if (key === 'auto') {
    autoRefresh.value = value === true
    return
  }
  level.value = value as FilterLevel
  await reload()
}

const selected = ref<LogRow | null>(null)
const messageBox = ref<HTMLElement | null>(null)
const selectedRows = computed(() => {
  const row = selected.value
  if (!row) return []
  return [
    { icon: 'mdi-clock-outline', label: t('logs.col.time'), value: row.time },
    { icon: 'mdi-flag-outline', label: t('logs.col.level'), value: row.level, chip: LEVEL_COLORS[row.level]?.color },
    { icon: 'mdi-source-branch', label: t('logs.col.thread'), value: row.thread },
    { icon: 'mdi-code-tags', label: t('logs.col.logger'), value: row.logger },
  ]
})

async function copyMessage(): Promise<void> {
  if (!selected.value) return
  // 클립보드 API 는 HTTPS(보안 문맥)에서만 있다. LAN HTTP 에서는 글자를 선택해 두고 직접 복사하게 한다
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(selected.value.message)
      showSuccess(t('logs.copied'))
      return
    } catch {
      // 권한 거부: 아래 선택 방식으로
    }
  }
  if (messageBox.value) window.getSelection()?.selectAllChildren(messageBox.value)
  showSuccess(t('logs.copyManual'))
}

function onRowClick(event: Event): void {
  selected.value = (event as CustomEvent<[{ item: LogRow }]>).detail[0].item
}
</script>

<template>
  <smartview-page-header :heading="t('nav.logs')" :subtitle="t('logs.subtitle')">
    <smartview-refreshed-at slot="actions" :time="refreshedAt" />
    <smartview-button
      slot="actions" data-testid="logs-pause" variant="neutral" :icon-name="autoRefresh ? 'mdi-pause' : 'mdi-play'"
      :label="autoRefresh ? t('logs.pause') : t('logs.resume')" @click="autoRefresh = !autoRefresh"
    />
  </smartview-page-header>

  <smartview-filter-bar
    class="bar" data-testid="logs-filter" :search-label="t('logs.search')" :filters="filters" :switches="switches"
    :values="filterValues" :loading="loading" @filter-change="onFilterChange"
    @search-change="search = ($event as CustomEvent<[string]>).detail[0]" @refresh="reload"
  />
  <smartview-data-table
    data-testid="logs-table" :headers="headers" :items="rows" :search="search" :loading="loading" :items-per-page="50" row-clickable
    empty-icon="mdi-text-box-remove-outline" :empty-title="t('logs.empty')" @row-click="onRowClick"
  />

  <smartview-modal
    data-testid="log-modal" :open="selected !== null" :heading="t('logs.entry')" icon="mdi-text-box-outline" max-width="960"
    :confirm-text="t('logs.copy')" :cancel-text="t('common.close')" dismissible
    @confirm="copyMessage" @cancel="selected = null"
  >
    <div v-if="selected" class="entry">
      <smartview-info-list :rows="selectedRows" />
      <pre ref="messageBox" class="message">{{ selected.message }}</pre>
    </div>
  </smartview-modal>
</template>

<style scoped>
.bar {
  margin: 16px 0;
}
.message {
  margin: 12px 0 0;
  padding: 12px;
  max-height: 420px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  border: 1px solid currentColor;
  border-radius: 4px;
  opacity: 0.9;
}
</style>
