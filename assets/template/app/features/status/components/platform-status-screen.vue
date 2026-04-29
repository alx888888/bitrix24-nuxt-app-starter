<template>
  <main class="min-h-screen w-full">
    <section class="flex w-full flex-col gap-3 px-4 py-6">
      <header class="flex flex-wrap items-start justify-between gap-3">
        <h1>Статус</h1>

        <div class="flex flex-wrap gap-3">
          <B24Button size="xs" @click="$emit('back')">
            На главную
          </B24Button>
          <B24Button :loading="loading" size="xs" @click="$emit('refresh')">
            Обновить
          </B24Button>
        </div>
      </header>

      <div class="w-full" data-status-json>
        <B24Textarea
          :model-value="renderedPayload"
          readonly
          :rows="30"
          class="w-full"
        />
      </div>
    </section>
  </main>
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
