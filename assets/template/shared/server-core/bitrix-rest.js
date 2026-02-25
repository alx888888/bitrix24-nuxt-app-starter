export async function callBitrixMethod({ domain, authId, method, params = {} }) {
  if (!domain || !authId) throw new Error('Missing domain/authId for Bitrix REST call')
  const endpoint = `https://${domain}/rest/${method}.json`
  const body = new URLSearchParams()
  body.append('auth', authId)
  for (const [k, v] of Object.entries(params)) body.append(k, String(v))
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  let data = {}
  try { data = await response.json() } catch {}
  return { ok: response.ok && !(data && data.error), status: response.status, data }
}

export async function callAppInfo({ domain, authId }) {
  return callBitrixMethod({ domain, authId, method: 'app.info' })
}

export async function placementGet({ domain, authId, placement }) {
  return callBitrixMethod({ domain, authId, method: 'placement.get', params: placement ? { PLACEMENT: placement } : {} })
}
