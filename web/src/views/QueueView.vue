<script setup lang="ts">
// Queue List: 대기·처리 중·실패 작업, 재시도·실패 지우기, 동영상 등록 (PROJECT-PLAN §25.5, Q-12·Q-13)
import { computed, ref } from 'vue'

import { api, ApiError } from '../api/client'
import type { DaemonStatus, Job, JobStatus } from '../api/types'
import { usePolling } from '../composables/polling'
import { compactTime, errorText } from '../format'
import { canRetry } from '../jobs'
import { t, type MessageKey } from '../i18n'
import { showError, showSuccess } from '../notify'

const props = defineProps<{ status: DaemonStatus | null }>()
const emit = defineEmits<{ 'status-changed': [] }>()

const REFRESH_MS = 5_000
const ACTIVE: JobStatus[] = ['probing', 'extracting', 'translating']
type QueueFilter = 'open' | 'queued' | 'active' | 'failed' | 'all'
const FILTER_STATUSES: Record<QueueFilter, JobStatus[] | undefined> = {
  open: ['queued', ...ACTIVE, 'failed'],
  queued: ['queued'],
  active: ACTIVE,
  failed: ['failed'],
  all: undefined,
}
const STATUS_COLORS: Record<JobStatus, { color: string; icon: string }> = {
  queued: { color: 'info', icon: 'mdi-clock-outline' },
  probing: { color: 'primary', icon: 'mdi-loading mdi-spin' },
  extracting: { color: 'primary', icon: 'mdi-loading mdi-spin' },
  translating: { color: 'primary', icon: 'mdi-loading mdi-spin' },
  done: { color: 'success', icon: 'mdi-check-circle' },
  skipped: { color: 'grey', icon: 'mdi-skip-next-circle-outline' },
  failed: { color: 'error', icon: 'mdi-alert-circle' },
}

const filter = ref<QueueFilter>('open')
const search = ref('')
const jobs = ref<Job[]>([])
const busy = ref<{ id: number; target: string }[]>([])

const { loading, refreshedAt, refresh } = usePolling(async () => {
  try {
    jobs.value = await api.jobs(FILTER_STATUSES[filter.value])
  } catch (error) {
    showError(errorText(error))
  }
}, REFRESH_MS)

// 템플릿에 객체 리터럴로 쓰면 다시 그릴 때마다(자동 갱신) 새 값이 요소에 들어간다. 내용이 같으면 요소가 무시하지만
// (vue-smartview dfcb3945), 사용자가 바꾼 값과 내용이 다른 리터럴(처음 정렬)은 사용자 값을 되돌린다
const filterValues = computed(() => ({ status: filter.value }))
const failedCount = computed(() => jobs.value.filter((job) => job.status === 'failed').length)
const retryableCount = computed(() => jobs.value.filter(canRetry).length)
const filters = computed(() => [
  {
    key: 'status',
    label: t('queue.filter'),
    items: (Object.keys(FILTER_STATUSES) as QueueFilter[]).map((value) => ({
      title: t(`queue.filter.${value}` as MessageKey),
      value,
    })),
  },
])
const headers = computed(() => [
  { title: t('queue.col.name'), key: 'name', type: 'name', subKey: 'path', maxWidth: '260px' },
  {
    title: t('queue.col.status'), key: 'status', type: 'status', width: '110px',
    statusMap: Object.fromEntries(
      (Object.keys(STATUS_COLORS) as JobStatus[]).map((s) => [s, { ...STATUS_COLORS[s], label: t(`status.${s}`) }]),
    ),
  },
  { title: t('queue.col.priority'), key: 'priority', width: '104px', value: (job: Job) => t(`priority.${job.priority}` as MessageKey) },
  { title: t('queue.col.attempts'), key: 'attempts', type: 'number', width: '76px' },
  { title: t('queue.col.next'), key: 'next_attempt_at', width: '120px', value: (job: Job) => compactTime(job.next_attempt_at) },
  { title: t('queue.col.error'), key: 'error', maxWidth: '240px', value: (job: Job) => job.error ?? '' },
  {
    title: t('queue.col.actions'), key: 'actions', type: 'actions', width: '72px',
    actions: [
      { name: 'retry', icon: 'mdi-refresh', color: 'primary', tooltip: t('queue.retry'), visible: canRetry },
    ],
  },
])

async function onFilterChange(event: Event): Promise<void> {
  const [{ value }] = (event as CustomEvent<[{ key: string; value: string }]>).detail
  filter.value = value as QueueFilter
  await refresh()
}

async function onRowAction(event: Event): Promise<void> {
  const [{ action, item }] = (event as CustomEvent<[{ action: string; item: Job }]>).detail
  if (action !== 'retry') return
  busy.value = [{ id: item.id, target: 'retry' }]
  try {
    const { count } = await api.retry(item.id)
    showSuccess(t('queue.retried', { count }))
    await refresh()
  } catch (error) {
    showError(errorText(error))
  } finally {
    busy.value = []
  }
}

