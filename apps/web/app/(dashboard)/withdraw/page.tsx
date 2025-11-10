'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getApiClient } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/lib/toast'

export default function WithdrawPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [xpToConvert, setXpToConvert] = useState('')
  const [rate, setRate] = useState<number | null>(null)
  const [xpBalance, setXpBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [minWithdrawal, setMinWithdrawal] = useState(5000)

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

      try {
        const api = getApiClient()
        const [me, rateData] = await Promise.all([
          api.getMe(),
          api.getConversionRate(),
        ])
        setXpBalance(me.xp_balance)
        setRate(rateData.tzs_per_xp)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      }
    }

    loadData()
  }, [router])

  const computedTzs =
    xpToConvert && rate
      ? Math.floor(parseFloat(xpToConvert) * rate)
      : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const xp = parseInt(xpToConvert)
    if (isNaN(xp) || xp < minWithdrawal) {
      setError(`Minimum withdrawal is ${minWithdrawal.toLocaleString()} XP`)
      return
    }

    if (xpBalance !== null && xp > xpBalance) {
      setError('Insufficient XP balance')
      return
    }


    setLoading(true)
    try {
      const api = getApiClient()
      const idempotencyKey = crypto.randomUUID()
      await api.createWithdrawal(xp, idempotencyKey)
      showToast(
        `Withdrawal request submitted! You will receive ${formatCurrency(computedTzs)}.`,
        'success'
      )
      // Small delay to show toast before redirect
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create withdrawal'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Withdraw XP</h1>
          <Link
            href="/dashboard"
            className="text-gray-300 hover:text-white transition"
          >
            ← Back
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          {xpBalance !== null && (
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-1">Available XP</p>
              <p className="text-2xl font-bold text-white">
                {xpBalance.toLocaleString()}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="xp"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                XP to Convert
              </label>
              <input
                id="xp"
                type="number"
                value={xpToConvert}
                onChange={(e) => setXpToConvert(e.target.value)}
                placeholder="5000"
                min={minWithdrawal}
                max={xpBalance || undefined}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                Minimum: {minWithdrawal.toLocaleString()} XP
              </p>
            </div>

            {rate && (
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">You will receive</p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(computedTzs)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Rate: {formatCurrency(rate)}/XP
                </p>
              </div>
            )}


            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition"
            >
              {loading ? 'Processing...' : 'Submit Withdrawal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

