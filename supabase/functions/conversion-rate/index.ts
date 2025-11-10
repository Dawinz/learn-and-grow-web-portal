import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('conversion_rates')
      .select('tzs_per_xp, effective_from')
      .order('effective_from', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      // Fallback to env default
      const defaultRate = parseFloat(Deno.env.get('TZS_PER_XP') || '0.05')
      return new Response(
        JSON.stringify({
          tzs_per_xp: defaultRate,
          effective_from: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        tzs_per_xp: parseFloat(data.tzs_per_xp),
        effective_from: data.effective_from,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in /conversion/rate:', error)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

