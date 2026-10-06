<script setup lang="ts">
// 공급자 카드의 구독 로그인 (PROJECT-PLAN §28.1): 상태, 로그인 창(토큰·자격 파일 붙여넣기, Codex 기기 코드), 로그아웃.
// 자격 값은 화면으로 내려오지 않는다 (Claude 토큰은 끝 4자리 힌트만)
import { computed, onMounted, onUnmounted, ref } from 'vue'

import { api, ApiError } from '../api/client'
import type { DeviceLogin, LoginStatus, SubscriptionProvider } from '../api/types'
import { errorText, localTime } from '../format'
import { MESSAGES, t, type MessageKey } from '../i18n'
import { showError, showSuccess } from '../notify'

const props = defineProps<{ provider: SubscriptionProvider }>()

// 기기 코드 로그인 상태를 묻는 간격
const DEVICE_POLL_MS = 1_500
const CLI_NAMES: Record<SubscriptionProvider, string> = { claude: 'Claude Code', openai: 'Codex' }
// CLI 를 넣은 이미지 태그 (태그마다 CLI 하나, README "이미지 태그")
const IMAGE_TAGS: Record<SubscriptionProvider, string> = { claude: 'claude', openai: 'codex' }
const IDLE: DeviceLogin = { state: 'idle', url: null, code: null, error: null }

const status = ref<LoginStatus | null>(null)
const open = ref(false)
const draft = ref('')
const saving = ref(false)
const busy = ref(false)
const device = ref<DeviceLogin>(IDLE)
let pollTimer: ReturnType<typeof setTimeout> | undefined

const isToken = computed(() => props.provider === 'claude')
const providerLabel = computed(() => t(`settings.provider.${props.provider}` as MessageKey))
const badge = computed(() => {
  const current = status.value
  if (!current?.logged_in) return { color: 'grey', icon: 'mdi-account-off-outline', label: t('subscription.loggedOut') }
  const label = current.hint
    ? t('subscription.loggedInHint', { hint: current.hint })
    : current.updated_at
      ? t('subscription.loggedInAt', { time: localTime(current.updated_at) })
      : t('subscription.loggedIn')
  return { color: 'success', icon: 'mdi-check-circle-outline', label }
})
const deviceRows = computed(() => [
  { icon: 'mdi-link-variant', label: t('subscription.deviceUrl'), value: device.value.url ?? '…' },
  { icon: 'mdi-numeric', label: t('subscription.deviceCode'), value: device.value.code ?? '…' },
])
const deviceText = computed(() => {
  if (device.value.state === 'failed') {
    return device.value.error === 'timeout'
      ? t('subscription.deviceExpired')
      : t('subscription.deviceFailed', { error: device.value.error ?? '' })
  }
  return t('subscription.deviceWaiting')
})

function failureText(error: unknown): string {
  if (error instanceof ApiError && `subscription.error.${error.code}` in MESSAGES.ko) {
    return t(`subscription.error.${error.code}` as MessageKey)
  }
  return errorText(error)
}

async function load(): Promise<void> {
  try {
    status.value = (await api.subscriptions()).find((row) => row.provider === props.provider) ?? null
  } catch (error) {
    showError(errorText(error))
  }
}

function openLogin(): void {
  draft.value = ''
  device.value = IDLE
  open.value = true
}

function stopPolling(): void {
  if (pollTimer !== undefined) clearTimeout(pollTimer)
  pollTimer = undefined
}

async function close(): Promise<void> {
  stopPolling()
  open.value = false
  if (device.value.state === 'waiting') {
    try {
      await api.cancelDeviceLogin()
    } catch (error) {
      showError(errorText(error))
    }
  }
  device.value = IDLE
}

async function save(): Promise<void> {
  saving.value = true
  try {
    status.value = await api.saveSubscription(props.provider, draft.value)
    showSuccess(t('subscription.saved'))
    await close()
  } catch (error) {
    showError(failureText(error))
  } finally {
    saving.value = false
  }
}

async function logout(): Promise<void> {
  busy.value = true
  try {
    status.value = await api.clearSubscription(props.provider)
    showSuccess(t('subscription.loggedOutToast'))
  } catch (error) {
    showError(errorText(error))
  } finally {
    busy.value = false
  }
}

