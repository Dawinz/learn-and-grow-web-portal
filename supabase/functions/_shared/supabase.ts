import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export async function validateUserToken(authHeader: string): Promise<{ user: any; error: any }> {
  // Validate user token by calling Supabase Auth API directly
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  
  // Extract token from "Bearer <token>"
  const token = authHeader.replace('Bearer ', '')
  
  // Call Supabase Auth API to get user
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'apikey': anonKey,
    },
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    return { user: null, error: errorData }
  }
  
  const userData = await response.json()
  return { user: userData, error: null }
}

export function createSupabaseClient(authHeader: string) {
  // Use built-in Supabase environment variables (automatically provided)
  // For Edge Functions, we use SERVICE_ROLE_KEY for database operations
  // but validate user tokens separately using validateUserToken()
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  })
}

export function createServiceClient() {
  // Use built-in Supabase environment variables (automatically provided)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  return createClient(supabaseUrl, supabaseKey)
}

export function getSupabaseAnonKey() {
  // Use built-in Supabase environment variable (automatically provided)
  return Deno.env.get('SUPABASE_ANON_KEY') || ''
}
