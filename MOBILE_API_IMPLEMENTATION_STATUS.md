# Mobile API Implementation Status

## ✅ Completed

### Database Schema
- ✅ `004_mobile_schema.sql` - Created schema for:
  - `devices` table (device registration & attestation)
  - `lessons` table (published lessons)
  - `lesson_progress` table (user progress tracking)
  - `xp_event_nonces` table (deduplication)

### API Endpoints Implemented
- ✅ `POST /xp/credit` - Batched XP events with idempotency and nonce deduplication
- ✅ `GET /xp/history` - XP ledger history with cursor pagination
- ✅ `GET /health` - Health check endpoint
- ✅ `GET /version` - API version and features

### Design Documentation
- ✅ `MOBILE_API_DESIGN.md` - Complete API specification

## 🚧 In Progress / Needs Refinement

### Device Authentication
- ⚠️ `POST /auth/device/start` - Created but needs refinement:
  - Current implementation attempts to create anonymous users via Supabase Auth
  - **Recommendation**: Use Supabase's anonymous sign-in or JWT-based device tokens
  - Alternative: Use a simpler device token system that doesn't require full auth.users records

## 📋 Pending Implementation

### Device Management
- ⬜ `POST /devices/register` - Device registration/update
- ⬜ Device limit enforcement (5 devices per user)

### Lessons
- ⬜ `GET /lessons` - List published lessons
- ⬜ `POST /lessons/{id}/progress` - Update lesson progress
- ⬜ `POST /lessons/{id}/complete` - Complete lesson (idempotent, awards XP)

### Referrals (Mobile)
- ⬜ `POST /referrals/claim` - Mobile-specific referral claiming
  - Note: `/referral-signup` exists for web, but mobile needs device_hash support

### Email Linking (Optional)
- ⬜ `POST /auth/email/link` - Link email to device session
- ⬜ `POST /auth/email/verify` - Verify email link

### Profile Updates
- ⬜ `PUT /profile` - Update phone/email

### Existing Endpoints (Already Work)
- ✅ `GET /me` - User profile (works for device auth)
- ✅ `GET /conversion-rate` - Conversion rate (public)
- ✅ `GET /withdrawals` - List withdrawals (read-only)
- ✅ `GET /referrals` - Referral status (works for device auth)

## 🔧 Next Steps

1. **Refine Device Auth**: Implement proper anonymous/device-based authentication
2. **Apply Database Migration**: Run `004_mobile_schema.sql` on Supabase
3. **Implement Remaining Endpoints**: Complete lessons and device management
4. **Testing**: Test XP credit batching, nonce deduplication, rate limiting
5. **Deploy**: Deploy all new Edge Functions

## 📝 Notes

- All endpoints use the same error format
- Idempotency is required for all mutations
- Rate limiting is implemented without Turnstile
- Device attestation flags reduce XP caps by 50%
- XP balance is always calculated server-side (never client-owned)