async function poll(): Promise<void> {
  try {
    device.value = await api.deviceLogin()
  } catch (error) {
    showError(errorText(error))
    return
  }
  if (device.value.state === 'done') {
    await load()
    showSuccess(t('subscription.saved'))
    stopPolling()
    open.value = false
    device.value = IDLE
  } else if (device.value.state === 'waiting') {
    pollTimer = setTimeout(poll, DEVICE_POLL_MS)
  }
}

function openDeviceUrl(): void {
  // 데몬이 아니라 사용자의 브라우저에서 로그인한다
  if (device.value.url) window.open(device.value.url, '_blank', 'noopener,noreferrer')
}

async function startDevice(): Promise<void> {
  stopPolling()
  try {
    device.value = await api.startDeviceLogin()
    pollTimer = setTimeout(poll, DEVICE_POLL_MS)
  } catch (error) {
    showError(failureText(error))
  }
}

onMounted(load)
onUnmounted(stopPolling)
</script>

<template>
  <div class="subscription" :data-testid="`subscription-${provider}`">
    <smartview-hint-banner
      v-if="status && !status.cli_available" :data-testid="`subscription-cli-missing-${provider}`" type="warning"
      :text="t('subscription.cliMissing', { cli: CLI_NAMES[provider], tag: IMAGE_TAGS[provider] })"
    />
    <smartview-hint-banner type="info" :text="t('subscription.notice', { cli: CLI_NAMES[provider] })" />
    <div class="status-row">
      <smartview-badge :data-testid="`subscription-status-${provider}`" :color="badge.color" :icon="badge.icon" :label="badge.label" />
      <smartview-button
        :data-testid="`subscription-login-${provider}`" variant="brand" icon-name="mdi-login"
        :label="status?.logged_in ? t('subscription.relogin') : t('subscription.login')" @click="openLogin"
      />
      <smartview-button
        :data-testid="`subscription-logout-${provider}`" variant="neutral" icon-name="mdi-logout"
        :label="t('subscription.logout')" :disabled="!status?.logged_in" :loading="busy" @click="logout"
      />
    </div>
  </div>

  <smartview-modal
    :data-testid="`subscription-modal-${provider}`" :open="open" icon="mdi-account-key-outline"
    :heading="t('subscription.loginHeading', { provider: providerLabel })" :confirm-text="t('subscription.save')"
    :confirm-disabled="!draft.trim()" :loading="saving"
    :secondary-text="provider === 'openai' ? t('subscription.deviceStart') : undefined" secondary-icon="mdi-cellphone-key"
    :secondary-loading="device.state === 'waiting'" @confirm="save" @cancel="close" @secondary="startDevice"
  >
    <!-- 모달은 열릴 때 내용 요소를 오버레이로 옮긴다. 열린 뒤 새로 만든 요소는 옮겨지지 않으므로
         조건부 내용은 v-if 대신 v-show 로 같은 요소를 보였다 숨긴다 -->
    <div class="login">
      <p class="steps">{{ t(`subscription.steps.${provider}` as MessageKey) }}</p>
      <div v-show="device.state !== 'idle'" class="device" :data-testid="`subscription-device-${provider}`">
        <smartview-info-list :rows="deviceRows" />
        <smartview-button
          v-show="device.url" :data-testid="`subscription-device-open-${provider}`" variant="neutral" icon-name="mdi-open-in-new"
          :label="t('subscription.deviceOpen')" @click="openDeviceUrl"
        />
        <smartview-hint-banner :type="device.state === 'failed' ? 'warning' : 'info'" :text="deviceText" />
      </div>
      <smartview-password-field
        v-show="isToken" :data-testid="`subscription-credential-${provider}`" :label="t('subscription.token')"
        :value="draft" autocomplete="off" @input="draft = ($event as CustomEvent<[string]>).detail[0]"
      />
      <smartview-textarea
        v-show="!isToken" :data-testid="`subscription-file-${provider}`"
        :label="t('subscription.authJson')"
        :value="draft" :rows="6" @input="draft = ($event as CustomEvent<[string]>).detail[0]"
      />
    </div>
  </smartview-modal>
</template>

<style scoped>
.subscription {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}
.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.login {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.steps {
  margin: 0;
  line-height: 1.5;
}
.device {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
