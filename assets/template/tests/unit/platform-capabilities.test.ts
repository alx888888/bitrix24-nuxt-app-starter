import { describe, expect, it, vi } from 'vitest'

describe('platform capability registry', () => {
  it('returns an empty sync list without domain capabilities', async () => {
    vi.resetModules()
    const { runPlatformCapabilityRegistrations } = await import('../../shared/server-core/platform/capabilities')

    await expect(
      runPlatformCapabilityRegistrations({
        context: { portalDomain: 'demo.bitrix24.ru', memberId: 'member-1', userId: '7', authId: 'auth-1' },
        eventName: 'ONAPPINSTALL',
        appBaseUrl: 'https://example.com/',
        appHandlerUrl: 'https://example.com/api/b24/handler',
        profile: null
      })
    ).resolves.toEqual([])
  })

  it('captures registration failures without leaking thrown objects', async () => {
    vi.resetModules()
    const { registerPlatformCapability, runPlatformCapabilityRegistrations } = await import('../../shared/server-core/platform/capabilities')

    registerPlatformCapability(async () => {
      throw new Error('registration failed')
    })

    await expect(
      runPlatformCapabilityRegistrations({
        context: { portalDomain: 'demo.bitrix24.ru', memberId: 'member-1', userId: '7', authId: 'auth-1' },
        eventName: 'ONAPPINSTALL',
        appBaseUrl: 'https://example.com/',
        appHandlerUrl: 'https://example.com/api/b24/handler',
        profile: null
      })
    ).resolves.toEqual([
      {
        code: 'unknown',
        ok: false,
        action: 'skipped',
        error: 'registration failed'
      }
    ])
  })
})
