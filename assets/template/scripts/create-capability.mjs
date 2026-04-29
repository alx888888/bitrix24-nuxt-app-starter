import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

function usage() {
  console.log('Usage: npm run capability:create -- <capability-name> [--kind status|bizproc-activity] [--force]')
  console.log('Example: npm run capability:create -- crm-sync')
  console.log('Example: npm run capability:create -- invoice-export --kind bizproc-activity')
}

function toPascalCase(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function toSnakeCase(value) {
  return value.replaceAll('-', '_')
}

function writeFileSafe(path, content, force) {
  if (existsSync(path) && !force) {
    throw new Error(`Refusing to overwrite existing file: ${path}`)
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, 'utf8')
}

function statusCapabilityFiles(name) {
  const pascalName = toPascalCase(name)
  return [
    {
      path: `shared/app-contract/${name}.ts`,
      content: `export interface ${pascalName}StatusPayload {\n  ok: true\n  capability: '${name}'\n}\n`
    },
    {
      path: `shared/server-core/${name}/index.ts`,
      content: `import type { ${pascalName}StatusPayload } from '../../app-contract/${name}'\n\nexport function build${pascalName}Status(): ${pascalName}StatusPayload {\n  return { ok: true, capability: '${name}' }\n}\n`
    },
    {
      path: `server/api/${name}/status.get.ts`,
      content: `import { build${pascalName}Status } from '../../../shared/server-core/${name}'\n\nexport default defineEventHandler(() => build${pascalName}Status())\n`
    },
    {
      path: `app/features/${name}/README.md`,
      content: `# ${pascalName} Feature\n\nBounded UI/client orchestration for the \`${name}\` capability.\n\nRules:\n- use B24UI components only\n- keep REST/backend calls behind server/api adapters\n- do not import shared/server-core from app code\n`
    },
    {
      path: `tests/unit/${name}-capability.test.ts`,
      content: `import { describe, expect, it } from 'vitest'\nimport { build${pascalName}Status } from '../../shared/server-core/${name}'\n\ndescribe('${name} capability skeleton', () => {\n  it('returns a bounded capability status payload', () => {\n    expect(build${pascalName}Status()).toEqual({ ok: true, capability: '${name}' })\n  })\n})\n`
    }
  ]
}

function bizprocActivityFiles(name) {
  const pascalName = toPascalCase(name)
  const activityCode = toSnakeCase(name)
  return [
    {
      path: `shared/app-contract/${name}.ts`,
      content: `export interface ${pascalName}ActivityResultPayload {\n  ok: boolean\n  STATUS_CODE: 200 | 500\n  ERROR_TEXT: string\n  eventSendOk: boolean\n}\n`
    },
    {
      path: `shared/server-core/${name}/bizproc-contract.ts`,
      content: `export const ${pascalName}ActivityCode = '${activityCode}'\n\nexport function build${pascalName}ActivityRegistration(handlerUrl: string) {\n  return {\n    CODE: ${pascalName}ActivityCode,\n    HANDLER: handlerUrl,\n    NAME: '${pascalName}',\n    DESCRIPTION: 'Generated Bitrix24 business process activity',\n    USE_SUBSCRIPTION: 'Y',\n    PROPERTIES: {\n      INPUT_JSON: {\n        Name: 'Input JSON',\n        Type: 'text',\n        Required: 'N',\n        Multiple: 'N'\n      }\n    },\n    RETURN_PROPERTIES: {\n      STATUS_CODE: {\n        Name: 'Status code',\n        Type: 'int',\n        Multiple: 'N'\n      },\n      ERROR_TEXT: {\n        Name: 'Error text',\n        Type: 'text',\n        Multiple: 'N'\n      }\n    }\n  }\n}\n`
    },
    {
      path: `shared/server-core/${name}/bizproc-payload.ts`,
      content: `import {\n  isBitrixRecord,\n  pickPayloadField,\n  readBitrixAuthPayload,\n  readBitrixDocumentId,\n  readBitrixProperties,\n  toText\n} from '../platform/bitrix-payload'\n\nexport function parse${pascalName}ActivityPayload(rawPayload: unknown) {\n  const payload = isBitrixRecord(rawPayload) ? rawPayload : {}\n  const auth = readBitrixAuthPayload(payload)\n  return {\n    auth,\n    documentId: readBitrixDocumentId(payload),\n    eventToken: toText(pickPayloadField(payload, 'event_token')),\n    properties: readBitrixProperties(payload)\n  }\n}\n`
    },
    {
      path: `shared/server-core/${name}/bizproc-execute.ts`,
      content: `import type { ${pascalName}ActivityResultPayload } from '../../app-contract/${name}'\nimport { callBitrixMethod } from '../platform/rest'\nimport { parse${pascalName}ActivityPayload } from './bizproc-payload'\n\nconst defaultResult = {\n  STATUS_CODE: 500,\n  ERROR_TEXT: 'Activity handler is not configured'\n} as const\n\nfunction pickAuthId(auth: Record<string, unknown>) {\n  return String(auth.AUTH_ID || auth.auth || auth.access_token || '')\n}\n\nexport async function execute${pascalName}Activity(rawPayload: unknown): Promise<${pascalName}ActivityResultPayload> {\n  const parsed = parse${pascalName}ActivityPayload(rawPayload)\n  const domain = String(parsed.auth.domain || parsed.auth.DOMAIN || '')\n  const authId = pickAuthId(parsed.auth)\n  let eventSendOk = false\n\n  if (parsed.eventToken && domain && authId) {\n    const eventResult = await callBitrixMethod({\n      domain,\n      authId,\n      method: 'bizproc.event.send',\n      params: {\n        EVENT_TOKEN: parsed.eventToken,\n        RETURN_VALUES: defaultResult\n      }\n    })\n    eventSendOk = eventResult.ok\n  }\n\n  return {\n    ok: false,\n    ...defaultResult,\n    eventSendOk\n  }\n}\n`
    },
    {
      path: `shared/server-core/${name}/bizproc-registration.ts`,
      content: `import { registerPlatformCapability } from '../platform/capabilities'\nimport { callBitrixMethod } from '../platform/rest'\nimport { ${pascalName}ActivityCode, build${pascalName}ActivityRegistration } from './bizproc-contract'\n\nexport function register${pascalName}PlatformCapability() {\n  registerPlatformCapability(async ({ context, appBaseUrl }) => {\n    const handlerUrl = new URL('/api/${name}/bizproc/execute', appBaseUrl).toString()\n    const result = await callBitrixMethod({\n      domain: context.portalDomain,\n      authId: context.authId,\n      method: 'bizproc.activity.add',\n      params: build${pascalName}ActivityRegistration(handlerUrl)\n    })\n\n    return {\n      code: ${pascalName}ActivityCode,\n      ok: result.ok,\n      action: 'registered',\n      error: result.ok ? null : 'bizproc.activity.add failed'\n    }\n  })\n}\n`
    },
    {
      path: `server/api/${name}/bizproc/execute.post.ts`,
      content: `import { readBody } from 'h3'\nimport { execute${pascalName}Activity } from '../../../../shared/server-core/${name}/bizproc-execute'\n\nexport default defineEventHandler(async (event) => execute${pascalName}Activity(await readBody(event).catch(() => ({}))))\n`
    },
    {
      path: `tests/unit/${name}-bizproc-payload.test.ts`,
      content: `import { describe, expect, it } from 'vitest'\nimport { parse${pascalName}ActivityPayload } from '../../shared/server-core/${name}/bizproc-payload'\n\ndescribe('${name} bizproc payload parser', () => {\n  it('reads Bitrix bracket payload fields', () => {\n    const parsed = parse${pascalName}ActivityPayload({\n      'auth[domain]': 'demo.bitrix24.ru',\n      'document_id[2]': 'DEAL_7',\n      event_token: 'event-1',\n      'properties[INPUT_JSON]': '{}'\n    })\n\n    expect(parsed.auth.domain).toBe('demo.bitrix24.ru')\n    expect(parsed.documentId).toEqual(['DEAL_7'])\n    expect(parsed.eventToken).toBe('event-1')\n    expect(parsed.properties.INPUT_JSON).toBe('{}')\n  })\n})\n`
    }
  ]
}

function createCapability(rootDir, name, kind = 'status', force = false) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error('Capability name must use kebab-case: letters, numbers and hyphen')
  }

  if (!['status', 'bizproc-activity'].includes(kind)) {
    throw new Error('Capability kind must be status or bizproc-activity')
  }

  const files = kind === 'bizproc-activity' ? bizprocActivityFiles(name) : statusCapabilityFiles(name)

  for (const file of files) {
    writeFileSafe(join(rootDir, file.path), file.content, force)
  }

  console.log(`[OK] Capability skeleton created: ${name} (${kind})`)
  console.log('Next: update docs/architecture/module-map.md, capability-map.md, api-contracts.md and docs/checklists/smoke.md.')
  if (kind === 'bizproc-activity') {
    console.log(`Next: import register${toPascalCase(name)}PlatformCapability from shared/server-core/${name}/bizproc-registration in shared/server-core/platform/capabilities.ts.`)
  }
}

const args = process.argv.slice(2)
let name = ''
let kind = 'status'
const force = args.includes('--force')

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index]
  if (arg === '--force') continue
  if (arg === '--kind') {
    kind = args[index + 1] || ''
    index += 1
    continue
  }
  if (arg.startsWith('--kind=')) {
    kind = arg.slice('--kind='.length)
    continue
  }
  if (!arg.startsWith('--') && !name) {
    name = arg
  }
}

if (!name) {
  usage()
  process.exit(1)
}

try {
  createCapability(process.cwd(), name, kind, force)
} catch (error) {
  console.error(String(error?.message || error))
  process.exit(1)
}
