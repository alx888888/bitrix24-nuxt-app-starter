export interface BitrixAuthPayload extends Record<string, unknown> {
  domain?: string
  DOMAIN?: string
  member_id?: string
  MEMBER_ID?: string
  user_id?: string
  USER_ID?: string
  access_token?: string
  AUTH_ID?: string
}

export interface LegacyBx24Api {
  init?: (callback: () => void) => void
  getAuth?: () => BitrixAuthPayload | null
  getDomain?: () => string
}
