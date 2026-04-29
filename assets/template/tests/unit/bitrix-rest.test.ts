import { afterEach, describe, expect, it, vi } from 'vitest'
import { callBitrixMethod } from '../../shared/server-core/platform/rest'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Bitrix REST client', () => {
  it('encodes nested params for Bitrix REST methods', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    await callBitrixMethod({
      domain: 'demo.bitrix24.ru',
      authId: 'auth-1',
      method: 'crm.item.update',
      params: {
        entityTypeId: 31,
        id: 54,
        fields: {
          TITLE: 'Updated',
          FILES: ['one', 'two']
        }
      }
    })

    const body = fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams
    expect(body.get('auth')).toBe('auth-1')
    expect(body.get('entityTypeId')).toBe('31')
    expect(body.get('fields[TITLE]')).toBe('Updated')
    expect(body.get('fields[FILES][0]')).toBe('one')
    expect(body.get('fields[FILES][1]')).toBe('two')
  })
})
