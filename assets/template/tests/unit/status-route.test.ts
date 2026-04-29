import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadStatusRoute() {
  vi.resetModules()

  const getRequestHeaders = vi.fn((event: Record<string, unknown>) => (event.__headers || {}) as Record<string, string>)
  const getQuery = vi.fn((event: Record<string, unknown>) => (event.__query || {}) as Record<string, unknown>)

  vi.doMock('h3', async () => {
    const actual = await vi.importActual<typeof import('h3')>('h3')
    return {
      ...actual,
      defineEventHandler: (handler: unknown) => handler,
      getRequestHeaders,
      getQuery
    }
  })

  const checkDbHealth = vi.fn().mockResolvedValue(undefined)
  const resolvePortalProfileByContext = vi.fn().mockResolvedValue({
    portal_domain: 'demo.bitrix24.ru',
    app_status: 'installed',
    install_auth_id: 'auth-1',
    installed_at: null,
    uninstalled_at: null,
    last_app_opened_at: null,
    updated_at: null
  })
  const callAppInfo = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    data: {
      result: {
        ID: 178
      }
    }
  })

  vi.doMock('~~/shared/server-core/platform/db', () => ({
    checkDbHealth
  }))
  vi.doMock('~~/shared/server-core/platform/profile', () => ({
    resolvePortalProfileByContext
  }))
  vi.doMock('~~/shared/server-core/platform/rest', () => ({
    callAppInfo
  }))

  const handler = (await import('~~/server/api/platform/status.get')).default

  return {
    handler,
    mocks: {
      checkDbHealth,
      resolvePortalProfileByContext,
      callAppInfo
    }
  }
}

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('/api/platform/status route', () => {
  it('returns the aggregated status contract without legacy payload fields', async () => {
    const { handler, mocks } = await loadStatusRoute()

    const payload = await handler({
      __headers: {
        'x-b24-domain': 'demo.bitrix24.ru',
        'x-b24-member-id': 'member-1',
        'x-b24-user-id': '7',
        'x-b24-auth-id': 'auth-1'
      },
      __query: {}
    } as never)

    expect(mocks.checkDbHealth).toHaveBeenCalledTimes(1)
    expect(mocks.resolvePortalProfileByContext).toHaveBeenCalledWith({
      portalDomain: 'demo.bitrix24.ru',
      memberId: 'member-1',
      userId: '7',
      authId: 'auth-1'
    })
    expect(mocks.callAppInfo).toHaveBeenCalledWith({
      domain: 'demo.bitrix24.ru',
      authId: 'auth-1'
    })
    expect(payload).toMatchObject({
      ok: true,
      app: {
        placementPreset: 'none'
      },
      portal: {
        portalDomain: 'demo.bitrix24.ru',
        memberId: 'member-1',
        userId: '7',
        hasContext: true
      },
      health: {
        backend: { ok: true },
        database: { ok: true },
        bitrixRest: {
          ok: true,
          method: 'app.info'
        }
      }
    })
    expect(Object.keys(payload).sort()).toEqual(['app', 'health', 'ok', 'portal', 'profile', 'timestamp'])
    expect(payload).not.toHaveProperty('compatibility')
    expect(payload).not.toHaveProperty('appSettings')
    expect(JSON.stringify(payload)).not.toContain('/api/system/status')
    expect(JSON.stringify(payload)).not.toContain('/api/app-settings')
  })
})
