import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateUserToken, createServiceClient } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { checkIdempotency, storeIdempotency } from '../_shared/idempotency.ts'
import { checkRateLimit, getClientIP } from '../_shared/rate-limit.ts'

const MAX_EVENTS_PER_MINUTE = 100
const MAX_XP_PER_DAY = 10000
const XP_NONCE_TTL_HOURS = 24

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
      return new Response(
        JSON.stringify({
          error: 'auth_required',
          message: 'Invalid or expired token',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
    const existingResponse = await checkIdempotency(idempotencyKey, user.id)
    if (existingResponse.exists && existingResponse.response) {
      return new Response(JSON.stringify(existingResponse.response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { events } = await req.json()

    if (!Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'invalid_request',
          message: 'events array is required and must not be empty',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (events.length > 100) {
      return new Response(
        JSON.stringify({
          error: 'invalid_request',
          message: 'Maximum 100 events per request',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceClient = createServiceClient()
    const ip = getClientIP(req)

    // Rate limit: 100 events/minute per device/user
    const rateLimitOk = await checkRateLimit(`${user.id}:${ip}`, '/xp/credit', MAX_EVENTS_PER_MINUTE, 1 / 60)
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({
          error: 'rate_limited',
          message: 'Too many events. Please slow down.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check daily XP cap
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data: todayXp } = await serviceClient
      .from('xp_ledger')
      .select('xp_delta')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())

    const todayTotalXp = (todayXp || []).reduce((sum, entry) => sum + entry.xp_delta, 0)

    // Check if user device is emulator/rooted (reduce cap by 50%)
    const { data: device } = await serviceClient
      .from('devices')
      .select('is_emulator, is_rooted')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    const isRestricted = device?.is_emulator || device?.is_rooted
    const dailyCap = isRestricted ? MAX_XP_PER_DAY * 0.5 : MAX_XP_PER_DAY

    const requestedXp = events.reduce((sum, event) => sum + (event.xp_delta || 0), 0)

    if (todayTotalXp + requestedXp > dailyCap) {
      return new Response(
        JSON.stringify({
          error: 'rate_limited',
          message: `Daily XP cap exceeded. Limit: ${dailyCap} XP/day${isRestricted ? ' (reduced for restricted device)' : ''}`,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process events
    const processedEvents: any[] = []
    let creditedCount = 0
    let duplicatesCount = 0
    let totalXpCredited = 0

    for (const event of events) {
      const { nonce, source, xp_delta, metadata } = event

      if (!nonce || typeof nonce !== 'string') {
        processedEvents.push({
          nonce: null,
          status: 'error',
          error: 'nonce is required',
        })
        continue
      }

      if (typeof xp_delta !== 'number' || xp_delta <= 0) {
        processedEvents.push({
          nonce,
          status: 'error',
          error: 'xp_delta must be a positive number',
        })
        continue
      }

      // Check if nonce already exists (deduplication)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + XP_NONCE_TTL_HOURS)

      const { data: existingNonce } = await serviceClient
        .from('xp_event_nonces')
        .select('nonce')
        .eq('nonce', nonce)
        .eq('user_id', user.id)
        .single()

      if (existingNonce) {
        processedEvents.push({
          nonce,
          status: 'duplicate',
          xp_delta: 0,
        })
        duplicatesCount++
        continue
      }

      // Insert nonce
      await serviceClient.from('xp_event_nonces').insert({
        nonce,
        user_id: user.id,
        source: source || 'unknown',
        xp_delta,
        expires_at: expiresAt.toISOString(),
      })

      // Insert XP ledger entry
      const { error: ledgerError } = await serviceClient.from('xp_ledger').insert({
        user_id: user.id,
        source: source || 'unknown',
        xp_delta,
        metadata: metadata || {},
      })

      if (ledgerError) {
        processedEvents.push({
          nonce,
          status: 'error',
          error: ledgerError.message,
        })
        continue
      }

      processedEvents.push({
        nonce,
        status: 'credited',
        xp_delta,
      })
      creditedCount++
      totalXpCredited += xp_delta
    }

    // Get updated XP balance
    const { data: balanceData } = await serviceClient
      .from('user_xp_balance')
      .select('xp')
      .eq('user_id', user.id)
      .single()

    const response = {
      credited: creditedCount,
      duplicates: duplicatesCount,
      total_xp: balanceData?.xp || 0,
      events: processedEvents,
    }

    // Store idempotency
    await storeIdempotency(idempotencyKey, user.id, response)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in /xp/credit:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

