<template>
  <PlatformHomeScreen
    :app-title="appTitle"
    :context-ready="contextReady"
    :rows="rows"
    @open-status="openStatus"
    @refresh-context="refreshContext"
  />
</template>

<script setup lang="ts">
import PlatformHomeScreen from '~/features/home/components/platform-home-screen.vue'
import { useB24ContextStore } from '~/stores/b24-context'
import { usePlatformBootstrap } from '~/composables/use-platform-bootstrap'

definePageMeta({ ssr: false })

const appConfig = useAppConfig() as {
  platform?: {
    appTitle?: string
    placementPreset?: string
  }
}
const appTitle = appConfig.platform?.appTitle ?? ''
const placementPreset = appConfig.platform?.placementPreset ?? 'none'
const b24 = useB24ContextStore()
const { bootstrap, refreshContext } = usePlatformBootstrap()

const contextReady = computed(() => b24.ready && Boolean(b24.portalDomain))
const rows = computed(() => {
  return [
    { key: 'appTitle', value: appTitle || '—' },
    { key: 'placementPreset', value: placementPreset || 'none' },
    { key: 'portalDomain', value: b24.portalDomain || '—' },
    { key: 'memberId', value: b24.memberId || '—' },
    { key: 'userId', value: b24.userId || '—' },
    { key: 'authId', value: b24.authId ? '[present]' : '—' },
    { key: 'isBitrixFrame', value: String(Boolean(b24.isBitrixFrame)) },
    { key: 'bootstrapError', value: b24.error || '—' }
  ]
})

function openStatus() {
  return navigateTo('/status')
}

onMounted(() => {
  void bootstrap()
})
</script>
