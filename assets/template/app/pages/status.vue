<template>
  <PlatformStatusScreen
    :payload="payload"
    :loading="loading"
    :error="error"
    @back="openHome"
    @refresh="refreshStatus"
  />
</template>

<script setup lang="ts">
import PlatformStatusScreen from '~/features/status/components/platform-status-screen.vue'
import { usePlatformStatus } from '~/features/status/use-platform-status'
import { usePlatformBootstrap } from '~/composables/use-platform-bootstrap'

definePageMeta({ ssr: false })

const { payload, loading, error, refresh } = usePlatformStatus()
const { bootstrap } = usePlatformBootstrap()

async function refreshStatus() {
  await refresh()
}

function openHome() {
  return navigateTo('/')
}

onMounted(async () => {
  await bootstrap()
  await refreshStatus()
})
</script>
