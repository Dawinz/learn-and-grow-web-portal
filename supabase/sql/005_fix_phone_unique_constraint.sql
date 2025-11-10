-- Fix: Replace UNIQUE constraint on phone with partial unique index
-- This allows multiple NULL values while keeping non-NULL phone numbers unique
-- This prevents "duplicate key value violates unique constraint" errors

-- Step 1: Drop the existing UNIQUE constraint on phone
ALTER TABLE public.users_public 
  DROP CONSTRAINT IF EXISTS users_public_phone_key;

-- Step 2: Create a partial unique index that only applies to non-NULL phone values
-- This allows multiple NULL values (for email-only users) while keeping phone numbers unique
CREATE UNIQUE INDEX IF NOT EXISTS users_public_phone_unique_not_null 
  ON public.users_public(phone) 
  WHERE phone IS NOT NULL;

-- Step 3: Ensure phone column is nullable (should already be done, but just in case)
ALTER TABLE public.users_public 
  ALTER COLUMN phone DROP NOT NULL;

