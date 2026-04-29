import { describe, expect, it } from 'vitest'
import {
  pickPayloadField,
  readBitrixAuthPayload,
  readBitrixDocumentId,
  readBitrixProperties
} from '../../shared/server-core/platform/bitrix-payload'

describe('Bitrix runtime payload helpers', () => {
  it('reads bracket-form auth, document_id and properties payloads', () => {
    const payload = {
      'auth[domain]': 'demo.bitrix24.ru',
      'auth[member_id]': 'member-1',
      'document_id[0]': 'crm',
      'document_id[1]': 'CCrmDocumentSmartInvoice',
      'document_id[2]': 'DYNAMIC_31_54',
      'properties[TEMPLATE_ID]': 'template-1'
    }

    expect(readBitrixAuthPayload(payload)).toMatchObject({
      domain: 'demo.bitrix24.ru',
      member_id: 'member-1'
    })
    expect(readBitrixDocumentId(payload)).toEqual(['crm', 'CCrmDocumentSmartInvoice', 'DYNAMIC_31_54'])
    expect(readBitrixProperties(payload)).toEqual({ TEMPLATE_ID: 'template-1' })
  })

  it('reads nested payloads and direct fallback fields', () => {
    const payload = {
      DOMAIN: 'demo.bitrix24.ru',
      auth: { AUTH_ID: 'auth-1' },
      document_id: ['crm', 'CCrmDocumentDeal', 'DEAL_7'],
      properties: { FILE_FIELD_CODE: 'UF_CRM_FILE' }
    }

    expect(pickPayloadField(payload, 'DOMAIN')).toBe('demo.bitrix24.ru')
    expect(pickPayloadField(payload, 'AUTH_ID', ['auth'])).toBe('auth-1')
    expect(readBitrixDocumentId(payload)).toEqual(['crm', 'CCrmDocumentDeal', 'DEAL_7'])
    expect(readBitrixProperties(payload)).toEqual({ FILE_FIELD_CODE: 'UF_CRM_FILE' })
  })
})
