import { upsertPortalProfileOnInstall, markPortalProfileUninstalled } from '../../shared/server-core/portal-profile.js'

const APP_TITLE = '{{APP_TITLE}}'
const PLACEMENT_PRESET = '{{PLACEMENT_PRESET}}'
const PLACEMENTS = {{PLACEMENTS_JSON}}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function getHeader(req, name) {
  const value = req.headers?.[name]
  if (Array.isArray(value)) return value[0] || ''
  return typeof value === 'string' ? value : ''
}

function isJsonString(value) {
  if (typeof value !== 'string') return false
  const text = value.trim()
  return text.startsWith('{') || text.startsWith('[')
}

function parseFormEncoded(text) {
  const params = new URLSearchParams(text)
  const data = {}
  for (const [key, value] of params.entries()) data[key] = value
  return data
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    if (isJsonString(req.body)) {
      try { return JSON.parse(req.body) } catch { return parseFormEncoded(req.body) }
    }
    return parseFormEncoded(req.body)
  }
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  if (isJsonString(raw)) {
    try { return JSON.parse(raw) } catch { return parseFormEncoded(raw) }
  }
  return parseFormEncoded(raw)
}

function pickField(payload, key) {
  if (payload[key] !== undefined) return payload[key]
  if (payload[key.toLowerCase()] !== undefined) return payload[key.toLowerCase()]
  if (payload[key.toUpperCase()] !== undefined) return payload[key.toUpperCase()]
  const bracketCandidates = [`auth[${key}]`, `auth[${key.toLowerCase()}]`, `AUTH[${key}]`, `AUTH[${key.toLowerCase()}]`]
  for (const bracketKey of bracketCandidates) if (payload[bracketKey] !== undefined) return payload[bracketKey]
  if (payload.auth && typeof payload.auth === 'object') {
    if (payload.auth[key] !== undefined) return payload.auth[key]
    if (payload.auth[key.toLowerCase()] !== undefined) return payload.auth[key.toLowerCase()]
  }
  return undefined
}

function normalizeDomain(rawDomain) {
  if (!rawDomain || typeof rawDomain !== 'string') return ''
  return rawDomain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
}

function isInstallEvent(eventName) { return String(eventName || '').toUpperCase() === 'ONAPPINSTALL' }
function isUninstallEvent(eventName) { return String(eventName || '').toUpperCase() === 'ONAPPUNINSTALL' }

async function callBitrixMethod({ domain, authId, method, params }) {
  const endpoint = `https://${domain}/rest/${method}.json`
  const body = new URLSearchParams()
  body.append('auth', authId)
  Object.entries(params || {}).forEach(([key, value]) => body.append(key, String(value)))
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  let data = {}
  try { data = await response.json() } catch {}
  return { ok: response.ok && !data.error, status: response.status, data }
}

async function unbindPlacement(domain, authId, placement) {
  return callBitrixMethod({ domain, authId, method: 'placement.unbind', params: { PLACEMENT: placement } })
}

async function bindPlacement(domain, authId, placement, handlerUrl) {
  return callBitrixMethod({ domain, authId, method: 'placement.bind', params: { PLACEMENT: placement, HANDLER: handlerUrl, TITLE: APP_TITLE } })
}

function getPublicHandlerUrl(req) {
  const protocol = getHeader(req, 'x-forwarded-proto') || 'https'
  const host = getHeader(req, 'x-forwarded-host') || getHeader(req, 'host') || 'example.vercel.app'
  return `${protocol}://${host}/api/b24/handler`
}

function shouldRedirectToUi(req) {
  const accept = getHeader(req, 'accept')
  const fetchDest = getHeader(req, 'sec-fetch-dest')
  return accept.includes('text/html') || fetchDest === 'iframe' || fetchDest === 'document'
}

