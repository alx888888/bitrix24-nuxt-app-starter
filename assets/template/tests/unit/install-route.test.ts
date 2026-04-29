import { afterEach, describe, expect, it, vi } from 'vitest'

interface InstallRouteOptions {
  placementPreset?: 'none' | 'crm-deal-lead-tabs'
  placements?: string[]
  bindResult?: { ok: boolean; status?: number; data?: Record<string, unknown> }
  unbindResult?: { ok: boolean; data?: Record<string, unknown> }
}

async function loadInstallRoute(options: InstallRouteOptions = {}) {
  vi.resetModules()

  const sendRedirect = vi.fn((_event, location: string, status: number) => ({
    redirected: true,
    location,
    status
  }))
  const setResponseStatus = vi.fn((event: Record<string, unknown>, status: number) => {
    event.__status = status
  })
  const readBody = vi.fn(async (event: Record<string, unknown>) => event.__body || {})
  const getQuery = vi.fn((event: Record<string, unknown>) => event.__query || {})
  const getRequestURL = vi.fn((event: Record<string, unknown>) => new URL(String(event.__url || 'https://example.com/api/b24/install')))
  const getRequestHeader = vi.fn((event: Record<string, unknown>, name: string) => {
    const headers = (event.__headers || {}) as Record<string, string>
    return headers[name] || headers[name.toLowerCase()] || ''
  })
  const getRequestHeaders = vi.fn((event: Record<string, unknown>) => (event.__headers || {}) as Record<string, string>)

  vi.doMock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3')
    return {
      ...actual,
      defineEventHandler: (handler: unknown) => handler,
      getQuery,
      getRequestHeader,
      getRequestHeaders,
      getRequestURL,
      readBody,
      sendRedirect,
      setResponseStatus
    }
  })

  const upsertPortalProfileOnInstall = vi.fn().mockResolvedValue({
    id: 1,
    portal_domain: 'demo.bitrix24.ru',
    install_auth_id: 'auth-1'
  })
  const markPortalProfileUninstalled = vi.fn().mockResolvedValue({
    id: 1,
    portal_domain: 'demo.bitrix24.ru',
    app_status: 'uninstalled'
  })
  const placementBind = vi.fn().mockResolvedValue(
    options.bindResult || { ok: true, status: 200, data: { result: true } }
  )
  const placementUnbind = vi.fn().mockResolvedValue(
    options.unbindResult || { ok: true, data: { result: true } }
  )

  vi.doMock('~~/shared/server-core/platform/profile', async () => {
    const actual = await vi.importActual<typeof import('~~/shared/server-core/platform/profile')>(
      '~~/shared/server-core/platform/profile'
    )
    return {
      ...actual,
      upsertPortalProfileOnInstall,
      markPortalProfileUninstalled
    }
  })

  vi.doMock('~~/shared/server-core/platform/rest', async () => {
    const actual = await vi.importActual<typeof import('~~/shared/server-core/platform/rest')>(
      '~~/shared/server-core/platform/rest'
    )
    return {
      ...actual,
      placementBind,
      placementUnbind
    }
  })

  vi.doMock('~~/shared/server-core/platform/config', () => ({
    PLATFORM_APP_TITLE: 'Demo App',
    PLATFORM_PLACEMENT_PRESET: options.placementPreset || 'none',
    PLATFORM_PLACEMENTS: options.placements || []
  }))

  const handler = (await import('~~/server/api/b24/install')).default

  return {
    handler,
    mocks: {
      sendRedirect,
      setResponseStatus,
      upsertPortalProfileOnInstall,
      markPortalProfileUninstalled,
      placementBind,
      placementUnbind
    }
  }
}

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  vi.unstubAllGlobals()
})

