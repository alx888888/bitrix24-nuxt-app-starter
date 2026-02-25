import { neon } from '@neondatabase/serverless'

let sqlClient = null
let ensured = false
let ensurePromise = null

function getDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.STORAGE_URL ||
    ''
  if (!url) throw new Error('DATABASE_URL is not configured (accepted: DATABASE_URL | POSTGRES_URL | STORAGE_URL)')
  return url
}

export function getSql() {
  if (!sqlClient) sqlClient = neon(getDatabaseUrl())
  return sqlClient
}

async function ensureSchemaInternal() {
  const sql = getSql()
  await sql`
    CREATE TABLE IF NOT EXISTS b24_portal_profiles (
      id BIGSERIAL PRIMARY KEY,
      member_id TEXT,
      portal_domain TEXT NOT NULL UNIQUE,
      app_status TEXT NOT NULL DEFAULT 'installed',
      app_title TEXT,
      install_auth_id TEXT,
      install_refresh_id TEXT,
      install_auth_expires TEXT,
      install_app_sid TEXT,
      install_placement TEXT,
      install_scope TEXT,
      installed_at TIMESTAMPTZ,
      uninstalled_at TIMESTAMPTZ,
      app_data JSONB,
      updated_by_user_id TEXT,
      last_app_opened_at TIMESTAMPTZ,
      last_install_payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS app_data JSONB`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS install_auth_id TEXT`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS install_refresh_id TEXT`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS install_scope TEXT`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS install_placement TEXT`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS last_app_opened_at TIMESTAMPTZ`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS updated_by_user_id TEXT`
  await sql`CREATE INDEX IF NOT EXISTS b24_portal_profiles_portal_domain_idx ON b24_portal_profiles (portal_domain)`
  await sql`CREATE INDEX IF NOT EXISTS b24_portal_profiles_member_id_idx ON b24_portal_profiles (member_id)`
  await sql`CREATE INDEX IF NOT EXISTS b24_portal_profiles_install_auth_id_idx ON b24_portal_profiles (install_auth_id)`
}

export async function ensureDbSchema() {
  if (ensured) return
  if (!ensurePromise) {
    ensurePromise = ensureSchemaInternal().then(() => { ensured = true }).finally(() => { if (!ensured) ensurePromise = null })
  }
  await ensurePromise
}

export async function checkDbHealth() {
  await ensureDbSchema()
  const sql = getSql()
  await sql`SELECT 1`
  return { ok: true }
}
