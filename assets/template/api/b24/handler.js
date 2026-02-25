import { touchPortalOpened } from '../../shared/server-core/portal-profile.js'

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

function getAppBaseUrl(req) {
  const protocol = getHeader(req, 'x-forwarded-proto') || 'https'
  const host = getHeader(req, 'x-forwarded-host') || getHeader(req, 'host') || 'example.vercel.app'
  return `${protocol}://${host}`
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
  if (!payload || typeof payload !== 'object') return undefined
  if (payload[key] !== undefined) return payload[key]
  if (payload[key.toLowerCase()] !== undefined) return payload[key.toLowerCase()]
  if (payload[key.toUpperCase()] !== undefined) return payload[key.toUpperCase()]
  for (const k of [`auth[${key}]`, `auth[${key.toLowerCase()}]`, `AUTH[${key}]`, `AUTH[${key.toLowerCase()}]`]) {
    if (payload[k] !== undefined) return payload[k]
  }
  return undefined
}

function normalizeDomain(rawDomain) {
  if (!rawDomain || typeof rawDomain !== 'string') return ''
  return rawDomain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
}

function inferB24Context(payload, req) {
  return {
    portalDomain: normalizeDomain(pickField(payload, 'DOMAIN') || pickField(payload, 'SERVER_NAME') || req.query?.DOMAIN || req.query?.domain || ''),
    memberId: String(pickField(payload, 'member_id') || pickField(payload, 'MEMBER_ID') || req.query?.member_id || ''),
    userId: String(pickField(payload, 'user_id') || pickField(payload, 'USER_ID') || req.query?.user_id || ''),
    authId: String(pickField(payload, 'AUTH_ID') || pickField(payload, 'auth_id') || req.query?.AUTH_ID || '')
  }
}

function buildRedirectUrl(req, ctx) {
  const url = new URL(`${getAppBaseUrl(req)}/`)
  url.searchParams.set('b24_iframe', '1')
  if (ctx.portalDomain) url.searchParams.set('DOMAIN', ctx.portalDomain)
  if (ctx.memberId) url.searchParams.set('member_id', ctx.memberId)
  if (ctx.userId) url.searchParams.set('user_id', ctx.userId)
  return url.toString()
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  let payload = {}
  try { payload = await readBody(req) } catch {}
  const ctx = inferB24Context(payload, req)
  if (ctx.portalDomain) {
    try { await touchPortalOpened(ctx) } catch {}
  }
  const redirectUrl = buildRedirectUrl(req, ctx)
  res.writeHead(303, { Location: redirectUrl })
  res.end()
}
