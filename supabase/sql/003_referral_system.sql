-- Referral System Migration
-- Adds referral tracking and rewards

-- Table: referral_codes
-- Stores unique referral codes for each user
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, code)
);

-- Table: referrals
-- Tracks referral relationships
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'qualified', 'rewarded'
    qualified_at TIMESTAMPTZ,
    rewarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(referred_id) -- A user can only be referred once
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character alphanumeric code
        new_code := UPPER(
            SUBSTRING(
                MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT),
                1, 8
            )
        );
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
        
        -- Exit loop if code is unique
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update referral qualification
CREATE OR REPLACE FUNCTION public.check_referral_qualification(p_referred_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_referral RECORD;
    v_xp_balance INT;
    v_withdrawal_count INT;
    v_min_xp INT := 10000;
    v_reward_xp INT := 1000;
BEGIN
    -- Get the referral record
    SELECT * INTO v_referral
    FROM public.referrals
    WHERE referred_id = p_referred_id
      AND status = 'pending'
    LIMIT 1;
    
    -- If no pending referral, return false
    IF v_referral IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check XP balance
    SELECT COALESCE(SUM(xp_delta), 0)::INT INTO v_xp_balance
    FROM public.xp_ledger
    WHERE user_id = p_referred_id;
    
    -- Check withdrawal count
    SELECT COUNT(*) INTO v_withdrawal_count
    FROM public.withdrawals
    WHERE user_id = p_referred_id
      AND status IN ('pending', 'paid');
    
    -- Check if user qualifies (10k XP + at least 1 withdrawal)
    IF v_xp_balance >= v_min_xp AND v_withdrawal_count >= 1 THEN
        -- Update referral status to qualified
        UPDATE public.referrals
        SET status = 'qualified',
            qualified_at = NOW(),
            updated_at = NOW()
        WHERE id = v_referral.id;
        
        -- Award reward to referrer (if not already rewarded)
        IF NOT EXISTS (
            SELECT 1 FROM public.referrals
            WHERE id = v_referral.id AND status = 'rewarded'
        ) THEN
            -- Insert XP reward into ledger
            INSERT INTO public.xp_ledger (user_id, source, xp_delta, metadata)
            VALUES (
                v_referral.referrer_id,
                'referral_reward',
                v_reward_xp,
                jsonb_build_object(
                    'referred_user_id', p_referred_id,
                    'referral_id', v_referral.id
                )
            );
            
            -- Update referral status to rewarded
            UPDATE public.referrals
            SET status = 'rewarded',
                rewarded_at = NOW(),
                updated_at = NOW()
            WHERE id = v_referral.id;
        END IF;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create referral code when user is created
CREATE OR REPLACE FUNCTION public.create_referral_code_for_user()
RETURNS TRIGGER AS $$
DECLARE
    v_code TEXT;
BEGIN
    -- Generate unique referral code
    v_code := public.generate_referral_code();
    
    -- Insert referral code
    INSERT INTO public.referral_codes (user_id, code)
    VALUES (NEW.id, v_code);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on users_public insert
CREATE TRIGGER create_referral_code_trigger
    AFTER INSERT ON public.users_public
    FOR EACH ROW
    EXECUTE FUNCTION public.create_referral_code_for_user();

-- Trigger to check referral qualification when withdrawal is created
CREATE OR REPLACE FUNCTION public.check_referral_on_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this withdrawal qualifies the user for referral reward
    PERFORM public.check_referral_qualification(NEW.user_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_referral_on_withdrawal_trigger
    AFTER INSERT ON public.withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION public.check_referral_on_withdrawal();

-- Trigger to update updated_at
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral code
CREATE POLICY "referral_codes_select_own" ON public.referral_codes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view referrals where they are the referrer
CREATE POLICY "referrals_select_as_referrer" ON public.referrals
    FOR SELECT
    USING (auth.uid() = referrer_id);

-- Users can view their own referral record (if they were referred)
CREATE POLICY "referrals_select_as_referred" ON public.referrals
    FOR SELECT
    USING (auth.uid() = referred_id);

-- Service role can insert referrals (for signup)
-- No public insert policy - handled by Edge Functions with service role

