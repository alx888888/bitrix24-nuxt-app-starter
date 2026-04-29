import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

function usage() {
  console.log('Usage: npm run capability:create -- <capability-name> [--force]')
  console.log('Example: npm run capability:create -- crm-sync')
}

function toPascalCase(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function writeFileSafe(path, content, force) {
  if (existsSync(path) && !force) {
    throw new Error(`Refusing to overwrite existing file: ${path}`)
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, 'utf8')
}

function createCapability(rootDir, name, force = false) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error('Capability name must use kebab-case: letters, numbers and hyphen')
  }

  const pascalName = toPascalCase(name)
  const files = [
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

  for (const file of files) {
    writeFileSafe(join(rootDir, file.path), file.content, force)
  }

  console.log(`[OK] Capability skeleton created: ${name}`)
  console.log('Next: update docs/architecture/module-map.md, capability-map.md, api-contracts.md and docs/checklists/smoke.md.')
}

const args = process.argv.slice(2)
const name = args.find((arg) => !arg.startsWith('--'))
const force = args.includes('--force')

if (!name) {
  usage()
  process.exit(1)
}

try {
  createCapability(process.cwd(), name, force)
} catch (error) {
  console.error(String(error?.message || error))
  process.exit(1)
}

