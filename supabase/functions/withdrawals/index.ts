import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateUserToken, createServiceClient } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { checkIdempotency, storeIdempotency } from '../_shared/idempotency.ts'
import { sendWithdrawalConfirmationEmail } from '../_shared/email.ts'
const MIN_WITHDRAWAL_XP = parseInt(Deno.env.get('MIN_WITHDRAWAL_XP') || '5000')
const WITHDRAWAL_COOLDOWN_DAYS = parseInt(
  Deno.env.get('WITHDRAWAL_COOLDOWN_DAYS') || '7'
)
const MAX_WITHDRAWALS_PER_7DAYS = parseInt(
  Deno.env.get('MAX_WITHDRAWALS_PER_7DAYS') || '1'
)

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

    if (req.method === 'GET') {
      // List withdrawals
      const url = new URL(req.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const pageSize = parseInt(url.searchParams.get('page_size') || '20')
      const offset = (page - 1) * pageSize

          const { data: withdrawals, error: withdrawalsError } = await serviceClient
            .from('withdrawals')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1)

          if (withdrawalsError) {
            throw withdrawalsError
          }

          const { count } = await serviceClient
            .from('withdrawals')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

      return new Response(
        JSON.stringify({
          withdrawals: withdrawals || [],
          total: count || 0,
          page,
          page_size: pageSize,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (req.method === 'POST') {
      // Create withdrawal
      const idempotencyKey = req.headers.get('Idempotency-Key')
      if (!idempotencyKey) {
        return new Response(
          JSON.stringify({
            error: 'idempotency_key_required',
            message: 'Idempotency-Key header is required',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

          // Check idempotency
          const idempotencyCheck = await checkIdempotency(idempotencyKey, user.id)
      if (idempotencyCheck.exists) {
        return new Response(
          JSON.stringify(idempotencyCheck.response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { xp_to_convert } = await req.json()

      if (!xp_to_convert || typeof xp_to_convert !== 'number') {
        return new Response(
          JSON.stringify({
            error: 'invalid_request',
            message: 'xp_to_convert is required and must be a number',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }


      // Validate minimum withdrawal
      if (xp_to_convert < MIN_WITHDRAWAL_XP) {
        return new Response(
          JSON.stringify({
            error: 'withdraw_too_small',
            message: `Minimum withdrawal is ${MIN_WITHDRAWAL_XP} XP`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

          // Get user profile and XP balance
          const { data: profile, error: profileError } = await serviceClient
            .from('users_public')
            .select('phone, email')
            .eq('id', user.id)
            .single()

          if (profileError) {
            throw profileError
          }

          const { data: balanceData, error: balanceError } = await serviceClient
            .from('user_xp_balance')
            .select('xp')
            .eq('user_id', user.id)
            .single()

      const xpBalance = balanceData?.xp || 0

      if (xpBalance < xp_to_convert) {
        return new Response(
          JSON.stringify({
            error: 'insufficient_xp',
            message: 'Insufficient XP balance',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

          // Check cooldown
          const { data: recentWithdrawals, error: recentError } = await serviceClient
            .from('withdrawals')
            .select('created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(MAX_WITHDRAWALS_PER_7DAYS)

      if (recentError) {
        throw recentError
      }

      if (recentWithdrawals && recentWithdrawals.length > 0) {
        const lastWithdrawal = recentWithdrawals[0]
        const lastDate = new Date(lastWithdrawal.created_at)
        const cooldownEnd = new Date(lastDate)
        cooldownEnd.setDate(cooldownEnd.getDate() + WITHDRAWAL_COOLDOWN_DAYS)

        if (new Date() < cooldownEnd) {
          return new Response(
            JSON.stringify({
              error: 'withdraw_cooldown',
              message: `Next withdrawal available on ${cooldownEnd.toISOString()}`,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check max withdrawals per 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const withdrawalsIn7Days = recentWithdrawals.filter(
          (w) => new Date(w.created_at) >= sevenDaysAgo
        )

        if (withdrawalsIn7Days.length >= MAX_WITHDRAWALS_PER_7DAYS) {
          return new Response(
            JSON.stringify({
              error: 'withdraw_limit_exceeded',
              message: `Maximum ${MAX_WITHDRAWALS_PER_7DAYS} withdrawal(s) per 7 days`,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Get current conversion rate
      const { data: rateData, error: rateError } = await serviceClient
        .from('conversion_rates')
        .select('tzs_per_xp')
        .order('effective_from', { ascending: false })
        .limit(1)
        .single()

      const tzsPerXp = rateData
        ? parseFloat(rateData.tzs_per_xp)
        : parseFloat(Deno.env.get('TZS_PER_XP') || '0.05')
      const amountTzs = Math.floor(xp_to_convert * tzsPerXp)

          // Create withdrawal and debit XP in a transaction
          const { data: withdrawal, error: withdrawalError } = await serviceClient
            .from('withdrawals')
            .insert({
              user_id: user.id,
              phone_snapshot: profile.phone || profile.email || 'N/A', // Use email if no phone
              xp_debited: xp_to_convert,
              amount_tzs: amountTzs,
              rate_snapshot: tzsPerXp,
              status: 'pending',
            })
            .select()
            .single()

          if (withdrawalError) {
            throw withdrawalError
          }

          // Debit XP
          const { error: ledgerError } = await serviceClient.from('xp_ledger').insert({
            user_id: user.id,
            source: 'withdrawal',
            xp_delta: -xp_to_convert,
            metadata: { withdrawal_id: withdrawal.id },
          })

      if (ledgerError) {
        throw ledgerError
      }

          // Get updated balance
          const { data: newBalanceData, error: newBalanceError } = await serviceClient
            .from('user_xp_balance')
            .select('xp')
            .eq('user_id', user.id)
            .single()

          const newBalance = newBalanceData?.xp || 0

          const response = {
            withdrawal_id: withdrawal.id,
            xp_balance: newBalance,
            amount_tzs: amountTzs,
          }

          // Store idempotency
          await storeIdempotency(idempotencyKey, user.id, response)

          // Send confirmation email (fire and forget - don't block response)
          if (profile.email) {
            sendWithdrawalConfirmationEmail(
              profile.email,
              withdrawal.id,
              xp_to_convert,
              amountTzs,
              tzsPerXp
            ).catch((emailError) => {
              // Don't fail the withdrawal if email fails
              console.error('Failed to send confirmation email:', emailError)
            })
          }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ error: 'method_not_allowed', message: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in /withdrawals:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

