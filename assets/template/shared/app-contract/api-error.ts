export interface ApiErrorPayload {
  ok: false
  error: string
  reason: string
  details?: unknown
}
