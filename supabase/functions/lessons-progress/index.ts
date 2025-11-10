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
      return new Response(
        JSON.stringify({
          error: 'auth_required',
          message: 'Invalid or expired token',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get lesson_id from request body
    const { lesson_id, progress_percent, time_spent_seconds, metadata } = await req.json()

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

    if (req.method === 'POST') {
      // Update progress

      if (typeof progress_percent !== 'number' || progress_percent < 0 || progress_percent > 100) {
        return new Response(
          JSON.stringify({
            error: 'invalid_request',
            message: 'progress_percent must be a number between 0 and 100',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Upsert progress (latest write wins)
      const { data: progress, error: progressError } = await serviceClient
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lesson_id,
          progress_percent: Math.round(progress_percent),
          time_spent_seconds: time_spent_seconds || 0,
          metadata: metadata || {},
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id',
        })
        .select()
        .single()

      if (progressError) {
        throw progressError
      }

      return new Response(
        JSON.stringify({
          progress_id: progress.id,
          progress_percent: progress.progress_percent,
          time_spent_seconds: progress.time_spent_seconds,
          updated_at: progress.updated_at,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'method_not_allowed', message: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in /lessons/{id}/progress:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

