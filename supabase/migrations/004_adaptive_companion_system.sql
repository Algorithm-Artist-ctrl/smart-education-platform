-- 004_adaptive_companion_system.sql
-- Smart Education: Adaptive Learning Companion, Topic Mastery, Preferences & Portfolio Schema

BEGIN;

-- 1. Extend student_profiles with Learning Preferences & Support Signals
ALTER TABLE public.student_profiles 
    ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
    ADD COLUMN IF NOT EXISTS learning_preferences TEXT[] DEFAULT '{"visual", "practice"}',
    ADD COLUMN IF NOT EXISTS support_signals TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS learning_pace TEXT DEFAULT 'steady',
    ADD COLUMN IF NOT EXISTS strengths TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS accessibility_settings JSONB DEFAULT '{"focus_mode": false, "read_aloud": false, "font_scale": 1, "dyslexia_font": false, "high_contrast": false, "reduced_motion": false, "lite_mode": false}';

-- 2. Topic Mastery (First-Class Mastery Data per Topic)
CREATE TABLE IF NOT EXISTS public.topic_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    mastery_score NUMERIC NOT NULL DEFAULT 0, -- 0 to 100
    accuracy NUMERIC NOT NULL DEFAULT 0,      -- 0 to 100
    attempts INT NOT NULL DEFAULT 0,
    correct_attempts INT NOT NULL DEFAULT 0,
    incorrect_attempts INT NOT NULL DEFAULT 0,
    hints_used INT NOT NULL DEFAULT 0,
    average_time_seconds NUMERIC DEFAULT 0,
    difficulty INT NOT NULL DEFAULT 1,       -- 1 to 5
    confidence TEXT DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'learning', 'needs_support', 'improving', 'mastered')),
    last_attempted_at TIMESTAMPTZ,
    last_mastered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_topic_mastery_student ON public.topic_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_topic ON public.topic_mastery(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_status ON public.topic_mastery(student_id, status);

-- 3. Diagnostic Results Table
CREATE TABLE IF NOT EXISTS public.diagnostic_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    overall_score NUMERIC NOT NULL DEFAULT 0,
    summary TEXT NOT NULL,
    subject_scores JSONB NOT NULL DEFAULT '{}',
    identified_strengths TEXT[] DEFAULT '{}',
    identified_support_signals TEXT[] DEFAULT '{}',
    recommended_actions JSONB NOT NULL DEFAULT '[]',
    recommended_path JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_results_student ON public.diagnostic_results(student_id);

-- 4. Creativity Lab Submissions
CREATE TABLE IF NOT EXISTS public.creativity_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    submission_type TEXT NOT NULL CHECK (submission_type IN ('drawing', 'text', 'explanation', 'design', 'experiment')),
    content_text TEXT,
    drawing_data TEXT,
    reasoning_text TEXT,
    ai_feedback TEXT,
    creativity_score INT DEFAULT 85,
    understanding_score INT DEFAULT 85,
    xp_earned INT DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creativity_student ON public.creativity_submissions(student_id);

-- 5. Real-World Life Missions
CREATE TABLE IF NOT EXISTS public.life_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    task_prompt TEXT NOT NULL,
    xp_reward INT NOT NULL DEFAULT 120,
    coins_reward INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mission_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES public.life_missions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    observation_notes TEXT NOT NULL,
    media_url TEXT,
    ai_feedback TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    xp_earned INT NOT NULL DEFAULT 120,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(mission_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_mission_submissions_student ON public.mission_submissions(student_id);

-- 6. Learning Portfolio
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('project', 'achievement', 'creativity', 'mission', 'certificate', 'milestone')),
    description TEXT,
    artifact_url TEXT,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_student ON public.portfolio_items(student_id);

-- 7. Learning Experience & Wellbeing Signals
CREATE TABLE IF NOT EXISTS public.wellbeing_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    feeling TEXT NOT NULL CHECK (feeling IN ('good', 'okay', 'difficult', 'overwhelmed')),
    session_notes TEXT,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, recorded_date)
);

CREATE INDEX IF NOT EXISTS idx_wellbeing_signals_student ON public.wellbeing_signals(student_id);

