import { defineStore } from 'pinia'
import {
  createEmptyPlatformFrameState,
  mergePlatformFrameState,
  type PlatformFrameState,
  resolvePlatformFrameContext
} from '~/features/platform-frame/runtime'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Failed to initialize Bitrix24 context'
}

export const useB24ContextStore = defineStore('b24-context', () => {
  const state = ref(createEmptyPlatformFrameState())
  let initPromise: Promise<void> | null = null

  const headers = computed<Record<string, string>>(() => ({
    ...(state.value.portalDomain ? { 'x-b24-domain': state.value.portalDomain } : {}),
    ...(state.value.memberId ? { 'x-b24-member-id': state.value.memberId } : {}),
    ...(state.value.userId ? { 'x-b24-user-id': state.value.userId } : {}),
    ...(state.value.authId ? { 'x-b24-auth-id': state.value.authId } : {})
  }))

  function getRequestHeaders(): Record<string, string> {
    return { ...headers.value }
  }

  function mergeContext(patch: Partial<PlatformFrameState>) {
    state.value = mergePlatformFrameState(state.value, patch)
  }

  async function initialize() {
    if (state.value.ready && state.value.portalDomain) return
    if (initPromise) return initPromise
    initPromise = (async () => {
      try {
        if (typeof window === 'undefined') return
        mergeContext(await resolvePlatformFrameContext())
        state.value.error = null
      } catch (error: unknown) {
        state.value.error = getErrorMessage(error)
      } finally {
        state.value.ready = true
        initPromise = null
      }
    })()
    return initPromise
  }

  async function refresh() {
    state.value = createEmptyPlatformFrameState()
    await initialize()
  }

  function markError(message: string | null) {
    state.value.error = message
  }

  return {
    ready: computed(() => state.value.ready),
    isBitrixFrame: computed(() => state.value.isBitrixFrame),
    isInstallMode: computed(() => state.value.isInstallMode),
    isFirstRun: computed(() => state.value.isFirstRun),
    portalDomain: computed(() => state.value.portalDomain),
    memberId: computed(() => state.value.memberId),
    userId: computed(() => state.value.userId),
    authId: computed(() => state.value.authId),
    error: computed(() => state.value.error),
    headers: readonly(headers),
    getRequestHeaders,
    initialize,
    refresh,
    markError
  }
})
