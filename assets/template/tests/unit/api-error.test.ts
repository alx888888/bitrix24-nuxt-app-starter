import { describe, expect, it } from 'vitest'
import { createApiErrorPayload } from '~~/shared/server-core/platform/api-error'

describe('createApiErrorPayload', () => {
  it('creates the shared API error shape without details by default', () => {
    expect(createApiErrorPayload({
      error: 'BAD_REQUEST',
      reason: 'Missing payload'
    })).toEqual({
      ok: false,
      error: 'BAD_REQUEST',
      reason: 'Missing payload'
    })
  })

  it('keeps details when the route intentionally exposes safe details', () => {
    expect(createApiErrorPayload({
      error: 'VALIDATION_FAILED',
      reason: 'Validation failed',
      details: [{ field: 'title' }]
    })).toEqual({
      ok: false,
      error: 'VALIDATION_FAILED',
      reason: 'Validation failed',
      details: [{ field: 'title' }]
    })
  })
})
