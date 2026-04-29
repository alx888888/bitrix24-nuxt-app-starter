import { describe, expect, it } from 'vitest'
import {
  buildHandlerRedirectUrl,
  resolveInstallEventName,
  shouldRedirectInstallResponse
} from '~~/shared/server-core/platform/install'

describe('platform install flow helpers', () => {
  it('falls back to ONAPPINSTALL when auth and domain exist', () => {
    expect(
      resolveInstallEventName({
        rawEventName: '',
        authId: 'auth-token',
        portalDomain: 'example.bitrix24.ru'
      })
    ).toBe('ONAPPINSTALL')
  })

  it('detects iframe and document requests for redirect flow', () => {
    expect(
      shouldRedirectInstallResponse({
        accept: 'text/html,application/xhtml+xml'
      })
    ).toBe(true)

    expect(
      shouldRedirectInstallResponse({
        'sec-fetch-dest': 'iframe'
      })
    ).toBe(true)
  })

  it('builds safe handler redirect url', () => {
    const url = buildHandlerRedirectUrl({
      baseUrl: 'https://example.com/',
      context: {
        portalDomain: 'demo.bitrix24.ru',
        memberId: 'member-1',
        userId: '7'
      }
    })

    expect(url).toContain('b24_iframe=1')
    expect(url).toContain('DOMAIN=demo.bitrix24.ru')
    expect(url).toContain('member_id=member-1')
    expect(url).toContain('user_id=7')
  })
})
