-- supabase/migrations/006_learning_intelligence_overhaul.sql
-- Smart Education: Learning Intelligence, Study Sessions, Relationships & Multi-Tenant Isolation

BEGIN;

-- 1. Study Sessions Table (Smart session length support: 5, 10, 15, 20, 30 min)
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes IN (5, 10, 15, 20, 30, 45, 60)),
    session_type TEXT NOT NULL DEFAULT 'practice' CHECK (session_type IN ('quick_burst', 'concept_deep_dive', 'revision', 'practice', 'challenge')),
    tasks_planned JSONB NOT NULL DEFAULT '[]'::jsonb,
    tasks_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'abandoned')),
    xp_earned INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_student ON public.study_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON public.study_sessions(student_id, status);

-- 2. Teacher-Student Relationships Table
CREATE TABLE IF NOT EXISTS public.teacher_student_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (teacher_id, student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_student_teacher ON public.teacher_student_relationships(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_student_student ON public.teacher_student_relationships(student_id);

-- 3. Parent-Student Relationships Table
CREATE TABLE IF NOT EXISTS public.parent_student_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL DEFAULT 'guardian' CHECK (relationship_type IN ('father', 'mother', 'guardian', 'other')),
    verified BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (parent_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON public.parent_student_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student ON public.parent_student_relationships(student_id);

-- 4. Compatibility View: student_ai_preferences
-- Maps to student_ai_profiles for legacy or alternative route queries
CREATE OR REPLACE VIEW public.student_ai_preferences AS
SELECT 
    student_id,
    ai_partner_name AS nova_name,
    preferred_language AS language,
    conversation_style AS tone,
    explanation_style AS teaching_style,
    interaction_preferences AS preferred_explanation_style,
    updated_at
FROM public.student_ai_profiles;

-- 5. Compatibility View: student_learning_profiles
CREATE OR REPLACE VIEW public.student_learning_profiles AS
SELECT 
    sp.id AS student_id,
    sp.learning_preferences,
    sp.preferred_language,
    sp.learning_pace,
    sp.strengths,
    sp.support_signals,
    sp.total_points AS xp,
    sp.level,
    sp.current_streak AS streak,
    sp.accessibility_settings,
    ai.learning_memory,
    ai.ai_partner_name,
    ai.conversation_style,
    ai.updated_at
FROM public.student_profiles sp
LEFT JOIN public.student_ai_profiles ai ON ai.student_id = sp.id;

-- 6. Row Level Security Policies
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_student_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_relationships ENABLE ROW LEVEL SECURITY;

-- Study Sessions: Student can manage own sessions
DO $$ BEGIN
    DROP POLICY IF EXISTS "Students manage own study sessions" ON public.study_sessions;
    CREATE POLICY "Students manage own study sessions"
        ON public.study_sessions FOR ALL
        USING (student_id = auth.uid() OR public.is_admin_or_super());
EXCEPTION WHEN others THEN null; END $$;

-- Teacher-Student Relationships
DO $$ BEGIN
    DROP POLICY IF EXISTS "Teachers and students can view their relationships" ON public.teacher_student_relationships;
    CREATE POLICY "Teachers and students can view their relationships"
        ON public.teacher_student_relationships FOR SELECT
        USING (
            teacher_id = auth.uid() 
            OR student_id = auth.uid() 
            OR public.is_admin_or_super()
        );
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins and teachers manage relationships" ON public.teacher_student_relationships;
    CREATE POLICY "Admins and teachers manage relationships"
        ON public.teacher_student_relationships FOR ALL
        USING (public.is_teacher() OR public.is_admin_or_super());
EXCEPTION WHEN others THEN null; END $$;

-- Parent-Student Relationships
DO $$ BEGIN
    DROP POLICY IF EXISTS "Parents and students can view their link" ON public.parent_student_relationships;
    CREATE POLICY "Parents and students can view their link"
        ON public.parent_student_relationships FOR SELECT
        USING (
            parent_id = auth.uid() 
            OR student_id = auth.uid() 
            OR public.is_admin_or_super()
        );
EXCEPTION WHEN others THEN null; END $$;

COMMIT;
