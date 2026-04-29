import { describe, expect, it } from 'vitest'
import {
  createEmptyPlatformFrameState,
  mergePlatformFrameState,
  readPlatformFrameQueryContext
} from '~/features/platform-frame/runtime'

describe('platform frame runtime', () => {
  it('creates empty frame state with install flags disabled', () => {
    const state = createEmptyPlatformFrameState()

    expect(state.isInstallMode).toBe(false)
    expect(state.isFirstRun).toBe(false)
  })

  it('reads safe query context', () => {
    const context = readPlatformFrameQueryContext(
      new URL('https://example.com/?DOMAIN=demo.bitrix24.ru&member_id=42&user_id=7&AUTH_ID=secret')
    )

    expect(context.portalDomain).toBe('demo.bitrix24.ru')
    expect(context.memberId).toBe('42')
    expect(context.userId).toBe('7')
    expect(context.authId).toBe('secret')
  })

  it('merges frame state without dropping current values', () => {
    const current = createEmptyPlatformFrameState()
    current.portalDomain = 'demo.bitrix24.ru'

    const merged = mergePlatformFrameState(current, {
      memberId: '100',
      isBitrixFrame: true,
      isInstallMode: true,
      isFirstRun: true
    })

    expect(merged.portalDomain).toBe('demo.bitrix24.ru')
    expect(merged.memberId).toBe('100')
    expect(merged.isBitrixFrame).toBe(true)
    expect(merged.isInstallMode).toBe(true)
    expect(merged.isFirstRun).toBe(true)
  })
})
