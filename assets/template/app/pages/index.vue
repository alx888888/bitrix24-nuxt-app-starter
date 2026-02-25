<template>
  <B24App>
    <div class="min-h-screen bg-white p-4 space-y-4">
      <div class="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="text-lg font-semibold">{{ appTitle }}</div>
            <div class="text-sm text-gray-500">
              Стартовый пакет Bitrix24 local server app (Nuxt + B24UI + Vercel + Neon)
            </div>
          </div>
          <B24Badge :color="b24Ready ? 'success' : 'warning'" size="xs">
            {{ b24Ready ? 'B24 контекст' : 'Ожидание B24' }}
          </B24Badge>
        </div>
        <div class="text-sm text-gray-600">
          Портал: {{ b24.portalDomain || '—' }} | member_id: {{ b24.memberId || '—' }}
        </div>
      </div>

      <StatusPanel :status="statusStore.data" :loading="statusStore.loading" :error="statusStore.error" @refresh="refreshAll" />

      <div class="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="text-base font-medium">Профиль приложения (Neon)</div>
            <div class="text-sm text-gray-500">Данные текущего портала без секретов</div>
          </div>
          <B24Badge :color="appSettingsStore.profile ? 'success' : 'warning'" size="xs">
            {{ appSettingsStore.profile ? 'Загружен' : 'Нет данных' }}
          </B24Badge>
        </div>

        <B24Table
          :data="profileRows"
          :columns="profileColumns"
          class="w-full"
          :loading="appSettingsStore.loading"
        />

        <details class="text-sm">
          <summary class="cursor-pointer text-gray-600">Показать JSON профиля</summary>
          <pre class="mt-2 whitespace-pre-wrap text-xs text-gray-500">{{ prettyProfile }}</pre>
        </details>
      </div>
    </div>
  </B24App>
</template>

<script setup lang="ts">
import { useB24ContextStore } from '~/stores/b24-context'
import { useAppSettingsStore } from '~/stores/app-settings'
import { useSystemStatusStore } from '~/stores/system-status'
import { useAppBootstrap } from '~/composables/useAppBootstrap'

definePageMeta({ ssr: false })

const appTitle = '{{APP_TITLE}}'
const b24 = useB24ContextStore()
const appSettingsStore = useAppSettingsStore()
const statusStore = useSystemStatusStore()
const { bootstrapApp } = useAppBootstrap()

const b24Ready = computed(() => b24.ready && !!b24.portalDomain)
const prettyProfile = computed(() => JSON.stringify(appSettingsStore.profile, null, 2) || 'Профиль еще не загружен')
const profileColumns = [
  { accessorKey: 'key', header: 'Поле' },
  { accessorKey: 'value', header: 'Значение' }
]
const profileRows = computed(() => {
  const p = appSettingsStore.profile
  if (!p) return []
  return [
    { key: 'portalDomain', value: p.portalDomain || '—' },
    { key: 'memberId', value: p.memberId || '—' },
    { key: 'appStatus', value: p.appStatus || '—' },
    { key: 'install.hasAuthId', value: String(Boolean(p.install?.hasAuthId)) },
    { key: 'install.scope', value: p.install?.scope || '—' },
    { key: 'install.placement', value: p.install?.placement || '—' },
    { key: 'meta.lastAppOpenedAt', value: p.meta?.lastAppOpenedAt || '—' },
    { key: 'meta.updatedAt', value: p.meta?.updatedAt || '—' }
  ]
})

async function refreshAll() {
  await Promise.allSettled([appSettingsStore.load(), statusStore.refresh()])
}

onMounted(() => {
  void bootstrapApp()
})
</script>
