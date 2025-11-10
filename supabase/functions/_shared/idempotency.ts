import { createServiceClient } from './supabase.ts'

export async function checkIdempotency(
  key: string,
  userId: string
): Promise<{ exists: boolean; response?: any }> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('idempotency_keys')
    .select('response_body')
    .eq('key', key)
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) {
    return { exists: false }
  }

  return { exists: true, response: data.response_body }
}

export async function storeIdempotency(
  key: string,
  userId: string,
  response: any,
  ttlHours: number = 24
): Promise<void> {
  const supabase = createServiceClient()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + ttlHours)

  await supabase.from('idempotency_keys').insert({
    key,
    user_id: userId,
    response_body: response,
    expires_at: expiresAt.toISOString(),
  })
}

