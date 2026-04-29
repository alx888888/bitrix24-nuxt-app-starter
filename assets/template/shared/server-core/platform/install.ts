import type { B24Context, B24Payload } from './context'
import { normalizeB24Domain, pickFlexibleField } from './context'

export function resolveInstallEventName({
  rawEventName,
  authId,
  portalDomain
}: {
  rawEventName: unknown
  authId: string
  portalDomain: string
}) {
  const eventName = String(rawEventName || '').toUpperCase()
  if (eventName) return eventName
  if (authId && portalDomain) return 'ONAPPINSTALL'
  return ''
}

export function isInstallEvent(eventName: string) {
  return eventName === 'ONAPPINSTALL'
}

export function isUninstallEvent(eventName: string) {
  return eventName === 'ONAPPUNINSTALL'
}

export function shouldRedirectInstallResponse(headers: Record<string, string | string[] | undefined>) {
  const accept = String(headers.accept || headers.Accept || '')
  const fetchDestination = String(headers['sec-fetch-dest'] || headers['Sec-Fetch-Dest'] || '')
  return accept.includes('text/html') || fetchDestination === 'iframe' || fetchDestination === 'document'
}

export function buildHandlerRedirectUrl({
  baseUrl,
  context
}: {
  baseUrl: string
  context: Partial<B24Context>
}) {
  const url = new URL(baseUrl)
  url.searchParams.set('b24_iframe', '1')

  if (context.portalDomain) url.searchParams.set('DOMAIN', normalizeB24Domain(context.portalDomain))
  if (context.memberId) url.searchParams.set('member_id', String(context.memberId))
  if (context.userId) url.searchParams.set('user_id', String(context.userId))

  return url.toString()
}

export function pickInstallProfileData(payload: B24Payload) {
  return {
    memberId: String(pickFlexibleField(payload, 'MEMBER_ID') || pickFlexibleField(payload, 'member_id') || ''),
    refreshId: String(pickFlexibleField(payload, 'REFRESH_ID') || pickFlexibleField(payload, 'refresh_id') || ''),
    authExpires: String(pickFlexibleField(payload, 'AUTH_EXPIRES') || pickFlexibleField(payload, 'auth_expires') || ''),
    appSid: String(pickFlexibleField(payload, 'APP_SID') || pickFlexibleField(payload, 'app_sid') || ''),
    placement: String(pickFlexibleField(payload, 'PLACEMENT') || pickFlexibleField(payload, 'placement') || ''),
    scope: String(pickFlexibleField(payload, 'SCOPE') || pickFlexibleField(payload, 'scope') || ''),
    userId: String(pickFlexibleField(payload, 'USER_ID') || pickFlexibleField(payload, 'user_id') || '')
  }
}
