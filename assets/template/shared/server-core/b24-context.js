export function normalizeDomain(rawDomain) {
  if (!rawDomain || typeof rawDomain !== 'string') return ''
  return rawDomain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
}

function pickHeader(headers, name) {
  if (!headers) return ''
  const direct = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()]
  if (Array.isArray(direct)) return direct[0] || ''
  return typeof direct === 'string' ? direct : ''
}

function pickQuery(query, ...keys) {
  for (const key of keys) {
    const value = query?.[key]
    if (Array.isArray(value)) return value[0] || ''
    if (value) return String(value)
  }
  return ''
}

export function getB24ContextFromHeadersAndQuery(headers, query) {
  return {
    portalDomain: normalizeDomain(pickHeader(headers, 'x-b24-domain') || pickQuery(query, 'DOMAIN', 'domain', 'SERVER_NAME', 'server_name')),
    memberId: String(pickHeader(headers, 'x-b24-member-id') || pickQuery(query, 'member_id', 'MEMBER_ID') || ''),
    userId: String(pickHeader(headers, 'x-b24-user-id') || pickQuery(query, 'user_id', 'USER_ID') || ''),
    authId: String(pickHeader(headers, 'x-b24-auth-id') || pickQuery(query, 'AUTH_ID', 'auth_id') || '')
  }
}

export function getB24ContextFromNodeRequest(req) {
  return getB24ContextFromHeadersAndQuery(req?.headers || {}, req?.query || {})
}
