<script setup lang="ts">
// Dashboard: 데몬·공급자·큐 상태 (PROJECT-PLAN §25.5)
import { computed, ref } from 'vue'

import { api } from '../api/client'
import type { DaemonStatus } from '../api/types'
import { usePolling } from '../composables/polling'
import { agoText, errorText, languageLabel } from '../format'
import { t, type MessageKey } from '../i18n'
import { showError } from '../notify'
import { routeHref } from '../router'

defineProps<{ status: DaemonStatus | null }>()
const emit = defineEmits<{ 'status-changed': [] }>()

const REFRESH_MS = 10_000
const ACTIVE = ['queued', 'probing', 'extracting', 'translating'] as const

const current = ref<DaemonStatus | null>(null)
const { loading, refreshedAt, refresh } = usePolling(async () => {
  try {
    current.value = await api.status()
  } catch (error) {
    showError(errorText(error))
  }
}, REFRESH_MS)

const pending = computed(() => ACTIVE.reduce((sum, key) => sum + (current.value?.queue[key] ?? 0), 0))
const available = computed(() => current.value?.provider.state !== 'unavailable')
const providerRows = computed(() => {
  const provider = current.value?.provider
  if (!provider) return []
  return [
    {
      icon: 'mdi-power-plug-outline',
      label: t('dashboard.providerState'),
      value: available.value ? t('dashboard.available') : t('dashboard.unavailable'),
      chip: available.value ? 'success' : 'warning',
    },
    { icon: 'mdi-robot-outline', label: t('dashboard.providerModel'), value: provider.model },
    { icon: 'mdi-message-alert-outline', label: t('dashboard.providerReason'), value: provider.reason || t('common.none') },
  ]
})
const translationRows = computed(() => {
  const status = current.value
  if (!status) return []
  return [
    { icon: 'mdi-translate', label: t('dashboard.targetLanguage'), value: languageLabel(status.target_language) },
    {
      icon: 'mdi-movie-search-outline',
      label: t('dashboard.tmdb'),
      value: status.tmdb_active ? t('dashboard.tmdbOn') : t('dashboard.tmdbOff'),
      chip: status.tmdb_active ? 'success' : 'warning',
    },
  ]
})
const watchRows = computed(() =>
  (current.value?.watch_paths ?? []).map((item) => ({
    icon: 'mdi-folder-eye-outline',
    label: item.path,
    value: t(`kind.${item.kind}` as MessageKey),
  })),
)

function onCardNavigate(event: Event): void {
  const [{ href }] = (event as CustomEvent<[{ href: string }]>).detail
  event.preventDefault()
  window.location.hash = href
}

async function onRefresh(): Promise<void> {
  await refresh()
  emit('status-changed')
}
</script>

<template>
  <smartview-page-header :heading="t('nav.dashboard')" :subtitle="t('dashboard.subtitle')">
    <smartview-refreshed-at slot="actions" :time="refreshedAt" />
    <smartview-button
      slot="actions" data-testid="refresh" variant="neutral" icon-name="mdi-refresh" :label="t('common.refresh')"
      :loading="loading" @click="onRefresh"
    />
  </smartview-page-header>

  <div v-if="current" class="stats">
    <smartview-stat-card
      data-testid="stat-daemon" :label="t('dashboard.daemon')"
      :value="current.healthy ? t('dashboard.healthy') : t('dashboard.unhealthy')"
      :caption="current.heartbeat_age_s === null ? t('dashboard.noHeartbeat') : t('dashboard.heartbeat', { age: agoText(current.heartbeat_age_s) })"
      icon="mdi-heart-pulse" :color="current.healthy ? 'success' : 'error'" :accent="current.healthy ? 'green' : 'red'"
      :index="0"
    />
    <smartview-stat-card
      data-testid="stat-provider" :label="t('dashboard.provider')" :value="current.provider.name" :caption="current.provider.model"
      icon="mdi-robot-outline" :color="available ? 'primary' : 'warning'" :accent="available ? 'blue' : 'orange'" :index="1"
    />
    <smartview-stat-card
      data-testid="stat-pending" :label="t('dashboard.pending')" :value="pending" icon="mdi-tray-full" color="info" accent="cyan" :index="2"
      :href="routeHref('queue')" @navigate="onCardNavigate"
    />
    <smartview-stat-card
      data-testid="stat-failed" :label="t('dashboard.failed')" :value="current.queue.failed" icon="mdi-alert-circle-outline" color="error"
      accent="red" :index="3" :href="routeHref('queue')" @navigate="onCardNavigate"
    />
    <smartview-stat-card
      data-testid="stat-completed" :label="t('dashboard.done')" :value="current.completed" icon="mdi-check-all" color="success" accent="green"
      :index="4" :href="routeHref('completed')" @navigate="onCardNavigate"
    />
  </div>

  <div v-if="current" class="cards">
    <smartview-card :heading="t('dashboard.providerCard')" icon="mdi-robot-outline">
      <smartview-info-list :rows="providerRows" />
    </smartview-card>
    <smartview-card data-testid="translation-card" :heading="t('dashboard.translationCard')" icon="mdi-translate">
      <smartview-info-list :rows="translationRows" />
    </smartview-card>
    <smartview-card :heading="t('dashboard.watchCard')" icon="mdi-folder-eye-outline" :count="watchRows.length">
      <smartview-hint-banner v-if="!current.watch_enabled" type="warning" :text="t('dashboard.watchOff')" />
      <smartview-info-list v-if="watchRows.length" :rows="watchRows" />
      <smartview-empty-state v-else icon="mdi-folder-off-outline" :heading="t('dashboard.noWatchPaths')" />
    </smartview-card>
  </div>
  <smartview-spinner v-else-if="loading" :alternative-text="t('common.loading')" />
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin: 16px 0;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 16px;
}
</style>
