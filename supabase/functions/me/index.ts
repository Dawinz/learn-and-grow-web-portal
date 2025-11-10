import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateUserToken, createServiceClient } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'auth_required',
          message: 'Authentication required',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate user token using Supabase Auth API
    const { user, error: userError } = await validateUserToken(authHeader)

    if (userError || !user) {
      console.error('Token validation failed:', userError)
      return new Response(
        JSON.stringify({
          error: 'auth_required',
          message: 'Invalid or expired token',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceClient = createServiceClient()

    // Get user profile
    const { data: profile, error: profileError } = await serviceClient
      .from('users_public')
      .select('*')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, create it (fallback if trigger didn't run)
    if (profileError || !profile) {
      console.warn('users_public record not found, creating it...', { userId: user.id, error: profileError })
      
      // Create profile without phone (phone is now optional)
      const { data: newProfile, error: createError } = await serviceClient
        .from('users_public')
        .insert({
          id: user.id,
          phone: null, // Phone is optional now
          email: user.email || null,
          kyc_level: 'none',
          status: 'active',
        })
        .select()
        .single()

      if (createError) {
        console.error('Failed to create users_public record:', createError)
        throw createError
      }

      // Use the newly created profile
      const profileToUse = newProfile
      
      // Get XP balance
      const { data: balanceData, error: balanceError } = await serviceClient
        .from('user_xp_balance')
        .select('xp')
        .eq('user_id', user.id)
        .single()

      const xpBalance = balanceData?.xp || 0

      return new Response(
        JSON.stringify({
          profile: {
            id: profileToUse.id,
            phone: profileToUse.phone,
            email: profileToUse.email,
            kyc_level: profileToUse.kyc_level,
            status: profileToUse.status,
          },
          xp_balance: xpBalance,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get XP balance
    const { data: balanceData, error: balanceError } = await serviceClient
      .from('user_xp_balance')
      .select('xp')
      .eq('user_id', user.id)
      .single()

    const xpBalance = balanceData?.xp || 0

    // Get referral code
    const { data: referralCode } = await serviceClient
      .from('referral_codes')
      .select('code')
      .eq('user_id', user.id)
      .single()

    return new Response(
      JSON.stringify({
        profile: {
          id: profile.id,
          phone: profile.phone,
          email: profile.email,
          kyc_level: profile.kyc_level,
          status: profile.status,
        },
        xp_balance: xpBalance,
        referral_code: referralCode?.code || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in /me:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

