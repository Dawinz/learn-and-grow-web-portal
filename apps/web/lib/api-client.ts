import { ApiClient } from './api-client-core'
import { createClient } from './supabase/client'

export function getApiClient(): ApiClient {
  return new ApiClient(async () => {
    const supabase = createClient()
    
    // Try to get session, with a retry if needed
    let session = null
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      if (currentSession?.access_token) {
        session = currentSession
        break
      }
      if (attempt === 0) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    // Return auth header only if session exists
    // Some endpoints (like sendOtp) don't require authentication
    if (session?.access_token) {
      return {
        Authorization: `Bearer ${session.access_token}`,
      } as HeadersInit
    }
    
    // Return empty headers for unauthenticated requests
    return {} as HeadersInit
  })
}

