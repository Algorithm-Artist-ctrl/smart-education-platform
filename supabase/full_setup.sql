-- ==============================================================================
-- SMART EDUCATION PLATFORM — COMPLETE POSTGRESQL SCHEMA, RLS & SEED SCRIPT
-- Run this script in your Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

BEGIN;

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Roles Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'teacher', 'parent', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'student',
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Automatic profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role public.user_role;
    raw_role TEXT;
BEGIN
    raw_role := new.raw_user_meta_data->>'role';
    IF raw_role IS NOT NULL AND raw_role IN ('student', 'teacher', 'parent', 'admin', 'super_admin') THEN
        assigned_role := raw_role::public.user_role;
    ELSE
        assigned_role := 'student'::public.user_role;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        assigned_role,
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url;

    -- If student, also create base student_profile
    IF assigned_role = 'student' THEN
        INSERT INTO public.student_profiles (id)
        VALUES (new.id)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Helper function for role-checking
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. Institutions
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Classes & Sections
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade_level INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

-- 8. Subjects & Class Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE(class_id, subject_id)
);

-- 9. Student Profiles (Extended)
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    roll_number TEXT,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    learning_goals TEXT[] DEFAULT '{}',
    current_streak INT DEFAULT 0,
    total_points INT DEFAULT 0,
    level INT DEFAULT 1,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Topics
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    difficulty_level INT DEFAULT 1,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Learning Content
CREATE TABLE IF NOT EXISTS public.learning_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('note', 'video', 'document', 'lesson', 'external')),
    content_url TEXT,
    body_markdown TEXT,
    file_path TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Assessments & Questions
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('initial_assessment', 'quiz', 'exam', 'practice')),
    total_marks INT NOT NULL DEFAULT 100,
    duration_minutes INT NOT NULL DEFAULT 30,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option_index INT NOT NULL,
    explanation TEXT,
    difficulty INT DEFAULT 1,
    marks INT DEFAULT 1
);

-- 13. Quiz Attempts & Detailed Answers
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ DEFAULT now(),
    end_time TIMESTAMPTZ,
    total_score NUMERIC DEFAULT 0,
    max_score NUMERIC DEFAULT 0,
    percentage NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

CREATE TABLE IF NOT EXISTS public.quiz_attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_index INT,
    is_correct BOOLEAN DEFAULT FALSE,
    time_spent_seconds INT DEFAULT 0
);

-- 14. Weak Topics Detection
CREATE TABLE IF NOT EXISTS public.weak_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    accuracy_rate NUMERIC DEFAULT 0,
    total_attempts INT DEFAULT 0,
    incorrect_count INT DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'improving', 'resolved')),
    last_evaluated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (student_id, topic_id)
);

-- 15. Daily Study Planner
CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    duration_minutes INT DEFAULT 30,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rescheduled')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. Revision Queue
CREATE TABLE IF NOT EXISTS public.revision_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    reason TEXT,
    recommended_content_id UUID REFERENCES public.learning_content(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. Personalised Learning Paths
CREATE TABLE IF NOT EXISTS public.learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    current_topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    recommended_next_topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, subject_id)
);

-- 18. Assignments & Submissions
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    attachment_url TEXT,
    max_points INT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    grade NUMERIC,
    feedback TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late', 'returned')),
    UNIQUE(assignment_id, student_id)
);

-- 19. Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, date)
);

-- 20. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'assignment', 'quiz', 'grade', 'revision', 'achievement', 'announcement')),
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 21. Gamification Badges
CREATE TABLE IF NOT EXISTS public.gamification_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    criteria_type TEXT NOT NULL,
    criteria_value INT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.gamification_badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, badge_id)
);

