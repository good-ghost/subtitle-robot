<script setup lang="ts">
// 처음 설정: 관리 계정이 없으면 사용자 이름·비밀번호를 만든다 (PROJECT-PLAN §28.3, Q-25 Sonarr 방식)
import { computed, ref } from 'vue'

import { ApiError, api } from '../api/client'
import { MESSAGES, t, type MessageKey } from '../i18n'

const emit = defineEmits<{ created: [username: string] }>()

// 서버 규칙과 같다 (web/auth.py MIN_PASSWORD_LENGTH)
const MIN_PASSWORD_LENGTH = 8

const username = ref('admin')
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const serverError = ref('')

const passwordError = computed(() =>
  password.value && password.value.length < MIN_PASSWORD_LENGTH
    ? t('setup.passwordTooShort', { min: MIN_PASSWORD_LENGTH })
    : '',
)
const confirmError = computed(() => (confirm.value && confirm.value !== password.value ? t('setup.mismatch') : ''))
const ready = computed(
  () => username.value.trim() !== '' && password.value.length >= MIN_PASSWORD_LENGTH && confirm.value === password.value,
)

function detail(event: Event): string {
  return (event as CustomEvent<[string]>).detail[0]
}

async function create(): Promise<void> {
  if (!ready.value) return
  loading.value = true
  serverError.value = ''
  try {
    const state = await api.setup(username.value.trim(), password.value)
    emit('created', state.username ?? username.value)
  } catch (error) {
    const key = error instanceof ApiError ? `setup.error.${error.code}` : ''
    serverError.value = key && key in MESSAGES.ko ? t(key as MessageKey) : t('setup.failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <smartview-card class="card" :heading="t('setup.heading')" icon="mdi-account-key-outline">
      <div class="form" data-testid="setup-form">
        <smartview-hint-banner type="info" :text="t('setup.notice')" />
        <smartview-input
          data-testid="setup-username" :label="t('setup.username')" :value="username" required
          @input="username = detail($event)"
        />
        <smartview-password-field
          data-testid="setup-password" :label="t('setup.password')" :value="password" autocomplete="new-password"
          :error-message="passwordError" @input="password = detail($event)"
        />
        <smartview-password-field
          data-testid="setup-confirm" :label="t('setup.confirm')" :value="confirm" autocomplete="new-password"
          :error-message="confirmError" @input="confirm = detail($event)"
        />
        <smartview-hint-banner v-if="serverError" data-testid="setup-error" type="error" :text="serverError" />
        <smartview-button
          data-testid="setup-submit" variant="brand" icon-name="mdi-account-plus-outline" :label="t('setup.submit')"
          :disabled="!ready" :loading="loading" @click="create"
        />
      </div>
    </smartview-card>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 16px;
  background: var(--sv-color-background, transparent);
}
.card {
  width: min(440px, 100%);
}
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
