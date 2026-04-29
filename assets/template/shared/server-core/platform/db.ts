import { neon } from '@neondatabase/serverless'
import { applyPlatformSchema } from './schema.mjs'

let sqlClient: ReturnType<typeof neon> | null = null
let schemaReady = false
let ensurePromise: Promise<void> | null = null

export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.STORAGE_URL || ''
  if (!url) {
    throw new Error('DATABASE_URL is not configured (accepted: DATABASE_URL | POSTGRES_URL | STORAGE_URL)')
  }
  return url
}

export function getSql() {
  if (!sqlClient) sqlClient = neon(getDatabaseUrl())
  return sqlClient
}

async function ensureSchemaInternal() {
  const sql = getSql()

  // Production setup should run scripts/db-migrate.mjs; this remains a first-run safety net.
  await applyPlatformSchema(sql)
}

export async function ensureDbSchema() {
  if (schemaReady) return

  if (!ensurePromise) {
    ensurePromise = ensureSchemaInternal()
      .then(() => {
        schemaReady = true
      })
      .finally(() => {
        if (!schemaReady) ensurePromise = null
      })
  }

  await ensurePromise
}

export async function checkDbHealth() {
  await ensureDbSchema()
  const sql = getSql()
  await sql`SELECT 1`
  return { ok: true }
}
