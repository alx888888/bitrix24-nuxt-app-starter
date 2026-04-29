import type { B24Frame } from '@bitrix24/b24jssdk'

declare module '#app' {
  interface NuxtApp {
    $initializeB24Frame?: () => Promise<B24Frame>
  }
}

export {}