function inferDomain(payload, req) {
  const candidates = [pickField(payload, 'DOMAIN'), pickField(payload, 'domain'), pickField(payload, 'SERVER_NAME'), req.query?.DOMAIN, req.query?.domain]
  for (const candidate of candidates) {
    const normalized = normalizeDomain(candidate)
    if (normalized) return normalized
  }
  return ''
}

function pickInstallProfileData(payload) {
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

export default async function handler(req, res) {
  setCors(res)
  const appHandlerUrl = getPublicHandlerUrl(req)
  const redirectToUi = shouldRedirectToUi(req)

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method === 'GET') {
    res.writeHead(307, { Location: appHandlerUrl })
    return res.end()
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED', reason: 'Use GET or POST' })

  try {
    const payload = await readBody(req)
    const rawEventName = pickField(payload, 'event') || pickField(payload, 'EVENT') || req.query?.event || ''
    const authId = pickField(payload, 'AUTH_ID') || pickField(payload, 'auth_id') || req.query?.AUTH_ID || ''
    const domain = inferDomain(payload, req)
    let eventName = String(rawEventName || '')
    if (!eventName && authId && domain) eventName = 'ONAPPINSTALL'

    if (!isInstallEvent(eventName) && !isUninstallEvent(eventName)) {
      res.writeHead(303, { Location: appHandlerUrl })
      return res.end()
    }

    if (!authId || !domain) {
      if (redirectToUi) {
        res.writeHead(303, { Location: appHandlerUrl })
        return res.end()
      }
      return res.status(400).json({ ok: false, error: 'BAD_REQUEST', reason: 'Missing required install auth payload' })
    }

    const profileData = pickInstallProfileData(payload)
    let profileSync = { ok: false, action: null, error: null }
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
        const row = await markPortalProfileUninstalled({ memberId: profileData.memberId, portalDomain: domain, userId: profileData.userId, rawPayload: payload })
        profileSync = { ok: true, action: 'soft_delete', profile: row, error: null }
      }
    } catch (e) {
      profileSync = { ok: false, action: isInstallEvent(eventName) ? 'upsert' : 'soft_delete', error: e instanceof Error ? e.message : 'Profile sync error' }
    }

    const placements = []
    const errors = []
    if (PLACEMENT_PRESET !== 'none') {
      for (const placement of PLACEMENTS) {
        if (isInstallEvent(eventName)) {
          const unbindResult = await unbindPlacement(domain, authId, placement)
          const bindResult = await bindPlacement(domain, authId, placement, appHandlerUrl)
          if (!bindResult.ok) {
            errors.push({ placement, stage: 'bind', unbind: unbindResult.data, bind: bindResult.data })
            continue
          }
          placements.push({ placement, action: 'rebound', title: APP_TITLE, handler: appHandlerUrl, result: bindResult.data.result || null })
        } else {
          const unbindResult = await unbindPlacement(domain, authId, placement)
          placements.push({ placement, action: 'unbound', ok: unbindResult.ok, result: unbindResult.data.result || null, error: unbindResult.ok ? null : unbindResult.data })
        }
      }
    }

    if (errors.length > 0) {
      if (redirectToUi) {
        res.writeHead(303, { Location: appHandlerUrl })
        return res.end()
      }
      return res.status(502).json({ ok: false, error: 'PLACEMENT_BIND_FAILED', reason: 'One or more placements failed to bind', details: errors, placements })
    }

    if (redirectToUi) {
      res.writeHead(303, { Location: appHandlerUrl })
      return res.end()
    }

    res.status(200).json({ ok: true, event: String(eventName).toUpperCase(), placementPreset: PLACEMENT_PRESET, placements, profileSync })
  } catch (error) {
    if (redirectToUi) {
      res.writeHead(303, { Location: appHandlerUrl })
      return res.end()
    }
    res.status(500).json({ ok: false, error: 'INTERNAL_ERROR', reason: error instanceof Error ? error.message : 'Unknown error' })
  }
}
