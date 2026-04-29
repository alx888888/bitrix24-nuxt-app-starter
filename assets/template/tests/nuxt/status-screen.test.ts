import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { PlatformStatusPayload } from '~~/shared/app-contract/platform-status'
import PlatformStatusScreen from '~/features/status/components/platform-status-screen.vue'

describe('PlatformStatusScreen', () => {
  it('renders the raw JSON payload from /api/platform/status', async () => {
    const payload: PlatformStatusPayload = {
      ok: true,
      timestamp: '2026-04-23T12:00:00.000Z',
      app: {
        projectName: 'demo-app',
        appTitle: 'Demo App',
        placementPreset: 'none'
      },
      portal: {
        portalDomain: 'demo.bitrix24.ru',
        memberId: 'member-1',
        userId: '7',
        hasContext: true
      },
      profile: {
        exists: true,
        appStatus: 'installed',
        hasInstallAuthId: true,
        installedAt: null,
        uninstalledAt: null,
        lastAppOpenedAt: null,
        updatedAt: null
      },
      health: {
        backend: { ok: true },
        database: { ok: true },
        bitrixRest: { ok: true, method: 'app.info' }
      }
    }

    const wrapper = await mountSuspended(PlatformStatusScreen, {
      props: {
        payload,
        loading: false,
        error: null
      }
    })

    expect(wrapper.text()).toContain('Статус')
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect((textarea.element as HTMLTextAreaElement).readOnly).toBe(true)
    expect((textarea.element as HTMLTextAreaElement).value).toContain('"portalDomain": "demo.bitrix24.ru"')
  })
})
