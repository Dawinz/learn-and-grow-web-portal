import { createServiceClient } from './supabase.ts'

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxCount: number,
  windowHours: number = 1
): Promise<boolean> {
  const supabase = createServiceClient()

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: identifier,
    p_endpoint: endpoint,
    p_max_count: maxCount,
    p_window_hours: windowHours,
  })

  if (error) {
    console.error('Rate limit check error:', error)
    return false
  }

  return data === true
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

