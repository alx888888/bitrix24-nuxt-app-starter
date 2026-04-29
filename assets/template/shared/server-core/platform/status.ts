import type { PlatformStatusPayload } from '~~/shared/app-contract/platform-status'
import type { B24Context } from './context'
import { PLATFORM_APP_TITLE, PLATFORM_PLACEMENT_PRESET, PLATFORM_PROJECT_NAME } from './config'
import { checkDbHealth } from './db'
import { resolvePortalProfileByContext, type PlatformProfileRow } from './profile'
import { callAppInfo } from './rest'
import { getErrorMessage, hasB24Context } from './context'

interface PlatformStatusDependencies {
  now: () => string
  checkDbHealth: typeof checkDbHealth
  resolvePortalProfileByContext: typeof resolvePortalProfileByContext
  callAppInfo: typeof callAppInfo
}

const defaultDependencies: PlatformStatusDependencies = {
  now: () => new Date().toISOString(),
  checkDbHealth,
  resolvePortalProfileByContext,
  callAppInfo
}

function readInstallationFlag(result: unknown): boolean | null {
  if (!result || typeof result !== 'object' || !('INSTALLED' in result)) return null

  const value = Reflect.get(result, 'INSTALLED')
  return typeof value === 'boolean' ? value : null
}

function createBaseStatusPayload(context: B24Context, now: string): PlatformStatusPayload {
  return {
    ok: false,
    timestamp: now,
    app: {
      projectName: PLATFORM_PROJECT_NAME,
      appTitle: PLATFORM_APP_TITLE,
      placementPreset: PLATFORM_PLACEMENT_PRESET
    },
    portal: {
      portalDomain: context.portalDomain || '',
      memberId: context.memberId || '',
      userId: context.userId || '',
      hasContext: hasB24Context(context)
    },
    profile: {
      exists: false,
      appStatus: 'unknown',
      hasInstallAuthId: false,
      installedAt: null,
      uninstalledAt: null,
      lastAppOpenedAt: null,
      updatedAt: null
    },
    health: {
      backend: { ok: true },
      database: { ok: false, reason: 'Database check not started' },
      bitrixRest: { ok: false, method: 'app.info', reason: 'Bitrix context missing' }
    }
  }
}

export async function buildPlatformStatusPayload(
  context: B24Context,
  overrides: Partial<PlatformStatusDependencies> = {}
): Promise<PlatformStatusPayload> {
  const dependencies = {
    ...defaultDependencies,
    ...overrides
  }

  const payload = createBaseStatusPayload(context, dependencies.now())

  let profile: PlatformProfileRow | null = null

  try {
    await dependencies.checkDbHealth()
    payload.health.database = { ok: true }
  } catch (error: unknown) {
    payload.health.database = {
      ok: false,
      reason: getErrorMessage(error, 'Database check failed')
    }
  }

  if (payload.health.database.ok && payload.portal.hasContext) {
    try {
      profile = await dependencies.resolvePortalProfileByContext(context)
      payload.profile = {
        exists: Boolean(profile),
        appStatus: profile?.app_status || 'installed',
        hasInstallAuthId: Boolean(profile?.install_auth_id),
        installedAt: profile?.installed_at || null,
        uninstalledAt: profile?.uninstalled_at || null,
        lastAppOpenedAt: profile?.last_app_opened_at || null,
        updatedAt: profile?.updated_at || null
      }
    } catch (error: unknown) {
      payload.profile = {
        exists: false,
        appStatus: 'unknown',
        hasInstallAuthId: false,
        installedAt: null,
        uninstalledAt: null,
        lastAppOpenedAt: null,
        updatedAt: null
      }
      payload.health.database = {
        ok: false,
        reason: getErrorMessage(error, 'Profile resolution failed')
      }
    }
  }

  const restDomain = context.portalDomain || profile?.portal_domain || ''
  const restAuthId = context.authId || profile?.install_auth_id || ''

  if (restDomain && restAuthId) {
    try {
      const appInfo = await dependencies.callAppInfo({
        domain: restDomain,
        authId: restAuthId
      })

      if (appInfo.ok) {
        const appInfoResult =
          appInfo.data.result && typeof appInfo.data.result === 'object' ? appInfo.data.result : {}
        const installationComplete = readInstallationFlag(appInfoResult)

        if (installationComplete === false) {
          payload.health.bitrixRest = {
            ok: false,
            restOk: true,
            method: 'app.info',
            installationComplete,
            reason: 'Application installation is not finished; call installFinish in the Bitrix24 frame',
            appInfo: appInfoResult
          }
        } else {
          payload.health.bitrixRest = {
            ok: true,
            restOk: true,
            method: 'app.info',
            installationComplete,
            appInfo: appInfoResult
          }
        }
      } else {
        const errorDescription =
          typeof appInfo.data.error_description === 'string' ? appInfo.data.error_description : null
        const errorCode = typeof appInfo.data.error === 'string' ? appInfo.data.error : null
        payload.health.bitrixRest = {
          ok: false,
          restOk: false,
          method: 'app.info',
          reason: errorDescription || errorCode || `HTTP ${appInfo.status}`
        }
      }
    } catch (error: unknown) {
      payload.health.bitrixRest = {
        ok: false,
        restOk: false,
        method: 'app.info',
        reason: getErrorMessage(error, 'Bitrix REST health check failed')
      }
    }
  }

  const hasRestContext = Boolean(restDomain && restAuthId)
  payload.ok = Boolean(
    payload.health.backend.ok && payload.health.database.ok && (!hasRestContext || payload.health.bitrixRest.ok)
  )
  return payload
}
