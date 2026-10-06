<script setup lang="ts">
// 키 탭: 공급자·TMDB 키를 넣고 지운다. 값은 화면으로 내려오지 않고 끝 4자리만 보인다 (PROJECT-PLAN §28.2)
import { onMounted, ref } from 'vue'

import { api } from '../api/client'
import tmdbLogo from '../assets/tmdb-logo.svg'
import type { SecretState } from '../api/types'
import { errorText } from '../format'
import { t, type MessageKey } from '../i18n'
import { showError, showSuccess } from '../notify'

const rows = ref<SecretState[]>([])
const drafts = ref<Record<string, string>>({})
const busy = ref('')

function label(key: string): string {
  if (key === 'tmdb.api_key') return t('secrets.tmdb')
  const provider = key.split('.')[1]
  return t('secrets.provider', { provider: t(`settings.provider.${provider}` as MessageKey) })
}

function status(row: SecretState): string {
  return row.set ? t('secrets.set', { hint: row.hint ?? '' }) : t('secrets.unset')
}

async function load(): Promise<void> {
  try {
    rows.value = await api.secrets()
  } catch (error) {
    showError(errorText(error))
  }
}

async function save(key: string, value: string | null): Promise<void> {
  busy.value = key
  try {
    const updated = await api.saveSecret(key, value)
    rows.value = rows.value.map((row) => (row.key === key ? updated : row))
    drafts.value[key] = ''
    showSuccess(value ? t('secrets.saved') : t('secrets.cleared'))
  } catch (error) {
    showError(errorText(error))
  } finally {
    busy.value = ''
  }
}

onMounted(load)
</script>

<template>
  <div class="panel">
    <smartview-hint-banner type="info" :text="t('secrets.notice')" />
    <div class="rows">
      <div v-for="row in rows" :key="row.key" class="row" :data-testid="`secret-${row.key}`">
        <smartview-password-field
          :label="label(row.key)" :hint="status(row)" :value="drafts[row.key] ?? ''" autocomplete="new-password"
          :placeholder="row.set ? t('secrets.replace') : ''"
          @input="drafts[row.key] = ($event as CustomEvent<[string]>).detail[0]"
        />
        <smartview-button
          :data-testid="`secret-save-${row.key}`" variant="brand" icon-name="mdi-content-save-outline" :label="t('secrets.save')"
          :disabled="!(drafts[row.key] ?? '').trim()" :loading="busy === row.key" @click="save(row.key, drafts[row.key] ?? '')"
        />
        <smartview-button
          :data-testid="`secret-clear-${row.key}`" variant="neutral" icon-name="mdi-delete-outline" :label="t('secrets.clear')"
          :disabled="!row.set" :loading="busy === row.key" @click="save(row.key, null)"
        />
      </div>
    </div>
    <!-- TMDB API 이용 약관의 표시 의무: 로고와 "보증받지 않음" 문구 (원어 조회에 TMDB 를 쓴다) -->
    <p class="attribution" data-testid="tmdb-attribution">
      <img :src="tmdbLogo" alt="TMDB" class="tmdb-logo">
      <span>{{ t('secrets.tmdbAttribution') }}</span>
    </p>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.rows {
  display: grid;
  gap: 12px;
}
.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: start;
}
.attribution {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 8px 0 0;
  font-size: 0.8125rem;
}
.attribution span {
  opacity: 0.75;
}
.tmdb-logo {
  height: 14px;
}
@media (max-width: 640px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
