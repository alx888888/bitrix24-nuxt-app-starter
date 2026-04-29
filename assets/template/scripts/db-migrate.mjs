import { applyPlatformSchema } from '../shared/server-core/platform/schema.mjs'

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

  await applyPlatformSchema(sql)
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
