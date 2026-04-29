import { defineEventHandler, getQuery, getRequestHeader, readBody, sendRedirect } from 'h3'
import { getB24ContextFromInstallPayload } from '~~/shared/server-core/platform/context'
import { touchPortalOpened } from '~~/shared/server-core/platform/profile'
import { buildHandlerRedirectUrl } from '~~/shared/server-core/platform/install'

export default defineEventHandler(async (event) => {
  const payload = (await readBody(event).catch(() => ({}))) || {}
  const query = getQuery(event)
  const context = getB24ContextFromInstallPayload(payload, query as Record<string, unknown>)

  if (context.portalDomain) {
    try {
      await touchPortalOpened(context)
    } catch {
      // best effort
    }
  }

  const host = getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host') || 'localhost:3000'
  const proto = getRequestHeader(event, 'x-forwarded-proto') || 'http'

  return sendRedirect(
    event,
    buildHandlerRedirectUrl({
      baseUrl: `${proto}://${host}/`,
      context
    }),
    303
  )
})
