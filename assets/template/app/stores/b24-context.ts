import { defineStore } from 'pinia'

interface B24ContextState {
  ready: boolean
  isBitrixFrame: boolean
  portalDomain: string
  memberId: string
  userId: string
  authId: string
  error: string | null
}

function normalizeDomain(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return ''
  return raw.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
}

function getQueryValue(searchParams: URLSearchParams, ...keys: string[]) {
  for (const key of keys) {
    const value = searchParams.get(key)
    if (value) return value
  }
  return ''
}

async function tryReadFromBitrixSdk(): Promise<Partial<B24ContextState>> {
  if (typeof window === 'undefined') return {}
  try {
    const { initializeB24Frame } = await import('@bitrix24/b24jssdk')
    const frame = await initializeB24Frame()
    const auth = frame?.auth?.getAuthData?.() || (await frame?.getAuth?.()) || frame?.auth || {}
    return {
      isBitrixFrame: true,
      portalDomain: normalizeDomain((auth as any)?.domain || (auth as any)?.DOMAIN || ''),
      memberId: String((auth as any)?.member_id || (auth as any)?.MEMBER_ID || ''),
      userId: String((auth as any)?.user_id || (auth as any)?.USER_ID || ''),
      authId: String((auth as any)?.access_token || (auth as any)?.AUTH_ID || '')
    }
  } catch {
    return {}
  }
}

async function tryReadFromBx24Global(): Promise<Partial<B24ContextState>> {
  if (typeof window === 'undefined' || typeof (window as any).BX24 === 'undefined') return {}
  try {
    const BX24 = (window as any).BX24
    if (typeof BX24.init === 'function') {
      await new Promise<void>((resolve) => {
        let done = false
        const finish = () => {
          if (done) return
          done = true
          resolve()
        }
        try {
          BX24.init(finish)
          setTimeout(finish, 500)
        } catch {
          finish()
        }
      })
    }
    const auth = typeof BX24.getAuth === 'function' ? BX24.getAuth() : null
    const domain = typeof BX24.getDomain === 'function' ? BX24.getDomain() : ''
    return {
      isBitrixFrame: true,
      portalDomain: normalizeDomain(domain || auth?.domain || auth?.DOMAIN || ''),
      memberId: String(auth?.member_id || auth?.MEMBER_ID || ''),
      userId: String(auth?.user_id || auth?.USER_ID || ''),
      authId: String(auth?.access_token || auth?.AUTH_ID || '')
    }
  } catch {
    return {}
  }
}

export const useB24ContextStore = defineStore('b24-context', () => {
  const state = ref<B24ContextState>({
    ready: false,
    isBitrixFrame: false,
    portalDomain: '',
    memberId: '',
    userId: '',
    authId: '',
    error: null
  })
  let initPromise: Promise<void> | null = null

  const headers = computed<Record<string, string>>(() => ({
    ...(state.value.portalDomain ? { 'x-b24-domain': state.value.portalDomain } : {}),
    ...(state.value.memberId ? { 'x-b24-member-id': state.value.memberId } : {}),
    ...(state.value.userId ? { 'x-b24-user-id': state.value.userId } : {}),
    ...(state.value.authId ? { 'x-b24-auth-id': state.value.authId } : {})
  }))

  function mergeContext(patch: Partial<B24ContextState>) {
    Object.assign(state.value, {
      isBitrixFrame: patch.isBitrixFrame ?? state.value.isBitrixFrame,
      portalDomain: normalizeDomain(patch.portalDomain || state.value.portalDomain),
      memberId: String(patch.memberId || state.value.memberId || ''),
      userId: String(patch.userId || state.value.userId || ''),
      authId: String(patch.authId || state.value.authId || '')
    })
  }

  async function initialize() {
    if (state.value.ready && state.value.portalDomain) return
    if (initPromise) return initPromise
    initPromise = (async () => {
      try {
        if (typeof window === 'undefined') return
        const url = new URL(window.location.href)
        mergeContext({
          portalDomain: normalizeDomain(getQueryValue(url.searchParams, 'DOMAIN', 'domain', 'SERVER_NAME', 'server_name')),
          memberId: getQueryValue(url.searchParams, 'member_id', 'MEMBER_ID'),
          userId: getQueryValue(url.searchParams, 'user_id', 'USER_ID'),
          authId: getQueryValue(url.searchParams, 'AUTH_ID', 'auth_id'),
          isBitrixFrame: Boolean(getQueryValue(url.searchParams, 'b24_iframe')) || window.self !== window.top
        })
        mergeContext(await tryReadFromBitrixSdk())
        if (!state.value.portalDomain || !state.value.authId) {
          mergeContext(await tryReadFromBx24Global())
        }
        state.value.error = null
      } catch (e: any) {
        state.value.error = e?.message || 'Failed to initialize Bitrix24 context'
      } finally {
        state.value.ready = true
        initPromise = null
      }
    })()
    return initPromise
  }

  return {
    state: readonly(state),
    ready: computed(() => state.value.ready),
    portalDomain: computed(() => state.value.portalDomain),
    memberId: computed(() => state.value.memberId),
    authId: computed(() => state.value.authId),
    headers: readonly(headers),
    initialize
  }
})
