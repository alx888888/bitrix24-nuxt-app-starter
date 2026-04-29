import { useB24ContextStore } from '~/stores/b24-context'

export function usePlatformBootstrap() {
  const b24 = useB24ContextStore()

  async function bootstrap() {
    await b24.initialize()
    if (!b24.portalDomain) return

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
