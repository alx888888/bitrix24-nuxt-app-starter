import type { B24Context } from './context'
import { ensureDbSchema, getSql } from './db'
import { sanitizeInstallPayload } from './context'

export interface PlatformProfileRow extends Record<string, unknown> {
  id: number | string
  member_id: string | null
  portal_domain: string
  app_status: string | null
  app_title: string | null
  install_auth_id: string | null
  install_refresh_id: string | null
  install_auth_expires: string | null
  install_app_sid: string | null
  install_placement: string | null
  install_scope: string | null
  installed_at: string | null
  uninstalled_at: string | null
  updated_by_user_id: string | null
  last_app_opened_at: string | null
  last_install_payload: Record<string, unknown> | null
  created_at: string | null
  updated_at: string | null
}

function normalizeValue(value: unknown) {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

function asProfileRows(rows: unknown): PlatformProfileRow[] {
  return Array.isArray(rows) ? (rows as PlatformProfileRow[]) : []
}

export async function getPortalProfileByDomain(portalDomain: string) {
  await ensureDbSchema()
  const domain = normalizeValue(portalDomain)
  if (!domain) return null
  const sql = getSql()
  const rows = asProfileRows(
    await sql`SELECT * FROM b24_portal_profiles WHERE portal_domain = ${domain} LIMIT 1`
  )
  return rows[0] || null
}

export async function getPortalProfileByMemberId(memberId: string) {
  await ensureDbSchema()
  const normalized = normalizeValue(memberId)
  if (!normalized) return null
  const sql = getSql()
  const rows = asProfileRows(await sql`
    SELECT *
    FROM b24_portal_profiles
    WHERE member_id = ${normalized}
    ORDER BY updated_at DESC NULLS LAST, id DESC
    LIMIT 1
  `)
  return rows[0] || null
}

export async function getPortalProfileByAuthId(authId: string) {
  await ensureDbSchema()
  const normalized = normalizeValue(authId)
  if (!normalized) return null
  const sql = getSql()
  const rows = asProfileRows(await sql`
    SELECT *
    FROM b24_portal_profiles
    WHERE install_auth_id = ${normalized}
    ORDER BY updated_at DESC NULLS LAST, id DESC
    LIMIT 1
  `)
  return rows[0] || null
}

export async function resolvePortalProfileByContext(context: B24Context) {
  return (
    (await getPortalProfileByDomain(context.portalDomain)) ||
    (await getPortalProfileByMemberId(context.memberId)) ||
    (await getPortalProfileByAuthId(context.authId)) ||
    null
  )
}

export async function ensurePortalProfile(context: B24Context) {
  await ensureDbSchema()
  const portalDomain = normalizeValue(context.portalDomain)
  if (!portalDomain) throw new Error('portalDomain is required')

  const sql = getSql()
  const [row] = asProfileRows(await sql`
    INSERT INTO b24_portal_profiles (
      portal_domain,
      member_id,
      app_status,
      install_auth_id,
      updated_by_user_id,
      updated_at
    )
    VALUES (
      ${portalDomain},
      ${normalizeValue(context.memberId)},
      'installed',
      ${normalizeValue(context.authId)},
      ${normalizeValue(context.userId)},
      NOW()
    )
    ON CONFLICT (portal_domain)
    DO UPDATE SET
      member_id = COALESCE(EXCLUDED.member_id, b24_portal_profiles.member_id),
      install_auth_id = COALESCE(EXCLUDED.install_auth_id, b24_portal_profiles.install_auth_id),
      updated_by_user_id = COALESCE(EXCLUDED.updated_by_user_id, b24_portal_profiles.updated_by_user_id),
      updated_at = NOW()
    RETURNING *
  `)

  return row || null
}

export async function ensurePortalProfileByContext(context: B24Context) {
  const existing = await resolvePortalProfileByContext(context)
  if (existing) {
    return ensurePortalProfile({
      portalDomain: context.portalDomain || existing.portal_domain,
      memberId: context.memberId || existing.member_id || '',
      userId: context.userId,
      authId: context.authId || existing.install_auth_id || ''
    })
  }

  return ensurePortalProfile(context)
}

export async function touchPortalOpened(context: B24Context) {
  const ensured = await ensurePortalProfileByContext(context)
  const portalDomain = normalizeValue(context.portalDomain) || ensured?.portal_domain
  const sql = getSql()

  const [row] = asProfileRows(await sql`
    UPDATE b24_portal_profiles
    SET
      member_id = COALESCE(${normalizeValue(context.memberId)}, member_id),
      install_auth_id = COALESCE(${normalizeValue(context.authId)}, install_auth_id),
      updated_by_user_id = COALESCE(${normalizeValue(context.userId)}, updated_by_user_id),
      last_app_opened_at = NOW(),
      updated_at = NOW()
    WHERE portal_domain = ${portalDomain}
    RETURNING *
  `)

  return row || null
}

export async function upsertPortalProfileOnInstall({
  memberId,
  portalDomain,
  appTitle,
  authId,
  refreshId,
  authExpires,
  appSid,
  placement,
  scope,
  userId,
  rawPayload
}: {
  memberId: string
  portalDomain: string
  appTitle: string
  authId: string
  refreshId: string
  authExpires: string
  appSid: string
  placement: string
  scope: string
  userId: string
  rawPayload: Record<string, unknown>
}) {
  await ensureDbSchema()
  const sql = getSql()
  const domain = normalizeValue(portalDomain)
  if (!domain) throw new Error('portalDomain is required for install upsert')

  const [row] = asProfileRows(await sql`
    INSERT INTO b24_portal_profiles (
      member_id,
      portal_domain,
      app_status,
      app_title,
      install_auth_id,
      install_refresh_id,
      install_auth_expires,
      install_app_sid,
      install_placement,
      install_scope,
      installed_at,
      uninstalled_at,
      updated_by_user_id,
      last_install_payload,
      updated_at
    ) VALUES (
      ${normalizeValue(memberId)},
      ${domain},
      'installed',
      ${normalizeValue(appTitle)},
      ${normalizeValue(authId)},
      ${normalizeValue(refreshId)},
      ${normalizeValue(authExpires)},
      ${normalizeValue(appSid)},
      ${normalizeValue(placement)},
      ${normalizeValue(scope)},
      NOW(),
      NULL,
      ${normalizeValue(userId)},
      ${sanitizeInstallPayload(rawPayload)},
      NOW()
    )
    ON CONFLICT (portal_domain)
    DO UPDATE SET
      member_id = COALESCE(EXCLUDED.member_id, b24_portal_profiles.member_id),
      app_status = 'installed',
      app_title = EXCLUDED.app_title,
      install_auth_id = EXCLUDED.install_auth_id,
      install_refresh_id = EXCLUDED.install_refresh_id,
      install_auth_expires = EXCLUDED.install_auth_expires,
      install_app_sid = EXCLUDED.install_app_sid,
      install_placement = EXCLUDED.install_placement,
      install_scope = EXCLUDED.install_scope,
      installed_at = NOW(),
      uninstalled_at = NULL,
      updated_by_user_id = EXCLUDED.updated_by_user_id,
      last_install_payload = EXCLUDED.last_install_payload,
      updated_at = NOW()
    RETURNING *
  `)

  return row || null
}

export async function markPortalProfileUninstalled({
  memberId,
  portalDomain,
  userId,
  rawPayload
}: {
  memberId: string
  portalDomain: string
  userId: string
  rawPayload: Record<string, unknown>
}) {
  await ensureDbSchema()
  const sql = getSql()
  const normalizedDomain = normalizeValue(portalDomain)
  const normalizedMemberId = normalizeValue(memberId)

  if (!normalizedDomain && !normalizedMemberId) {
    throw new Error('memberId or portalDomain is required')
  }

  const rows = normalizedMemberId
    ? asProfileRows(await sql`
        UPDATE b24_portal_profiles
        SET
          app_status = 'uninstalled',
          uninstalled_at = NOW(),
          updated_by_user_id = ${normalizeValue(userId)},
          last_install_payload = ${sanitizeInstallPayload(rawPayload)},
          updated_at = NOW()
        WHERE member_id = ${normalizedMemberId}
        RETURNING *
      `)
    : asProfileRows(await sql`
        UPDATE b24_portal_profiles
        SET
          app_status = 'uninstalled',
          uninstalled_at = NOW(),
          updated_by_user_id = ${normalizeValue(userId)},
          last_install_payload = ${sanitizeInstallPayload(rawPayload)},
          updated_at = NOW()
        WHERE portal_domain = ${normalizedDomain}
        RETURNING *
      `)

  return rows[0] || null
}
