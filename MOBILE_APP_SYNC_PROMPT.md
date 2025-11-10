# Mobile App Backend Sync Prompt

Copy and paste this entire prompt into Cursor when working on the mobile app to ensure it stays in sync with the backend.

---

## Context: Mobile App Backend Integration

You are working on a Flutter mobile app ("Learn & Grow") that syncs with a Supabase backend. The backend is already fully implemented and deployed. **DO NOT modify the mobile app's existing structure or architecture.** Your task is to ensure the app correctly integrates with the backend APIs and stays in sync.

## Backend API Base URL

```
https://iscqpvwtikwqquvxlpsr.supabase.co/functions/v1
```

## Authentication

The mobile app uses **device-based guest sessions** for anonymous users. Users can optionally link their email later.

### Device Authentication Flow

1. **First Launch**: Call `POST /auth-device-start` with device fingerprint
2. **Subsequent Launches**: Use stored `device_id` to restore session
3. **Optional**: Link email later (not yet implemented in backend)

### Required Headers

For authenticated endpoints:
```
Authorization: Bearer {access_token}
apikey: {SUPABASE_ANON_KEY}
Content-Type: application/json
```

For mutations (POST/PUT):
```
Idempotency-Key: {UUID}  // Required for: /xp-credit, /lessons-complete, /referral-signup
```

## Core APIs (All Implemented & Working)

### 1. Device Authentication

**POST /auth-device-start**
- **Purpose**: Create/restore guest session
- **Auth Required**: No
- **Request Body**:
```json
{
  "device_id": "uuid (optional, for restore)",
  "device_fingerprint": "string (required)",
  "installer_id": "string (optional)",
  "device_metadata": {
    "platform": "ios|android",
    "os_version": "string",
    "app_version": "string",
    "is_emulator": boolean,
    "is_rooted": boolean
  }
}
```
- **Response**:
```json
{
  "session": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_at": "timestamp"
  },
  "user_id": "uuid",
  "is_new_user": boolean,
  "device_id": "uuid"
}
```
- **Rate Limit**: 10 requests/hour per IP
- **Store**: `access_token`, `refresh_token`, `device_id`, `user_id` for future requests

### 2. User Profile & XP Balance

**GET /me**
- **Purpose**: Get user profile and XP balance
- **Auth Required**: Yes (Bearer token)
- **Response**:
```json
{
  "profile": {
    "id": "uuid",
    "phone": "string|null",
    "email": "string|null",
    "kyc_level": "string",
    "status": "string"
  },
  "xp_balance": 5000,
  "referral_code": "ABC12345"
}
```
- **Note**: This endpoint returns XP balance, so you don't need a separate `/xp/balance` endpoint

### 3. XP Credit (Batched)

**POST /xp-credit**
- **Purpose**: Credit XP in batches with idempotency
- **Auth Required**: Yes
- **Headers**: `Idempotency-Key: {UUID}` (required)
- **Request Body**:
```json
{
  "events": [
    {
      "nonce": "string (unique per event, required)",
      "source": "lesson|quiz|ad|daily|referral_reward",
      "xp_delta": 100,
      "metadata": {
        "lesson_id": "uuid (optional)",
        "quiz_id": "uuid (optional)",
        "ad_id": "string (optional)"
      }
    }
  ]
}
```
- **Response**:
```json
{
  "credited": 2,
  "duplicates": 0,
  "total_xp": 5000,
  "events": [
    {
      "nonce": "string",
      "status": "credited|duplicate",
      "xp_delta": 100
    }
  ]
}
```
- **Rate Limits**: 
  - 100 events/minute per device
  - 10,000 XP/day per device
  - Reduced caps for emulator/rooted devices (50%)
- **Important**: 
  - Each event MUST have a unique `nonce`
  - Server deduplicates by nonce (24h cache)
  - Always include `Idempotency-Key` header

### 4. XP History

**GET /xp-history**
- **Purpose**: Get XP ledger history with cursor pagination
- **Auth Required**: Yes
- **Query Parameters**:
  - `limit`: number (default: 50, max: 100)
  - `cursor`: timestamp (ISO string, for pagination)
- **Response**:
```json
{
  "events": [
    {
      "id": "uuid",
      "source": "string",
      "xp_delta": 100,
      "metadata": {},
      "created_at": "timestamp"
    }
  ],
  "next_cursor": "timestamp|null",
  "has_more": boolean
}
```

### 5. Lessons

**GET /lessons**
- **Purpose**: List published lessons
- **Auth Required**: No (public endpoint)
- **Query Parameters**:
  - `limit`: number (default: 50)
  - `offset`: number (default: 0)
  - `category`: string (optional)
- **Response**:
```json
{
  "lessons": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "category": "string",
      "xp_reward": 100,
      "duration_minutes": 10,
      "published_at": "timestamp",
      "created_at": "timestamp"
    }
  ],
  "total": 50
}
```

