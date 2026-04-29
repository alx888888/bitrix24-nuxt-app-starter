import { describe, expect, it, vi } from 'vitest'
import { buildPlatformStatusPayload } from '~~/shared/server-core/platform/status'

describe('buildPlatformStatusPayload', () => {
  it('returns degraded health without database or rest context', async () => {
    const payload = await buildPlatformStatusPayload(
      {
        portalDomain: '',
        memberId: '',
        userId: '',
        authId: ''
      },
      {
        now: () => '2026-04-23T12:00:00.000Z',
        checkDbHealth: vi.fn().mockRejectedValue(new Error('DATABASE_URL is not configured')),
        resolvePortalProfileByContext: vi.fn().mockResolvedValue(null),
        callAppInfo: vi.fn()
      }
    )

    expect(payload.timestamp).toBe('2026-04-23T12:00:00.000Z')
    expect(payload.app.placementPreset).toBe('none')
    expect(payload.portal.hasContext).toBe(false)
    expect(payload.health.backend.ok).toBe(true)
    expect(payload.health.database.ok).toBe(false)
    expect(payload.health.bitrixRest.method).toBe('app.info')
  })
})
