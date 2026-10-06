<script setup lang="ts">
// Completed List: 처리 기록(ledger) — 판정·출력·상세·다시 처리(forget) (PROJECT-PLAN §25.5, Q-13)
import { computed, ref } from 'vue'

import { api } from '../api/client'
import type { DaemonStatus, LedgerEntry, Verdict } from '../api/types'
import { usePolling } from '../composables/polling'
import { errorText, isoFromEpoch, localTime } from '../format'
import { t } from '../i18n'
import { showError, showSuccess } from '../notify'

defineProps<{ status: DaemonStatus | null }>()
const emit = defineEmits<{ 'status-changed': [] }>()

// 기록은 자주 바뀌지 않는다. 새 판정을 놓치지 않을 만큼만 갱신한다
const REFRESH_MS = 15_000
const VERDICTS: Record<Verdict, { color: string; icon: string }> = {
  translated: { color: 'success', icon: 'mdi-translate' },
  has_target: { color: 'info', icon: 'mdi-check-circle-outline' },
  has_korean: { color: 'info', icon: 'mdi-check-circle-outline' },
  has_external: { color: 'info', icon: 'mdi-file-document-outline' },
  no_source: { color: 'warning', icon: 'mdi-help-circle-outline' },
  image_only: { color: 'warning', icon: 'mdi-image-outline' },
  failed: { color: 'error', icon: 'mdi-alert-circle' },
}

const verdict = ref<Verdict | 'all'>('all')
const history = ref(false)
const search = ref('')
const entries = ref<LedgerEntry[]>([])

const { loading, refreshedAt, refresh } = usePolling(async () => {
  try {
    entries.value = await api.ledger(verdict.value === 'all' ? undefined : verdict.value, history.value)
  } catch (error) {
    showError(errorText(error))
  }
}, REFRESH_MS)

// 템플릿에 객체 리터럴로 쓰면 다시 그릴 때마다(자동 갱신) 새 값이 요소에 들어간다. 내용이 같으면 요소가 무시하지만
// (vue-smartview dfcb3945), 사용자가 바꾼 값과 내용이 다른 리터럴(처음 정렬)은 사용자 값을 되돌린다
const filterValues = computed(() => ({ verdict: verdict.value, history: history.value }))
// 처음 정렬 (상수: 자동 갱신 때 사용자가 고른 정렬을 되돌리지 않게)
const INITIAL_SORT = [{ key: 'processed_at', order: 'desc' }]
const filters = computed(() => [
  {
    key: 'verdict',
    label: t('completed.filter'),
    items: [
      { title: t('completed.filter.all'), value: 'all' },
      // 0.6.0 전 값 has_korean 은 has_target 필터가 함께 보인다 (서버가 묶는다)
      ...(Object.keys(VERDICTS) as Verdict[])
        .filter((value) => value !== 'has_korean')
        .map((value) => ({ title: t(`verdict.${value}`), value })),
    ],
  },
])
const switches = computed(() => [{ key: 'history', label: t('completed.history') }])
const headers = computed(() => [
  {
    title: t('completed.col.name'), key: 'name', type: 'name', subKey: 'path', maxWidth: '320px',
    value: (entry: LedgerEntry) => (entry.current ? entry.name : `${entry.name} (${t('completed.historyMark')})`),
  },
  {
    title: t('completed.col.verdict'), key: 'verdict', type: 'status', width: '150px',
    statusMap: Object.fromEntries(
      (Object.keys(VERDICTS) as Verdict[]).map((v) => [v, { ...VERDICTS[v], label: t(`verdict.${v}`) }]),
    ),
  },
  { title: t('completed.col.reason'), key: 'reason', maxWidth: '240px' },
  {
    title: t('completed.col.provider'), key: 'provider', width: '100px',
    value: (entry: LedgerEntry) => entry.provider ?? t('common.none'),
  },
  {
    title: t('completed.col.processed'), key: 'processed_at', type: 'date', width: '170px',
    value: (entry: LedgerEntry) => isoFromEpoch(entry.processed_at),
  },
  {
    title: t('completed.col.actions'), key: 'actions', type: 'actions', width: '110px',
    actions: [
      { name: 'detail', icon: 'mdi-information-outline', color: 'primary', tooltip: t('completed.detail') },
      { name: 'forget', icon: 'mdi-restore', color: 'warning', tooltip: t('completed.forget') },
    ],
  },
])

async function onFilterChange(event: Event): Promise<void> {
  const [{ key, value }] = (event as CustomEvent<[{ key: string; value: string | boolean }]>).detail
  if (key === 'verdict') verdict.value = value as Verdict | 'all'
  if (key === 'history') history.value = value === true
  await refresh()
}

