import { getQuery, getRequestHeader, getRequestURL, readBody, sendRedirect, setResponseStatus } from 'h3'
import { markPortalProfileUninstalled, upsertPortalProfileOnInstall } from '~~/shared/server-core/portal-profile.js'

const APP_TITLE = '{{APP_TITLE}}'
const PLACEMENT_PRESET = '{{PLACEMENT_PRESET}}'
const PLACEMENTS = {{PLACEMENTS_JSON}}

function normalizeDomain(rawDomain: unknown): string {
  if (!rawDomain || typeof rawDomain !== 'string') return ''
  return rawDomain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
}

function pickField(payload: any, key: string) {
  if (!payload || typeof payload !== 'object') return undefined
  if (payload[key] !== undefined) return payload[key]
  if (payload[key.toLowerCase()] !== undefined) return payload[key.toLowerCase()]
  if (payload[key.toUpperCase()] !== undefined) return payload[key.toUpperCase()]
  for (const candidate of [`auth[${key}]`, `auth[${key.toLowerCase()}]`, `AUTH[${key}]`, `AUTH[${key.toLowerCase()}]`]) {
    if (payload[candidate] !== undefined) return payload[candidate]
  }
  if (payload.auth && typeof payload.auth === 'object') {
    if (payload.auth[key] !== undefined) return payload.auth[key]
    if (payload.auth[key.toLowerCase()] !== undefined) return payload.auth[key.toLowerCase()]
  }
  return undefined
}

function isInstallEvent(eventName: unknown) {
  return String(eventName || '').toUpperCase() === 'ONAPPINSTALL'
}

function isUninstallEvent(eventName: unknown) {
  return String(eventName || '').toUpperCase() === 'ONAPPUNINSTALL'
}

async function callBitrixMethod({ domain, authId, method, params = {} }: any) {
  const endpoint = `https://${domain}/rest/${method}.json`
  const body = new URLSearchParams()
  body.append('auth', String(authId))
  for (const [key, value] of Object.entries(params)) body.append(key, String(value))
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  let data: any = {}
  try {
    data = await response.json()
  } catch {}
  return { ok: response.ok && !data?.error, status: response.status, data }
}

async function unbindPlacement(domain: string, authId: string, placement: string) {
  return callBitrixMethod({ domain, authId, method: 'placement.unbind', params: { PLACEMENT: placement } })
}

async function bindPlacement(domain: string, authId: string, placement: string, handlerUrl: string) {
  return callBitrixMethod({
    domain,
    authId,
    method: 'placement.bind',
    params: { PLACEMENT: placement, HANDLER: handlerUrl, TITLE: APP_TITLE }
  })
}

function inferDomain(payload: any, query: Record<string, any>) {
  const candidates = [
    pickField(payload, 'DOMAIN'),
    pickField(payload, 'domain'),
    pickField(payload, 'SERVER_NAME'),
    query.DOMAIN,
    query.domain
  ]
  for (const candidate of candidates) {
    const normalized = normalizeDomain(candidate)
    if (normalized) return normalized
  }
  return ''
}

function pickInstallProfileData(payload: any) {
  return {
    memberId: pickField(payload, 'member_id') || pickField(payload, 'MEMBER_ID') || '',
    refreshId: pickField(payload, 'REFRESH_ID') || pickField(payload, 'refresh_id') || '',
    authExpires: pickField(payload, 'AUTH_EXPIRES') || pickField(payload, 'auth_expires') || '',
    appSid: pickField(payload, 'APP_SID') || pickField(payload, 'app_sid') || '',
    placement: pickField(payload, 'PLACEMENT') || pickField(payload, 'placement') || '',
    scope: pickField(payload, 'scope') || pickField(payload, 'SCOPE') || '',
    userId: pickField(payload, 'user_id') || pickField(payload, 'USER_ID') || ''
  }
}

export default defineEventHandler(async (event) => {
  const method = event.method.toUpperCase()
  const url = getRequestURL(event)
  const host = getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host') || url.host || 'localhost:3000'
  const proto = getRequestHeader(event, 'x-forwarded-proto') || url.protocol.replace(':', '') || 'http'
  const appHandlerUrl = `${proto}://${host}/api/b24/handler`

  if (method === 'GET') {
    return sendRedirect(event, appHandlerUrl, 307)
  }

  if (method !== 'POST') {
    setResponseStatus(event, 405)
    return { ok: false, error: 'METHOD_NOT_ALLOWED', reason: 'Use GET or POST' }
  }

  const payload = (await readBody(event).catch(() => ({}))) || {}
  const query = getQuery(event)
  const rawEventName = pickField(payload, 'event') || pickField(payload, 'EVENT') || query.event || ''
  const authId = String(pickField(payload, 'AUTH_ID') || pickField(payload, 'auth_id') || query.AUTH_ID || '')
  const domain = inferDomain(payload, query as any)
  let eventName = String(rawEventName || '')
  if (!eventName && authId && domain) eventName = 'ONAPPINSTALL'

  if (!isInstallEvent(eventName) && !isUninstallEvent(eventName)) {
    return sendRedirect(event, appHandlerUrl, 303)
  }

  if (!authId || !domain) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'BAD_REQUEST', reason: 'Missing required install auth payload' }
  }

  const profileData = pickInstallProfileData(payload)
  let profileSync: any = { ok: false, action: null, error: null }
  try {
    if (isInstallEvent(eventName)) {
      const row = await upsertPortalProfileOnInstall({
        memberId: profileData.memberId,
        portalDomain: domain,
        appTitle: APP_TITLE,
        authId,
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
        portalDomain: domain,
        userId: profileData.userId,
        rawPayload: payload
      })
      profileSync = { ok: true, action: 'soft_delete', profile: row, error: null }
    }
  } catch (e: any) {
    profileSync = { ok: false, action: isInstallEvent(eventName) ? 'upsert' : 'soft_delete', error: e?.message || 'Profile sync error' }
  }

  const placements: any[] = []
  const errors: any[] = []

  if (PLACEMENT_PRESET !== 'none') {
    for (const placement of PLACEMENTS) {
      if (isInstallEvent(eventName)) {
        const unbindResult = await unbindPlacement(domain, authId, placement)
        const bindResult = await bindPlacement(domain, authId, placement, appHandlerUrl)
        if (!bindResult.ok) {
          errors.push({ placement, stage: 'bind', unbind: unbindResult.data, bind: bindResult.data })
          continue
        }
        placements.push({ placement, action: 'rebound', title: APP_TITLE, handler: appHandlerUrl, result: bindResult.data?.result || null })
      } else {
        const unbindResult = await unbindPlacement(domain, authId, placement)
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
    setResponseStatus(event, 502)
    return {
      ok: false,
      error: 'PLACEMENT_BIND_FAILED',
      reason: 'One or more placements failed to bind',
      details: errors,
      placements
    }
  }

  return {
    ok: true,
    event: String(eventName).toUpperCase(),
    placementPreset: PLACEMENT_PRESET,
    placements,
    profileSync
  }
})
