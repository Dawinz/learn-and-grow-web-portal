import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { checkRateLimit, getClientIP } from '../_shared/rate-limit.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const ip = getClientIP(req)
    
    // Rate limit: 10 requests/hour per IP
    const rateLimitOk = await checkRateLimit(ip, '/auth/device/start', 10, 1)
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({
          error: 'rate_limited',
          message: 'Too many requests. Please try again later.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { device_id, device_fingerprint, installer_id, device_metadata } = await req.json()

    if (!device_fingerprint || typeof device_fingerprint !== 'string') {
      return new Response(
        JSON.stringify({ error: 'invalid_request', message: 'device_fingerprint is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceClient = createServiceClient()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    let userId: string | null = null
    let isNewUser = false
    let deviceId: string | null = device_id || null

    // If device_id provided, try to restore session
    if (deviceId) {
      const { data: device } = await serviceClient
        .from('devices')
        .select('user_id')
        .eq('id', deviceId)
        .single()

      if (device) {
        userId = device.user_id
      }
    }

    // If no user found, check by device fingerprint
    if (!userId) {
      const { data: device } = await serviceClient
        .from('devices')
        .select('user_id, id')
        .eq('device_fingerprint', device_fingerprint)
        .single()

      if (device) {
        userId = device.user_id
        deviceId = device.id
      }
    }

    // If still no user, create new anonymous user
    if (!userId) {
      // Create anonymous user via Supabase Auth
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
        },
        body: JSON.stringify({
          email: `device_${device_fingerprint.substring(0, 8)}@anonymous.local`,
          email_confirm: true,
          user_metadata: {
            device_fingerprint,
            installer_id,
            is_anonymous: true,
          },
        }),
      })

      if (!authResponse.ok) {
        const errorData = await authResponse.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create anonymous user')
      }

      const authData = await authResponse.json()
      userId = authData.id
      isNewUser = true

      // Create user_public record
      await serviceClient.from('users_public').insert({
        id: userId,
        phone: null,
        email: null,
        kyc_level: 'none',
        status: 'active',
      }).catch(() => {
        // Ignore if already exists
      })
    }

    // Register/update device
    const deviceData: any = {
      user_id: userId,
      device_fingerprint,
      platform: device_metadata?.platform || null,
      os_version: device_metadata?.os_version || null,
      app_version: device_metadata?.app_version || null,
      is_emulator: device_metadata?.is_emulator || false,
      is_rooted: device_metadata?.is_rooted || false,
      is_debug: device_metadata?.is_debug || false,
    }

    if (deviceId) {
      await serviceClient
        .from('devices')
        .update(deviceData)
        .eq('id', deviceId)
    } else {
      const { data: newDevice } = await serviceClient
        .from('devices')
        .insert(deviceData)
        .select('id')
        .single()
      deviceId = newDevice?.id || null
    }

    // Generate session token for the user
    const sessionResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
      },
      body: JSON.stringify({
        email: `device_${device_fingerprint.substring(0, 8)}@anonymous.local`,
        password: device_fingerprint, // Use fingerprint as password for anonymous users
      }),
    })

    // If password auth fails, use admin API to generate token
    let session: any = null
    if (!sessionResponse.ok) {
      const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link?type=magiclink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
        },
        body: JSON.stringify({
          email: `device_${device_fingerprint.substring(0, 8)}@anonymous.local`,
        }),
      })

      // For anonymous users, create a custom token
      const customTokenResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
        },
        body: JSON.stringify({
          expires_in: 3600 * 24 * 30, // 30 days
        }),
      })

      if (customTokenResponse.ok) {
        const tokenData = await customTokenResponse.json()
        session = {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || '',
          expires_at: new Date(Date.now() + 3600 * 24 * 30 * 1000).toISOString(),
        }
      }
    } else {
      const sessionData = await sessionResponse.json()
      session = {
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        expires_at: new Date(Date.now() + (sessionData.expires_in || 3600) * 1000).toISOString(),
      }
    }

    if (!session) {
      throw new Error('Failed to create session')
    }

    return new Response(
      JSON.stringify({
        session,
        user_id: userId,
        is_new_user: isNewUser,
        device_id: deviceId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in /auth/device/start:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

