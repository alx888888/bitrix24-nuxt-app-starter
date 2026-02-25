<template>
  <div class="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1">
        <div class="text-base font-medium">Статус платформы</div>
        <div class="text-sm text-gray-500">Проверка backend / db / installer / rest / placements</div>
      </div>
      <B24Button color="air-secondary-accent" :loading="loading" @click="$emit('refresh')">Обновить</B24Button>
    </div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      Ошибка статуса: {{ error }}
    </div>

    <div v-if="items.length" class="overflow-x-auto">
      <B24Table
        :data="items"
        :columns="columns"
        class="w-full"
        :loading="loading"
      >
        <template #status-cell="{ row }">
          <B24Badge :color="row.original.ok ? 'success' : 'danger'" size="xs">
            {{ row.original.ok ? 'OK' : 'ERR' }}
          </B24Badge>
        </template>

        <template #description-cell="{ row }">
          <span class="text-xs text-gray-500">{{ row.original.description }}</span>
        </template>
      </B24Table>
    </div>

    <div v-else class="text-sm text-gray-500">Статус еще не загружен.</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  status: any
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ (e: 'refresh'): void }>()

const columns = [
  { accessorKey: 'title', header: 'Компонент' },
  { accessorKey: 'status', header: 'Статус' },
  { accessorKey: 'description', header: 'Описание' }
]

const items = computed(() => {
  const c = props.status?.components
  if (!c) return []
  const list = [
    { key: 'backend', title: 'Backend', status: 'ok', ok: Boolean(c.backend?.ok), description: 'Ответ API-агрегатора статусов' },
    { key: 'database', title: 'Database (Neon)', status: 'ok', ok: Boolean(c.database?.ok), description: c.database?.reason || 'Подключение и схема БД' },
    { key: 'portalProfile', title: 'Portal profile', status: 'ok', ok: Boolean(c.portalProfile?.ok), description: c.portalProfile?.exists ? 'Профиль найден/создан' : 'Профиль отсутствует' },
    { key: 'installer', title: 'Installer flow', status: 'ok', ok: Boolean(c.installer?.ok), description: `preset: ${c.installer?.placementPreset || 'unknown'}` },
    { key: 'bitrixRest', title: 'Bitrix REST', status: 'ok', ok: Boolean(c.bitrixRest?.ok), description: c.bitrixRest?.reason || 'Проверка app.info' }
  ]
  if (c.placements) {
    list.push({ key: 'placements', title: 'Placements', status: 'ok', ok: Boolean(c.placements?.ok), description: c.placements?.reason || (c.placements?.checked ? 'Проверка выполнена' : 'Проверка не выполнялась') })
  }
  return list
})
</script>
