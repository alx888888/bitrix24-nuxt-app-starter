import type { B24Context } from './context'
import type { PlatformProfileRow } from './profile'

export interface PlatformCapabilityRegistrationContext {
  context: B24Context
  eventName: string
  appBaseUrl: string
  appHandlerUrl: string
  profile: PlatformProfileRow | null
}

export interface PlatformCapabilityRegistrationResult {
  code: string
  ok: boolean
  action: 'registered' | 'updated' | 'removed' | 'skipped' | 'noop'
  error: string | null
}

export type PlatformCapabilityRegistration = (
  context: PlatformCapabilityRegistrationContext
) => Promise<PlatformCapabilityRegistrationResult>

const registrations: PlatformCapabilityRegistration[] = []

export function registerPlatformCapability(registration: PlatformCapabilityRegistration) {
  registrations.push(registration)
}

export async function runPlatformCapabilityRegistrations(context: PlatformCapabilityRegistrationContext) {
  const results: PlatformCapabilityRegistrationResult[] = []

  for (const registration of registrations) {
    try {
      results.push(await registration(context))
    } catch (error: unknown) {
      results.push({
        code: 'unknown',
        ok: false,
        action: 'skipped',
        error: error instanceof Error && error.message ? error.message : 'Capability registration error'
      })
    }
  }

  return results
}
