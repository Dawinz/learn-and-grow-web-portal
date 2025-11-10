import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { checkRateLimit, getClientIP } from '../_shared/rate-limit.ts'
import { getSupabaseAnonKey } from '../_shared/supabase.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const ip = getClientIP(req)
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'invalid_email', message: 'Valid email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limit: 5 per hour per email, 20 per day per IP
    const emailRateLimitOk = await checkRateLimit(email, '/auth-otp', 5, 1)
    const ipRateLimitOk = await checkRateLimit(ip, '/auth-otp', 20, 24)

    if (!emailRateLimitOk) {
      return new Response(
        JSON.stringify({
          error: 'rate_limited',
          message: 'Too many requests for this email. Please try again later.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!ipRateLimitOk) {
      return new Response(
        JSON.stringify({
          error: 'rate_limited',
          message: 'Too many requests from this IP. Please try again later.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const anonKey = getSupabaseAnonKey()

    // Use Supabase Auth REST API to send OTP (6-digit code)
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
      },
      body: JSON.stringify({
        email,
        type: 'email', // This sends a 6-digit OTP code
      }),
    })

    if (!authResponse.ok) {
      const errorData = await authResponse.json().catch(() => ({}))
      console.error('Supabase Auth API error:', {
        status: authResponse.status,
        statusText: authResponse.statusText,
        error: errorData,
      })
      throw new Error(errorData.message || errorData.error_description || 'Failed to send OTP')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code sent to your email',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in /auth-otp:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message || 'Failed to send OTP',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

