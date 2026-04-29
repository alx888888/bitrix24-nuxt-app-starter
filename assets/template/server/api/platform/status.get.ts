import { defineEventHandler, getQuery, getRequestHeaders } from 'h3'
import { getB24ContextFromHeadersAndQuery } from '~~/shared/server-core/platform/context'
import { buildPlatformStatusPayload } from '~~/shared/server-core/platform/status'

export default defineEventHandler(async (event) => {
  const context = getB24ContextFromHeadersAndQuery(getRequestHeaders(event), getQuery(event))
  return buildPlatformStatusPayload(context)
})
