'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getApiClient } from '@/lib/api-client'
import { formatEmail } from '@/lib/utils'

interface Profile {
  id: string
  phone: string | null
  email: string | null
  kyc_level: string
  status: string
}

export default function AccountPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [passkeySupported, setPasskeySupported] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      // Check passkey support
      setPasskeySupported(
        typeof window !== 'undefined' &&
          typeof window.PublicKeyCredential !== 'undefined'
      )

      try {
        const api = getApiClient()
        const me = await api.getMe()
        setProfile(me.profile)
      } catch (err: any) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleSetupPasskey = async () => {
    // TODO: Implement passkey setup
    alert('Passkey setup coming soon')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-48 mb-8"></div>
          <div className="bg-gray-800 rounded-lg h-96"></div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-gray-400">Manage your account information</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

            <div className="bg-gray-800 rounded-lg shadow-xl p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email ? formatEmail(profile.email) : 'Not set'}
                  disabled
                  className="w-full px-4 py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Email is managed through authentication
                </p>
              </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              KYC Level
            </label>
            <input
              type="text"
              value={profile.kyc_level}
              disabled
              className="w-full px-4 py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <input
              type="text"
              value={profile.status}
              disabled
              className="w-full px-4 py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
            />
          </div>

          {passkeySupported && (
            <div className="pt-4 border-t border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">
                Security
              </h2>
              <button
                onClick={handleSetupPasskey}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Set up a Passkey
              </button>
              <p className="mt-2 text-xs text-gray-400">
                Use a passkey for passwordless login
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
    </div>
  )
}

