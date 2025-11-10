# Mobile API Design - Learn & Grow

This document outlines the mobile API surface that syncs with the existing web portal backend.

## Overview

The mobile app (Flutter) will use the same Supabase backend as the web portal. All endpoints are Supabase Edge Functions accessible at:
```
https://{project-ref}.supabase.co/functions/v1/{endpoint}
```

## Authentication & Device Management

### POST /auth/device/start
Create or restore a guest session (device-based).

**Request:**
```json
{
  "device_id": "string (optional, for restore)",
  "device_fingerprint": "string",
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

**Response:**
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

**Rate Limit:** 10 requests/hour per IP

### POST /devices/register
Register or update device fingerprint and attestation flags.

**Request:**
```json
{
  "device_fingerprint": "string",
  "device_name": "string (optional)",
  "attestation_flags": {
    "is_emulator": boolean,
    "is_rooted": boolean,
    "is_debug": boolean
  }
}
```

**Response:**
```json
{
  "device_id": "uuid",
  "registered_at": "timestamp"
}
```

**Rate Limit:** 5 requests/hour per device

### POST /auth/email/link (Optional)
Link email to existing device session.

**Request:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "success": boolean,
  "message": "string"
}
```

### POST /auth/email/verify (Optional)
Verify email link and complete account linking.

**Request:**
```json
{
  "token": "string"
}
```

**Response:**
```json
{
  "success": boolean,
  "user_id": "uuid"
}
```

## XP & Progress

### GET /xp/balance
Get current XP balance (sum of ledger).

**Response:**
```json
{
  "xp_balance": 0,
  "updated_at": "timestamp"
}
```

### POST /xp/credit
Credit XP in batches with idempotency.

**Request:**
```json
{
  "events": [
    {
      "nonce": "string (unique per event)",
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

**Headers:**
- `Idempotency-Key`: Required (UUID)

**Response:**
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

**Rate Limit:** 
- 100 events/minute per device
- 10,000 XP/day per device (configurable)
- Reduced caps for emulator/rooted devices

### GET /xp/history
Get XP ledger history with pagination.

**Query Parameters:**
- `limit`: number (default: 50, max: 100)
- `cursor`: timestamp (ISO string, for pagination)

**Response:**
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

## Lessons

### GET /lessons
Get published lessons.

**Query Parameters:**
- `limit`: number (default: 50)
- `offset`: number (default: 0)
- `category`: string (optional)

**Response:**
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

### POST /lessons/{lesson_id}/progress
Update partial lesson progress.

**Request:**
```json
{
  "progress_percent": 50,
  "time_spent_seconds": 300,
  "metadata": {}
}
```

**Response:**
```json
{
  "progress_id": "uuid",
  "progress_percent": 50,
  "updated_at": "timestamp"
}
```

**Note:** Latest write wins by timestamp.

### POST /lessons/{lesson_id}/complete
Mark lesson as complete (idempotent, awards XP).

**Request:**
```json
{
  "time_spent_seconds": 600,
  "metadata": {}
}
```

**Headers:**
- `Idempotency-Key`: Required (UUID)

**Response:**
```json
{
  "completion_id": "uuid",
  "xp_awarded": 100,
  "total_xp": 5100,
  "completed_at": "timestamp"
}
```

**Note:** XP is only awarded once per lesson completion.

## Referrals

### POST /referrals/claim
Claim a referral code (from mobile app).

**Request:**
```json
{
  "referral_code": "ABC12345",
  "installer_id": "string (optional)",
  "device_hash": "string (optional)"
}
```

**Headers:**
- `Idempotency-Key`: Required (UUID)

**Response:**
```json
{
  "success": boolean,
  "message": "string",
  "referral": {
    "id": "uuid",
    "referrer_id": "uuid",
    "status": "pending",
    "created_at": "timestamp"
  }
}
```

**Rate Limit:** 5 claims/hour per device

### GET /referrals/status
Get referral statistics for current user.

**Response:**
```json
{
  "referral_code": "ABC12345",
  "stats": {
    "total_referrals": 5,
    "pending_referrals": 2,
    "qualified_referrals": 1,
    "rewarded_referrals": 1,
    "total_rewards_earned": 1000
  }
}
```

## Conversion & Withdrawals (Read-Only from Mobile)

### GET /conversion/rate
Get current conversion rate (already exists as `/conversion-rate`).

**Response:**
```json
{
  "tzs_per_xp": 0.05,
  "effective_from": "timestamp"
}
```

### GET /withdrawals
List withdrawals (read-only, already exists).

**Query Parameters:**
- `page`: number (default: 1)
- `page_size`: number (default: 20)

### GET /withdrawals/{id}
Get single withdrawal details.

**Response:**
```json
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
```

## System & Profile

### GET /me
Get user profile (already exists).

**Response:**
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

### GET /version
Get API version and supported features.

**Response:**
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

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "timestamp",
  "database": "connected"
}
```

### GET /profile
Get extended profile (same as /me).

### PUT /profile
Update profile (phone/email).

**Request:**
```json
{
  "phone": "string (optional)",
  "email": "string (optional)"
}
```

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "phone": "string|null",
    "email": "string|null",
    "kyc_level": "string",
    "status": "string"
  }
}
```

## Error Response Format

All errors follow this uniform format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "code": "string|number (optional)",
  "details": {} // optional additional context
}
```

**Common Error Codes:**
- `auth_required` (401)
- `rate_limited` (429)
- `invalid_request` (400)
- `not_found` (404)
- `internal_error` (500)
- `duplicate_event` (409) - for idempotency conflicts

## Data Ownership & Conflict Rules

1. **XP Balance**: Always calculated server-side as `SUM(xp_ledger)`. Client never owns the balance.
2. **Idempotency**: All mutations require `Idempotency-Key` header (UUID).
3. **Nonces**: Each XP event must have a unique `nonce`. Server rejects duplicates (24h cache).
4. **Referrals**: First valid claim per device/user wins. Prevents multi-claiming.
5. **Lessons**: Latest write wins by timestamp. Completion is idempotent (no double award).

## Rate Limiting (Without Turnstile)

Rate limits are enforced per:
- Device fingerprint
- User ID
- IP address

**Limits:**
- `/auth/device/start`: 10/hour per IP
- `/xp/credit`: 100 events/minute per device, 10,000 XP/day per device
- `/referrals/claim`: 5/hour per device
- Emulator/rooted devices: 50% of normal limits

## Device Policy

- Limit: 5 devices per user (configurable)
- Emulator/root flags reduce XP caps by 50%
- Blocklist: email/phone/device/IP can be blocked centrally

## Mobile ↔ Web Consistency

- Web and mobile share the same XP ledger
- Referral rewards are visible on both platforms
- Web initiates withdrawals; mobile can read status
- No extra verification steps (no captchas)

