import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'method_not_allowed', message: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { user_id, referral_code } = await req.json()

    if (!user_id || !referral_code) {
      return new Response(
        JSON.stringify({
          error: 'invalid_request',
          message: 'user_id and referral_code are required',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceClient = createServiceClient()

    // Validate referral code and get referrer
    const { data: referralCodeData, error: codeError } = await serviceClient
      .from('referral_codes')
      .select('user_id')
      .eq('code', referral_code.toUpperCase())
      .single()

    if (codeError || !referralCodeData) {
      return new Response(
        JSON.stringify({
          error: 'invalid_referral_code',
          message: 'Invalid referral code',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const referrerId = referralCodeData.user_id

    // Check if user is trying to refer themselves
    if (referrerId === user_id) {
      return new Response(
        JSON.stringify({
          error: 'invalid_referral',
          message: 'You cannot use your own referral code',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user was already referred
    const { data: existingReferral, error: checkError } = await serviceClient
      .from('referrals')
      .select('id')
      .eq('referred_id', user_id)
      .single()

    if (existingReferral) {
      return new Response(
        JSON.stringify({
          error: 'already_referred',
          message: 'You have already been referred',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create referral record
    const { data: referral, error: insertError } = await serviceClient
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: user_id,
        referral_code: referral_code.toUpperCase(),
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating referral:', insertError)
      throw insertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Referral recorded successfully',
        referral,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in /referral-signup:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

