<template>
  <B24App>
    <main class="min-h-screen px-4 py-6">
      <section class="mx-auto flex max-w-5xl flex-col gap-4">
        <header class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1>Статус</h1>
            <p>Raw aggregated JSON payload from `/api/platform/status`.</p>
          </div>

          <div class="flex flex-wrap gap-3">
            <B24Button color="air-secondary-accent" @click="$emit('back')">
              На главную
            </B24Button>
            <B24Button :loading="loading" color="primary" @click="$emit('refresh')">
              Обновить
            </B24Button>
          </div>
        </header>

        <B24Badge :color="statusColor" size="xs">
          {{ statusLabel }}
        </B24Badge>

        <pre class="overflow-x-auto whitespace-pre-wrap">{{ renderedPayload }}</pre>
      </section>
    </main>
  </B24App>
</template>

<script setup lang="ts">
import type { PlatformStatusPayload } from '~~/shared/app-contract/platform-status'

const props = defineProps<{
  payload: PlatformStatusPayload | null
  loading?: boolean
  error?: string | null
}>()

defineEmits<{
  (e: 'back' | 'refresh'): void
}>()

const statusColor = computed(() => {
  if (props.error) return 'danger'
  if (!props.payload) return 'warning'
  return props.payload.ok ? 'success' : 'warning'
})

const statusLabel = computed(() => {
  if (props.error) return 'Request failed'
  if (!props.payload) return 'No payload'
  return props.payload.ok ? 'Platform ok' : 'Platform degraded'
})

const renderedPayload = computed(() => {
  if (props.error) {
    return JSON.stringify({ ok: false, error: props.error }, null, 2)
  }

  if (!props.payload) {
    return JSON.stringify({ ok: false, reason: 'Status payload not loaded yet' }, null, 2)
  }

  return JSON.stringify(props.payload, null, 2)
})
</script>
