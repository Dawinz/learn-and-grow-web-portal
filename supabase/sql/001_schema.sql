-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: users_public
CREATE TABLE IF NOT EXISTS public.users_public (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT UNIQUE, -- Made nullable to support email-only authentication
    email TEXT UNIQUE,
    kyc_level TEXT DEFAULT 'none' NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: xp_ledger
CREATE TABLE IF NOT EXISTS public.xp_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    xp_delta INT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: conversion_rates
CREATE TABLE IF NOT EXISTS public.conversion_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tzs_per_xp NUMERIC(12,6) NOT NULL,
    effective_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_snapshot TEXT NOT NULL,
    xp_debited INT NOT NULL,
    amount_tzs INT NOT NULL,
    rate_snapshot NUMERIC(12,6) NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    payout_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: blocks
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'ip', 'email', 'phone', 'user_id'
    value TEXT NOT NULL,
    reason TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(type, value)
);

-- Table: idempotency_keys
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    key TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    response_body JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Table: rate_limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP address or email
    endpoint TEXT NOT NULL,
    count INT DEFAULT 1 NOT NULL,
    window_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(identifier, endpoint, window_start)
);

-- View: user_xp_balance
CREATE OR REPLACE VIEW public.user_xp_balance AS
SELECT
    user_id,
    COALESCE(SUM(xp_delta), 0)::INT AS xp
FROM public.xp_ledger
GROUP BY user_id;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_xp_ledger_user_id ON public.xp_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_created_at ON public.xp_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON public.withdrawals(created_at);
CREATE INDEX IF NOT EXISTS idx_blocks_type_value ON public.blocks(type, value);
CREATE INDEX IF NOT EXISTS idx_blocks_expires_at ON public.blocks(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON public.idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint ON public.rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_conversion_rates_effective_from ON public.conversion_rates(effective_from DESC);

-- RLS Policies

-- Enable RLS
ALTER TABLE public.users_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_rates ENABLE ROW LEVEL SECURITY;

-- users_public: users can select/update their own row
CREATE POLICY "users_public_select_own" ON public.users_public
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "users_public_update_own" ON public.users_public
    FOR UPDATE
    USING (auth.uid() = id);

-- xp_ledger: users can select/insert their own rows
CREATE POLICY "xp_ledger_select_own" ON public.xp_ledger
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "xp_ledger_insert_own" ON public.xp_ledger
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- withdrawals: users can select/insert their own rows
CREATE POLICY "withdrawals_select_own" ON public.withdrawals
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "withdrawals_insert_own" ON public.withdrawals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- conversion_rates: public read, service role write
CREATE POLICY "conversion_rates_select_all" ON public.conversion_rates
    FOR SELECT
    USING (true);

-- blocks: no public access (service role only)
-- No policies = no public access

-- idempotency_keys: users can select their own
CREATE POLICY "idempotency_keys_select_own" ON public.idempotency_keys
    FOR SELECT
    USING (auth.uid() = user_id);

-- rate_limits: no public access (service role only)
-- No policies = no public access

-- Functions

-- Function to get current conversion rate
CREATE OR REPLACE FUNCTION public.get_current_conversion_rate()
RETURNS NUMERIC(12,6) AS $$
    SELECT tzs_per_xp
    FROM public.conversion_rates
    ORDER BY effective_from DESC
    LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_max_count INT,
    p_window_hours INT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INT;
    v_window_start TIMESTAMPTZ;
BEGIN
    -- Calculate window start
    v_window_start := date_trunc('hour', NOW()) - (p_window_hours || ' hours')::INTERVAL;
    
    -- Get count in current window
    SELECT COALESCE(SUM(count), 0) INTO v_count
    FROM public.rate_limits
    WHERE identifier = p_identifier
      AND endpoint = p_endpoint
      AND window_start >= v_window_start;
    
    -- Check if limit exceeded
    IF v_count >= p_max_count THEN
        RETURN FALSE;
    END IF;
    
    -- Increment counter
    INSERT INTO public.rate_limits (identifier, endpoint, window_start, count)
    VALUES (p_identifier, p_endpoint, date_trunc('hour', NOW()), 1)
    ON CONFLICT (identifier, endpoint, window_start)
    DO UPDATE SET count = rate_limits.count + 1;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired rate limits
CREATE OR REPLACE FUNCTION public.clean_expired_rate_limits()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.rate_limits
    WHERE window_start < NOW() - INTERVAL '24 hours';
    
    DELETE FROM public.idempotency_keys
    WHERE expires_at < NOW();
    
    DELETE FROM public.blocks
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_public_updated_at
    BEFORE UPDATE ON public.users_public
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON public.withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

