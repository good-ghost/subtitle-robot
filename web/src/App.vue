<script setup lang="ts">
// 세션 확인 → 로그인 화면 또는 셸. 어느 API 든 401 이면 로그인 화면으로 돌아간다.
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { api, onUnauthorized } from './api/client'
import ShellView from './components/ShellView.vue'
import { t } from './i18n'
import LoginView from './views/LoginView.vue'
import SetupView from './views/SetupView.vue'

type SessionPhase = 'checking' | 'setup' | 'signed-out' | 'signed-in'

const phase = ref<SessionPhase>('checking')
const notice = ref('')

function signOut(message = ''): void {
  notice.value = message
  phase.value = 'signed-out'
}

onMounted(async () => {
  onUnauthorized(() => signOut(t('login.expired')))
  try {
    const state = await api.session()
    phase.value = state.setup_required ? 'setup' : state.authenticated ? 'signed-in' : 'signed-out'
  } catch {
    signOut(t('common.unreachable'))
  }
})

onBeforeUnmount(() => onUnauthorized(null))

// 계정을 바꾸면 모든 세션이 끝난다 (§28.3): 다시 로그인하게 한다
function relogin(): void {
  signOut(t('account.changed'))
}

async function logout(): Promise<void> {
  try {
    await api.logout()
  } finally {
    signOut()
  }
}
</script>

<template>
  <SetupView v-if="phase === 'setup'" @created="phase = 'signed-in'" />
  <LoginView v-else-if="phase === 'signed-out'" :notice="notice" @logged-in="phase = 'signed-in'" />
  <ShellView v-else-if="phase === 'signed-in'" @logout="logout" @relogin="relogin" />
  <smartview-spinner v-else size="large" :alternative-text="t('common.loading')" />
</template>
