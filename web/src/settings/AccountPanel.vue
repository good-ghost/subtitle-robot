<script setup lang="ts">
// 계정 탭: 관리 계정의 사용자 이름·비밀번호를 바꾼다. 바꾸면 모든 세션이 끝나 다시 로그인한다 (PROJECT-PLAN §28.3)
import { computed, onMounted, ref } from 'vue'

import { ApiError, api } from '../api/client'
import { errorText } from '../format'
import { MESSAGES, t, type MessageKey } from '../i18n'
import { showError } from '../notify'

const emit = defineEmits<{ changed: [] }>()

// 서버 규칙과 같다 (web/auth.py MIN_PASSWORD_LENGTH)
const MIN_PASSWORD_LENGTH = 8

const username = ref('')
const current = ref('')
const next = ref('')
const confirm = ref('')
const saving = ref(false)
const currentError = ref('')

const nextError = computed(() =>
  next.value && next.value.length < MIN_PASSWORD_LENGTH ? t('setup.passwordTooShort', { min: MIN_PASSWORD_LENGTH }) : '',
)
const confirmError = computed(() => (confirm.value !== next.value ? t('setup.mismatch') : ''))
const ready = computed(
  () => username.value.trim() !== '' && current.value !== '' && !nextError.value && !confirmError.value,
)

function detail(event: Event): string {
  return (event as CustomEvent<[string]>).detail[0]
}

onMounted(async () => {
  try {
    username.value = (await api.account()).username ?? ''
  } catch (error) {
    showError(errorText(error))
  }
})

async function save(): Promise<void> {
  if (!ready.value) return
  saving.value = true
  currentError.value = ''
  try {
    await api.saveAccount(current.value, username.value.trim(), next.value || null)
    emit('changed')
  } catch (error) {
    const key = error instanceof ApiError ? `account.error.${error.code}` : ''
    if (key === 'account.error.wrong_password') currentError.value = t(key)
    else showError(key && key in MESSAGES.ko ? t(key as MessageKey) : errorText(error))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="panel" data-testid="account-panel">
    <smartview-hint-banner type="info" :text="t('account.notice')" />
    <div class="grid">
      <smartview-input data-testid="account-username" :label="t('setup.username')" :value="username" @input="username = detail($event)" />
      <smartview-password-field
        data-testid="account-current" :label="t('account.current')" :value="current" :error-message="currentError"
        @input="current = detail($event)"
      />
      <smartview-password-field
        data-testid="account-new" :label="t('account.new')" :hint="t('account.newHint')" :value="next" autocomplete="new-password"
        :error-message="nextError" @input="next = detail($event)"
      />
      <smartview-password-field
        data-testid="account-confirm" :label="t('setup.confirm')" :value="confirm" autocomplete="new-password"
        :error-message="confirmError" @input="confirm = detail($event)"
      />
    </div>
    <div>
      <smartview-button
        data-testid="account-save" variant="brand" icon-name="mdi-account-check-outline" :label="t('account.save')"
        :disabled="!ready" :loading="saving" @click="save"
      />
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}
</style>
