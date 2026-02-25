export interface SystemStatusResponse {
  ok: boolean
  timestamp: string
  portal: {
    portalDomain: string
    memberId: string
    hasContext: boolean
  }
  components: Record<string, any>
}
