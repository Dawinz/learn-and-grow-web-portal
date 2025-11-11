# Mobile App Integration - Quick Reference

## ✅ Supabase Configuration

**Supabase Anon Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0
```

**API Base URL:**
```
https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1
```

## ✅ All Edge Functions Confirmed Deployed

All 13 required Edge Functions are deployed and working:

1. ✅ `/auth-device-start` - Device-based guest sessions
2. ✅ `/me` - User profile & XP balance
3. ✅ `/xp-credit` - Credit XP (batched, idempotent)
4. ✅ `/xp-history` - XP ledger history
5. ✅ `/lessons` - List published lessons
6. ✅ `/lessons-progress` - Update lesson progress
7. ✅ `/lessons-complete` - Complete lesson (awards XP)
8. ✅ `/referrals` - Get referral stats
9. ✅ `/referral-signup` - Claim referral code
10. ✅ `/conversion-rate` - Get XP to TZS rate
11. ✅ `/withdrawals` - List withdrawals (read-only)
12. ✅ `/version` - API version & features
13. ✅ `/health` - Health check

## ✅ Email Linking Solution

**Use existing `/auth-otp` endpoint** (already implemented, no need to create `/link-email`):

### Step 1: Send OTP
```http
POST https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/auth-otp
Headers:
  Content-Type: application/json
  apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0

Body:
{
  "email": "user@example.com",
  "referral_code": "ABC12345" // optional
}
```

### Step 2: Verify OTP with Supabase Auth SDK
```dart
// Flutter example
final response = await supabase.auth.verifyOTP(
  email: email,
  token: otpCode,
  type: OtpType.email,
);
```

### Step 3: Email is automatically linked
Once OTP is verified, the user has an authenticated session. The backend automatically links the email to the user profile.

**Note**: If user has an existing device session, you can merge them by using the same `user_id` or implementing custom merge logic.

## Flutter Configuration Example

```dart
class SupabaseConfig {
  static const String supabaseUrl = 'https://iscqpvwtikwqquvxlpsr.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0';
  static const String apiBaseUrl = '${supabaseUrl}/functions/v1';
}
```

## Important Notes

- ✅ **No duplicate endpoints needed** - All required APIs exist
- ✅ **Use `/auth-otp` for email linking** - No need to create `/link-email`
- ✅ **All endpoints are production-ready** - Fully deployed and tested
- ✅ **Idempotency required** - Use `Idempotency-Key` header for: `/xp-credit`, `/lessons-complete`, `/referral-signup`

## Testing

Test the health endpoint first:
```bash
curl -X GET "https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1/health" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzY3Fwdnd0aWt3cXF1dnhscHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTc3MDMsImV4cCI6MjA3ODE5MzcwM30.bl0H3HJ4n3wYWSL0I_100IS3fBr5yjv5Okzm_0ziAS0"
```

Expected: `{"status":"ok","timestamp":"...","database":"connected"}`

---

**Everything is ready for mobile app integration!** 🚀