-- 8. Nova AI Conversations & Messages
CREATE TABLE IF NOT EXISTS public.nova_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_name TEXT,
    topic_name TEXT,
    title TEXT NOT NULL DEFAULT 'Tutoring Session',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nova_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.nova_conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'nova')),
    text TEXT NOT NULL,
    action_type TEXT,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nova_conversations_student ON public.nova_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_nova_messages_convo ON public.nova_messages(conversation_id);

-- 9. Row Level Security Policies
ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creativity_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellbeing_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students manage own topic mastery" ON public.topic_mastery;
    CREATE POLICY "Students manage own topic mastery"
        ON public.topic_mastery FOR ALL
        USING (
            student_id = auth.uid() 
            OR public.is_teacher() 
            OR public.is_admin_or_super()
            OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = topic_mastery.student_id AND sp.parent_id = auth.uid())
        );
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students manage own diagnostic results" ON public.diagnostic_results;
    CREATE POLICY "Students manage own diagnostic results"
        ON public.diagnostic_results FOR ALL
        USING (
            student_id = auth.uid() 
            OR public.is_teacher() 
            OR public.is_admin_or_super()
            OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = diagnostic_results.student_id AND sp.parent_id = auth.uid())
        );
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students manage own creativity submissions" ON public.creativity_submissions;
    CREATE POLICY "Students manage own creativity submissions"
        ON public.creativity_submissions FOR ALL
        USING (
            student_id = auth.uid() 
            OR public.is_teacher() 
            OR public.is_admin_or_super()
            OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = creativity_submissions.student_id AND sp.parent_id = auth.uid())
        );
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone authenticated can view life missions" ON public.life_missions;
    CREATE POLICY "Anyone authenticated can view life missions"
        ON public.life_missions FOR SELECT
        TO authenticated USING (true);
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students manage own mission submissions" ON public.mission_submissions;
    CREATE POLICY "Students manage own mission submissions"
        ON public.mission_submissions FOR ALL
        USING (
            student_id = auth.uid() 
            OR public.is_teacher() 
            OR public.is_admin_or_super()
            OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = mission_submissions.student_id AND sp.parent_id = auth.uid())
        );
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students manage own portfolio items" ON public.portfolio_items;
    CREATE POLICY "Students manage own portfolio items"
        ON public.portfolio_items FOR ALL
        USING (
            student_id = auth.uid() 
            OR is_public = true
            OR public.is_teacher() 
            OR public.is_admin_or_super()
            OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = portfolio_items.student_id AND sp.parent_id = auth.uid())
        );
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students manage own wellbeing signals" ON public.wellbeing_signals;
    CREATE POLICY "Students manage own wellbeing signals"
        ON public.wellbeing_signals FOR ALL
        USING (
            student_id = auth.uid() 
            OR public.is_teacher() 
            OR public.is_admin_or_super()
            OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = wellbeing_signals.student_id AND sp.parent_id = auth.uid())
        );
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Student private access to nova conversations" ON public.nova_conversations;
    CREATE POLICY "Student private access to nova conversations"
        ON public.nova_conversations FOR ALL
        USING (student_id = auth.uid() OR public.is_admin_or_super());
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Student private access to nova messages" ON public.nova_messages;
    CREATE POLICY "Student private access to nova messages"
        ON public.nova_messages FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.nova_conversations nc 
                WHERE nc.id = nova_messages.conversation_id 
                AND (nc.student_id = auth.uid() OR public.is_admin_or_super())
            )
        );
EXCEPTION WHEN others THEN null; END $$;

