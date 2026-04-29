import type { ApiErrorPayload } from '~~/shared/app-contract/api-error'

export function createApiErrorPayload({
  error,
  reason,
  details
}: {
  error: string
  reason: string
  details?: unknown
}): ApiErrorPayload {
  const payload: ApiErrorPayload = {
    ok: false,
    error,
    reason
  }

  if (details !== undefined) {
    payload.details = details
  }

  return payload
}