const retrying = ref(false)
async function retryAll(): Promise<void> {
  retrying.value = true
  try {
    const { count } = await api.retry()
    showSuccess(t('queue.retried', { count }))
    await refresh()
    emit('status-changed')
  } catch (error) {
    showError(errorText(error))
  } finally {
    retrying.value = false
  }
}

// 실패 지우기 확인
const clearOpen = ref(false)
const clearing = ref(false)
async function clearFailed(): Promise<void> {
  clearing.value = true
  try {
    const { count } = await api.clearFailed()
    showSuccess(t('queue.cleared', { count }))
    clearOpen.value = false
    await refresh()
    emit('status-changed')
  } catch (error) {
    showError(errorText(error))
  } finally {
    clearing.value = false
  }
}

// 동영상 등록 모달
const registerOpen = ref(false)
const registering = ref(false)
const registerPath = ref('')
const recursive = ref(false)
const force = ref(false)
const pathError = ref('')
const watchPaths = computed(() => (props.status?.watch_paths ?? []).map((p) => p.path).join(', ') || t('common.none'))

function openRegister(): void {
  pathError.value = ''
  registerOpen.value = true
}

async function register(): Promise<void> {
  if (!registerPath.value.trim()) {
    pathError.value = t('error.path_not_absolute')
    return
  }
  registering.value = true
  pathError.value = ''
  try {
    const queued = await api.registerMedia(registerPath.value.trim(), recursive.value, force.value)
    showSuccess(t('register.done', { count: queued.length }))
    registerOpen.value = false
    registerPath.value = ''
    await refresh()
    emit('status-changed')
  } catch (error) {
    // 경로 문제는 입력칸에, 나머지는 알림으로
    if (error instanceof ApiError && error.status === 400) pathError.value = errorText(error)
    else showError(errorText(error))
  } finally {
    registering.value = false
  }
}
</script>

<template>
  <smartview-page-header
    :heading="t('nav.queue')" :subtitle="t('queue.subtitle')" :action-text="t('queue.register')"
    action-icon="mdi-plus" @action="openRegister"
  >
    <smartview-refreshed-at slot="actions" :time="refreshedAt" />
    <smartview-button
      slot="actions" data-testid="retry-all" variant="neutral" icon-name="mdi-refresh" :label="t('queue.retryAll')"
      :disabled="retryableCount === 0" :loading="retrying" @click="retryAll"
    />
    <smartview-button
      slot="actions" data-testid="clear-failed" variant="destructive-text" icon-name="mdi-delete-sweep-outline" :label="t('queue.clearFailed')"
      :disabled="failedCount === 0" @click="clearOpen = true"
    />
  </smartview-page-header>

  <smartview-filter-bar
    class="bar" data-testid="queue-filter" :search-label="t('queue.search')" :filters="filters" :values="filterValues" :loading="loading"
    @filter-change="onFilterChange" @search-change="search = ($event as CustomEvent<[string]>).detail[0]"
    @refresh="refresh"
  />
  <smartview-data-table
    data-testid="queue-table" :headers="headers" :items="jobs" :search="search" :busy="busy" :loading="loading" empty-icon="mdi-tray"
    :empty-title="t('queue.empty')" @row-action="onRowAction"
  />

  <smartview-prompt
    data-testid="clear-prompt" :open="clearOpen" :heading="t('queue.clearHeading')" :message="t('queue.clearMessage', { count: failedCount })"
    :warning="t('queue.clearWarning')" :confirm-text="t('queue.clearConfirm')" :loading="clearing"
    @confirm="clearFailed" @cancel="clearOpen = false"
  />

  <smartview-modal
    data-testid="register-modal" :open="registerOpen" :heading="t('register.heading')" icon="mdi-movie-plus-outline"
    :confirm-text="t('register.confirm')" :loading="registering" @confirm="register" @cancel="registerOpen = false"
  >
    <div class="form">
      <smartview-input
        data-testid="register-path" :label="t('register.path')" icon="mdi-folder-outline" :hint="t('register.pathHint', { paths: watchPaths })"
        :value="registerPath" :error-message="pathError" required placeholder="/media/movies/Movie (2024)"
        @input="registerPath = ($event as CustomEvent<[string]>).detail[0]"
      />
      <smartview-checkbox
        data-testid="register-recursive" :label="t('register.recursive')" :checked="recursive"
        @change="recursive = ($event as CustomEvent<[boolean]>).detail[0]"
      />
      <smartview-checkbox
        data-testid="register-force" :label="t('register.force')" :checked="force" @change="force = ($event as CustomEvent<[boolean]>).detail[0]"
      />
    </div>
  </smartview-modal>
</template>

<style scoped>
.bar {
  margin: 16px 0;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
