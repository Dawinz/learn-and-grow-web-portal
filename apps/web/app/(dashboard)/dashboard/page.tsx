'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getApiClient } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/lib/toast'
import { ReferralSection } from '@/components/ReferralSection'

interface DashboardData {
  xp_balance: number
  tzs_per_xp: number
  effective_from: string
  last_withdrawals: Array<{
    id: string
    amount_tzs: number
    status: string
    created_at: string
  }>
  next_eligible_date: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    const supabase = createClient()
    
    // Check if user is authenticated - try multiple times to ensure session is available
    let session = null
    for (let i = 0; i < 3; i++) {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      if (currentSession) {
      session = currentSession
      break
      }
      // Wait a bit before retrying
      if (i < 2) {
      await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    if (!session) {
      router.push('/login')
      return
    }

    try {
      // Ensure we have a valid session before making API calls
      const { data: { session: finalSession } } = await supabase.auth.getSession()
      if (!finalSession?.access_token) {
      throw new Error('No valid session found')
      }
      
      const api = getApiClient()
      const [me, rate, withdrawals] = await Promise.all([
      api.getMe(),
      api.getConversionRate(),
      api.getWithdrawals(1, 5),
      ])

      // Calculate next eligible withdrawal date
      const lastWithdrawal = withdrawals.withdrawals[0]
      let nextEligibleDate: string | null = null
      if (lastWithdrawal) {
      const lastDate = new Date(lastWithdrawal.created_at)
      const cooldownDays = 7 // From env
      const nextDate = new Date(lastDate)
      nextDate.setDate(nextDate.getDate() + cooldownDays)
      nextEligibleDate = nextDate.toISOString()
      }

      setData({
      xp_balance: me.xp_balance,
      tzs_per_xp: rate.tzs_per_xp,
      effective_from: rate.effective_from,
      last_withdrawals: withdrawals.withdrawals.slice(0, 5),
      next_eligible_date: nextEligibleDate,
      })
      setError(null)
      if (showRefreshing) {
      showToast('Dashboard refreshed', 'success')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load dashboard'
      setError(errorMessage)
      if (showRefreshing) {
      showToast(errorMessage, 'error')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  // Listen for refresh events from layout
  useEffect(() => {
    const handleRefresh = () => {
      loadData(true)
    }
    window.addEventListener('refresh-data', handleRefresh)
    return () => window.removeEventListener('refresh-data', handleRefresh)
  }, [loadData])

  if (loading && !data) {
    return (
      <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-64 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
        ))}
        </div>
      </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="bg-red-900/50 border border-red-700 text-red-200 px-6 py-4 rounded">
      {error}
      </div>
    )
  }

  if (!data) return null

  const canWithdraw =
    data.xp_balance >= 5000 && // MIN_WITHDRAWAL_XP
    (!data.next_eligible_date ||
      new Date(data.next_eligible_date) <= new Date())

  const estimatedValue = data.xp_balance * data.tzs_per_xp
  const xpNeeded = Math.max(0, 5000 - data.xp_balance)
  const daysUntilEligible = data.next_eligible_date
    ? Math.ceil(
      (new Date(data.next_eligible_date).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
      )
    : 0

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-gray-400">Welcome back! Here&apos;s your account overview.</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* XP Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-blue-100">XP Balance</h2>
        </div>
        <p className="text-5xl font-bold text-white mb-2">
          {data.xp_balance.toLocaleString()}
        </p>
        <p className="text-blue-100 text-sm">
          Estimated value: {formatCurrency(estimatedValue)}
        </p>
        </div>

        {/* Conversion Rate Card */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-purple-100">Rate</h2>
        </div>
        <p className="text-5xl font-bold text-white mb-2">
          {formatCurrency(data.tzs_per_xp)}
        </p>
        <p className="text-purple-100 text-xs">
          per XP • Since {formatDate(data.effective_from)}
        </p>
        </div>

        {/* Withdrawal Status Card */}
        <div
        className={`rounded-xl p-6 shadow-lg transform hover:scale-105 transition-transform ${
          canWithdraw
          ? 'bg-gradient-to-br from-green-600 to-green-700'
          : 'bg-gradient-to-br from-gray-700 to-gray-800'
        }`}
        >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Status</h2>
        </div>
        {canWithdraw ? (
          <>
          <p className="text-2xl font-bold text-white mb-2">Ready</p>
          <p className="text-green-100 text-sm">You can withdraw now</p>
          </>
        ) : data.xp_balance < 5000 ? (
          <>
          <p className="text-2xl font-bold text-white mb-2">
            {xpNeeded.toLocaleString()} XP
          </p>
          <p className="text-gray-300 text-sm">
            needed to withdraw (min: 5,000)
          </p>
          </>
        ) : (
          <>
          <p className="text-2xl font-bold text-white mb-2">
            {daysUntilEligible}d
          </p>
          <p className="text-gray-300 text-sm">until next withdrawal</p>
          </>
        )}
        </div>
      </div>

      {/* Info Banner */}
      {data.next_eligible_date &&
        new Date(data.next_eligible_date) > new Date() && (
        <div className="bg-gradient-to-r from-yellow-900/50 to-yellow-800/50 border border-yellow-700/50 text-yellow-200 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
          <svg
          className="w-6 h-6 text-yellow-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
          </svg>
          <div>
          <p className="font-semibold">Next Withdrawal Available</p>
          <p className="text-sm text-yellow-300">
            {formatDate(data.next_eligible_date)} ({daysUntilEligible} day{daysUntilEligible !== 1 ? 's' : ''} remaining)
          </p>
          </div>
        </div>
        )}

      {/* Recent Withdrawals */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-gray-700/50 shadow-xl">
        <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          Recent Withdrawals
        </h2>
        <Link
          href="/history"
          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition flex items-center gap-1"
        >
          View All
          <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
          </svg>
        </Link>
        </div>
        {data.last_withdrawals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No withdrawals yet</p>
          <p className="text-gray-500 text-sm">
          Start earning XP to make your first withdrawal
          </p>
        </div>
        ) : (
        <div className="space-y-3">
          {data.last_withdrawals.map((w) => (
          <div
            key={w.id}
            className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition border border-gray-600/30"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-2 h-12 rounded-full ${
                  w.status === 'paid'
                    ? 'bg-green-500'
                    : w.status === 'pending'
                    ? 'bg-yellow-500'
                    : 'bg-gray-500'
                }`}
              />
              <div>
                <p className="text-white font-semibold text-lg">
                  {formatCurrency(w.amount_tzs)}
                </p>
                <p className="text-sm text-gray-400">
                  {formatDate(w.created_at)}
                </p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${
                w.status === 'paid'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : w.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {w.status}
            </span>
          </div>
          ))}
        </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Withdrawal Card */}
        <div
        className={`rounded-xl p-6 border-2 transition-all ${
          canWithdraw
          ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500/50 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20'
          : 'bg-gray-800/50 border-gray-700/50 opacity-75'
        }`}
        >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Withdraw XP</h3>
        </div>
        <p className="text-gray-300 mb-6 text-sm">
          {canWithdraw
          ? `Convert your ${data.xp_balance.toLocaleString()} XP to cash. Minimum withdrawal: 5,000 XP.`
          : data.xp_balance < 5000
          ? `You need ${xpNeeded.toLocaleString()} more XP to make a withdrawal.`
          : `You can withdraw again in ${daysUntilEligible} day${daysUntilEligible !== 1 ? 's' : ''}.`}
        </p>
        <Link
          href="/withdraw"
          className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition ${
          canWithdraw
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {canWithdraw ? (
          <span className="flex items-center justify-center gap-2">
            <span>Withdraw Now</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </span>
          ) : (
          'Withdrawal Unavailable'
          )}
        </Link>
        </div>

        {/* Quick Info Card */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-white mb-4">
          Quick Info
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
          <span className="text-gray-400">Minimum Withdrawal</span>
          <span className="text-white font-semibold">5,000 XP</span>
          </div>
          <div className="flex justify-between items-center">
          <span className="text-gray-400">Cooldown Period</span>
          <span className="text-white font-semibold">7 days</span>
          </div>
          <div className="flex justify-between items-center">
          <span className="text-gray-400">Current Rate</span>
          <span className="text-white font-semibold">
            {formatCurrency(data.tzs_per_xp)}/XP
          </span>
          </div>
          <div className="pt-3 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Potential Value</span>
            <span className="text-green-400 font-bold text-lg">
              {formatCurrency(estimatedValue)}
            </span>
          </div>
          </div>
        </div>
        </div>
      </div>

      {/* Referral Section */}
      <ReferralSection />
    </div>
  )
}

