# User Database Structure - Complete Example

This document shows what data one user will have across all database tables in the Learn & Grow Cashout Portal.

## Example User Overview

**User ID:** `72e1aad2-4845-469a-8abc-3a78575c2b70`  
**Email:** `dawdawinz@gmail.com`  
**Phone:** `+255123456789` (stored in users_public, nullable in auth.users)

---

## 1. Auth Schema - `auth.users` (Supabase Auth)

This is the core authentication table managed by Supabase:

```json
{
  "id": "72e1aad2-4845-469a-8abc-3a78575c2b70",
  "email": "dawdawinz@gmail.com",
  "phone": null,
  "email_confirmed_at": "2025-11-09T12:26:07.324534Z",
  "phone_confirmed_at": null,
  "last_sign_in_at": "2025-11-09T18:04:07.836139Z",
  "created_at": "2025-11-09T12:25:59.029827Z",
  "updated_at": "2025-11-09T18:04:07.878082Z",
  "raw_user_meta_data": {
    "sub": "72e1aad2-4845-469a-8abc-3a78575c2b70",
    "email": "dawdawinz@gmail.com",
    "phone": "+255123456789",
    "email_verified": true,
    "phone_verified": false
  },
  "encrypted_password": "[hashed]",
  "role": "authenticated",
  "aud": "authenticated"
}
```

**Key Fields:**
- `id`: UUID primary key (used across all tables)
- `email`: User's email address
- `email_confirmed_at`: When email was verified
- `last_sign_in_at`: Last login timestamp
- `raw_user_meta_data`: Additional metadata stored as JSON

---

## 2. Public Schema - `public.users_public`

Extended user profile information:

```json
{
  "id": "72e1aad2-4845-469a-8abc-3a78575c2b70",
  "email": "dawdawinz@gmail.com",
  "phone": "+255123456789",
  "kyc_level": "none",
  "status": "active",
  "created_at": "2025-11-09T12:25:59.029434Z",
  "updated_at": "2025-11-09T12:25:59.029434Z"
}
```

**Key Fields:**
- `id`: References `auth.users.id`
- `phone`: Can be null (for email-only users)
- `kyc_level`: KYC verification level (`none`, `basic`, `full`)
- `status`: Account status (`active`, `suspended`, `banned`)

---

## 3. XP Ledger - `public.xp_ledger`

