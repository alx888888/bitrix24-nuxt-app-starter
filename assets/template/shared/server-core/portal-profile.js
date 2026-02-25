import { ensureDbSchema, getSql } from './db.js'

function norm(v) {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s || null
}

function safePayload(payload) {
  if (!payload || typeof payload !== 'object') return {}
  const clone = { ...payload }
  for (const k of ['AUTH_ID', 'auth_id', 'REFRESH_ID', 'refresh_id']) {
    if (k in clone) clone[k] = '[redacted]'
  }
  return clone
}

export async function getPortalProfileByDomain(portalDomain) {
  await ensureDbSchema()
  const domain = norm(portalDomain)
  if (!domain) return null
  const sql = getSql()
  const rows = await sql`SELECT * FROM b24_portal_profiles WHERE portal_domain = ${domain} LIMIT 1`
  return rows[0] || null
}

export async function getPortalProfileByMemberId(memberId) {
  await ensureDbSchema()
  const value = norm(memberId)
  if (!value) return null
  const sql = getSql()
  const rows = await sql`SELECT * FROM b24_portal_profiles WHERE member_id = ${value} ORDER BY updated_at DESC NULLS LAST, id DESC LIMIT 1`
  return rows[0] || null
}

export async function getPortalProfileByAuthId(authId) {
  await ensureDbSchema()
  const value = norm(authId)
  if (!value) return null
  const sql = getSql()
  const rows = await sql`SELECT * FROM b24_portal_profiles WHERE install_auth_id = ${value} ORDER BY updated_at DESC NULLS LAST, id DESC LIMIT 1`
  return rows[0] || null
}

export async function resolvePortalProfileByContext({ portalDomain, memberId, authId }) {
  return (await getPortalProfileByDomain(portalDomain)) || (await getPortalProfileByMemberId(memberId)) || (await getPortalProfileByAuthId(authId)) || null
}

export async function ensurePortalProfile({ portalDomain, memberId, userId, authId }) {
  await ensureDbSchema()
  const domain = norm(portalDomain)
  if (!domain) throw new Error('portalDomain is required')
  const sql = getSql()
  const [row] = await sql`
    INSERT INTO b24_portal_profiles (portal_domain, member_id, app_status, install_auth_id, updated_by_user_id, updated_at)
    VALUES (${domain}, ${norm(memberId)}, 'installed', ${norm(authId)}, ${norm(userId)}, NOW())
    ON CONFLICT (portal_domain)
    DO UPDATE SET
      member_id = COALESCE(EXCLUDED.member_id, b24_portal_profiles.member_id),
      install_auth_id = COALESCE(EXCLUDED.install_auth_id, b24_portal_profiles.install_auth_id),
      updated_by_user_id = COALESCE(EXCLUDED.updated_by_user_id, b24_portal_profiles.updated_by_user_id),
      updated_at = NOW()
    RETURNING *
  `
  return row || null
}

export async function ensurePortalProfileByContext(ctx) {
  const existing = await resolvePortalProfileByContext(ctx)
  if (existing) {
    return ensurePortalProfile({
      portalDomain: ctx.portalDomain || existing.portal_domain,
      memberId: ctx.memberId || existing.member_id,
      userId: ctx.userId,
      authId: ctx.authId || existing.install_auth_id
    })
  }
  return ensurePortalProfile(ctx)
}

export async function touchPortalOpened(ctx) {
  const ensured = await ensurePortalProfileByContext(ctx)
  const domain = norm(ctx.portalDomain) || ensured?.portal_domain
  const sql = getSql()
  const [row] = await sql`
    UPDATE b24_portal_profiles
    SET
      member_id = COALESCE(${norm(ctx.memberId)}, member_id),
      install_auth_id = COALESCE(${norm(ctx.authId)}, install_auth_id),
      updated_by_user_id = COALESCE(${norm(ctx.userId)}, updated_by_user_id),
      last_app_opened_at = NOW(),
      updated_at = NOW()
    WHERE portal_domain = ${domain}
    RETURNING *
  `
  return row || null
}

export async function upsertPortalProfileOnInstall({ memberId, portalDomain, appTitle, authId, refreshId, authExpires, appSid, placement, scope, userId, rawPayload }) {
  await ensureDbSchema()
  const sql = getSql()
  const domain = norm(portalDomain)
  if (!domain) throw new Error('portalDomain is required for install upsert')
  const [row] = await sql`
    INSERT INTO b24_portal_profiles (
      member_id, portal_domain, app_status, app_title,
      install_auth_id, install_refresh_id, install_auth_expires, install_app_sid,
      install_placement, install_scope, installed_at, uninstalled_at,
      updated_by_user_id, last_install_payload, updated_at
    ) VALUES (
      ${norm(memberId)}, ${domain}, 'installed', ${norm(appTitle)},
      ${norm(authId)}, ${norm(refreshId)}, ${norm(authExpires)}, ${norm(appSid)},
      ${norm(placement)}, ${norm(scope)}, NOW(), NULL,
      ${norm(userId)}, ${safePayload(rawPayload)}, NOW()
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
  `
  return row || null
}

export async function markPortalProfileUninstalled({ memberId, portalDomain, userId, rawPayload }) {
  await ensureDbSchema()
  const sql = getSql()
  const domain = norm(portalDomain)
  const member = norm(memberId)
  if (!domain && !member) throw new Error('memberId or portalDomain is required')
  const rows = member
    ? await sql`UPDATE b24_portal_profiles SET app_status = 'uninstalled', uninstalled_at = NOW(), updated_by_user_id = ${norm(userId)}, last_install_payload = ${safePayload(rawPayload)}, updated_at = NOW() WHERE member_id = ${member} RETURNING *`
    : await sql`UPDATE b24_portal_profiles SET app_status = 'uninstalled', uninstalled_at = NOW(), updated_by_user_id = ${norm(userId)}, last_install_payload = ${safePayload(rawPayload)}, updated_at = NOW() WHERE portal_domain = ${domain} RETURNING *`
  return rows[0] || null
}
