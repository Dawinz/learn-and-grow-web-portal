import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // In production, add admin authentication check here
    // For now, this is a scaffold

    const url = new URL(req.url)
    const withdrawalId = url.searchParams.get('id')

    if (!withdrawalId) {
      return new Response(
        JSON.stringify({ error: 'invalid_request', message: 'Withdrawal ID required (query param: id)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { payout_ref } = await req.json()

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('withdrawals')
      .update({
        status: 'paid',
        payout_ref: payout_ref || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in /admin/mark-paid:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

