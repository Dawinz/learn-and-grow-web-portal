-- Fix: Make phone nullable to support email-only authentication
-- This allows users to sign up with email without requiring a phone number

-- Step 1: Drop the existing NOT NULL constraint on phone
ALTER TABLE public.users_public 
  ALTER COLUMN phone DROP NOT NULL;

-- Step 2: Update the unique constraint to allow multiple NULL values
-- PostgreSQL allows multiple NULLs in a UNIQUE column, but we need to ensure
-- non-NULL phone numbers are still unique
-- The existing UNIQUE constraint will handle this correctly

-- Step 3: Update any existing NULL phone values to use email as fallback
-- (This is optional, but helps with data consistency)
UPDATE public.users_public 
SET phone = COALESCE(phone, 'email:' || email)
WHERE phone IS NULL AND email IS NOT NULL;

-- Note: If you want to keep phone truly unique for non-NULL values only,
-- you could create a partial unique index:
-- CREATE UNIQUE INDEX users_public_phone_unique_not_null 
--   ON public.users_public(phone) 
--   WHERE phone IS NOT NULL;
-- But the existing UNIQUE constraint should work fine with NULLs

