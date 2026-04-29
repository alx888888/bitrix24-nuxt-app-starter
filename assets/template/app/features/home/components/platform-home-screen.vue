<template>
  <main class="min-h-screen w-full">
    <section class="flex w-full justify-between px-4 py-6">
      <span aria-hidden="true" />
      <B24Button size="xs" @click="$emit('open-status')">
        Статус
      </B24Button>
    </section>
  </main>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'open-status'): void
}>()
</script>
