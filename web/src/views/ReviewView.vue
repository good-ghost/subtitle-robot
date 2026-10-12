<script setup lang="ts">
// 자막 검수 (WI-7.009): 번역한 영상의 원본 자막과 번역 자막을 블록마다 나란히 보이고, 번역 글자를 고친다.
// 저장한 블록은 검수 완료로 표시한다 (글자를 바꾸지 않고 저장해도 된다)
import { computed, onMounted, ref } from 'vue'

import { api } from '../api/client'
import type { LedgerEntry, Review, ReviewRow } from '../api/types'
import { errorText, timecode } from '../format'
import { t } from '../i18n'
import { showError, showSuccess } from '../notify'
import { filterRows, MAX_SUBTITLE_LENGTH, oneLine, REVIEW_STATUS_LOOKS, rowStatus } from '../review'

const props = defineProps<{ entry: LedgerEntry }>()
const emit = defineEmits<{ back: [] }>()

// 자막은 수백~수천 줄이다: 한 화면에 훑어볼 만큼만
const ROWS_PER_PAGE = 50
const EDIT_ROWS = 3

interface TableRow {
  id: number
  start: string
  end: string
  source: string
  text: string
  status: string
}

const review = ref<Review | null>(null)
const loading = ref(false)
const search = ref('')
// 기본은 자막 전체다: 고칠지 말지는 앞뒤 자막을 봐야 정할 수 있다 (검토 필요만 보기는 스위치로)
const flaggedOnly = ref(false)

async function load(name?: string): Promise<void> {
  loading.value = true
  try {
    review.value = await api.review(props.entry.id, name)
  } catch (error) {
    showError(errorText(error))
  } finally {
    loading.value = false
  }
}

onMounted(() => load())

const flaggedCount = computed(() => (review.value?.rows ?? []).filter((row) => row.needs_review).length)
const reviewedCount = computed(() => (review.value?.rows ?? []).filter((row) => row.reviewed).length)
const subtitle = computed(() => {
  const head = t('review.subtitle', { name: review.value?.name ?? props.entry.name })
  if (!review.value) return head
  return `${head} · ${t('review.summary', { total: review.value.rows.length, flagged: flaggedCount.value, reviewed: reviewedCount.value })}`
})
// 문구가 비면 배너는 아무것도 그리지 않는다
const noSourceText = computed(() => (review.value && review.value.source_name === null ? t('review.noSource') : ''))
const misalignedText = computed(() =>
  review.value?.source_name && !review.value.aligned ? t('review.misaligned', { name: review.value.source_name }) : '',
)
const editedText = computed(() => (review.value?.edited ? t('review.edited') : ''))

// 템플릿에 객체 리터럴로 쓰면 다시 그릴 때마다 새 값이 요소에 들어가 사용자가 고른 값을 되돌린다 (CompletedView 와 같다)
const filterValues = computed(() => ({ name: review.value?.name ?? '', flagged: flaggedOnly.value }))
const filters = computed(() => {
  const subtitles = review.value?.subtitles ?? []
  // 번역 SRT 가 하나면 고를 것이 없다
  if (subtitles.length < 2) return []
  return [{ key: 'name', label: t('review.file'), icon: 'mdi-subtitles-outline', items: subtitles.map((name) => ({ title: name, value: name })) }]
})
const switches = computed(() => [{ key: 'flagged', label: t('review.flaggedOnly') }])

async function onFilterChange(event: Event): Promise<void> {
  const [{ key, value }] = (event as CustomEvent<[{ key: string; value: string | boolean }]>).detail
  if (key === 'flagged') flaggedOnly.value = value === true
  else if (key === 'name') await load(String(value))
}

const rows = computed<TableRow[]>(() =>
  filterRows(review.value?.rows ?? [], flaggedOnly.value).map((row) => ({
    id: row.index,
    start: timecode(row.start),
    end: timecode(row.end),
    source: oneLine(row.source),
    text: oneLine(row.text),
    status: rowStatus(row),
  })),
)
const headers = computed(() => [
  { title: t('review.col.start'), key: 'start', width: '124px' },
  { title: t('review.col.end'), key: 'end', width: '124px' },
  { title: t('review.col.source'), key: 'source', maxWidth: '520px' },
  { title: t('review.col.translated'), key: 'text', maxWidth: '520px' },
  {
    title: t('review.col.status'), key: 'status', type: 'status', width: '130px',
    statusMap: {
      reviewed: { ...REVIEW_STATUS_LOOKS.reviewed, label: t('review.status.reviewed') },
      pending: { ...REVIEW_STATUS_LOOKS.pending, label: t('review.status.pending') },
      open: { ...REVIEW_STATUS_LOOKS.open, label: t('review.status.open') },
    },
  },
  {
    title: t('review.col.actions'), key: 'actions', type: 'actions', width: '70px',
    actions: [{ name: 'edit', icon: 'mdi-pencil-outline', color: 'primary', tooltip: t('review.edit') }],
  },
])

