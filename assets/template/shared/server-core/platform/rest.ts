import { isB24Payload, type B24Payload } from './context'

function appendFormValue(body: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null) return

  if (Array.isArray(value)) {
    value.forEach((item, index) => appendFormValue(body, `${key}[${index}]`, item))
    return
  }

  if (isB24Payload(value)) {
    for (const [childKey, childValue] of Object.entries(value)) {
      appendFormValue(body, `${key}[${childKey}]`, childValue)
    }
    return
  }

  body.append(key, String(value))
}

export async function callBitrixMethod({
  domain,
  authId,
  method,
  params = {}
}: {
  domain: string
  authId: string
  method: string
  params?: Record<string, unknown>
}) {
  if (!domain || !authId) {
    throw new Error('Missing domain/authId for Bitrix REST call')
  }

  const endpoint = `https://${domain}/rest/${method}.json`
  const body = new URLSearchParams()
  body.append('auth', authId)

  for (const [key, value] of Object.entries(params)) {
    appendFormValue(body, key, value)
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })

  let data: B24Payload = {}
  try {
    const parsed = await response.json()
    data = isB24Payload(parsed) ? parsed : {}
  } catch {
    data = {}
  }

  return {
    ok: response.ok && !data?.error,
    status: response.status,
    data
  }
}

export function callAppInfo({
  domain,
  authId
}: {
  domain: string
  authId: string
}) {
  return callBitrixMethod({
    domain,
    authId,
    method: 'app.info'
  })
}

export function placementGet({
  domain,
  authId,
  placement
}: {
  domain: string
  authId: string
  placement?: string
}) {
  return callBitrixMethod({
    domain,
    authId,
    method: 'placement.get',
    params: placement ? { PLACEMENT: placement } : {}
  })
}

export function placementBind({
  domain,
  authId,
  placement,
  handlerUrl,
  title
}: {
  domain: string
  authId: string
  placement: string
  handlerUrl: string
  title: string
}) {
  return callBitrixMethod({
    domain,
    authId,
    method: 'placement.bind',
    params: {
      PLACEMENT: placement,
      HANDLER: handlerUrl,
      TITLE: title
    }
  })
}

export function placementUnbind({
  domain,
  authId,
  placement
}: {
  domain: string
  authId: string
  placement: string
}) {
  return callBitrixMethod({
    domain,
    authId,
    method: 'placement.unbind',
    params: {
      PLACEMENT: placement
    }
  })
}
