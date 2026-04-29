export interface B24Context {
  portalDomain: string
  memberId: string
  userId: string
  authId: string
}

export type B24Payload = Record<string, unknown>

export function normalizeB24Domain(rawDomain: unknown): string {
  if (!rawDomain || typeof rawDomain !== 'string') return ''
  return rawDomain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
}

export function isB24Payload(value: unknown): value is B24Payload {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
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
  if (payload[key] !== undefined) return payload[key]
  if (payload[key.toLowerCase()] !== undefined) return payload[key.toLowerCase()]
  if (payload[key.toUpperCase()] !== undefined) return payload[key.toUpperCase()]

  for (const candidate of [
    `auth[${key}]`,
    `auth[${key.toLowerCase()}]`,
    `AUTH[${key}]`,
    `AUTH[${key.toLowerCase()}]`
  ]) {
    if (payload[candidate] !== undefined) return payload[candidate]
  }

  if (isB24Payload(payload.auth)) {
    if (payload.auth[key] !== undefined) return payload.auth[key]
    if (payload.auth[key.toLowerCase()] !== undefined) return payload.auth[key.toLowerCase()]
  }

  return undefined
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

export function sanitizeInstallPayload(payload: B24Payload) {
  const clone = { ...payload }
  for (const key of ['AUTH_ID', 'auth_id', 'REFRESH_ID', 'refresh_id']) {
    if (key in clone) clone[key] = '[redacted]'
  }

  return clone
}
