import { defineStore } from 'pinia'
import type { SystemStatusResponse } from '~/types/system-status'
import { useB24ContextStore } from '~/stores/b24-context'

export const useSystemStatusStore = defineStore('system-status', () => {
  const data = ref<SystemStatusResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      const b24 = useB24ContextStore()
      await b24.initialize()
      data.value = await $fetch<SystemStatusResponse>('/api/system/status', {
        headers: b24.headers as any
      })
      return data.value
    } catch (e: any) {
      error.value = e?.data?.reason || e?.message || 'Не удалось получить статус системы'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { data: readonly(data), loading: readonly(loading), error: readonly(error), refresh }
})
