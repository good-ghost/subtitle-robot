<script setup lang="ts">
// 로그인: 관리 계정의 사용자 이름 + 비밀번호 (PROJECT-PLAN §25.3, §28.3)
import { ref } from 'vue'

import { ApiError, api } from '../api/client'
import { t } from '../i18n'

const props = defineProps<{ notice?: string }>()
const emit = defineEmits<{ 'logged-in': [username: string] }>()

const loading = ref(false)
const errorMessage = ref(props.notice ?? '')

async function onSubmit(event: Event): Promise<void> {
  const [{ username, password }] = (event as CustomEvent<[{ username: string; password: string }]>).detail
  loading.value = true
  errorMessage.value = ''
  try {
    const state = await api.login(username, password)
    emit('logged-in', state.username ?? username)
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError && error.code === 'invalid_credentials'
        ? t('login.invalid')
        : t('login.failed', { message: error instanceof Error ? error.message : String(error) })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <smartview-login
    :product-name="t('app.name')"
    product-icon="mdi-subtitles"
    :subtitle="t('login.subtitle')"
    :secured-text="t('login.secured')"
    :loading="loading"
    :error-message="errorMessage"
    @submit="onSubmit"
  />
</template>
