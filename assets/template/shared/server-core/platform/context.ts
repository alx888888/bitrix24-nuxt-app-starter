import {
  isBitrixRecord,
  pickPayloadField,
  readBitrixAuthPayload,
  type BitrixRuntimePayload
} from './bitrix-payload'

export interface B24Context {
  portalDomain: string
  memberId: string
  userId: string
  authId: string
}

export type B24Payload = BitrixRuntimePayload

export function normalizeB24Domain(rawDomain: unknown): string {
  if (!rawDomain || typeof rawDomain !== 'string') return ''
  return rawDomain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
}

export function isB24Payload(value: unknown): value is B24Payload {
  return isBitrixRecord(value)
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (isB24Payload(error) && typeof error.message === 'string') return error.message
  return fallback
}

function pickHeader(headers: Record<string, string | string[] | undefined>, name: string) {
  const direct = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()]
  if (Array.isArray(direct)) return direct[0] || ''
  return typeof direct === 'string' ? direct : ''
}

function pickQueryValue(query: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = query[key]
    if (Array.isArray(value)) return String(value[0] || '')
    if (value !== undefined && value !== null && String(value)) return String(value)
  }
  return ''
}

export function pickFlexibleField(payload: B24Payload, key: string) {
  return pickPayloadField(payload, key, ['auth'])
}

export function getB24ContextFromHeadersAndQuery(
  headers: Record<string, string | string[] | undefined>,
  query: Record<string, unknown>
): B24Context {
  return {
    portalDomain: normalizeB24Domain(
      pickHeader(headers, 'x-b24-domain') || pickQueryValue(query, 'DOMAIN', 'domain', 'SERVER_NAME', 'server_name')
    ),
    memberId: String(pickHeader(headers, 'x-b24-member-id') || pickQueryValue(query, 'member_id', 'MEMBER_ID') || ''),
    userId: String(pickHeader(headers, 'x-b24-user-id') || pickQueryValue(query, 'user_id', 'USER_ID') || ''),
    authId: String(pickHeader(headers, 'x-b24-auth-id') || pickQueryValue(query, 'AUTH_ID', 'auth_id') || '')
  }
}

export function getB24ContextFromInstallPayload(
  payload: B24Payload,
  query: Record<string, unknown>
): B24Context {
  return {
    portalDomain: normalizeB24Domain(
      pickFlexibleField(payload, 'DOMAIN') ||
      pickFlexibleField(payload, 'SERVER_NAME') ||
      pickQueryValue(query, 'DOMAIN', 'domain')
    ),
    memberId: String(
      pickFlexibleField(payload, 'MEMBER_ID') ||
      pickFlexibleField(payload, 'member_id') ||
      pickQueryValue(query, 'member_id', 'MEMBER_ID') ||
      ''
    ),
    userId: String(
      pickFlexibleField(payload, 'USER_ID') ||
      pickFlexibleField(payload, 'user_id') ||
      pickQueryValue(query, 'user_id', 'USER_ID') ||
      ''
    ),
    authId: String(pickFlexibleField(payload, 'AUTH_ID') || pickFlexibleField(payload, 'auth_id') || pickQueryValue(query, 'AUTH_ID', 'auth_id') || '')
  }
}

export function hasB24Context(context: B24Context) {
  return Boolean(context.portalDomain || context.memberId || context.authId)
}

function shouldRedactKey(key: string) {
  return /(auth_id|refresh_id|application_token|access_token|refresh_token|client_secret|token|secret|password|key)/i.test(key)
}

function redactSensitiveValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveValue(item))
  }

  if (isB24Payload(value)) {
    return sanitizeInstallPayload(value)
  }

  return value
}

export function sanitizeInstallPayload(payload: B24Payload) {
  const clone: B24Payload = {}
  const authPayload = readBitrixAuthPayload(payload)
  const mergedPayload = Object.keys(authPayload).length > 0 ? { ...payload, auth: authPayload } : payload

  for (const [key, value] of Object.entries(mergedPayload)) {
    clone[key] = shouldRedactKey(key) ? '[redacted]' : redactSensitiveValue(value)
  }

  return clone
}
