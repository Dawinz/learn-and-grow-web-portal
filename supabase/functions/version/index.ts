import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  return new Response(
    JSON.stringify({
      version: '1.0.0',
      api_version: '1',
      features: {
        device_auth: true,
        lessons: true,
        referrals: true,
        withdrawals: false, // Mobile can read, but not create
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})