-- 10. Seed Starter Life Missions
INSERT INTO public.life_missions (id, title, subject_name, category, description, task_prompt, xp_reward, coins_reward)
VALUES 
    ('f0000000-0000-0000-0000-000000000001', 'Geometry in the Wild', 'Mathematics', 'Geometry', 'Observe 5 objects at home or in nature with different geometric shapes (circles, cylinders, prisms, spheres).', 'Take a photo or write down the 5 objects, noting their geometric properties and dimensions.', 120, 30),
    ('f0000000-0000-0000-0000-000000000002', 'Friction Detective', 'Physics', 'Mechanics', 'Find 3 real-world examples of friction at work in your home or street (shoes on tile, bicycle brakes, door hinges).', 'Describe how friction helps or hinders each mechanism and what happens when lubrication is added.', 140, 35),
    ('f0000000-0000-0000-0000-000000000003', 'Household Energy Audit', 'Physics', 'Energy', 'Track 3 major electrical appliances in your home and calculate their approximate power usage.', 'Record the wattage rating on the appliance labels and determine which consumes the most energy daily.', 150, 40),
    ('f0000000-0000-0000-0000-000000000004', 'Algorithmic Daily Routine', 'Computer Science', 'Logic', 'Write pseudocode or a flowchart describing your morning routine using conditional statements and loops.', 'Use IF-THEN conditions (e.g. IF raining THEN take umbrella) and a WHILE loop (e.g. WHILE tired...).', 130, 35)
ON CONFLICT (id) DO NOTHING;

-- 11. Quests Table (Daily Bounties & Weekly Expeditions)
ALTER TABLE public.quests 
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS coin_reward INT DEFAULT 20,
    ADD COLUMN IF NOT EXISTS progress_current INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS progress_total INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE;

ALTER TABLE public.quests DROP CONSTRAINT IF EXISTS quests_quest_type_check;
ALTER TABLE public.quests ADD CONSTRAINT quests_quest_type_check CHECK (quest_type = ANY (ARRAY['topic'::text, 'quiz'::text, 'revision'::text, 'assignment'::text, 'streak'::text, 'daily'::text, 'weekly'::text, 'epic'::text, 'special'::text]));

CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject_name TEXT,
    quest_type TEXT NOT NULL DEFAULT 'daily' CHECK (quest_type IN ('daily', 'weekly', 'epic', 'special')),
    duration_minutes INT DEFAULT 15,
    xp_reward INT NOT NULL DEFAULT 50,
    coin_reward INT NOT NULL DEFAULT 20,
    progress_current INT NOT NULL DEFAULT 0,
    progress_total INT NOT NULL DEFAULT 1,
    progress_percent INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed', 'locked')),
    target_id TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quests_student ON public.quests(student_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON public.quests(student_id, status);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students manage own quests" ON public.quests;
    CREATE POLICY "Students manage own quests"
        ON public.quests FOR ALL
        USING (
            student_id = auth.uid() 
            OR student_id IS NULL 
            OR public.is_teacher() 
            OR public.is_admin_or_super()
            OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = quests.student_id AND sp.parent_id = auth.uid())
        );
EXCEPTION WHEN others THEN null; END $$;

-- Starter Template Quests (available to all or cloneable per student)
INSERT INTO public.quests (id, title, description, subject_name, quest_type, duration_minutes, xp_reward, coin_reward, progress_total, target_id)
VALUES 
    ('70000000-0000-0000-0000-000000000001', 'Solve 3 Quadratic Questions', 'Conquer quadratic equations and formula drills in the math realm.', 'Mathematics', 'daily', 15, 60, 25, 3, 'd0000000-0000-0000-0000-000000000001'),
    ('70000000-0000-0000-0000-000000000002', 'Newton’s Force Master', 'Demonstrate your grasp of Newton’s Laws of Motion and momentum.', 'Physics', 'daily', 20, 75, 30, 3, 'd0000000-0000-0000-0000-000000000002'),
    ('70000000-0000-0000-0000-000000000003', 'Python Code Explorer', 'Test your logic on Python syntax, loops, and list manipulation.', 'Computer Science', 'daily', 15, 50, 20, 3, 'd0000000-0000-0000-0000-000000000003'),
    ('70000000-0000-0000-0000-000000000004', 'Real-World Observation Expedition', 'Complete 1 practical Life Mission connecting theory to everyday life.', 'Interdisciplinary', 'weekly', 30, 150, 50, 1, NULL),
    ('70000000-0000-0000-0000-000000000005', 'Mind & Canvas: Creative Sketch', 'Submit a visual proof or diagram in the Creativity Lab.', 'Visual Learning', 'weekly', 25, 100, 40, 1, NULL)
ON CONFLICT (id) DO NOTHING;

COMMIT;
