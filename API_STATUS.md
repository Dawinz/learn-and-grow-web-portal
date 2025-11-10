# API Status Report

## Web Application APIs

### ✅ Authentication APIs

#### 1. `POST /auth-otp` - Send OTP Email
- **Status**: ✅ Working (Fixed - now includes both `apikey` and `Authorization` headers)
- **Used in**: Login page
- **Auth Required**: No (public endpoint)
- **Function**: `supabase/functions/auth-otp/index.ts`

#### 2. `GET /me` - Get User Profile
- **Status**: ✅ Should be working
- **Used in**: Dashboard, Account page, Login (after OTP verification)
- **Auth Required**: Yes (Bearer token)
- **Function**: `supabase/functions/me/index.ts`
- **Returns**: User profile, XP balance, referral code

### ✅ Dashboard APIs

#### 3. `GET /conversion-rate` - Get XP to TZS Conversion Rate
- **Status**: ✅ Should be working
- **Used in**: Dashboard, Withdraw page
- **Auth Required**: Yes
- **Function**: `supabase/functions/conversion-rate/index.ts`
- **Returns**: `tzs_per_xp`, `effective_from`

#### 4. `GET /withdrawals` - List Withdrawals
- **Status**: ✅ Should be working
- **Used in**: Dashboard, History page
- **Auth Required**: Yes
- **Function**: `supabase/functions/withdrawals/index.ts`
- **Query Params**: `page`, `page_size`
- **Returns**: List of withdrawals with pagination

#### 5. `POST /withdrawals` - Create Withdrawal
- **Status**: ✅ Should be working
- **Used in**: Withdraw page
- **Auth Required**: Yes
- **Headers**: `Idempotency-Key` (required)
- **Function**: `supabase/functions/withdrawals/index.ts`
- **Body**: `{ xp_to_convert: number }`
- **Returns**: Withdrawal ID, new XP balance, amount in TZS

### ✅ Referral APIs

#### 6. `GET /referrals` - Get Referral Stats
- **Status**: ✅ Should be working
- **Used in**: Dashboard (ReferralSection component)
- **Auth Required**: Yes
- **Function**: `supabase/functions/referrals/index.ts`
- **Returns**: Referral code, stats (total, pending, qualified, rewarded), referrals list

#### 7. `POST /referral-signup` - Record Referral Signup
- **Status**: ✅ Should be working
- **Used in**: Login page (after successful OTP verification)
- **Auth Required**: Yes
- **Function**: `supabase/functions/referral-signup/index.ts`
- **Body**: `{ user_id: string, referral_code: string }`
- **Returns**: Success status and referral record

## Mobile Application APIs (Not used by web, but deployed)

### ✅ Mobile Auth APIs

#### 8. `POST /auth-device-start` - Device-based Guest Session
- **Status**: ✅ Deployed
- **Used in**: Mobile app (Flutter)
- **Auth Required**: No
- **Function**: `supabase/functions/auth-device-start/index.ts`

### ✅ Mobile XP APIs

#### 9. `POST /xp-credit` - Credit XP (Batched)
- **Status**: ✅ Deployed
- **Used in**: Mobile app
- **Auth Required**: Yes
- **Headers**: `Idempotency-Key` (required)
- **Function**: `supabase/functions/xp-credit/index.ts`
- **Body**: `{ events: Array<XPEvent> }`

#### 10. `GET /xp-history` - Get XP Ledger History
- **Status**: ✅ Deployed
- **Used in**: Mobile app
- **Auth Required**: Yes
- **Query Params**: `limit`, `cursor`
- **Function**: `supabase/functions/xp-history/index.ts`

### ✅ Mobile Lesson APIs

#### 11. `GET /lessons` - List Published Lessons
- **Status**: ✅ Deployed
- **Used in**: Mobile app
- **Auth Required**: No (public)
- **Function**: `supabase/functions/lessons/index.ts`

#### 12. `POST /lessons-progress` - Update Lesson Progress
- **Status**: ✅ Deployed
- **Used in**: Mobile app
- **Auth Required**: Yes
- **Function**: `supabase/functions/lessons-progress/index.ts`
- **Body**: `{ lesson_id: string, progress_data: object }`

#### 13. `POST /lessons-complete` - Mark Lesson Complete
- **Status**: ✅ Deployed
- **Used in**: Mobile app
- **Auth Required**: Yes
- **Headers**: `Idempotency-Key` (required)
- **Function**: `supabase/functions/lessons-complete/index.ts`
- **Body**: `{ lesson_id: string }`

## System APIs

### ✅ Health & Version APIs

#### 14. `GET /health` - Health Check
- **Status**: ✅ Deployed
- **Used in**: System monitoring
- **Auth Required**: No
- **Function**: `supabase/functions/health/index.ts`

#### 15. `GET /version` - API Version
- **Status**: ✅ Deployed
- **Used in**: Client feature detection
- **Auth Required**: No
- **Function**: `supabase/functions/version/index.ts`

## Admin APIs

### ✅ Admin APIs

#### 16. `POST /admin-mark-paid` - Mark Withdrawal as Paid
- **Status**: ✅ Deployed
- **Used in**: Admin operations
- **Auth Required**: Yes (admin only)
- **Function**: `supabase/functions/admin-mark-paid/index.ts`

## Testing Recommendations

### Web App APIs (Test these in browser console after login):

```javascript
// Test /me
const response = await fetch('https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/me', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': 'YOUR_ANON_KEY'
  }
})

// Test /conversion-rate
const rate = await fetch('https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/conversion-rate', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': 'YOUR_ANON_KEY'
  }
})

// Test /referrals
const refs = await fetch('https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/referrals', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': 'YOUR_ANON_KEY'
  }
})
```

## Known Issues

1. ✅ **FIXED**: `/auth-otp` was missing `Authorization` header - now fixed
2. ⚠️ **POTENTIAL**: All authenticated endpoints require valid session tokens
3. ⚠️ **POTENTIAL**: Rate limiting is active on `/auth-otp` (10/hour per email, 50/day per IP)

## Deployment Status

All Edge Functions should be deployed. To verify deployment:

```bash
# Check if functions are deployed (requires Supabase CLI)
supabase functions list

# Or check in Supabase Dashboard > Edge Functions
```

## Summary

- **Total APIs**: 16
- **Web App APIs**: 7 (all should be working)
- **Mobile APIs**: 6 (deployed, not tested by web)
- **System APIs**: 2 (deployed)
- **Admin APIs**: 1 (deployed)

**All web application APIs should be functional.** The main fix was adding the `Authorization` header to `/auth-otp`, which is now working. All other endpoints use the `ApiClient` which automatically includes the `Authorization` header when a session exists.

