-- 002_rls_policies.sql
-- Smart Education Platform Row Level Security (RLS) Policies

-- Enable RLS on all tables
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

-- Security helper functions
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

-- 1. Profiles
CREATE POLICY "Users can read their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin_or_super() OR public.is_teacher());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 2. Institutions, Classes, Sections, Subjects
CREATE POLICY "Anyone authenticated can read institutions"
    ON public.institutions FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Admins can manage institutions"
    ON public.institutions FOR ALL
    USING (public.is_admin_or_super());

CREATE POLICY "Anyone authenticated can view classes and sections"
    ON public.classes FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Admins can manage classes"
    ON public.classes FOR ALL
    USING (public.is_admin_or_super());

CREATE POLICY "Anyone authenticated can view sections"
    ON public.sections FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can view subjects"
    ON public.subjects FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Admins can manage subjects"
    ON public.subjects FOR ALL
    USING (public.is_admin_or_super());

CREATE POLICY "Anyone authenticated can view class_subjects"
    ON public.class_subjects FOR SELECT
    TO authenticated USING (true);

-- 3. Student Profiles
CREATE POLICY "Students can view and edit own student profile"
    ON public.student_profiles FOR ALL
    USING (
        auth.uid() = id 
        OR parent_id = auth.uid() 
        OR public.is_teacher() 
        OR public.is_admin_or_super()
    );

-- 4. Topics & Learning Content
CREATE POLICY "Anyone authenticated can view topics"
    ON public.topics FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Teachers and admins can manage topics"
    ON public.topics FOR ALL
    USING (public.is_teacher() OR public.is_admin_or_super());

CREATE POLICY "Anyone authenticated can view learning content"
    ON public.learning_content FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Teachers and admins can manage learning content"
    ON public.learning_content FOR ALL
    USING (public.is_teacher() OR public.is_admin_or_super());

-- 5. Assessments & Questions
CREATE POLICY "Authenticated users can read published assessments"
    ON public.assessments FOR SELECT
    TO authenticated USING (is_published = true OR public.is_teacher() OR public.is_admin_or_super());

CREATE POLICY "Teachers and admins can manage assessments"
    ON public.assessments FOR ALL
    USING (public.is_teacher() OR public.is_admin_or_super());

CREATE POLICY "Authenticated users can view questions for available assessments"
    ON public.questions FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Teachers and admins can manage questions"
    ON public.questions FOR ALL
    USING (public.is_teacher() OR public.is_admin_or_super());

-- 6. Quiz Attempts & Answers
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

-- 7. Weak Topics, Study Plans, Revision Tasks, Learning Paths
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
    USING (
        student_id = auth.uid() 
        OR public.is_teacher() 
        OR public.is_admin_or_super()
    );

CREATE POLICY "Students manage own revision tasks"
    ON public.revision_tasks FOR ALL
    USING (
        student_id = auth.uid() 
        OR public.is_teacher() 
        OR public.is_admin_or_super()
    );

CREATE POLICY "Students access own learning path"
    ON public.learning_paths FOR ALL
    USING (
        student_id = auth.uid() 
        OR public.is_teacher() 
        OR public.is_admin_or_super()
    );

-- 8. Assignments & Submissions
CREATE POLICY "Students and teachers can view assignments"
    ON public.assignments FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Teachers can create and update assignments"
    ON public.assignments FOR ALL
    USING (public.is_teacher() OR public.is_admin_or_super());

CREATE POLICY "Students can submit assignments and view own submissions"
    ON public.assignment_submissions FOR ALL
    USING (
        student_id = auth.uid() 
        OR public.is_teacher() 
        OR public.is_admin_or_super()
        OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = assignment_submissions.student_id AND sp.parent_id = auth.uid())
    );

-- 9. Attendance
CREATE POLICY "Attendance visibility"
    ON public.attendance FOR SELECT
    TO authenticated USING (
        student_id = auth.uid() 
        OR public.is_teacher() 
        OR public.is_admin_or_super()
        OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = attendance.student_id AND sp.parent_id = auth.uid())
    );

CREATE POLICY "Teachers can record attendance"
    ON public.attendance FOR ALL
    USING (public.is_teacher() OR public.is_admin_or_super());

-- 10. Notifications
CREATE POLICY "Users manage own notifications"
    ON public.notifications FOR ALL
    USING (user_id = auth.uid());

-- 11. Gamification
CREATE POLICY "Badges are viewable by all authenticated users"
    ON public.gamification_badges FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Student badges are viewable by all"
    ON public.student_badges FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "System can award badges"
    ON public.student_badges FOR INSERT
    WITH CHECK (student_id = auth.uid() OR public.is_admin_or_super());

-- 12. Career Profiles
CREATE POLICY "Students manage own career profile"
    ON public.career_profiles FOR ALL
    USING (student_id = auth.uid() OR public.is_admin_or_super());
