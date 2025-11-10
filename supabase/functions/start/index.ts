import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSupabaseClient, createServiceClient } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { checkRateLimit, getClientIP } from '../_shared/rate-limit.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const ip = getClientIP(req)

    // Rate limit: 20 requests per hour per IP
    const rateLimitOk = await checkRateLimit(ip, '/start', 20, 1)
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({
          error: 'rate_limited',
          message: 'Too many requests. Please try again later.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { phone, email } = await req.json()

    if (!phone || typeof phone !== 'string') {
      return new Response(
        JSON.stringify({ error: 'invalid_request', message: 'Phone is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate E.164 format
    if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
      return new Response(
        JSON.stringify({
          error: 'invalid_phone',
          message: 'Phone must be in E.164 format',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    const supabase = createServiceClient()

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users_public')
      .select('id, email')
      .eq('phone', phone)
      .single()

    if (existingUser) {
      // User exists
      if (existingUser.email) {
        return new Response(
          JSON.stringify({
            email_hint: existingUser.email.replace(
              /(.)(.*)(@)/,
              (_, first, middle, at) => `${first}${'*'.repeat(middle.length)}${at}`
            ),
            requires_email: false,
            user_id: existingUser.id,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // User exists but no email - require email
        if (!email) {
          return new Response(
            JSON.stringify({
              requires_email: true,
              user_id: existingUser.id,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update user with email
        const { error: updateError } = await supabase
          .from('users_public')
          .update({ email })
          .eq('id', existingUser.id)

        if (updateError) {
          throw updateError
        }

        return new Response(
          JSON.stringify({
            requires_email: false,
            user_id: existingUser.id,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // New user - require email
      if (!email) {
        return new Response(
          JSON.stringify({
            requires_email: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create auth user first (this would typically be done via Supabase Auth)
      // For now, we'll create the user_public record and let them sign up via magic link
      // The actual user creation should happen when they confirm their email
      return new Response(
        JSON.stringify({
          requires_email: true,
          message: 'Please sign up with email to create account',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error in /start:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

