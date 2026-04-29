import type { PlatformStatusPayload } from '~~/shared/app-contract/platform-status'
import { useB24ContextStore } from '~/stores/b24-context'

function getFetchErrorMessage(cause: unknown): string {
  if (cause instanceof Error && cause.message) return cause.message
  if (
    cause &&
    typeof cause === 'object' &&
    'data' in cause &&
    cause.data &&
    typeof cause.data === 'object' &&
    'reason' in cause.data &&
    typeof cause.data.reason === 'string'
  ) {
    return cause.data.reason
  }
  return 'Platform status request failed'
}

export function usePlatformStatus() {
  const b24 = useB24ContextStore()
  const payload = ref<PlatformStatusPayload | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function refresh() {
    loading.value = true
    error.value = null

    try {
      await b24.initialize()
      payload.value = await $fetch<PlatformStatusPayload>('/api/platform/status', {
        headers: b24.getRequestHeaders()
      })

      return payload.value
    } catch (cause: unknown) {
      error.value = getFetchErrorMessage(cause)
      throw cause
    } finally {
      loading.value = false
    }
  }

  return {
    payload: readonly(payload),
    loading: readonly(loading),
    error: readonly(error),
    refresh
  }
}
