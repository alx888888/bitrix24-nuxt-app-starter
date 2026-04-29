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

  it('marks payload as degraded when app.info reports unfinished installation', async () => {
    const payload = await buildPlatformStatusPayload(
      {
        portalDomain: 'demo.bitrix24.ru',
        memberId: 'member-1',
        userId: '7',
        authId: 'auth-1'
      },
      {
        now: () => '2026-04-24T03:25:31.843Z',
        checkDbHealth: vi.fn().mockResolvedValue(undefined),
        resolvePortalProfileByContext: vi.fn().mockResolvedValue({
          portal_domain: 'demo.bitrix24.ru',
          app_status: 'installed',
          install_auth_id: 'auth-1',
          installed_at: '2026-04-24T03:24:55.730Z',
          uninstalled_at: null,
          last_app_opened_at: '2026-04-24T03:25:31.315Z',
          updated_at: '2026-04-24T03:25:31.315Z'
        }),
        callAppInfo: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          data: {
            result: {
              ID: 182,
              STATUS: 'L',
              INSTALLED: false
            }
          }
        })
      }
    )

    expect(payload.ok).toBe(false)
    expect(payload.health.bitrixRest.ok).toBe(false)
    expect(payload.health.bitrixRest.installationComplete).toBe(false)
    expect(payload.health.bitrixRest.reason).toContain('installFinish')
  })
})
