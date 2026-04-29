import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadHandlerRoute(touchError: Error | null = null) {
  vi.resetModules()

  const sendRedirect = vi.fn((_event, location: string, status: number) => ({
    redirected: true,
    location,
    status
  }))
  const readBody = vi.fn(async (event: Record<string, unknown>) => event.__body || {})
  const getQuery = vi.fn((event: Record<string, unknown>) => event.__query || {})
  const getRequestHeader = vi.fn((event: Record<string, unknown>, name: string) => {
    const headers = (event.__headers || {}) as Record<string, string>
    return headers[name] || headers[name.toLowerCase()] || ''
  })

  vi.doMock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3')
    return {
      ...actual,
      defineEventHandler: (handler: unknown) => handler,
      getQuery,
      getRequestHeader,
      readBody,
      sendRedirect
    }
  })

  const touchPortalOpened = touchError
    ? vi.fn().mockRejectedValue(touchError)
    : vi.fn().mockResolvedValue(null)

  vi.doMock('~~/shared/server-core/platform/profile', async () => {
    const actual = await vi.importActual<typeof import('~~/shared/server-core/platform/profile')>(
      '~~/shared/server-core/platform/profile'
    )
    return {
      ...actual,
      touchPortalOpened
    }
  })

  const handler = (await import('~~/server/api/b24/handler')).default

  return {
    handler,
    mocks: {
      sendRedirect,
      touchPortalOpened
    }
  }
}

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('/api/b24/handler route', () => {
  it('redirects to / with normalized B24 context in query', async () => {
    const { handler, mocks } = await loadHandlerRoute()

    const result = await handler({
      method: 'POST',
      __headers: {
        host: 'starter.example.com',
        'x-forwarded-proto': 'https'
      },
      __query: {
        DOMAIN: 'https://demo.bitrix24.ru/work/',
        member_id: 'member-1',
        user_id: '7'
      },
      __body: {}
    } as never)

    expect(mocks.touchPortalOpened).toHaveBeenCalledWith({
      portalDomain: 'demo.bitrix24.ru',
      memberId: 'member-1',
      userId: '7',
      authId: ''
    })
    expect(result).toEqual({
      redirected: true,
      location: 'https://starter.example.com/?b24_iframe=1&DOMAIN=demo.bitrix24.ru&member_id=member-1&user_id=7',
      status: 303
    })
  })

  it('swallows touchPortalOpened errors and still redirects', async () => {
    const { handler, mocks } = await loadHandlerRoute(new Error('profile write failed'))

    const result = await handler({
      method: 'POST',
      __headers: {
        host: 'starter.example.com',
        'x-forwarded-proto': 'https'
      },
      __query: {
        DOMAIN: 'demo.bitrix24.ru',
        member_id: 'member-1'
      },
      __body: {}
    } as never)

    expect(mocks.touchPortalOpened).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      redirected: true,
      location: 'https://starter.example.com/?b24_iframe=1&DOMAIN=demo.bitrix24.ru&member_id=member-1',
      status: 303
    })
  })
})
