<script setup lang="ts">
// Archived List (WI-7.010): 완료 목록에서 보관한 처리 기록. 화면은 완료 목록과 같고 보관한 기록만 보인다.
// 보관한 영상도 처리한 것으로 본다: 기록을 지우기(삭제) 전에는 다시 처리하지 않는다
import type { DaemonStatus } from '../api/types'
import CompletedView from './CompletedView.vue'

defineProps<{ status: DaemonStatus | null }>()
const emit = defineEmits<{ 'status-changed': [] }>()
</script>

<template>
  <CompletedView shelved :status="status" @status-changed="emit('status-changed')" />
</template>
