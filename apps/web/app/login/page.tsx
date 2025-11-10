'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getApiClient } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
        return
      }

      // Get email and referral code from URL params
      const emailParam = searchParams.get('email')
      const referralParam = searchParams.get('ref') || searchParams.get('referral')
      if (referralParam) {
        setReferralCode(referralParam.toUpperCase())
      }
      if (emailParam) {
        setEmail(emailParam)
        setStep('otp')
        // Auto-send OTP when email is in URL
        handleSendOtp(emailParam)
      }
    }
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams])

  const handleSendOtp = async (emailToUse?: string) => {
    const emailValue = emailToUse || email
    setError(null)

    if (!emailValue || !emailValue.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      // Call the Edge Function directly without requiring auth
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing')
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/auth-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ 
          email: emailValue, 
          referral_code: referralCode || undefined 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send OTP')
      }

      setStep('otp')
      setEmail(emailValue)
      showToast('Verification code sent to your email', 'success')
    } catch (err: any) {
      console.error('Error sending OTP:', err)
      const errorMessage = err.message || 'Failed to send OTP'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Accept any length OTP (Supabase can send 6 or 8 digits)
    if (!otp || otp.length < 6) {
      setError('Please enter a valid verification code')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Try verifying with the exact token as provided
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp.trim(),
        type: 'email',
      })

      if (verifyError) {
        // Provide more helpful error messages
        if (verifyError.message?.includes('expired') || verifyError.message?.includes('invalid')) {
          setError('This code has expired or is invalid. Please request a new code.')
        } else {
          setError(verifyError.message || 'Invalid code. Please check and try again.')
        }
        return
      }

      if (data.session) {
        // Set the session explicitly to ensure it's stored
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        
        if (setSessionError) {
          console.error('Error setting session:', setSessionError)
          setError('Failed to store session. Please try again.')
          return
        }
        
        // Verify the session is accessible
        const { data: { session: verifiedSession }, error: getSessionError } = await supabase.auth.getSession()
        
        if (getSessionError || !verifiedSession || !verifiedSession.access_token) {
          console.error('Session verification failed:', getSessionError)
          setError('Session not properly stored. Please try again.')
          return
        }
        
        // Ensure user profile exists and record referral signup if referral code was used
        // Do this BEFORE redirecting, but don't block login if it fails
        if (referralCode && data.user && data.session) {
          try {
            // Use the session token directly instead of relying on cookies
            const api = getApiClient()
            
            // Wait a bit for session to be available
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // Try to ensure user profile exists (but don't fail if it doesn't)
            try {
              await api.getMe()
            } catch (meError) {
              // Profile might not exist yet, that's okay - it will be created by trigger
              console.log('Profile check failed (may not exist yet):', meError)
            }
            
            // Record the referral using the session we just created
            await api.recordReferralSignup(data.user.id, referralCode)
          } catch (refError: any) {
            // Don't block login if referral recording fails - we can retry later
            console.error('Failed to record referral (non-blocking):', refError)
            // The error won't be shown to user since we're redirecting anyway
          }
        }

        // Small delay to ensure cookies are persisted before redirect
        await new Promise(resolve => setTimeout(resolve, 200))

        // Use window.location for a full page reload to ensure cookies are set
        window.location.href = '/dashboard'
      } else {
        setError('Failed to create session')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8">
            <h1 className="text-2xl font-bold text-white mb-2 text-center">
              Enter Verification Code
            </h1>
            <p className="text-gray-400 text-center mb-2 text-sm">
              We sent a verification code to <strong className="text-white">{email}</strong>
            </p>
            <p className="text-yellow-400 text-center mb-6 text-xs">
              ⚠️ Codes expire quickly - please enter it as soon as you receive it
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter code"
                  maxLength={10}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-mono"
                  required
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-400 text-center">
                  Enter the verification code from your email
                </p>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email')
                    setOtp('')
                    setError(null)
                  }}
                  className="text-sm text-gray-400 hover:text-gray-300"
                >
                  Change email
                </button>
                <span className="text-gray-600 mx-2">•</span>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading}
                  className="text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-600"
                >
                  Resend code
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Login
          </h1>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendOtp()
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="referral"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Referral Code (Optional)
              </label>
              <input
                id="referral"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="ABC12345"
                maxLength={20}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
              <p className="mt-1 text-xs text-gray-400">
                Enter a referral code if you were invited by someone
              </p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

