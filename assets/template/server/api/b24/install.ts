import { defineEventHandler, getQuery, getRequestHeader, getRequestHeaders, getRequestURL, readBody, sendRedirect, setResponseStatus } from 'h3'
import {
  getErrorMessage,
  getB24ContextFromInstallPayload,
  isB24Payload,
  pickFlexibleField
} from '~~/shared/server-core/platform/context'
import {
  buildHandlerRedirectUrl,
  isInstallEvent,
  isUninstallEvent,
  pickInstallProfileData,
  resolveInstallEventName,
  shouldRedirectInstallResponse
} from '~~/shared/server-core/platform/install'
import {
  markPortalProfileUninstalled,
  type PlatformProfileRow,
  upsertPortalProfileOnInstall
} from '~~/shared/server-core/platform/profile'
import {
  PLATFORM_APP_TITLE,
  PLATFORM_PLACEMENTS,
  PLATFORM_PLACEMENT_PRESET
} from '~~/shared/server-core/platform/config'
import { placementBind, placementUnbind } from '~~/shared/server-core/platform/rest'

interface ProfileSyncResult {
  ok: boolean
  action: 'upsert' | 'soft_delete' | null
  profile?: PlatformProfileRow | null
  error: string | null
}

interface PlacementResult {
  placement: string
  action: 'rebound' | 'unbound'
  title?: string
  handler?: string
  ok?: boolean
  result: unknown
  error?: unknown
}

interface PlacementBindFailure {
  placement: string
  stage: 'bind'
  unbind: unknown
  bind: unknown
}

export default defineEventHandler(async (event) => {
  const method = event.method.toUpperCase()
  const url = getRequestURL(event)
  const host = getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host') || url.host || 'localhost:3000'
  const proto = getRequestHeader(event, 'x-forwarded-proto') || url.protocol.replace(':', '') || 'http'
  const appHandlerUrl = `${proto}://${host}/api/b24/handler`
  const redirectToUi = shouldRedirectInstallResponse(getRequestHeaders(event))

  if (method === 'GET') {
    return sendRedirect(event, appHandlerUrl, 307)
  }

  if (method !== 'POST') {
    setResponseStatus(event, 405)
    return { ok: false, error: 'METHOD_NOT_ALLOWED', reason: 'Use GET or POST' }
  }

  const body = await readBody(event).catch(() => ({}))
  const payload = isB24Payload(body) ? body : {}
  const query = getQuery(event)
  const context = getB24ContextFromInstallPayload(payload, query as Record<string, unknown>)
  const rawEventName = pickFlexibleField(payload, 'event') || pickFlexibleField(payload, 'EVENT') || query.event || ''
  const eventName = resolveInstallEventName({
    rawEventName,
    authId: context.authId,
    portalDomain: context.portalDomain
  })

  if (!context.authId || !context.portalDomain) {
    if (redirectToUi) {
      return sendRedirect(event, appHandlerUrl, 303)
    }
    setResponseStatus(event, 400)
    return { ok: false, error: 'BAD_REQUEST', reason: 'Missing required install auth payload' }
  }

  const profileData = pickInstallProfileData(payload)
  let profileSync: ProfileSyncResult = { ok: false, action: null, error: null }
  try {
    if (isInstallEvent(eventName)) {
      const row = await upsertPortalProfileOnInstall({
        memberId: profileData.memberId,
        portalDomain: context.portalDomain,
        appTitle: PLATFORM_APP_TITLE,
        authId: context.authId,
        refreshId: profileData.refreshId,
        authExpires: profileData.authExpires,
        appSid: profileData.appSid,
        placement: profileData.placement,
        scope: profileData.scope,
        userId: profileData.userId,
        rawPayload: payload
      })
      profileSync = { ok: true, action: 'upsert', profile: row, error: null }
    } else {
      const row = await markPortalProfileUninstalled({
        memberId: profileData.memberId,
        portalDomain: context.portalDomain,
        userId: profileData.userId,
        rawPayload: payload
      })
      profileSync = { ok: true, action: 'soft_delete', profile: row, error: null }
    }
  } catch (error: unknown) {
    profileSync = {
      ok: false,
      action: isInstallEvent(eventName) ? 'upsert' : 'soft_delete',
      error: getErrorMessage(error, 'Profile sync error')
    }
  }

  if (!isInstallEvent(eventName) && !isUninstallEvent(eventName)) {
    return sendRedirect(event, appHandlerUrl, 303)
  }

  const placements: PlacementResult[] = []
  const errors: PlacementBindFailure[] = []

  if (PLATFORM_PLACEMENT_PRESET !== 'none') {
    for (const placement of PLATFORM_PLACEMENTS) {
      if (isInstallEvent(eventName)) {
        const unbindResult = await placementUnbind({
          domain: context.portalDomain,
          authId: context.authId,
          placement
        })
        const bindResult = await placementBind({
          domain: context.portalDomain,
          authId: context.authId,
          placement,
          handlerUrl: appHandlerUrl,
          title: PLATFORM_APP_TITLE
        })
        if (!bindResult.ok) {
          errors.push({ placement, stage: 'bind', unbind: unbindResult.data, bind: bindResult.data })
          continue
        }
        placements.push({
          placement,
          action: 'rebound',
          title: PLATFORM_APP_TITLE,
          handler: appHandlerUrl,
          result: bindResult.data?.result || null
        })
      } else {
        const unbindResult = await placementUnbind({
          domain: context.portalDomain,
          authId: context.authId,
          placement
        })
        placements.push({
          placement,
          action: 'unbound',
          ok: unbindResult.ok,
          result: unbindResult.data?.result || null,
          error: unbindResult.ok ? null : unbindResult.data
        })
      }
    }
  }

  if (errors.length > 0) {
    if (redirectToUi) {
      return sendRedirect(event, appHandlerUrl, 303)
    }
    setResponseStatus(event, 502)
    return {
      ok: false,
      error: 'PLACEMENT_BIND_FAILED',
      reason: 'One or more placements failed to bind',
      details: errors,
      placements
    }
  }

  if (redirectToUi) {
    return sendRedirect(
      event,
      buildHandlerRedirectUrl({
        baseUrl: `${proto}://${host}/`,
        context
      }),
      303
    )
  }

  return {
    ok: true,
    event: String(eventName).toUpperCase(),
    placementPreset: PLATFORM_PLACEMENT_PRESET,
    placements,
    profileSync
  }
})
