'use client'

import { useState, useEffect } from 'react'
import { getApiClient } from '@/lib/api-client'
import { useToast } from '@/lib/toast'

export function ReferralSection() {
  const { showToast } = useToast()
  const [referralData, setReferralData] = useState<{
    referral_code: string | null
    stats: {
      total_referrals: number
      pending_referrals: number
      qualified_referrals: number
      rewarded_referrals: number
      total_rewards_earned: number
    }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadReferrals = async () => {
      try {
        const api = getApiClient()
        const data = await api.getReferrals()
        setReferralData(data)
      } catch (error: any) {
        console.error('Failed to load referrals:', error)
      } finally {
        setLoading(false)
      }
    }
    loadReferrals()
  }, [])

  const copyReferralLink = () => {
    if (!referralData?.referral_code) return

    const referralLink = `${window.location.origin}/login?ref=${referralData.referral_code}`
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    showToast('Referral link copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!referralData?.referral_code) {
    return null
  }

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/login?ref=${referralData.referral_code}`

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50">
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Referral Program</h3>
      
      <div className="space-y-4">
        {/* Referral Code */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Your Referral Code
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={referralData.referral_code}
              readOnly
              className="flex-1 px-3 sm:px-4 py-2 bg-gray-700 text-white rounded-lg font-mono text-base sm:text-lg text-center sm:text-left"
            />
            <button
              onClick={copyReferralLink}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400 break-words">
            Share this link: <span className="text-gray-300 break-all">{referralLink}</span>
          </p>
        </div>

        {/* How it works */}
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-blue-200 font-semibold mb-2">How it works:</p>
          <ul className="text-xs text-blue-100 space-y-1 list-disc list-inside">
            <li>Share your referral link with friends</li>
            <li>They need to earn 10,000 XP and make at least 1 withdrawal</li>
            <li>You'll receive 1,000 XP when they qualify!</li>
          </ul>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-gray-700">
          <div>
            <p className="text-xs sm:text-sm text-gray-400">Total Referrals</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{referralData.stats.total_referrals}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-400">Rewards Earned</p>
            <p className="text-xl sm:text-2xl font-bold text-green-400">
              {referralData.stats.total_rewards_earned.toLocaleString()} XP
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-400">Pending</p>
            <p className="text-lg sm:text-xl font-semibold text-yellow-400">{referralData.stats.pending_referrals}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-400">Qualified</p>
            <p className="text-lg sm:text-xl font-semibold text-blue-400">{referralData.stats.qualified_referrals}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

