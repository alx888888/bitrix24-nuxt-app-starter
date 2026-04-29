import { describe, expect, it } from 'vitest'
import { sanitizeInstallPayload } from '~~/shared/server-core/platform/context'

describe('install payload redaction', () => {
  it('recursively redacts runtime tokens and developer secrets', () => {
    expect(
      sanitizeInstallPayload({
        AUTH_ID: 'auth',
        REFRESH_ID: 'refresh',
        APPLICATION_TOKEN: 'app-token',
        nested: {
          access_token: 'access',
          keep: 'value',
          rows: [{ client_secret: 'secret' }]
        }
      })
    ).toEqual({
      AUTH_ID: '[redacted]',
      REFRESH_ID: '[redacted]',
      APPLICATION_TOKEN: '[redacted]',
      nested: {
        access_token: '[redacted]',
        keep: 'value',
        rows: [{ client_secret: '[redacted]' }]
      }
    })
  })
})
