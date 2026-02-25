import { useB24ContextStore } from '~/stores/b24-context'
import { useAppSettingsStore } from '~/stores/app-settings'
import { useSystemStatusStore } from '~/stores/system-status'

export function useAppBootstrap() {
  const b24 = useB24ContextStore()
  const appSettings = useAppSettingsStore()
  const status = useSystemStatusStore()

  async function bootstrapApp() {
    await b24.initialize()
    await Promise.allSettled([appSettings.load(), status.refresh()])
    void appSettings.markAppOpened()
  }

  return { bootstrapApp }
}