**POST /lessons-progress**
- **Purpose**: Update partial lesson progress
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "lesson_id": "uuid",
  "progress_percent": 50,
  "time_spent_seconds": 300,
  "metadata": {}
}
```
- **Response**:
```json
{
  "progress_id": "uuid",
  "progress_percent": 50,
  "updated_at": "timestamp"
}
```
- **Note**: Latest write wins by timestamp

**POST /lessons-complete**
- **Purpose**: Mark lesson as complete (idempotent, awards XP)
- **Auth Required**: Yes
- **Headers**: `Idempotency-Key: {UUID}` (required)
- **Request Body**:
```json
{
  "lesson_id": "uuid",
  "time_spent_seconds": 600,
  "metadata": {}
}
```
- **Response**:
```json
{
  "completion_id": "uuid",
  "xp_awarded": 100,
  "total_xp": 5100,
  "completed_at": "timestamp"
}
```
- **Important**: XP is only awarded once per lesson completion (idempotent)

### 6. Referrals

**GET /referrals**
- **Purpose**: Get referral statistics
- **Auth Required**: Yes
- **Response**:
```json
{
  "referral_code": "ABC12345",
  "stats": {
    "total_referrals": 5,
    "pending_referrals": 2,
    "qualified_referrals": 1,
    "rewarded_referrals": 1,
    "total_rewards_earned": 1000
  },
  "referrals": [...]
}
```

**POST /referral-signup**
- **Purpose**: Claim/record referral code (works for mobile)
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "user_id": "uuid",
  "referral_code": "ABC12345"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "string",
  "referral": {...}
}
```
- **Note**: Use this endpoint for mobile referral claiming (not `/referrals/claim`)

### 7. Conversion & Withdrawals

**GET /conversion-rate**
- **Purpose**: Get current XP to TZS conversion rate
- **Auth Required**: Yes
- **Response**:
```json
{
  "tzs_per_xp": 0.05,
  "effective_from": "timestamp"
}
```

**GET /withdrawals**
- **Purpose**: List withdrawals (read-only for mobile)
- **Auth Required**: Yes
- **Query Parameters**:
  - `page`: number (default: 1)
  - `page_size`: number (default: 20)
- **Response**:
```json
{
  "withdrawals": [
    {
      "id": "uuid",
      "xp_debited": 5000,
      "amount_tzs": 250,
      "rate_snapshot": 0.05,
      "status": "pending|paid|rejected",
      "payout_ref": "string|null",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "total": 10,
  "page": 1,
  "page_size": 20
}
```
- **Note**: Mobile can only READ withdrawals, not create them (web-only)

### 8. System Endpoints

**GET /version**
- **Purpose**: Get API version and feature flags
- **Auth Required**: No
- **Response**:
```json
{
  "version": "1.0.0",
  "api_version": "1",
  "features": {
    "device_auth": true,
    "lessons": true,
    "referrals": true,
    "withdrawals": false
  }
}
```

**GET /health**
- **Purpose**: Health check
- **Auth Required**: No
- **Response**:
```json
{
  "status": "ok",
  "timestamp": "timestamp",
  "database": "connected"
}
```

## Error Handling

All errors follow this format:
```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "code": "string|number (optional)",
  "details": {} // optional
}
```

**Common Error Codes:**
- `auth_required` (401) - Missing or invalid token
- `rate_limited` (429) - Too many requests
- `invalid_request` (400) - Invalid request body/params
- `not_found` (404) - Resource not found
- `internal_error` (500) - Server error
- `duplicate_event` (409) - Idempotency conflict

## Critical Rules

1. **XP Balance**: Always calculated server-side. Never trust client-side balance. Always fetch from `/me` or `/xp-history`.

2. **Idempotency**: 
   - ALL mutations require `Idempotency-Key` header (UUID)
   - Required for: `/xp-credit`, `/lessons-complete`, `/referral-signup`
   - Generate a new UUID for each unique operation
   - Retry with same key if request fails (network error)

3. **Nonces**: 
   - Each XP event MUST have a unique `nonce`
   - Server rejects duplicates (24h cache)
   - Use UUID or timestamp-based nonce

4. **Referrals**: 
   - First valid claim per device/user wins
   - Prevents multi-claiming
   - Use `/referral-signup` endpoint

5. **Lessons**: 
   - Latest write wins by timestamp for progress
   - Completion is idempotent (no double award)
   - Always include `Idempotency-Key` for completion

6. **Rate Limiting**:
   - `/auth-device-start`: 10/hour per IP
   - `/xp-credit`: 100 events/minute, 10,000 XP/day per device
   - Emulator/rooted devices: 50% of normal limits
   - Handle 429 errors gracefully with retry logic

## Data Sync Strategy

1. **XP Balance**: Fetch from `/me` on app start and after XP credit operations
2. **XP History**: Use cursor pagination for efficient loading
3. **Lessons**: Cache locally, refresh periodically
4. **Progress**: Save locally, sync periodically (latest write wins)
5. **Offline Support**: Queue XP events and sync when online

## Testing Checklist

When integrating, verify:
- [ ] Device authentication works (guest session)
- [ ] XP credit with idempotency (test duplicate nonces)
- [ ] XP history pagination works
- [ ] Lesson progress updates correctly
- [ ] Lesson completion awards XP only once
- [ ] Referral claiming works
- [ ] Error handling for all error codes
- [ ] Rate limiting is handled gracefully
- [ ] Token refresh works (if implemented)

## Important Notes

- **DO NOT** modify the mobile app's existing structure
- **DO NOT** add extra verification steps (no captchas)
- **DO NOT** rebuild the web portal (it already exists)
- **DO** use the exact API endpoints listed above
- **DO** follow the request/response formats exactly
- **DO** handle all error cases
- **DO** implement proper idempotency for all mutations
- **DO** respect rate limits

## Backend Status

✅ All 13 core mobile APIs are implemented and deployed
✅ Backend is production-ready
✅ Database schema is complete
✅ All Edge Functions are deployed

The mobile app should integrate with these APIs without modifying the backend.

---

**Use this prompt whenever working on mobile app backend integration to ensure consistency and correctness.**

