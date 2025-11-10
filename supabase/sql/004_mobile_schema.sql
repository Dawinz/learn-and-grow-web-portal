-- Mobile API Schema
-- Adds support for device-based auth, lessons, and XP event nonces

-- Table: devices
-- Tracks device registrations and attestation flags
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT,
    platform TEXT, -- 'ios' | 'android'
    os_version TEXT,
    app_version TEXT,
    is_emulator BOOLEAN DEFAULT false,
    is_rooted BOOLEAN DEFAULT false,
    is_debug BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, device_fingerprint)
);

-- Table: lessons
-- Published lessons that users can complete
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    content TEXT, -- Lesson content (markdown/HTML)
    xp_reward INT NOT NULL DEFAULT 0,
    duration_minutes INT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: lesson_progress
-- Tracks user progress through lessons
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    progress_percent INT DEFAULT 0 NOT NULL CHECK (progress_percent >= 0 AND progress_percent <= 100),
    time_spent_seconds INT DEFAULT 0 NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, lesson_id)
);

-- Table: xp_event_nonces
-- Tracks XP event nonces to prevent duplicates (24h TTL)
CREATE TABLE IF NOT EXISTS public.xp_event_nonces (
    nonce TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    xp_delta INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_fingerprint ON public.devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_lessons_published_at ON public.lessons(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON public.lessons(category);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON public.lesson_progress(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_xp_event_nonces_user_id ON public.xp_event_nonces(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_event_nonces_expires_at ON public.xp_event_nonces(expires_at);

-- RLS Policies
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_event_nonces ENABLE ROW LEVEL SECURITY;

-- devices: users can select/insert/update their own devices
CREATE POLICY "devices_select_own" ON public.devices
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "devices_insert_own" ON public.devices
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "devices_update_own" ON public.devices
    FOR UPDATE
    USING (auth.uid() = user_id);

-- lessons: public read (published only)
CREATE POLICY "lessons_select_published" ON public.lessons
    FOR SELECT
    USING (published_at IS NOT NULL AND published_at <= NOW());

-- lesson_progress: users can select/insert/update their own progress
CREATE POLICY "lesson_progress_select_own" ON public.lesson_progress
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "lesson_progress_insert_own" ON public.lesson_progress
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lesson_progress_update_own" ON public.lesson_progress
    FOR UPDATE
    USING (auth.uid() = user_id);

-- xp_event_nonces: no public access (service role only for deduplication)
-- No policies = no public access

-- Functions

-- Function to check if device limit exceeded
CREATE OR REPLACE FUNCTION public.check_device_limit(p_user_id UUID, p_max_devices INT DEFAULT 5)
RETURNS BOOLEAN AS $$
DECLARE
    v_device_count INT;
BEGIN
    SELECT COUNT(*) INTO v_device_count
    FROM public.devices
    WHERE user_id = p_user_id;
    
    RETURN v_device_count < p_max_devices;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired XP event nonces
CREATE OR REPLACE FUNCTION public.clean_expired_xp_nonces()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.xp_event_nonces
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON public.lessons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_progress_updated_at
    BEFORE UPDATE ON public.lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

