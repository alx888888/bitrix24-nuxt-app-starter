import { getQuery, getRequestHeader, readBody, sendRedirect } from 'h3'
import { touchPortalOpened } from '~~/shared/server-core/portal-profile.js'

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
  return undefined
}

function inferB24Context(payload: any, query: Record<string, any>) {
  return {
    portalDomain: normalizeDomain(
      pickField(payload, 'DOMAIN') || pickField(payload, 'SERVER_NAME') || query.DOMAIN || query.domain || ''
    ),
    memberId: String(pickField(payload, 'member_id') || pickField(payload, 'MEMBER_ID') || query.member_id || ''),
    userId: String(pickField(payload, 'user_id') || pickField(payload, 'USER_ID') || query.user_id || ''),
    authId: String(pickField(payload, 'AUTH_ID') || pickField(payload, 'auth_id') || query.AUTH_ID || '')
  }
}

export default defineEventHandler(async (event) => {
  const payload = (await readBody(event).catch(() => ({}))) || {}
  const query = getQuery(event)
  const ctx = inferB24Context(payload, query as any)

  if (ctx.portalDomain) {
    try {
      await touchPortalOpened(ctx)
    } catch {
      // best effort
    }
  }

  const host = getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host') || 'localhost:3000'
  const proto = getRequestHeader(event, 'x-forwarded-proto') || 'http'
  const url = new URL(`${proto}://${host}/`)
  url.searchParams.set('b24_iframe', '1')
  if (ctx.portalDomain) url.searchParams.set('DOMAIN', ctx.portalDomain)
  if (ctx.memberId) url.searchParams.set('member_id', ctx.memberId)
  if (ctx.userId) url.searchParams.set('user_id', ctx.userId)

  return sendRedirect(event, url.toString(), 303)
})
