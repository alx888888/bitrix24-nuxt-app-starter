<template>
  <PlatformHomeScreen
    @open-status="openStatus"
  />
</template>

<script setup lang="ts">
import PlatformHomeScreen from '~/features/home/components/platform-home-screen.vue'
import { usePlatformBootstrap } from '~/composables/use-platform-bootstrap'

definePageMeta({ ssr: false })

const { bootstrap } = usePlatformBootstrap()

function openStatus() {
  return navigateTo('/status')
}

onMounted(() => {
  void bootstrap()
})
</script>
