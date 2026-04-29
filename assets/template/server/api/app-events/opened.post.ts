import { getQuery, getRequestHeaders, createError } from 'h3'
import {
  getB24ContextFromHeadersAndQuery,
  getErrorMessage,
  hasB24Context
} from '~~/shared/server-core/platform/context'
import { touchPortalOpened } from '~~/shared/server-core/platform/profile'

export default defineEventHandler(async (event) => {
  const context = getB24ContextFromHeadersAndQuery(getRequestHeaders(event), getQuery(event))

  if (!hasB24Context(context)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing Bitrix24 context',
      data: {
        error: 'MISSING_B24_CONTEXT',
        reason: 'Missing x-b24-* headers or query context'
      }
    })
  }

  try {
    const profile = await touchPortalOpened(context)
    return {
      ok: true,
      updated: Boolean(profile),
      profile: {
        portalDomain: profile?.portal_domain || context.portalDomain || '',
        lastAppOpenedAt: profile?.last_app_opened_at || null
      }
    }
  } catch (error: unknown) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Portal profile update unavailable',
      data: {
        error: 'PROFILE_UPDATE_FAILED',
        reason: getErrorMessage(error, 'Portal profile update failed')
      }
    })
  }
})
