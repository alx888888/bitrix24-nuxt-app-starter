<template>
  <B24App>
    <main class="min-h-screen px-4 py-6">
      <section class="mx-auto flex max-w-4xl flex-col gap-6">
        <header class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1>{{ appTitle }}</h1>
            <p>Platform-only starter для Bitrix24 local server app на Nuxt + B24UI + B24 JS SDK.</p>
          </div>

          <B24Badge :color="contextReady ? 'success' : 'warning'" size="xs">
            {{ contextReady ? 'B24 context ready' : 'Waiting for B24 context' }}
          </B24Badge>
        </header>

        <section class="flex flex-wrap gap-3">
          <B24Button color="air-secondary-accent" @click="$emit('refresh-context')">
            Обновить контекст
          </B24Button>
          <B24Button color="primary" @click="$emit('open-status')">
            Открыть /status
          </B24Button>
        </section>

        <section class="overflow-x-auto">
          <B24Table
            :data="rows"
            :columns="columns"
            class="w-full"
          />
        </section>
      </section>
    </main>
  </B24App>
</template>

<script setup lang="ts">
defineProps<{
  appTitle: string
  contextReady: boolean
  rows: Array<{ key: string; value: string }>
}>()

defineEmits<{
  (e: 'open-status' | 'refresh-context'): void
}>()

const columns = [
  { accessorKey: 'key', header: 'Поле' },
  { accessorKey: 'value', header: 'Значение' }
]
</script>