-- 22. Career Profiles
CREATE TABLE IF NOT EXISTS public.career_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    interests TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    target_careers TEXT[] DEFAULT '{}',
    resume_data JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 23. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_class ON public.student_profiles(class_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON public.topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_learning_content_topic ON public.learning_content(topic_id);
CREATE INDEX IF NOT EXISTS idx_assessments_subject ON public.assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_assessment ON public.questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_weak_topics_student ON public.weak_topics(student_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_student_date ON public.study_plans(student_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_revision_tasks_student ON public.revision_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weak_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'super_admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles
CREATE POLICY "Users can read their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin_or_super() OR public.is_teacher());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Academics
CREATE POLICY "Anyone authenticated can read institutions"
    ON public.institutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage institutions"
    ON public.institutions FOR ALL USING (public.is_admin_or_super());

CREATE POLICY "Anyone authenticated can view classes and sections"
    ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage classes"
    ON public.classes FOR ALL USING (public.is_admin_or_super());

CREATE POLICY "Anyone authenticated can view sections"
    ON public.sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated can view subjects"
    ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage subjects"
    ON public.subjects FOR ALL USING (public.is_admin_or_super());

CREATE POLICY "Anyone authenticated can view class_subjects"
    ON public.class_subjects FOR SELECT TO authenticated USING (true);

-- Student Profiles
CREATE POLICY "Students can view and edit own student profile"
    ON public.student_profiles FOR ALL
    USING (
        auth.uid() = id 
        OR parent_id = auth.uid() 
        OR public.is_teacher() 
        OR public.is_admin_or_super()
    );

-- Topics & Learning Content
CREATE POLICY "Anyone authenticated can view topics"
    ON public.topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers and admins can manage topics"
    ON public.topics FOR ALL USING (public.is_teacher() OR public.is_admin_or_super());

CREATE POLICY "Anyone authenticated can view learning content"
    ON public.learning_content FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers and admins can manage learning content"
    ON public.learning_content FOR ALL USING (public.is_teacher() OR public.is_admin_or_super());

-- Assessments & Questions
CREATE POLICY "Authenticated users can read published assessments"
    ON public.assessments FOR SELECT TO authenticated USING (is_published = true OR public.is_teacher() OR public.is_admin_or_super());
CREATE POLICY "Teachers and admins can manage assessments"
    ON public.assessments FOR ALL USING (public.is_teacher() OR public.is_admin_or_super());

CREATE POLICY "Authenticated users can view questions for available assessments"
    ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers and admins can manage questions"
    ON public.questions FOR ALL USING (public.is_teacher() OR public.is_admin_or_super());

-- Quiz Attempts & Answers
CREATE POLICY "Students manage their own quiz attempts"
    ON public.quiz_attempts FOR ALL
    USING (
        student_id = auth.uid() 
        OR public.is_teacher() 
        OR public.is_admin_or_super()
        OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = quiz_attempts.student_id AND sp.parent_id = auth.uid())
    );

CREATE POLICY "Students manage their own quiz answers"
    ON public.quiz_attempt_answers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.quiz_attempts qa 
            WHERE qa.id = quiz_attempt_answers.attempt_id 
            AND (
                qa.student_id = auth.uid() 
                OR public.is_teacher() 
                OR public.is_admin_or_super()
            )
        )
    );

-- Weak Topics, Study Plans, Revision, Learning Path
CREATE POLICY "Students access own weak topics"
    ON public.weak_topics FOR ALL
    USING (
        student_id = auth.uid() 
        OR public.is_teacher() 
        OR public.is_admin_or_super()
        OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = weak_topics.student_id AND sp.parent_id = auth.uid())
    );

CREATE POLICY "Students manage own study plans"
    ON public.study_plans FOR ALL
    USING (student_id = auth.uid() OR public.is_teacher() OR public.is_admin_or_super());

CREATE POLICY "Students manage own revision tasks"
    ON public.revision_tasks FOR ALL
    USING (student_id = auth.uid() OR public.is_teacher() OR public.is_admin_or_super());

CREATE POLICY "Students access own learning path"
    ON public.learning_paths FOR ALL
    USING (student_id = auth.uid() OR public.is_teacher() OR public.is_admin_or_super());

-- Assignments & Submissions
CREATE POLICY "Students and teachers can view assignments"
    ON public.assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can create and update assignments"
    ON public.assignments FOR ALL USING (public.is_teacher() OR public.is_admin_or_super());

CREATE POLICY "Students can submit assignments and view own submissions"
    ON public.assignment_submissions FOR ALL
    USING (
        student_id = auth.uid() 
        OR public.is_teacher() 
        OR public.is_admin_or_super()
        OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = assignment_submissions.student_id AND sp.parent_id = auth.uid())
    );

-- Attendance & Notifications
CREATE POLICY "Attendance visibility"
    ON public.attendance FOR SELECT TO authenticated USING (
        student_id = auth.uid() 
        OR public.is_teacher() 
        OR public.is_admin_or_super()
        OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = attendance.student_id AND sp.parent_id = auth.uid())
    );
CREATE POLICY "Teachers can record attendance"
    ON public.attendance FOR ALL USING (public.is_teacher() OR public.is_admin_or_super());

CREATE POLICY "Users manage own notifications"
    ON public.notifications FOR ALL USING (user_id = auth.uid());

