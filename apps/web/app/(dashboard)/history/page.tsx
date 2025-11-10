'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getApiClient } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Withdrawal {
  id: string
  phone_snapshot: string
  xp_debited: number
  amount_tzs: number
  rate_snapshot: number
  status: string
  payout_ref: string | null
  created_at: string
  updated_at: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

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
        const result = await api.getWithdrawals(page, pageSize)
        setWithdrawals(result.withdrawals)
        setTotal(result.total)
      } catch (err: any) {
        setError(err.message || 'Failed to load withdrawal history')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, page])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-900/50 text-green-200'
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-200'
      case 'rejected':
        return 'bg-red-900/50 text-red-200'
      default:
        return 'bg-gray-700 text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-48 mb-8"></div>
          <div className="bg-gray-800 rounded-lg h-64"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Withdrawal History</h1>
          <p className="text-gray-400">View all your withdrawal requests</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
          {withdrawals.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No withdrawals found
            </p>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="border-b border-gray-700 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(w.amount_tzs)}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {w.xp_debited.toLocaleString()} XP @{' '}
                        {formatCurrency(w.rate_snapshot)}/XP
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(w.created_at)}
                      </p>
                      {w.payout_ref && (
                        <p className="text-xs text-gray-500 mt-1">
                          Ref: {w.payout_ref}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(
                        w.status
                      )}`}
                    >
                      {w.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {total > pageSize && (
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded transition"
              >
                Previous
              </button>
              <span className="text-gray-400">
                Page {page} of {Math.ceil(total / pageSize)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / pageSize)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
    </div>
  )
}