describe('/api/b24/install route', () => {
  it('redirects GET requests to /api/b24/handler with 307', async () => {
    const { handler, mocks } = await loadInstallRoute()

    const result = await handler({
      method: 'GET',
      __url: 'https://starter.example.com/api/b24/install',
      __headers: {}
    } as never)

    expect(result).toEqual({
      redirected: true,
      location: 'https://starter.example.com/api/b24/handler',
      status: 307
    })
    expect(mocks.sendRedirect).toHaveBeenCalledTimes(1)
  })

  it('returns 405 for unsupported methods', async () => {
    const { handler, mocks } = await loadInstallRoute()
    const event = {
      method: 'PUT',
      __url: 'https://starter.example.com/api/b24/install',
      __headers: {}
    }

    const result = await handler(event as never)

    expect(event.__status).toBe(405)
    expect(result).toEqual({
      ok: false,
      error: 'METHOD_NOT_ALLOWED',
      reason: 'Use GET or POST'
    })
    expect(mocks.setResponseStatus).toHaveBeenCalledWith(event, 405)
  })

  it('redirects browser-like POST without auth payload to handler', async () => {
    const { handler, mocks } = await loadInstallRoute()

    const result = await handler({
      method: 'POST',
      __url: 'https://starter.example.com/api/b24/install',
      __headers: {
        accept: 'text/html,application/xhtml+xml'
      },
      __body: {}
    } as never)

    expect(result).toEqual({
      redirected: true,
      location: 'https://starter.example.com/api/b24/handler',
      status: 303
    })
    expect(mocks.sendRedirect).toHaveBeenCalled()
  })

  it('returns 400 JSON body for POST without auth payload on JSON requests', async () => {
    const { handler } = await loadInstallRoute()
    const event = {
      method: 'POST',
      __url: 'https://starter.example.com/api/b24/install',
      __headers: {
        accept: 'application/json'
      },
      __body: {}
    }

    const result = await handler(event as never)

    expect(event.__status).toBe(400)
    expect(result).toEqual({
      ok: false,
      error: 'BAD_REQUEST',
      reason: 'Missing required install auth payload'
    })
  })

  it('runs install branch and returns JSON result when placement preset is none', async () => {
    const { handler, mocks } = await loadInstallRoute()

    const result = await handler({
      method: 'POST',
      __url: 'https://starter.example.com/api/b24/install',
      __headers: {
        accept: 'application/json'
      },
      __body: {
        event: 'ONAPPINSTALL',
        AUTH_ID: 'auth-1',
        DOMAIN: 'demo.bitrix24.ru',
        MEMBER_ID: 'member-1',
        USER_ID: '7'
      }
    } as never)

    expect(mocks.upsertPortalProfileOnInstall).toHaveBeenCalledTimes(1)
    expect(mocks.markPortalProfileUninstalled).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      ok: true,
      event: 'ONAPPINSTALL',
      placementPreset: 'none',
      placements: [],
      profileSync: {
        ok: true,
        action: 'upsert',
        error: null
      }
    })
  })

  it('runs uninstall branch and unbind flow', async () => {
    const { handler, mocks } = await loadInstallRoute({
      placementPreset: 'crm-deal-lead-tabs',
      placements: ['CRM_DEAL_DETAIL_TAB']
    })

    const result = await handler({
      method: 'POST',
      __url: 'https://starter.example.com/api/b24/install',
      __headers: {
        accept: 'application/json'
      },
      __body: {
        event: 'ONAPPUNINSTALL',
        AUTH_ID: 'auth-1',
        DOMAIN: 'demo.bitrix24.ru',
        MEMBER_ID: 'member-1',
        USER_ID: '7'
      }
    } as never)

    expect(mocks.markPortalProfileUninstalled).toHaveBeenCalledTimes(1)
    expect(mocks.placementUnbind).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      ok: true,
      event: 'ONAPPUNINSTALL',
      placementPreset: 'crm-deal-lead-tabs',
      profileSync: {
        ok: true,
        action: 'soft_delete'
      }
    })
  })

  it('returns 502 when placement bind fails', async () => {
    const { handler, mocks } = await loadInstallRoute({
      placementPreset: 'crm-deal-lead-tabs',
      placements: ['CRM_DEAL_DETAIL_TAB'],
      bindResult: {
        ok: false,
        status: 500,
        data: {
          error: 'PLACEMENT_BIND_FAILED'
        }
      }
    })

    const event = {
      method: 'POST',
      __url: 'https://starter.example.com/api/b24/install',
      __headers: {
        accept: 'application/json'
      },
      __body: {
        event: 'ONAPPINSTALL',
        AUTH_ID: 'auth-1',
        DOMAIN: 'demo.bitrix24.ru',
        MEMBER_ID: 'member-1',
        USER_ID: '7'
      }
    }

    const result = await handler(event as never)

    expect(event.__status).toBe(502)
    expect(mocks.placementBind).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      ok: false,
      error: 'PLACEMENT_BIND_FAILED',
      reason: 'One or more placements failed to bind'
    })
  })
})
