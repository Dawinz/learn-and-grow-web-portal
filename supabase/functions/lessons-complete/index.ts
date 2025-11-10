import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateUserToken, createServiceClient } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { checkIdempotency, storeIdempotency } from '../_shared/idempotency.ts'

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

    // Get lesson_id from request body
    const { lesson_id, time_spent_seconds, metadata } = await req.json()

    if (!lesson_id) {
      return new Response(
        JSON.stringify({
          error: 'invalid_request',
          message: 'lesson_id is required in request body',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceClient = createServiceClient()

    // Get lesson details
    const { data: lesson, error: lessonError } = await serviceClient
      .from('lessons')
      .select('id, xp_reward')
      .eq('id', lesson_id)
      .single()

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({
          error: 'not_found',
          message: 'Lesson not found',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already completed
    const { data: existingProgress } = await serviceClient
      .from('lesson_progress')
      .select('is_completed, completed_at')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson_id)
      .single()
    const now = new Date().toISOString()

    // Update or create progress record
    const progressData: any = {
      user_id: user.id,
      lesson_id: lesson_id,
      progress_percent: 100,
      time_spent_seconds: time_spent_seconds || 0,
      is_completed: true,
      completed_at: now,
      metadata: metadata || {},
      updated_at: now,
    }

    const { data: progress, error: progressError } = await serviceClient
      .from('lesson_progress')
      .upsert(progressData, {
        onConflict: 'user_id,lesson_id',
      })
      .select()
      .single()

    if (progressError) {
      throw progressError
    }

    // Award XP only if not already completed
    let xpAwarded = 0
    if (!existingProgress || !existingProgress.is_completed) {
      // Insert XP ledger entry
      const { error: xpError } = await serviceClient.from('xp_ledger').insert({
        user_id: user.id,
        source: 'lesson_completion',
        xp_delta: lesson.xp_reward,
        metadata: {
          lesson_id: lesson_id,
          completion_id: progress.id,
        },
      })

      if (xpError) {
        console.error('Error awarding XP:', xpError)
        // Don't fail the completion if XP award fails
      } else {
        xpAwarded = lesson.xp_reward
      }
    }

    // Get updated XP balance
    const { data: balanceData } = await serviceClient
      .from('user_xp_balance')
      .select('xp')
      .eq('user_id', user.id)
      .single()

    const response = {
      completion_id: progress.id,
      xp_awarded: xpAwarded,
      total_xp: balanceData?.xp || 0,
      completed_at: progress.completed_at,
    }

    // Store idempotency
    await storeIdempotency(idempotencyKey, user.id, response)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in /lessons/{id}/complete:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

