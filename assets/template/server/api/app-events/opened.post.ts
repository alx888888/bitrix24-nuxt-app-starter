import { getQuery, getRequestHeaders, createError } from 'h3'
import { getB24ContextFromHeadersAndQuery } from '~~/shared/server-core/b24-context.js'
import { touchPortalOpened } from '~~/shared/server-core/portal-profile.js'

export default defineEventHandler(async (event) => {
  const ctx = getB24ContextFromHeadersAndQuery(getRequestHeaders(event), getQuery(event))
  if (!ctx.portalDomain && !ctx.memberId && !ctx.authId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing Bitrix24 context', data: { error: 'MISSING_B24_CONTEXT', reason: 'Missing x-b24-* headers' } })
  }
  const profile = await touchPortalOpened(ctx)
  return { ok: true, profile: { portalDomain: profile?.portal_domain || ctx.portalDomain || '', lastAppOpenedAt: profile?.last_app_opened_at || null } }
})
