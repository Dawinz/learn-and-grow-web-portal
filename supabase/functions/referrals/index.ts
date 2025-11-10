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

    // Validate user token
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

    if (req.method === 'GET') {
      // Get user's referral code
      const { data: referralCode, error: codeError } = await serviceClient
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id)
        .single()

      // Get referral statistics
      const { data: referrals, error: referralsError } = await serviceClient
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError)
        throw referralsError
      }

      // Calculate stats
      const stats = {
        total_referrals: referrals?.length || 0,
        pending_referrals: referrals?.filter((r: any) => r.status === 'pending').length || 0,
        qualified_referrals: referrals?.filter((r: any) => r.status === 'qualified').length || 0,
        rewarded_referrals: referrals?.filter((r: any) => r.status === 'rewarded').length || 0,
        total_rewards_earned: (referrals?.filter((r: any) => r.status === 'rewarded').length || 0) * 1000, // 1000 XP per reward
      }

      return new Response(
        JSON.stringify({
          referral_code: referralCode?.code || null,
          stats,
          referrals: referrals || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'method_not_allowed', message: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in /referrals:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