const editing = ref<ReviewRow | null>(null)
const draft = ref('')
const saving = ref(false)
const editRows = computed(() => {
  const row = editing.value
  return row ? [{ icon: 'mdi-clock-outline', label: t('review.time'), value: `${timecode(row.start)} → ${timecode(row.end)}` }] : []
})
const editNotes = computed(() => {
  const row = editing.value
  if (!row) return []
  const notes = row.notes.map((note) => ({ type: note.severity === 'error' ? 'warning' : 'info', text: `${note.code}: ${note.detail}` }))
  // 사유 없이 검토 필요로만 표시된 블록 (폴백으로 번역한 블록 등)
  return row.needs_review && notes.length === 0 ? [{ type: 'warning', text: t('review.needsReview') }] : notes
})
// 글자를 바꾸지 않아도 저장할 수 있다 (확인만 하고 검수 완료로 표시). 빈 자막만 막는다
const blank = computed(() => draft.value.trim() === '')

function openEditor(event: Event): void {
  const [{ item }] = (event as CustomEvent<[{ item: TableRow }]>).detail
  const row = review.value?.rows.find((candidate) => candidate.index === item.id)
  if (!row) return
  editing.value = row
  draft.value = row.text
}

async function save(): Promise<void> {
  const current = review.value
  const row = editing.value
  if (!current || !row || blank.value) return
  saving.value = true
  try {
    const saved = await api.saveReview(props.entry.id, current.name, row.index, draft.value)
    review.value = {
      ...current,
      edited: current.edited || saved.text !== row.text,
      rows: current.rows.map((candidate) =>
        candidate.index === saved.index ? { ...candidate, text: saved.text, reviewed: saved.reviewed } : candidate,
      ),
    }
    showSuccess(t('review.saved', { index: saved.index }))
    editing.value = null
  } catch (error) {
    showError(errorText(error))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <smartview-page-header :heading="t('review.heading')" :subtitle="subtitle">
    <smartview-button
      slot="actions" data-testid="review-back" variant="neutral" icon-name="mdi-arrow-left" :label="t('review.back')"
      @click="emit('back')"
    />
  </smartview-page-header>

  <div class="notices">
    <smartview-hint-banner data-testid="review-no-source" type="info" :text="noSourceText" />
    <smartview-hint-banner data-testid="review-misaligned" type="warning" :text="misalignedText" />
    <smartview-hint-banner data-testid="review-edited" type="info" :text="editedText" />
  </div>

  <smartview-filter-bar
    class="bar" data-testid="review-filter" :search-label="t('review.search')" :filters="filters" :switches="switches"
    :values="filterValues" :loading="loading" @filter-change="onFilterChange"
    @search-change="search = ($event as CustomEvent<[string]>).detail[0]" @refresh="load(review?.name)"
  />
  <smartview-data-table
    data-testid="review-table" :headers="headers" :items="rows" :search="search" :loading="loading" :items-per-page="ROWS_PER_PAGE"
    row-clickable empty-icon="mdi-subtitles-outline" :empty-title="t('review.empty')"
    :empty-hint="flaggedOnly ? t('review.emptyHint') : ''" @row-click="openEditor" @row-action="openEditor"
  />

  <smartview-modal
    data-testid="review-edit-modal" :open="editing !== null" :heading="editing ? t('review.editHeading', { index: editing.index }) : ''"
    icon="mdi-pencil-outline" max-width="760" :confirm-text="t('common.save')" :cancel-text="t('common.cancel')"
    :loading="saving" :confirm-disabled="blank" @confirm="save" @cancel="editing = null"
  >
    <!--
      본문의 맨 위 요소는 창을 닫아도 지우지 않는다 (v-if 를 쓰지 않는다). 창이 열린 동안 본문은 공용 오버레이로 옮겨져
      있어, 닫는 순간 지운 요소가 되돌아오면서 화면에 남는다 (STT 검수 화면에서 확인한 동작)
    -->
    <div class="editor">
      <smartview-info-list :rows="editRows" />
      <smartview-hint-banner v-for="(note, at) in editNotes" :key="at" data-testid="review-note" :type="note.type" :text="note.text" />
      <smartview-textarea
        data-testid="review-source" :label="t('review.sourceLabel')" :value="editing?.source ?? ''" :rows="EDIT_ROWS" auto-grow readonly
      />
      <smartview-textarea
        data-testid="review-text" :label="t('review.textLabel')" :value="draft" :hint="t('review.textHelp')" :rows="EDIT_ROWS"
        auto-grow :maxlength="MAX_SUBTITLE_LENGTH" @input="draft = ($event as CustomEvent<[string]>).detail[0]"
      />
    </div>
  </smartview-modal>
</template>

<style scoped>
.notices {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}
.bar {
  margin: 16px 0;
}
.editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
