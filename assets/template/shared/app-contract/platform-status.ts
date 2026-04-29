export interface PlatformHealthEntry {
  ok: boolean
  reason?: string
  method?: string
  installationComplete?: boolean | null
  restOk?: boolean
  [key: string]: unknown
}

export interface PlatformStatusPayload {
  ok: boolean
  timestamp: string
  app: {
    projectName: string
    appTitle: string
    placementPreset: string
  }
  portal: {
    portalDomain: string
    memberId: string
    userId: string
    hasContext: boolean
  }
  profile: {
    exists: boolean
    appStatus: string
    hasInstallAuthId: boolean
    installedAt: string | null
    uninstalledAt: string | null
    lastAppOpenedAt: string | null
    updatedAt: string | null
  }
  health: {
    backend: PlatformHealthEntry
    database: PlatformHealthEntry
    bitrixRest: PlatformHealthEntry
  }
}
