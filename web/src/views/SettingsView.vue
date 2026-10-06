<script setup lang="ts">
// Settings: config.toml 편집·저장, 적용(데몬 재기동) (PROJECT-PLAN §25.9, Q-15)
import { computed, onMounted, ref } from 'vue'

import { api, ApiError } from '../api/client'
import type { DaemonStatus, FieldError, ProviderName, SettingsState, SettingsValues } from '../api/types'
import { errorText, fieldErrorText, languageLabel, numberOrText } from '../format'
import { MESSAGES, t, type MessageKey } from '../i18n'
import { showError, showSuccess } from '../notify'
import AccountPanel from '../settings/AccountPanel.vue'
import SecretsPanel from '../settings/SecretsPanel.vue'
import SettingField from '../settings/SettingField.vue'
import SubscriptionPanel from '../settings/SubscriptionPanel.vue'
import {
  allFields,
  getPath,
  isSubscriptionProvider,
  PROVIDER_CHOICE,
  providerFields,
  PROVIDERS,
  setPath,
  FIELD_TABS,
  TAB_FIELDS,
  TABS,
  visibleProviderFields,
  type SettingField as Field,
  type SettingsTab,
} from '../settings/fields'

defineProps<{ status: DaemonStatus | null }>()
const emit = defineEmits<{ 'status-changed': []; relogin: [] }>()

// 재기동을 기다리는 간격과 상한 (진행 중인 LLM 요청 하나를 끝내고 멈추므로 NIM 제한 시간 300초 + 여유)
const RESTART_POLL_MS = 2_000
const RESTART_TIMEOUT_MS = 6 * 60_000

const state = ref<SettingsState | null>(null)
const form = ref<SettingsValues | null>(null)
const errors = ref<FieldError[]>([])
const tab = ref<SettingsTab>('provider')
const loading = ref(false)
const saving = ref(false)

const writable = computed(() => state.value?.writable === true)
const tabs = computed(() =>
  TABS.map((value) => ({
    value,
    label: t(`settings.tab.${value}` as MessageKey),
    // 오류가 있는 탭을 아이콘으로 알린다
    icon: tabHasError(value) ? 'mdi-alert-circle-outline' : undefined,
  })),
)

function fieldsOf(value: SettingsTab): Field[] {
  if (value === 'provider') return [PROVIDER_CHOICE, ...PROVIDERS.flatMap(providerFields)]
  if (value === 'keys' || value === 'account') return []
  return TAB_FIELDS[value]
}

// 서버가 주는 선택지(대상 언어 목록)를 채운 필드. 이름은 화면 언어로 (Intl), 이름 순
const languageOptions = computed(() =>
  (state.value?.languages ?? [])
    .map((item) => ({ value: item.code, label: languageLabel(item.code, item.name), literal: true }))
    .sort((a, b) => a.label.localeCompare(b.label)),
)
// 시간대: 비우면 컨테이너 TZ (§28.4)
const timezoneOptions = computed(() => [
  { value: '', label: t('settings.system.timezoneDefault'), literal: true },
  ...(state.value?.timezones ?? []).map((zone) => ({ value: zone, label: zone, literal: true })),
])
const tabFields = computed(() => {
  const resolve = (field: Field): Field => {
    if (field.dynamicOptions === 'languages') return { ...field, options: languageOptions.value }
    if (field.dynamicOptions === 'timezones') return { ...field, options: timezoneOptions.value }
    return field
  }
  return Object.fromEntries(
    Object.entries(TAB_FIELDS).map(([name, fields]) => [name, fields.map(resolve)]),
  ) as typeof TAB_FIELDS
})

function errorFor(path: string): string | undefined {
  const found = errors.value.find((error) => error.loc === path || error.loc.startsWith(`${path}.`))
  return found ? fieldErrorText(found) : undefined
}

function tabHasError(value: SettingsTab): boolean {
  return fieldsOf(value).some((field) => errorFor(field.path) !== undefined)
}

function valueOf(path: string): unknown {
  return getPath(form.value, path)
}

function update(path: string, value: unknown): void {
  if (form.value) setPath(form.value, path, value)
}

/** 설정 값 복사본. ref 안의 값은 반응형 프록시라 structuredClone 할 수 없어 JSON 으로 복사한다. */
function copyValues(values: SettingsValues): SettingsValues {
  return JSON.parse(JSON.stringify(values)) as SettingsValues
}

async function load(): Promise<void> {
  loading.value = true
  try {
    const loaded = await api.settings()
    state.value = loaded
    form.value = copyValues(loaded.values)
    errors.value = []
  } catch (error) {
    showError(errorText(error))
  } finally {
    loading.value = false
  }
}

