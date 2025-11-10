import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  const response = NextResponse.redirect(new URL(next, requestUrl.origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Handle code exchange (new magic link format)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
    }

    if (!data.session) {
      console.error('No session created after code exchange')
      return NextResponse.redirect(new URL('/login?error=no_session', requestUrl.origin))
    }

    return response
  }

  // Handle token verification (old magic link format)
  if (token && type === 'magiclink') {
    // For token-based magic links, Supabase redirects to /auth/v1/verify first
    // which sets cookies, then redirects here. Check if session exists.
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      return response
    }
    
    // If no session, try to verify the token
    // Note: verifyOtp requires email, which we might not have
    // In this case, redirect to login with error
    return NextResponse.redirect(new URL('/login?error=token_verification_failed', requestUrl.origin))
  }

  // Check if session exists (might have been set by Supabase's verify)
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    return response
  }

  // No session - redirect to login
  return NextResponse.redirect(new URL('/login?error=no_session', requestUrl.origin))
}

