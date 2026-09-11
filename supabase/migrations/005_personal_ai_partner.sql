-- supabase/migrations/005_personal_ai_partner.sql
-- Smart Education: Personal AI Learning Partner & Learning Memory System

BEGIN;

-- 1. Extend student_profiles with ai_partner_name for rapid query joins
ALTER TABLE public.student_profiles 
    ADD COLUMN IF NOT EXISTS ai_partner_name TEXT DEFAULT 'Nova';

-- 2. Dedicated Persistent AI Learning Partner Profile Table
CREATE TABLE IF NOT EXISTS public.student_ai_profiles (
    student_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    ai_partner_name TEXT NOT NULL DEFAULT 'Nova',
    preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'hinglish')),
    conversation_style TEXT NOT NULL DEFAULT 'friendly' CHECK (conversation_style IN ('simple', 'friendly', 'hinglish', 'detailed', 'visual')),
    explanation_style TEXT NOT NULL DEFAULT 'examples' CHECK (explanation_style IN ('examples', 'step_by_step', 'intuitive', 'visual', 'rigorous')),
    interaction_preferences JSONB NOT NULL DEFAULT '{"hint_first": true, "show_examples": true, "challenge_mode": false, "auto_practice": true}'::jsonb,
    learning_memory JSONB NOT NULL DEFAULT '{"common_mistakes": [], "memorized_facts": [], "focus_topics": [], "learning_habits": []}'::jsonb,
    last_learning_context JSONB DEFAULT '{}'::jsonb,
    activity_summary TEXT DEFAULT 'Learning voyage initiated.',
    setup_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_ai_profiles_student ON public.student_ai_profiles(student_id);

-- 3. Learning Event Tracking Table (Section 24)
CREATE TABLE IF NOT EXISTS public.learning_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'lesson_started', 'quiz_completed', 'hint_requested', 'question_correct', 'question_incorrect', 'ai_question_asked', 'practice_completed', etc.
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_events_student ON public.learning_events(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_type ON public.learning_events(student_id, event_type);
CREATE INDEX IF NOT EXISTS idx_learning_events_created ON public.learning_events(created_at DESC);

-- 4. Strict Row Level Security Policies (Section 22: Privacy Guaranteed)
ALTER TABLE public.student_ai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students manage own AI profile" ON public.student_ai_profiles;
    CREATE POLICY "Students manage own AI profile"
        ON public.student_ai_profiles FOR ALL
        USING (student_id = auth.uid() OR public.is_admin_or_super());
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students manage own learning events" ON public.learning_events;
    CREATE POLICY "Students manage own learning events"
        ON public.learning_events FOR ALL
        USING (student_id = auth.uid() OR public.is_admin_or_super());
EXCEPTION WHEN others THEN null; END $$;

COMMIT;
