import { finishPlatformInstallIfNeeded } from '~/features/platform-frame/runtime'
import { useB24ContextStore } from '~/stores/b24-context'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Bitrix24 install finish failed'
}

export function usePlatformBootstrap() {
  const b24 = useB24ContextStore()

  async function bootstrap() {
    await b24.initialize()
    if (!b24.portalDomain) return
    b24.markError(null)

    try {
      const installState = await finishPlatformInstallIfNeeded()
      if (installState.triggered) return
    } catch (error: unknown) {
      b24.markError(getErrorMessage(error))
      return
    }

    await $fetch('/api/app-events/opened', {
      method: 'POST',
      headers: b24.getRequestHeaders()
    }).catch(() => null)
  }

  async function refreshContext() {
    await b24.refresh()
  }

  return {
    bootstrap,
    refreshContext
  }
}