-- Gamification & Career
CREATE POLICY "Badges are viewable by all"
    ON public.gamification_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Student badges are viewable by all"
    ON public.student_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can award badges"
    ON public.student_badges FOR INSERT WITH CHECK (student_id = auth.uid() OR public.is_admin_or_super());

CREATE POLICY "Students manage own career profile"
    ON public.career_profiles FOR ALL USING (student_id = auth.uid() OR public.is_admin_or_super());

-- ==============================================================================
-- CURRICULUM SEED DATA
-- ==============================================================================

-- 1. Base Institution
INSERT INTO public.institutions (id, name, code, address)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'National Smart Academy', 'NSA-001', 'Tech City Campus, New Delhi')
ON CONFLICT (code) DO NOTHING;

-- 2. Classes & Sections
INSERT INTO public.classes (id, institution_id, name, grade_level)
VALUES 
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Grade 10', 10),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Grade 12', 12)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sections (id, class_id, name)
VALUES 
    ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Section A'),
    ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Section B')
ON CONFLICT (id) DO NOTHING;

-- 3. Subjects
INSERT INTO public.subjects (id, institution_id, name, code, description, icon)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Mathematics', 'MATH10', 'Algebra, Geometry, Trigonometry, and Calculus basics.', 'Calculator'),
    ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Physics', 'PHY10', 'Mechanics, Optics, Electricity, and Modern Physics.', 'Atom'),
    ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Computer Science', 'CS10', 'Programming Logic, Python, Algorithms, and Databases.', 'Code')
ON CONFLICT (id) DO NOTHING;

-- 4. Class Subjects
INSERT INTO public.class_subjects (class_id, subject_id)
VALUES 
    ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001'),
    ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000002'),
    ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT (class_id, subject_id) DO NOTHING;

-- 5. Topics
INSERT INTO public.topics (id, subject_id, name, description, difficulty_level, order_index)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Quadratic Equations', 'Standard form, factoring, completing the square, and quadratic formula.', 2, 1),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Trigonometric Ratios', 'Sine, Cosine, Tangent values and trigonometric identities.', 2, 2),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Arithmetic Progressions', 'nth term formula, common difference, and sum of first n terms.', 1, 3),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Laws of Motion', 'Newton’s three laws of motion, inertia, momentum, and impulse.', 2, 1),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Light - Reflection & Refraction', 'Snell’s Law, lens maker equations, and mirror ray diagrams.', 3, 2),
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'Python Fundamentals', 'Variables, control flow, loops, and functional modularity.', 1, 1),
    ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'Data Structures (Arrays & Lists)', 'List operations, indexing, slicing, search, and algorithmic complexity.', 2, 2)
ON CONFLICT (id) DO NOTHING;

-- 6. Learning Content Lessons
INSERT INTO public.learning_content (id, topic_id, title, content_type, body_markdown)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Mastering Quadratic Equations', 'lesson', 
     '# Quadratic Equations Guide\n\nA quadratic equation is an equation of the second degree: **ax² + bx + c = 0** where a ≠ 0.\n\n### The Quadratic Formula\n\n`x = (-b ± √(b² - 4ac)) / (2a)`\n\n### The Discriminant\n- **D = b² - 4ac > 0**: Two distinct real roots.\n- **D = 0**: Two equal real roots.\n- **D < 0**: No real roots (complex roots).'),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'Newton’s Laws of Motion Explained', 'lesson',
     '# Newton’s Laws of Motion\n\n### 1. First Law (Inertia)\nAn object at rest stays at rest, and an object in motion stays in motion unless acted upon by a net external force.\n\n### 2. Second Law (F = ma)\nThe acceleration of an object is directly proportional to the net force acting upon it.\n\n### 3. Third Law (Action & Reaction)\nFor every action, there is an equal and opposite reaction.'),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 'Python Control Flow and Loops', 'lesson',
     '# Python Control Flow\n\nIn Python, decisions are made using `if`, `elif`, and `else` statements.\n\n```python\nfor i in range(1, 6):\n    if i % 2 == 0:\n        print(f"{i} is even")\n    else:\n        print(f"{i} is odd")\n```\n\nMastering loops helps construct algorithmic solutions efficiently.')
ON CONFLICT (id) DO NOTHING;

