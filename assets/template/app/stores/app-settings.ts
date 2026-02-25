import { defineStore } from 'pinia'
import { useB24ContextStore } from '~/stores/b24-context'

export interface PortalSettingsProfile {
  portalDomain: string
  memberId: string
  appStatus: string
  install: {
    hasAuthId: boolean
    installedAt: string | null
    uninstalledAt: string | null
    scope: string
    placement: string
  }
  meta: {
    lastAppOpenedAt: string | null
    updatedAt: string | null
  }
}

export const useAppSettingsStore = defineStore('app-settings', () => {
  const profile = ref<PortalSettingsProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const b24 = useB24ContextStore()
      await b24.initialize()
      const response = await $fetch<{ ok: boolean; profile: PortalSettingsProfile }>('/api/app-settings', {
        headers: b24.headers as any
      })
      profile.value = response.profile
      return response.profile
    } catch (e: any) {
      error.value = e?.data?.reason || e?.message || 'Не удалось загрузить профиль'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function markAppOpened() {
    try {
      const b24 = useB24ContextStore()
      await b24.initialize()
      if (!b24.portalDomain) return
      await $fetch('/api/app-events/opened', { method: 'POST', headers: b24.headers as any })
    } catch {
      // best effort
    }
  }

  return {
    profile: readonly(profile),
    loading: readonly(loading),
    error: readonly(error),
    load,
    markAppOpened
  }
})
