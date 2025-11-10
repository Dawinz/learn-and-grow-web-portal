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

    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const cursor = url.searchParams.get('cursor')

    const serviceClient = createServiceClient()

    let query = serviceClient
      .from('xp_ledger')
      .select('id, source, xp_delta, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit + 1) // Fetch one extra to check if there's more

    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: events, error } = await query

    if (error) {
      throw error
    }

    const hasMore = events && events.length > limit
    const eventsToReturn = hasMore ? events.slice(0, limit) : (events || [])
    const nextCursor = hasMore && eventsToReturn.length > 0
      ? eventsToReturn[eventsToReturn.length - 1].created_at
      : null

    return new Response(
      JSON.stringify({
        events: eventsToReturn.map((e: any) => ({
          id: e.id,
          source: e.source,
          xp_delta: e.xp_delta,
          metadata: e.metadata,
          created_at: e.created_at,
        })),
        next_cursor: nextCursor,
        has_more: hasMore,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in /xp/history:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