-- 7. Diagnostic Assessments
INSERT INTO public.assessments (id, title, description, subject_id, topic_id, assessment_type, total_marks, duration_minutes)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'Mathematics Diagnostic Assessment', 'Evaluate core baseline proficiency in Quadratic Equations and Trigonometry.', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'initial_assessment', 30, 20),
    ('d0000000-0000-0000-0000-000000000002', 'Physics Diagnostic Assessment', 'Baseline assessment for Laws of Motion and Optics.', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'initial_assessment', 30, 20),
    ('d0000000-0000-0000-0000-000000000003', 'Computer Science Diagnostic Assessment', 'Baseline test on Python syntax and basic data structures.', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 'initial_assessment', 30, 20)
ON CONFLICT (id) DO NOTHING;

-- 8. Questions
INSERT INTO public.questions (assessment_id, topic_id, question_text, options, correct_option_index, explanation, difficulty, marks)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 
     'What are the roots of the quadratic equation x² - 5x + 6 = 0?', 
     '["x = 2 and x = 3", "x = -2 and x = -3", "x = 1 and x = 6", "x = -1 and x = -6"]'::jsonb, 
     0, 'Factoring gives (x - 2)(x - 3) = 0, so roots are 2 and 3.', 1, 10),
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 
     'If the discriminant b² - 4ac is less than 0, what is the nature of the roots?', 
     '["Two real and equal roots", "Two real and distinct roots", "No real roots (imaginary)", "Rational and unequal roots"]'::jsonb, 
     2, 'When D < 0, the square root contains a negative number, yielding complex/imaginary roots.', 2, 10),
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 
     'What is the value of sin²(θ) + cos²(θ)?', 
     '["0", "1", "2", "-1"]'::jsonb, 
     1, 'sin²(θ) + cos²(θ) = 1 is the fundamental Pythagorean trigonometric identity.', 1, 10),

    ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 
     'According to Newton’s Second Law, Force is equal to:', 
     '["Mass × Velocity", "Mass × Acceleration", "Weight × Gravity", "Energy / Time"]'::jsonb, 
     1, 'F = m × a (Force equals mass times acceleration).', 1, 10),
    ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 
     'When a bus suddenly turns a corner, passengers lean outward due to:', 
     '["Inertia of direction", "Gravitational pull", "Friction with the floor", "Centripetal acceleration"]'::jsonb, 
     0, 'Passengers tend to maintain their original direction of motion due to inertia of direction.', 2, 10),
    ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 
     'What is the refractive index of a medium if the speed of light in it is 2 × 10⁸ m/s? (c = 3 × 10⁸ m/s)', 
     '["1.2", "1.33", "1.5", "1.75"]'::jsonb, 
     2, 'Refractive index n = c / v = (3 × 10⁸) / (2 × 10⁸) = 1.5.', 2, 10),

    ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 
     'In Python, what is the output of `type(5 / 2)`?', 
     '["<class ''int''>", "<class ''float''>", "<class ''double''>", "<class ''number''>"]'::jsonb, 
     1, 'In Python 3, single division `/` always returns a float (2.5).', 1, 10),
    ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 
     'What keyword is used to define a function in Python?', 
     '["func", "function", "def", "lambda"]'::jsonb, 
     2, 'Functions in Python are defined using the `def` keyword.', 1, 10),
    ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000007', 
     'What is the time complexity of accessing an element by index in a Python list?', 
     '["O(1)", "O(n)", "O(log n)", "O(n²)"]'::jsonb, 
     0, 'Python lists are dynamic arrays, so lookup by index is constant time O(1).', 2, 10);

-- 9. Badges
INSERT INTO public.gamification_badges (id, code, title, description, icon, criteria_type, criteria_value)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', 'FIRST_ASSESSMENT', 'First Step', 'Completed your diagnostic assessment', 'Award', 'assessment_completed', 1),
    ('e0000000-0000-0000-0000-000000000002', 'STREAK_3', 'Flame Igniter', 'Maintained a 3-day study streak', 'Flame', 'streak', 3),
    ('e0000000-0000-0000-0000-000000000003', 'STREAK_7', 'Study Champion', 'Maintained a 7-day study streak', 'Zap', 'streak', 7),
    ('e0000000-0000-0000-0000-000000000004', 'PERFECT_SCORE', 'Mastermind', 'Scored 100% on any topic quiz', 'Star', 'perfect_score', 1),
    ('e0000000-0000-0000-0000-000000000005', 'WEAK_TOPIC_CONQUEROR', 'Phoenix Rising', 'Turned a weak topic into mastery through revision', 'ShieldCheck', 'weak_topic_resolved', 1)
ON CONFLICT (code) DO NOTHING;

COMMIT;
