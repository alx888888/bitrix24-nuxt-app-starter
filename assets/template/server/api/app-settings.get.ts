import { getQuery, getRequestHeaders, createError } from 'h3'
import { getB24ContextFromHeadersAndQuery } from '~~/shared/server-core/b24-context.js'
import { resolvePortalProfileByContext } from '~~/shared/server-core/portal-profile.js'
import { toPortalSettingsProfileResponse } from '~~/shared/server-core/app-settings.js'

export default defineEventHandler(async (event) => {
  const ctx = getB24ContextFromHeadersAndQuery(getRequestHeaders(event), getQuery(event))
  if (!ctx.portalDomain && !ctx.memberId && !ctx.authId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing Bitrix24 context',
      data: {
        error: 'BAD_REQUEST',
        reason: 'Missing Bitrix24 context in request headers',
        details: { expectedHeaders: ['x-b24-domain', 'x-b24-member-id', 'x-b24-auth-id'] }
      }
    })
  }
  const profile = await resolvePortalProfileByContext(ctx)
  return { ok: true, profile: toPortalSettingsProfileResponse(profile, ctx) }
})
