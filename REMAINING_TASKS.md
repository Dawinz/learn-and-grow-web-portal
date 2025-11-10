# Remaining Tasks - Learn & Grow Portal

## 🚨 Critical: Database Migration

### Apply Mobile Schema
**File:** `supabase/sql/004_mobile_schema.sql`

**Action Required:**
```bash
# Option 1: Via Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr/sql
# Copy and paste the contents of 004_mobile_schema.sql
# Click "Run"

# Option 2: Via Supabase CLI
npx supabase db push
```

**What it creates:**
- `devices` table (device registration)
- `lessons` table (published lessons)
- `lesson_progress` table (user progress tracking)
- `xp_event_nonces` table (XP deduplication)
- Indexes and RLS policies

---

## 📦 Deploy New Edge Functions

### Functions to Deploy

**Already Implemented (Need Deployment):**
1. ✅ `xp-credit` - Batched XP events
2. ✅ `xp-history` - XP ledger history
3. ✅ `health` - Health check
4. ✅ `version` - API version
5. ✅ `lessons` - List lessons
6. ✅ `lessons-progress` - Update progress
7. ✅ `lessons-complete` - Complete lesson
8. ⚠️ `auth-device-start` - Device auth (needs refinement)

**Deployment Command:**
```bash
npx supabase functions deploy xp-credit --project-ref iscqpvwtikwqquvxlpsr
npx supabase functions deploy xp-history --project-ref iscqpvwtikwqquvxlpsr
npx supabase functions deploy health --project-ref iscqpvwtikwqquvxlpsr --no-verify-jwt
npx supabase functions deploy version --project-ref iscqpvwtikwqquvxlpsr --no-verify-jwt
npx supabase functions deploy lessons --project-ref iscqpvwtikwqquvxlpsr --no-verify-jwt
npx supabase functions deploy lessons-progress --project-ref iscqpvwtikwqquvxlpsr
npx supabase functions deploy lessons-complete --project-ref iscqpvwtikwqquvxlpsr
```

---

## 🔧 Needs Implementation

### 1. Device Registration Endpoint
**File:** `supabase/functions/devices-register/index.ts`

**Status:** ⬜ Not implemented

**What it does:**
- Register/update device fingerprint
- Store attestation flags (emulator, rooted, debug)
- Enforce device limit (5 per user)

**Priority:** Medium (can work without it initially)

---

### 2. Mobile Referral Claiming
**File:** `supabase/functions/referrals-claim/index.ts`

**Status:** ⬜ Not implemented

**What it does:**
- Mobile-specific referral claiming
- Support for `device_hash` and `installer_id`
- Prevent duplicate claims per device

**Note:** `/referral-signup` exists for web, but mobile needs device support

**Priority:** Medium (web referral works, mobile can use it with modifications)

---

### 3. Device Auth Refinement
**File:** `supabase/functions/auth-device-start/index.ts`

**Status:** ⚠️ Implemented but needs refinement

**Current Issue:**
- Attempts to create anonymous users via Supabase Auth API
- May not work correctly for device-based sessions

**Recommendation:**
- Use Supabase's anonymous sign-in feature
- Or implement JWT-based device tokens
- Or use a simpler device token system

**Priority:** High (needed for mobile app to work)

---

### 4. Profile Update Endpoint
**File:** `supabase/functions/profile/index.ts` (PUT method)

**Status:** ⬜ Not implemented

**What it does:**
- Update user phone/email
- Validate changes
- Update `users_public` table

**Priority:** Low (can be done via Supabase dashboard initially)

---

### 5. Email Linking (Optional)
**Files:**
- `supabase/functions/auth-email-link/index.ts`
- `supabase/functions/auth-email-verify/index.ts`

**Status:** ⬜ Not implemented

**What it does:**
- Link email to device session
- Verify email and merge accounts

**Priority:** Low (optional feature)

---

## ✅ Already Working (No Action Needed)

### Web Portal
- ✅ Authentication (OTP)
- ✅ Dashboard
- ✅ Withdrawals
- ✅ History
- ✅ Account settings
- ✅ Referral system (web)

### Backend
- ✅ `/me` - User profile
- ✅ `/conversion-rate` - Conversion rate
- ✅ `/withdrawals` - List/create withdrawals
- ✅ `/referrals` - Referral status
- ✅ `/referral-signup` - Web referral signup

---

## 📋 Quick Start Checklist

### For Mobile App Integration:

1. **Apply Database Migration** ⚠️ CRITICAL
   ```bash
   # Run 004_mobile_schema.sql on Supabase
   ```

2. **Deploy Core Endpoints** ⚠️ CRITICAL
   ```bash
   # Deploy: xp-credit, xp-history, lessons, lessons-progress, lessons-complete
   ```

3. **Fix Device Auth** ⚠️ HIGH PRIORITY
   - Refine `auth-device-start` endpoint
   - Test anonymous user creation

4. **Test XP System** 📝
   - Test batched XP credit
   - Test nonce deduplication
   - Test rate limiting

5. **Create Sample Lessons** 📝
   - Insert test lessons into `lessons` table
   - Set `published_at` to make them visible

---

## 🎯 Priority Order

1. **Apply database migration** (Required for everything)
2. **Deploy implemented endpoints** (Get mobile API working)
3. **Fix device auth** (Critical for mobile login)
4. **Implement device registration** (Nice to have)
5. **Mobile referral claiming** (Can use web version initially)
6. **Profile updates** (Low priority)
7. **Email linking** (Optional)

---

## 📝 Notes

- All endpoints follow uniform error format
- Idempotency required for all mutations
- Rate limiting implemented (no Turnstile)
- XP balance always server-calculated
- Web and mobile share same backend

---

## 🚀 Ready for Mobile App

Once you:
1. ✅ Apply database migration
2. ✅ Deploy the endpoints
3. ✅ Fix device auth

Your Flutter app can start using:
- ✅ XP credit system
- ✅ Lesson system
- ✅ Referral system (via web endpoint)
- ✅ Withdrawal viewing
- ✅ User profile

The mobile app can connect to the same Supabase backend!

