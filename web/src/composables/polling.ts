// 화면이 떠 있는 동안 주기적으로 불러온다. 앞 요청이 끝나기 전에는 다시 부르지 않는다.
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export function usePolling(load: () => Promise<void>, intervalMs: number, enabled: Ref<boolean> = ref(true)) {
  const loading = ref(false)
  const refreshedAt = ref('')
  let timer: number | undefined

  async function refresh(): Promise<void> {
    if (loading.value) return
    loading.value = true
    try {
      await load()
      refreshedAt.value = new Date().toISOString()
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void refresh()
    timer = window.setInterval(() => {
      if (enabled.value) void refresh()
    }, intervalMs)
  })
  onBeforeUnmount(() => window.clearInterval(timer))

  return { loading, refreshedAt, refresh }
}