/** 숫자 칸은 입력하는 동안 글자로 두었다가 보낼 때 숫자로 바꾼다. 비울 수 있는 칸은 비우면 null. */
function payload(): SettingsValues {
  const values = copyValues(form.value as SettingsValues)
  for (const field of allFields()) {
    if (field.kind === 'number' || field.kind === 'numberOrText') {
      const raw = getPath(values, field.path)
      if (field.nullable && (raw === null || (typeof raw === 'string' && raw.trim() === ''))) {
        setPath(values, field.path, null)
      } else if (typeof raw === 'string' || typeof raw === 'number') {
        setPath(values, field.path, numberOrText(raw))
      }
    }
  }
  return values
}

// 공급자 탭은 고른 공급자의 카드만 보인다 (Q-21)
const shownProviders = computed(() => PROVIDERS.filter((name) => name === form.value?.llm.provider))

// 모델 목록 창 (§27.3): 데몬이 공급자의 모델 목록 API 를 부른다
const modelsFor = ref<ProviderName | null>(null)
const modelsLoading = ref(false)
const modelsError = ref('')
const modelOptions = ref<{ value: string; label: string }[]>([])
const chosenModel = ref('')

async function openModels(name: ProviderName): Promise<void> {
  modelsFor.value = name
  modelsError.value = ''
  modelOptions.value = []
  chosenModel.value = form.value?.providers[name].model ?? ''
  modelsLoading.value = true
  try {
    const baseUrl = form.value?.providers[name].base_url ?? ''
    const { models } = await api.providerModels(name, baseUrl, form.value?.providers[name].auth)
    modelOptions.value = models.map((model) => ({ value: model, label: model }))
    if (!models.length) modelsError.value = t('settings.models.empty')
  } catch (error) {
    modelsError.value =
      error instanceof ApiError && `models.error.${error.code}` in MESSAGES.ko
        ? t(`models.error.${error.code}` as MessageKey, { detail: error.detail })
        : errorText(error)
  } finally {
    modelsLoading.value = false
  }
}

function chooseModel(): void {
  if (modelsFor.value && chosenModel.value) update(`providers.${modelsFor.value}.model`, chosenModel.value)
  modelsFor.value = null
}

async function save(): Promise<void> {
  if (!form.value) return
  saving.value = true
  try {
    const saved = await api.saveSettings(payload())
    state.value = saved
    form.value = copyValues(saved.values)
    errors.value = []
    showSuccess(t('settings.saved'))
  } catch (error) {
    if (error instanceof ApiError && error.code === 'invalid_settings') {
      errors.value = error.errors
      const first = TABS.find(tabHasError)
      if (first) tab.value = first
    }
    showError(errorText(error))
  } finally {
    saving.value = false
  }
}

// 적용(재기동)
const restartOpen = ref(false)
const restarting = ref(false)

/** 데몬 시작 시각이 바뀔 때까지 기다린다. 재기동이 확인 간격보다 빨라도 놓치지 않는다. */
async function waitForDaemon(previousStart: number): Promise<boolean> {
  const deadline = Date.now() + RESTART_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, RESTART_POLL_MS))
    try {
      if ((await api.status()).started_at !== previousStart) return true
    } catch {
      // 내려가 있는 동안은 연결이 안 된다. 다시 뜰 때까지 기다린다
    }
  }
  return false
}

async function restart(): Promise<void> {
  restarting.value = true
  try {
    const previousStart = (await api.status()).started_at
    await api.restart()
    restartOpen.value = false
    if (await waitForDaemon(previousStart)) {
      showSuccess(t('settings.restarted'))
      await load()
      emit('status-changed')
    } else {
      showError(t('settings.restartTimeout'))
    }
  } catch (error) {
    showError(errorText(error))
  } finally {
    restarting.value = false
    restartOpen.value = false
  }
}

onMounted(load)
</script>

