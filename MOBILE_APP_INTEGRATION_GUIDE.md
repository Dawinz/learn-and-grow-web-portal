# Mobile App Supabase Integration Guide

## ✅ Supabase Configuration

### Project Details
- **Project Reference**: `iscqpvwtikwqquvxlpsr`
- **Supabase URL**: `https://iscqpvwtikwqquvxlpsr.supabase.co`
- **API Base URL**: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1`

### Supabase Anon Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0
```

**Where to find it:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/iscqpvwtikwqquvxlpsr
2. Navigate to: Project Settings → API
3. Copy the "anon public" key

## ✅ Edge Functions Deployment Status

**ALL REQUIRED EDGE FUNCTIONS ARE DEPLOYED AND WORKING:**

### Core Mobile APIs (All Deployed ✅)

1. **POST /auth-device-start** ✅
   - Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/auth-device-start`
   - Status: Deployed & Working
   - Purpose: Device-based guest session creation/restoration

2. **GET /me** ✅
   - Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/me`
   - Status: Deployed & Working
   - Purpose: Get user profile and XP balance

3. **POST /xp-credit** ✅
   - Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/xp-credit`
   - Status: Deployed & Working
   - Purpose: Credit XP in batches with idempotency
   - **Required Header**: `Idempotency-Key: {UUID}`

4. **GET /xp-history** ✅
   - Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/xp-history`
   - Status: Deployed & Working
   - Purpose: Get XP ledger history with cursor pagination

5. **GET /lessons** ✅
   - Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/lessons`
   - Status: Deployed & Working
   - Purpose: List published lessons

6. **POST /lessons-progress** ✅
   - Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/lessons-progress`
   - Status: Deployed & Working
   - Purpose: Update partial lesson progress

7. **POST /lessons-complete** ✅
   - Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/lessons-complete`
   - Status: Deployed & Working
   - Purpose: Mark lesson complete (idempotent, awards XP)
   - **Required Header**: `Idempotency-Key: {UUID}`

8. **GET /referrals** ✅
   - Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/referrals`
   - Status: Deployed & Working
   - Purpose: Get referral statistics

9. **POST /referral-signup** ✅
   - Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/referral-signup`
   - Status: Deployed & Working
   - Purpose: Claim/record referral code

10. **GET /conversion-rate** ✅
    - Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/conversion-rate`
    - Status: Deployed & Working
    - Purpose: Get XP to TZS conversion rate

11. **GET /withdrawals** ✅
    - Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/withdrawals`
    - Status: Deployed & Working
    - Purpose: List withdrawals (read-only for mobile)

12. **GET /version** ✅
    - Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/version`
    - Status: Deployed & Working
    - Purpose: Get API version and feature flags

13. **GET /health** ✅
    - Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/health`
    - Status: Deployed & Working
    - Purpose: Health check endpoint

## Email Linking & Authentication

### Option 1: Use Existing OTP Endpoint (Recommended)

**POST /auth-otp** ✅ (Already Implemented)
- Endpoint: `https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/auth-otp`
- Status: Deployed & Working
- Purpose: Send OTP email for authentication

**How to use for email linking:**

1. **Send OTP to email:**
```http
POST /auth-otp
Headers:
  Content-Type: application/json
  apikey: {SUPABASE_ANON_KEY}
  Authorization: Bearer {SUPABASE_ANON_KEY}

Body:
{
  "email": "user@example.com",
  "referral_code": "ABC12345" // optional
}
```

2. **Verify OTP with Supabase Auth:**
After user receives OTP, verify it using Supabase Auth SDK:
```dart
// Flutter example
final response = await supabase.auth.verifyOTP(
  email: email,
  token: otpCode,
  type: OtpType.email,
);
```

3. **Link email to existing device session:**
Once OTP is verified, the user will have an authenticated session. The backend automatically links the email to the user profile.

**Note**: The `/auth-otp` endpoint creates/updates the user in Supabase Auth. If the user already has a device-based session, you can:
- Option A: Use the same user_id from device session
- Option B: Merge device session with email-authenticated session (requires custom logic)

### Option 2: Create Dedicated Email Linking Endpoint (If Needed)

If you need a dedicated endpoint that links an email to an existing device session, we can create:
- `POST /auth/email/link` - Send magic link to email
- `POST /auth/email/verify` - Verify link and link email to device session

**Current Status**: Not implemented (but can be added if needed)

**Recommendation**: Use the existing `/auth-otp` endpoint for email authentication. It's simpler and already working.

## API Request Format

### For Public Endpoints (No Auth)
```http
POST /auth-device-start
Headers:
  Content-Type: application/json
  apikey: {SUPABASE_ANON_KEY}
  Authorization: Bearer {SUPABASE_ANON_KEY}

Body: { ... }
```

### For Authenticated Endpoints
```http
GET /me
Headers:
  Content-Type: application/json
  Authorization: Bearer {access_token}
  apikey: {SUPABASE_ANON_KEY}
```

### For Mutations (POST/PUT with Idempotency)
```http
POST /xp-credit
Headers:
  Content-Type: application/json
  Authorization: Bearer {access_token}
  apikey: {SUPABASE_ANON_KEY}
  Idempotency-Key: {UUID}  // REQUIRED for: /xp-credit, /lessons-complete, /referral-signup

Body: { ... }
```

## Mobile App Configuration

### Flutter/Dart Configuration

```dart
// config.dart
class SupabaseConfig {
  static const String supabaseUrl = 'https://iscqpvwtikwqquvxlpsr.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0';
  static const String apiBaseUrl = '${supabaseUrl}/functions/v1';
  
  // Edge Function Endpoints
  static const String authDeviceStart = '$apiBaseUrl/auth-device-start';
  static const String me = '$apiBaseUrl/me';
  static const String xpCredit = '$apiBaseUrl/xp-credit';
  static const String xpHistory = '$apiBaseUrl/xp-history';
  static const String lessons = '$apiBaseUrl/lessons';
  static const String lessonsProgress = '$apiBaseUrl/lessons-progress';
  static const String lessonsComplete = '$apiBaseUrl/lessons-complete';
  static const String referrals = '$apiBaseUrl/referrals';
  static const String referralSignup = '$apiBaseUrl/referral-signup';
  static const String conversionRate = '$apiBaseUrl/conversion-rate';
  static const String withdrawals = '$apiBaseUrl/withdrawals';
  static const String version = '$apiBaseUrl/version';
  static const String health = '$apiBaseUrl/health';
  static const String authOtp = '$apiBaseUrl/auth-otp'; // For email linking
}
```

## Testing Endpoints

### Quick Test: Health Check
```bash
curl -X GET "https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/health" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0"
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

## Summary

✅ **All 13 core Edge Functions are deployed and working**
✅ **Supabase anon key provided above**
✅ **Email authentication available via `/auth-otp` endpoint**
✅ **No duplicate endpoints needed - use existing implementations**

### For Email Linking:
- **Use `/auth-otp`** to send OTP to user's email
- **Verify OTP** using Supabase Auth SDK
- **Email is automatically linked** when user authenticates

### Next Steps for Mobile App:
1. Add Supabase anon key to app configuration
2. Implement API client using the endpoints listed above
3. Use `/auth-otp` for email authentication/linking
4. Test all endpoints using the health check first

## Additional Resources

- **Full API Documentation**: See `MOBILE_API_DESIGN.md`
- **API Status Report**: See `MOBILE_API_STATUS.md`
- **Sync Prompt**: See `MOBILE_APP_SYNC_PROMPT.md`

All endpoints are production-ready and fully functional!