All XP transactions (credits and debits):

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "72e1aad2-4845-469a-8abc-3a78575c2b70",
    "source": "lesson_completion",
    "xp_delta": 100,
    "metadata": {
      "lesson_id": "lesson_123",
      "course_name": "Introduction to Programming"
    },
    "created_at": "2025-11-09T14:30:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "72e1aad2-4845-469a-8abc-3a78575c2b70",
    "source": "quiz_completion",
    "xp_delta": 50,
    "metadata": {
      "quiz_id": "quiz_456",
      "score": 85
    },
    "created_at": "2025-11-09T15:00:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "user_id": "72e1aad2-4845-469a-8abc-3a78575c2b70",
    "source": "withdrawal",
    "xp_delta": -5000,
    "metadata": {
      "withdrawal_id": "withdrawal_789"
    },
    "created_at": "2025-11-10T10:00:00Z"
  }
]
```

**Key Fields:**
- `xp_delta`: Positive for credits, negative for debits
- `source`: Where the XP came from/went to
- `metadata`: Additional context as JSON

**Current XP Balance:** Sum of all `xp_delta` values = `100 + 50 - 5000 = -4850` (or `0` if no transactions)

---

## 4. Withdrawals - `public.withdrawals`

All withdrawal requests:

```json
[
  {
    "id": "withdrawal-uuid-1",
    "user_id": "72e1aad2-4845-469a-8abc-3a78575c2b70",
    "phone_snapshot": "+255123456789",
    "xp_debited": 5000,
    "amount_tzs": 250,
    "rate_snapshot": 0.05,
    "status": "pending",
    "payout_ref": null,
    "created_at": "2025-11-10T10:00:00Z",
    "updated_at": "2025-11-10T10:00:00Z"
  },
  {
    "id": "withdrawal-uuid-2",
    "user_id": "72e1aad2-4845-469a-8abc-3a78575c2b70",
    "phone_snapshot": "+255123456789",
    "xp_debited": 10000,
    "amount_tzs": 500,
    "rate_snapshot": 0.05,
    "status": "paid",
    "payout_ref": "PAYOUT_REF_12345",
    "created_at": "2025-11-05T08:00:00Z",
    "updated_at": "2025-11-06T14:30:00Z"
  }
]
```

**Key Fields:**
- `phone_snapshot`: Phone number at time of withdrawal (for audit)
- `xp_debited`: XP amount withdrawn
- `amount_tzs`: Cash amount in Tanzanian Shillings
- `rate_snapshot`: Conversion rate at time of withdrawal
- `status`: `pending`, `paid`, `rejected`
- `payout_ref`: Reference from payment provider (when paid)

---

## 5. Auth Sessions - `auth.sessions`

Active user sessions:

```json
[
  {
    "id": "session-uuid-1",
    "user_id": "72e1aad2-4845-469a-8abc-3a78575c2b70",
    "created_at": "2025-11-09T18:04:07Z",
    "updated_at": "2025-11-09T18:04:07Z",
    "aal": "aal1",
    "ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  }
]
```

**Key Fields:**
- `aal`: Authentication Assurance Level (`aal1`, `aal2`, `aal3`)
- `ip`: IP address of the session
- `user_agent`: Browser/client information

---

## 6. Idempotency Keys - `public.idempotency_keys`

Prevents duplicate withdrawal requests:

```json
[
  {
    "key": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "72e1aad2-4845-469a-8abc-3a78575c2b70",
    "response_body": {
      "id": "withdrawal-uuid-1",
      "status": "pending",
      "amount_tzs": 250
    },
    "created_at": "2025-11-10T10:00:00Z",
    "expires_at": "2025-11-10T11:00:00Z"
  }
]
```

**Purpose:** Ensures the same withdrawal request isn't processed twice

---

## 7. Conversion Rates - `public.conversion_rates`

Historical conversion rates (shared across all users):

```json
[
  {
    "id": "rate-uuid-1",
    "tzs_per_xp": 0.05,
    "effective_from": "2025-11-01T00:00:00Z",
    "created_at": "2025-11-01T00:00:00Z"
  }
]
```

**Note:** This is a system-wide table, not user-specific

---

## Complete User Data Summary

For user `72e1aad2-4845-469a-8abc-3a78575c2b70`:

### Profile Information
- **Email:** dawdawinz@gmail.com
- **Phone:** +255123456789
- **KYC Level:** none
- **Status:** active
- **Account Created:** 2025-11-09

### XP Statistics
- **Current XP Balance:** 0 (no transactions yet)
- **Total XP Transactions:** 0
- **Total XP Earned:** 0
- **Total XP Spent:** 0

### Withdrawal Statistics
- **Total Withdrawals:** 0
- **Paid Withdrawals:** 0
- **Pending Withdrawals:** 0
- **Rejected Withdrawals:** 0

### Authentication
- **Email Verified:** Yes (2025-11-09)
- **Phone Verified:** No
- **Last Sign In:** 2025-11-09 18:04:07
- **Active Sessions:** 1

---

## Database Relationships

```
auth.users (id)
    ├── public.users_public (id → auth.users.id)
    ├── public.xp_ledger (user_id → auth.users.id)
    ├── public.withdrawals (user_id → auth.users.id)
    ├── public.idempotency_keys (user_id → auth.users.id)
    └── auth.sessions (user_id → auth.users.id)
```

---

## Example: User with Activity

Here's what a more active user might look like:

### User Profile
- **XP Balance:** 15,000 XP
- **Total Earned:** 25,000 XP
- **Total Spent:** 10,000 XP (withdrawn)

### Withdrawals
1. **Withdrawal #1** (Paid)
   - Amount: 5,000 XP → 250 TZS
   - Status: paid
   - Date: 2025-11-01

2. **Withdrawal #2** (Pending)
   - Amount: 5,000 XP → 250 TZS
   - Status: pending
   - Date: 2025-11-08

### XP Transactions
- 50 transactions from various sources (lessons, quizzes, etc.)
- Latest: +200 XP from "Advanced Course Completion"

---

## Notes

1. **Phone Field:** Can be `null` for email-only authentication
2. **XP Balance:** Calculated dynamically from `xp_ledger` (not stored)
3. **Rate Snapshots:** Withdrawals store the rate at time of request
4. **RLS Policies:** Users can only see their own data
5. **Soft Deletes:** Users are marked as deleted, not removed

