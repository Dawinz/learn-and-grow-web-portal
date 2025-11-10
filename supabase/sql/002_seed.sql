-- Seed conversion rate
INSERT INTO public.conversion_rates (tzs_per_xp, effective_from)
VALUES (
  COALESCE(
    (SELECT tzs_per_xp::NUMERIC(12,6) FROM (SELECT '0.05'::TEXT AS tzs_per_xp) AS env),
    0.05::NUMERIC(12,6)
  ),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Note: Test user and XP ledger entries should be created via Supabase Auth
-- This script assumes you'll create a test user manually or via the API
-- Example SQL to create test user XP (run after creating auth user):
/*
-- First, create auth user via Supabase Auth API or dashboard
-- Then run:

-- Insert into users_public (replace USER_ID with actual auth user ID)
INSERT INTO public.users_public (id, phone, email, kyc_level, status)
VALUES (
  'USER_ID_HERE'::UUID,
  '+255123456789',
  'test@example.com',
  'none',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Insert XP ledger entries totaling 18,000 XP
INSERT INTO public.xp_ledger (user_id, source, xp_delta, metadata)
VALUES
  ('USER_ID_HERE'::UUID, 'signup_bonus', 5000, '{"type": "bonus"}'::jsonb),
  ('USER_ID_HERE'::UUID, 'activity', 3000, '{"activity": "daily_checkin"}'::jsonb),
  ('USER_ID_HERE'::UUID, 'activity', 5000, '{"activity": "lesson_complete"}'::jsonb),
  ('USER_ID_HERE'::UUID, 'activity', 5000, '{"activity": "achievement"}'::jsonb)
ON CONFLICT DO NOTHING;
*/

