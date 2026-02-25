export function toPortalSettingsProfileResponse(profile, fallbackCtx = {}) {
  if (!profile) {
    return {
      portalDomain: fallbackCtx.portalDomain || '',
      memberId: fallbackCtx.memberId || '',
      appStatus: 'installed',
      install: {
        hasAuthId: Boolean(fallbackCtx.authId),
        installedAt: null,
        uninstalledAt: null,
        scope: '',
        placement: ''
      },
      meta: {
        lastAppOpenedAt: null,
        updatedAt: null
      }
    }
  }
  return {
    portalDomain: profile.portal_domain,
    memberId: profile.member_id || '',
    appStatus: profile.app_status || 'installed',
    install: {
      hasAuthId: Boolean(profile.install_auth_id),
      installedAt: profile.installed_at || null,
      uninstalledAt: profile.uninstalled_at || null,
      scope: profile.install_scope || '',
      placement: profile.install_placement || ''
    },
    meta: {
      lastAppOpenedAt: profile.last_app_opened_at || null,
      updatedAt: profile.updated_at || null
    }
  }
}