// 상세·다시 처리
const selected = ref<LedgerEntry | null>(null)
const detailOpen = ref(false)
const forgetOpen = ref(false)
const forgetting = ref(false)

const detailRows = computed(() => {
  const entry = selected.value
  if (!entry) return []
  return [
    {
      icon: 'mdi-flag-outline', label: t('completed.field.verdict'), value: t(`verdict.${entry.verdict}`),
      chip: VERDICTS[entry.verdict].color,
    },
    { icon: 'mdi-text', label: t('completed.field.reason'), value: entry.reason || t('common.none') },
    {
      icon: 'mdi-robot-outline', label: t('completed.field.provider'),
      value: entry.provider ? `${entry.provider} / ${entry.model ?? t('common.none')}` : t('common.none'),
    },
    {
      icon: 'mdi-subtitles-outline', label: t('completed.field.source'),
      value: Object.keys(entry.source).length ? JSON.stringify(entry.source) : t('common.none'),
    },
    { icon: 'mdi-counter', label: t('completed.field.attempts'), value: entry.attempts },
    { icon: 'mdi-clock-outline', label: t('completed.field.processed'), value: localTime(entry.processed_at) },
  ]
})

// 경로처럼 긴 값은 info-list 에서 말줄임되므로 줄바꿈되는 목록으로 보인다
const detailPaths = computed(() => {
  const entry = selected.value
  if (!entry) return []
  return [
    { label: t('completed.field.path'), value: entry.path },
    { label: t('completed.field.contentId'), value: entry.content_id },
    ...entry.outputs.map((path, index) => ({ label: t('completed.field.output', { n: index + 1 }), value: path })),
    ...entry.renames.map((item, index) => ({
      label: t('completed.field.renamed', { n: index + 1 }),
      value: `${item.original} → ${item.renamed}`,
    })),
  ]
})

function onRowAction(event: Event): void {
  const [{ action, item }] = (event as CustomEvent<[{ action: string; item: LedgerEntry }]>).detail
  selected.value = item
  if (action === 'detail') detailOpen.value = true
  if (action === 'forget') forgetOpen.value = true
}

function openForgetFromDetail(): void {
  detailOpen.value = false
  forgetOpen.value = true
}

async function forget(): Promise<void> {
  if (!selected.value) return
  forgetting.value = true
  try {
    await api.forget(selected.value.path)
    showSuccess(t('completed.forgotten'))
    forgetOpen.value = false
    await refresh()
    emit('status-changed')
  } catch (error) {
    showError(errorText(error))
  } finally {
    forgetting.value = false
  }
}
</script>

<template>
  <smartview-page-header :heading="t('nav.completed')" :subtitle="t('completed.subtitle')">
    <smartview-refreshed-at slot="actions" :time="refreshedAt" />
  </smartview-page-header>

  <smartview-filter-bar
    class="bar" data-testid="completed-filter" :search-label="t('completed.search')" :filters="filters" :switches="switches"
    :values="filterValues" :loading="loading" @filter-change="onFilterChange"
    @search-change="search = ($event as CustomEvent<[string]>).detail[0]" @refresh="refresh"
  />
  <smartview-data-table
    data-testid="completed-table" :headers="headers" :items="entries" :search="search" :loading="loading" :sort-by="INITIAL_SORT"
    empty-icon="mdi-check-all" :empty-title="t('completed.empty')" @row-action="onRowAction"
  />

  <smartview-modal
    data-testid="detail-modal" :open="detailOpen" :heading="t('completed.detailHeading')" icon="mdi-information-outline" max-width="760"
    :confirm-text="t('completed.forget')" :cancel-text="t('common.close')" dismissible
    @confirm="openForgetFromDetail" @cancel="detailOpen = false"
  >
    <dl class="paths">
      <template v-for="item in detailPaths" :key="item.label">
        <dt>{{ item.label }}</dt>
        <dd>{{ item.value }}</dd>
      </template>
    </dl>
    <smartview-info-list :rows="detailRows" />
  </smartview-modal>

  <smartview-prompt
    data-testid="forget-prompt" :open="forgetOpen" color="warning" icon="mdi-restore" :heading="t('completed.forgetHeading')"
    :message="t('completed.forgetMessage', { name: selected?.name ?? '' })" :warning="t('completed.forgetWarning')"
    :confirm-text="t('completed.forgetConfirm')" :loading="forgetting" @confirm="forget" @cancel="forgetOpen = false"
  />
</template>

<style scoped>
.bar {
  margin: 16px 0;
}
.paths {
  margin: 0 0 8px;
}
.paths dt {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 8px;
}
.paths dd {
  margin: 2px 0 0;
  font-family: monospace;
  font-size: 13px;
  word-break: break-all;
}
</style>
