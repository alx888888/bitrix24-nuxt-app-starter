function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.STORAGE_URL || ''
  if (!url) {
    throw new Error('DATABASE_URL is not configured (accepted: DATABASE_URL | POSTGRES_URL | STORAGE_URL)')
  }
  return url
}

export async function migratePlatformSchema() {
  const databaseUrl = getDatabaseUrl()
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)

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
      updated_by_user_id TEXT,
      last_app_opened_at TIMESTAMPTZ,
      last_install_payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS install_auth_id TEXT`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS install_refresh_id TEXT`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS install_auth_expires TEXT`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS install_app_sid TEXT`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS install_scope TEXT`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS install_placement TEXT`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS updated_by_user_id TEXT`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS last_app_opened_at TIMESTAMPTZ`
  await sql`ALTER TABLE b24_portal_profiles ADD COLUMN IF NOT EXISTS last_install_payload JSONB`
  await sql`CREATE INDEX IF NOT EXISTS b24_portal_profiles_portal_domain_idx ON b24_portal_profiles (portal_domain)`
  await sql`CREATE INDEX IF NOT EXISTS b24_portal_profiles_member_id_idx ON b24_portal_profiles (member_id)`
  await sql`CREATE INDEX IF NOT EXISTS b24_portal_profiles_install_auth_id_idx ON b24_portal_profiles (install_auth_id)`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migratePlatformSchema()
    .then(() => {
      console.log('[OK] Database schema migrated')
    })
    .catch((error) => {
      console.error(String(error?.message || error))
      process.exit(1)
    })
}