<template>
  <smartview-page-header
    :heading="t('nav.settings')"
    :subtitle="state ? (state.path ? t('settings.subtitle', { path: state.path }) : t('settings.noPath')) : ''"
  >
    <smartview-button
      slot="actions" data-testid="settings-apply" :variant="state?.restart_pending ? 'brand' : 'neutral'" icon-name="mdi-restart"
      :label="t('settings.apply')" :disabled="!writable" :loading="restarting" @click="restartOpen = true"
    />
    <smartview-button
      slot="actions" data-testid="settings-save" variant="brand" icon-name="mdi-content-save-outline" :label="t('common.save')"
      :disabled="!writable || !form" :loading="saving" @click="save"
    />
  </smartview-page-header>

  <div v-if="state && form" class="body">
    <smartview-state-notice
      v-if="!writable && state.reason" type="warning" :heading="t('settings.readOnly')"
      :text="t(`settings.readOnlyText.${state.reason}` as MessageKey)"
    />
    <smartview-hint-banner v-if="restarting" type="info" :text="t('settings.restarting')" />
    <smartview-hint-banner v-else-if="state.restart_pending" type="warning" :text="t('settings.pending')" />
    <smartview-hint-banner v-else type="info" :text="t('settings.notice')" />

    <fieldset class="fields" :disabled="!writable || restarting">
      <smartview-tabs data-testid="settings-tabs" :tabs="tabs" :tab="tab" @tab-change="tab = ($event as CustomEvent<[SettingsTab]>).detail[0]">
        <div slot="tab-provider" class="tab">
          <div class="grid">
            <SettingField
              :data-testid="`field-${PROVIDER_CHOICE.path}`" :field="PROVIDER_CHOICE" :value="valueOf(PROVIDER_CHOICE.path)" :error="errorFor(PROVIDER_CHOICE.path)"
              @update="update(PROVIDER_CHOICE.path, $event)"
            />
          </div>
          <smartview-card
            v-for="name in shownProviders" :key="name" class="provider" variant="outlined"
            :heading="t(`settings.provider.${name}` as MessageKey)" icon="mdi-robot-outline"
          >
            <div class="grid">
              <template v-for="field in visibleProviderFields(name, form.providers[name].auth, state.subscription_clis ?? [])" :key="field.path">
                <div v-if="field.modelPicker" class="model-row">
                  <SettingField
                    :data-testid="`field-${field.path}`" :field="field" :value="valueOf(field.path)"
                    :error="errorFor(field.path)" @update="update(field.path, $event)"
                  />
                  <smartview-button
                    :data-testid="`models-${name}`" variant="neutral" icon-name="mdi-format-list-bulleted"
                    :label="t('settings.provider.modelList')" @click="openModels(name)"
                  />
                </div>
                <SettingField
                  v-else :data-testid="`field-${field.path}`" :field="field" :value="valueOf(field.path)"
                  :error="errorFor(field.path)" @update="update(field.path, $event)"
                />
              </template>
            </div>
            <SubscriptionPanel v-if="isSubscriptionProvider(name) && form.providers[name].auth === 'subscription'" :provider="name" />
          </smartview-card>
        </div>
        <div
          v-for="name in FIELD_TABS" :key="name" v-bind="{ slot: `tab-${name}` }"
          class="tab grid"
        >
          <SettingField
            v-for="field in tabFields[name]" :key="field.path" :data-testid="`field-${field.path}`" :class="{ wide: ['tags', 'paths', 'chips'].includes(field.kind) }"
            :field="field" :value="valueOf(field.path)" :error="errorFor(field.path)" @update="update(field.path, $event)"
          />
        </div>
        <div slot="tab-keys" class="tab">
          <SecretsPanel />
        </div>
        <div slot="tab-account" class="tab">
          <AccountPanel @changed="emit('relogin')" />
        </div>
      </smartview-tabs>
    </fieldset>
  </div>
  <smartview-spinner v-else-if="loading" :alternative-text="t('common.loading')" />

  <smartview-modal
    data-testid="models-modal" :open="modelsFor !== null" icon="mdi-format-list-bulleted"
    :heading="modelsFor ? t('settings.models.heading', { provider: t(`settings.provider.${modelsFor}` as MessageKey) }) : ''"
    :confirm-text="t('settings.models.confirm')" :loading="modelsLoading" @confirm="chooseModel" @cancel="modelsFor = null"
  >
    <!-- 모달은 열릴 때 내용 요소를 오버레이로 옮긴다. 열린 뒤 새로 만든 요소는 옮겨지지 않으므로
         v-if 대신 v-show 로 같은 요소를 보였다 숨긴다 -->
    <smartview-spinner v-show="modelsLoading" :alternative-text="t('settings.models.loading')" />
    <smartview-hint-banner v-show="!modelsLoading && modelsError" data-testid="models-error" type="warning" :text="modelsError" />
    <smartview-combobox
      v-show="!modelsLoading && !modelsError" data-testid="models-combobox" :label="t('settings.models.field')" :options="modelOptions" :value="chosenModel"
      :hint="t('settings.models.count', { count: modelOptions.length })" searchable
      @change="chosenModel = ($event as CustomEvent<[string]>).detail[0]"
    />
  </smartview-modal>

  <smartview-prompt
    data-testid="restart-prompt" :open="restartOpen" color="warning" icon="mdi-restart" :heading="t('settings.restartHeading')"
    :message="t('settings.restartMessage')" :warning="t('settings.restartWarning')"
    :confirm-text="t('settings.restartConfirm')" :loading="restarting" @confirm="restart" @cancel="restartOpen = false"
  />
</template>

<style scoped>
.body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}
.model-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.model-row > :first-child {
  flex: 1;
}
.fields {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}
.tab {
  padding: 16px 0;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px 24px;
  align-items: start;
}
.wide {
  grid-column: 1 / -1;
}
.provider {
  margin-top: 16px;
}
</style>
