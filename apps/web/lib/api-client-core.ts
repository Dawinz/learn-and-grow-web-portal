import { z } from 'zod'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Schemas
export const StartResponseSchema = z.object({
  email_hint: z.string().optional(),
  requires_email: z.boolean(),
  user_id: z.string().uuid().optional(),
})

export const OtpResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

export const MeResponseSchema = z.object({
  profile: z.object({
    id: z.string().uuid(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    kyc_level: z.string(),
    status: z.string(),
  }),
  xp_balance: z.number().int(),
  referral_code: z.string().nullable().optional(),
})

export const ConversionRateResponseSchema = z.object({
  tzs_per_xp: z.number(),
  effective_from: z.string(),
})

export const WithdrawalResponseSchema = z.object({
  withdrawal_id: z.string().uuid(),
  xp_balance: z.number().int(),
  amount_tzs: z.number().int(),
})

export const WithdrawalSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  phone_snapshot: z.string(),
  xp_debited: z.number().int(),
  amount_tzs: z.number().int(),
  rate_snapshot: z.number(),
  status: z.string(),
  payout_ref: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const WithdrawalsListResponseSchema = z.object({
  withdrawals: z.array(WithdrawalSchema),
  total: z.number().int(),
  page: z.number().int(),
  page_size: z.number().int(),
})

export const ErrorResponseSchema = z.object({
  error: z.string().optional(),
  code: z.union([z.string(), z.number()]).optional(),
  message: z.string().optional(),
}).passthrough() // Allow additional fields

// API Client
export class ApiClient {
  private baseUrl: string
  private getAuthHeaders: () => Promise<HeadersInit>

  constructor(getAuthHeaders: () => Promise<HeadersInit>) {
    this.baseUrl = `${SUPABASE_URL}/functions/v1`
    this.getAuthHeaders = getAuthHeaders
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers,
      },
    })

    let data: any
    try {
      data = await response.json()
    } catch (e) {
      throw new Error(`Invalid JSON response: ${response.statusText}`)
    }

    if (!response.ok) {
      // Try to parse error, but be lenient with structure
      try {
        const error = ErrorResponseSchema.parse(data)
        throw new Error(error.message || error.error || 'Request failed')
      } catch (parseError) {
        // If schema validation fails, just use the raw error message
        throw new Error(data.message || data.error || JSON.stringify(data))
      }
    }

    // For successful responses, validate against expected schema if it's a known endpoint
    // Otherwise just return the data
    return data as T
  }

  async sendOtp(email: string, referralCode?: string) {
    return this.request<z.infer<typeof OtpResponseSchema>>(
      '/auth-otp',
      {
        method: 'POST',
        body: JSON.stringify({ email, referral_code: referralCode }),
      }
    )
  }

  async getMe() {
    return this.request<z.infer<typeof MeResponseSchema>>('/me')
  }

  async getConversionRate() {
    return this.request<z.infer<typeof ConversionRateResponseSchema>>(
      '/conversion-rate'
    )
  }

  async createWithdrawal(
    xpToConvert: number,
    idempotencyKey: string
  ) {
    return this.request<z.infer<typeof WithdrawalResponseSchema>>(
      '/withdrawals',
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          xp_to_convert: xpToConvert,
        }),
      }
    )
  }

  async getWithdrawals(page = 1, pageSize = 20) {
    return this.request<z.infer<typeof WithdrawalsListResponseSchema>>(
      `/withdrawals?page=${page}&page_size=${pageSize}`
    )
  }

  async getReferrals() {
    return this.request<{
      referral_code: string | null
      stats: {
        total_referrals: number
        pending_referrals: number
        qualified_referrals: number
        rewarded_referrals: number
        total_rewards_earned: number
      }
      referrals: Array<{
        id: string
        referrer_id: string
        referred_id: string
        referral_code: string
        status: string
        qualified_at: string | null
        rewarded_at: string | null
        created_at: string
      }>
    }>('/referrals')
  }

  async recordReferralSignup(userId: string, referralCode: string) {
    return this.request<{
      success: boolean
      message: string
      referral: any
    }>('/referral-signup', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        referral_code: referralCode,
      }),
    })
  }
}
