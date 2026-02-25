import { getQuery, getRequestHeaders } from 'h3'
import { getB24ContextFromHeadersAndQuery } from '~~/shared/server-core/b24-context.js'
import { checkDbHealth } from '~~/shared/server-core/db.js'
import { resolvePortalProfileByContext } from '~~/shared/server-core/portal-profile.js'
import { callAppInfo, placementGet } from '~~/shared/server-core/bitrix-rest.js'

const PLACEMENT_PRESET = '{{PLACEMENT_PRESET}}'
const PLACEMENTS = {{PLACEMENTS_JSON}}

export default defineEventHandler(async (event) => {
  const ctx = getB24ContextFromHeadersAndQuery(getRequestHeaders(event), getQuery(event))
  const components: any = {
    backend: { ok: true },
    database: { ok: false, reason: 'Не проверено' },
    portalProfile: { ok: false, exists: false, hasInstallAuthId: false },
    installer: {
      ok: true,
      installEndpointReachable: true,
      handlerConfigured: true,
      placementPreset: PLACEMENT_PRESET
    },
    bitrixRest: { ok: false, method: 'app.info', reason: 'Нет достаточного контекста' },
    placements: {
      ok: PLACEMENT_PRESET === 'none',
      checked: false,
      items: [] as Array<{ placement: string; bound: boolean }>,
      reason: PLACEMENT_PRESET === 'none' ? 'Preset none: проверка placements не требуется' : 'Нет authId для проверки'
    }
  }

  let profile: any = null
  try {
    await checkDbHealth()
    components.database = { ok: true }
  } catch (e: any) {
    components.database = { ok: false, reason: e?.message || 'DB check failed' }
  }

  if (components.database.ok && (ctx.portalDomain || ctx.memberId || ctx.authId)) {
    try {
      profile = await resolvePortalProfileByContext(ctx)
      components.portalProfile = {
        ok: true,
        exists: Boolean(profile),
        appStatus: profile?.app_status || null,
        hasInstallAuthId: Boolean(profile?.install_auth_id)
      }
    } catch (e: any) {
      components.portalProfile = { ok: false, exists: false, hasInstallAuthId: false, reason: e?.message || 'Profile resolve failed' }
    }
  }

  const restDomain = ctx.portalDomain || profile?.portal_domain || ''
  const restAuthId = ctx.authId || profile?.install_auth_id || ''
  if (restDomain && restAuthId) {
    try {
      const appInfo = await callAppInfo({ domain: restDomain, authId: restAuthId })
      if (appInfo.ok) {
        components.bitrixRest = { ok: true, method: 'app.info', appInfo: appInfo.data?.result || {} }
      } else {
        components.bitrixRest = { ok: false, method: 'app.info', reason: appInfo.data?.error_description || appInfo.data?.error || `HTTP ${appInfo.status}` }
      }
    } catch (e: any) {
      components.bitrixRest = { ok: false, method: 'app.info', reason: e?.message || 'REST check failed' }
    }
  }

  if (PLACEMENT_PRESET !== 'none' && restDomain && restAuthId) {
    const items = []
    let allOk = true
    for (const placement of PLACEMENTS) {
      try {
        const res = await placementGet({ domain: restDomain, authId: restAuthId, placement })
        const bound = Boolean(res.ok && (res.data?.result === true || res.data?.result || res.data))
        items.push({ placement, bound })
        if (!res.ok) allOk = false
      } catch {
        items.push({ placement, bound: false })
        allOk = false
      }
    }
    components.placements = {
      ok: allOk,
      checked: true,
      items,
      reason: allOk ? '' : 'Часть placement-проверок завершилась с ошибкой'
    }
  }

  return {
    ok: Boolean(components.backend.ok && components.installer.ok),
    timestamp: new Date().toISOString(),
    portal: {
      portalDomain: ctx.portalDomain || profile?.portal_domain || '',
      memberId: ctx.memberId || profile?.member_id || '',
      hasContext: Boolean(ctx.portalDomain || ctx.memberId || ctx.authId)
    },
    components
  }
})
