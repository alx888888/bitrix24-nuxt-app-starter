import type { B24Frame } from '@bitrix24/b24jssdk'
import type { LegacyBx24Api } from './sdk-types'

export interface PlatformFrameState {
  ready: boolean
  isBitrixFrame: boolean
  isInstallMode: boolean
  isFirstRun: boolean
  portalDomain: string
  memberId: string
  userId: string
  authId: string
  error: string | null
}

export function createEmptyPlatformFrameState(): PlatformFrameState {
  return {
    ready: false,
    isBitrixFrame: false,
    isInstallMode: false,
    isFirstRun: false,
    portalDomain: '',
    memberId: '',
    userId: '',
    authId: '',
    error: null
  }
}

export function normalizePlatformDomain(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return ''
  return raw.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
}

export function pickQueryValue(searchParams: URLSearchParams, ...keys: string[]) {
  for (const key of keys) {
    const value = searchParams.get(key)
    if (value) return value
  }
  return ''
}

export function readPlatformFrameQueryContext(url: URL): Partial<PlatformFrameState> {
  return {
    portalDomain: normalizePlatformDomain(
      pickQueryValue(url.searchParams, 'DOMAIN', 'domain', 'SERVER_NAME', 'server_name')
    ),
    memberId: pickQueryValue(url.searchParams, 'member_id', 'MEMBER_ID'),
    userId: pickQueryValue(url.searchParams, 'user_id', 'USER_ID'),
    authId: pickQueryValue(url.searchParams, 'AUTH_ID', 'auth_id'),
    isBitrixFrame:
      Boolean(pickQueryValue(url.searchParams, 'b24_iframe')) ||
      (typeof window !== 'undefined' ? window.self !== window.top : false)
  }
}

export function mergePlatformFrameState(
  current: PlatformFrameState,
  patch: Partial<PlatformFrameState>
): PlatformFrameState {
  return {
    ...current,
    isBitrixFrame: patch.isBitrixFrame ?? current.isBitrixFrame,
    isInstallMode: patch.isInstallMode ?? current.isInstallMode,
    isFirstRun: patch.isFirstRun ?? current.isFirstRun,
    portalDomain: normalizePlatformDomain(patch.portalDomain ?? current.portalDomain),
    memberId: String(patch.memberId ?? current.memberId ?? ''),
    userId: String(patch.userId ?? current.userId ?? ''),
    authId: String(patch.authId ?? current.authId ?? ''),
    error: patch.error ?? current.error
  }
}

async function initializeNuxtB24Frame(): Promise<B24Frame | null> {
  if (typeof window === 'undefined') return null

  const nuxtApp = useNuxtApp()
  if (typeof nuxtApp.$initializeB24Frame !== 'function') return null

  return nuxtApp.$initializeB24Frame()
}

async function readContextFromNuxtSdk(): Promise<Partial<PlatformFrameState>> {
  if (typeof window === 'undefined') return {}

  try {
    const frame = await initializeNuxtB24Frame()
    if (!frame) return {}
    const auth = frame?.auth?.getAuthData?.()

    return {
      isBitrixFrame: true,
      isInstallMode: Boolean(frame.isInstallMode),
      isFirstRun: Boolean(frame.isFirstRun),
      portalDomain: normalizePlatformDomain(auth && typeof auth === 'object' ? auth.domain || '' : ''),
      memberId: String(auth && typeof auth === 'object' ? auth.member_id || '' : ''),
      userId: '',
      authId: String(auth && typeof auth === 'object' ? auth.access_token || '' : '')
    }
  } catch {
    return {}
  }
}

async function readContextFromLegacyBx24(): Promise<Partial<PlatformFrameState>> {
  if (typeof window === 'undefined') return {}
  const globalWindow = window as typeof window & { BX24?: LegacyBx24Api }
  if (!globalWindow.BX24) return {}

  try {
    const BX24 = globalWindow.BX24

    if (typeof BX24.init === 'function') {
      const init = BX24.init
      await new Promise<void>((resolve) => {
        let resolved = false
        const finish = () => {
          if (resolved) return
          resolved = true
          resolve()
        }

        try {
          init(finish)
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
      portalDomain: normalizePlatformDomain(domain || auth?.domain || auth?.DOMAIN || ''),
      memberId: String(auth?.member_id || auth?.MEMBER_ID || ''),
      userId: String(auth?.user_id || auth?.USER_ID || ''),
      authId: String(auth?.access_token || auth?.AUTH_ID || '')
    }
  } catch {
    return {}
  }
}

let initializationPromise: Promise<Partial<PlatformFrameState>> | null = null

export async function resolvePlatformFrameContext(): Promise<Partial<PlatformFrameState>> {
  if (typeof window === 'undefined') return {}
  if (initializationPromise) return initializationPromise

  initializationPromise = (async () => {
    const initial = readPlatformFrameQueryContext(new URL(window.location.href))
    const sdk = await readContextFromNuxtSdk()
    const legacy = !sdk.portalDomain || !sdk.authId ? await readContextFromLegacyBx24() : {}

    return mergePlatformFrameState(
      mergePlatformFrameState(createEmptyPlatformFrameState(), initial),
      {
        ...sdk,
        ...legacy
      }
    )
  })().finally(() => {
    initializationPromise = null
  })

  return initializationPromise
}

export async function finishPlatformInstallIfNeeded(): Promise<{ supported: boolean; triggered: boolean }> {
  const frame = await initializeNuxtB24Frame()
  if (!frame) {
    return {
      supported: false,
      triggered: false
    }
  }

  if (!frame.isInstallMode) {
    return {
      supported: true,
      triggered: false
    }
  }

  await frame.installFinish()

  return {
    supported: true,
    triggered: true
  }
}
