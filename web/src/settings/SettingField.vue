<script setup lang="ts">
// 설정 필드 하나를 vue-smartview 입력 요소로 그린다 (종류는 fields.ts)
import { computed } from 'vue'

import { t, type MessageKey } from '../i18n'
import { jsonText, modelRows, WATCH_KINDS, type FieldOption, type SettingField } from './fields'

// JSON 칸의 처음 줄 수
const JSON_ROWS = 2

const props = defineProps<{ field: SettingField; value: unknown; error?: string }>()
const emit = defineEmits<{ update: [value: unknown] }>()

function optionLabel(option: FieldOption): string {
  return option.literal ? option.label : t(option.label as MessageKey)
}

const label = computed(() => t(props.field.label))
const hint = computed(() => (props.field.hint ? t(props.field.hint) : ''))
const suffix = computed(() => (props.field.suffix ? t(props.field.suffix) : ''))
// 글자·숫자 칸의 값 (배열·객체 필드는 이 값을 쓰지 않는다)
const text = computed(() =>
  typeof props.value === 'string' || typeof props.value === 'number' ? String(props.value) : '',
)
const comboOptions = computed(() => (props.field.options ?? []).map((o) => ({ value: o.value, label: optionLabel(o) })))
const chipOptions = computed(() => (props.field.options ?? []).map((o) => ({ value: o.value, label: optionLabel(o) })))
const json = computed(() => jsonText(props.value))
const rows = computed(() => modelRows(props.value))
// 모델별 설정 카드의 칸 (빈 칸은 공급자 값을 쓴다)
const modelColumns = computed(() => [
  { key: 'model', type: 'text', label: t('settings.models.model'), span: 12, required: true },
  { key: 'reasoning_tokens', type: 'number', label: t('settings.provider.reasoning_tokens'), span: 4 },
  { key: 'max_output_tokens', type: 'number', label: t('settings.provider.max_output_tokens'), span: 4 },
  { key: 'temperature', type: 'number', label: t('settings.provider.temperature'), span: 4 },
  {
    key: 'extra_body', type: 'text', label: t('settings.provider.extra_body'), span: 12,
    placeholder: t('settings.models.extraBodyPlaceholder'),
  },
])
const pathColumns = computed(() => [
  { key: 'path', type: 'text', label: t('settings.watch.path'), placeholder: '/media/movies', span: 8, required: true },
  {
    key: 'kind', type: 'select', label: t('settings.watch.kind'), span: 4, defaultValue: 'auto',
    items: WATCH_KINDS.map((o) => ({ value: o.value, title: optionLabel(o) })),
  },
])

function detail<T>(event: Event): T {
  return (event as CustomEvent<[T]>).detail[0]
}
</script>

<template>
  <smartview-input
    v-if="field.kind === 'text' || field.kind === 'number' || field.kind === 'numberOrText' || field.kind === 'readonly'"
    :label="label" :hint="hint" :suffix="suffix" :value="text" :error-message="error ?? ''"
    :type="field.kind === 'number' ? 'number' : 'text'" :readonly="field.kind === 'readonly'"
    density="compact" @input="emit('update', detail<string>($event))"
  />
  <smartview-checkbox-toggle
    v-else-if="field.kind === 'toggle'" :label="label" :hint="hint" :checked="value === true"
    :error-message="error ?? ''" @change="emit('update', detail<boolean>($event))"
  />
  <smartview-combobox
    v-else-if="field.kind === 'select'" :label="label" :hint="hint" :options="comboOptions" :value="text"
    :searchable="field.searchable === true"
    :error-message="error ?? ''" density="compact" @change="emit('update', detail<string>($event))"
  />
  <smartview-multi-picklist
    v-else-if="field.kind === 'tags'" :label="label" :hint="hint" :value="value" :error-message="error ?? ''"
    @change="emit('update', detail<string[]>($event))"
  />
  <smartview-checkbox-button-group
    v-else-if="field.kind === 'chips'" :label="label" :hint="hint" :options="chipOptions" :value="value"
    :error-message="error ?? ''" @change="emit('update', detail<string[]>($event))"
  />
  <smartview-repeatable-rows
    v-else-if="field.kind === 'paths'" :label="label" :columns="pathColumns" :value="value"
    :add-text="t('settings.watch.addPath')" :error-message="error ?? ''"
    @change="emit('update', detail<Record<string, unknown>[]>($event))"
  />
  <smartview-textarea
    v-else-if="field.kind === 'json'" :label="label" :hint="hint" :value="json" :rows="JSON_ROWS" auto-grow
    :placeholder="t('settings.models.extraBodyPlaceholder')" :error-message="error ?? ''"
    @input="emit('update', detail<string>($event))"
  />
  <!-- 모델별 설정은 input 으로 받는다: 칸을 떠날 때(change) 보낸 값이 늦게 돌아와 다음 칸에 입력 중인 값을
       덮어썼다 (E2E 에서 재현). input 은 늘 요소의 최신 상태라 되돌아와도 같은 값이다 -->
  <smartview-repeatable-rows
    v-else-if="field.kind === 'models'" :label="label" :hint="hint" :columns="modelColumns" :value="rows"
    layout="card" :add-text="t('settings.models.add')" :empty-text="t('settings.models.none')"
    :error-message="error ?? ''" @input="emit('update', detail<Record<string, unknown>[]>($event))"
  />
</template>
