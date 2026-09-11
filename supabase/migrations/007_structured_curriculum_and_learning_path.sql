-- supabase/migrations/007_structured_curriculum_and_learning_path.sql
-- Smart Education: Structured Curriculum Hierarchy & Personalized Learning Path
-- Hierarchy: SUBJECT -> MODULE -> CHAPTER -> TOPIC -> LESSON -> PRACTICE -> QUIZ

BEGIN;

-- 1. Modules Table
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INT DEFAULT 0,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modules_subject ON public.modules(subject_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON public.modules(subject_id, order_index);

-- 2. Chapters Table
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chapters_module ON public.chapters(module_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON public.chapters(module_id, order_index);

-- 3. Extend Topics with Module and Chapter relationships
ALTER TABLE public.topics
    ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS learning_objectives TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS prerequisites UUID[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS estimated_minutes INT DEFAULT 15;

CREATE INDEX IF NOT EXISTS idx_topics_chapter ON public.topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_topics_module ON public.topics(module_id);

-- 4. Student Learning Position (Continue Where I Left Off)
CREATE TABLE IF NOT EXISTS public.student_learning_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    lesson_id UUID REFERENCES public.learning_content(id) ON DELETE SET NULL,
    lesson_title TEXT,
    step_number INT DEFAULT 1,
    total_steps INT DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_positions_student ON public.student_learning_positions(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_positions_accessed ON public.student_learning_positions(student_id, last_accessed_at DESC);

-- 5. Practice Attempts Table
CREATE TABLE IF NOT EXISTS public.practice_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_index INT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    hints_used INT DEFAULT 0,
    time_spent_seconds INT DEFAULT 0,
    mistake_category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_student ON public.practice_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_topic ON public.practice_attempts(topic_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_question ON public.practice_attempts(question_id);

-- 6. Row Level Security Policies
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_learning_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public modules are viewable by authenticated users" ON public.modules;
    CREATE POLICY "Public modules are viewable by authenticated users"
        ON public.modules FOR SELECT
        TO authenticated USING (true);
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public chapters are viewable by authenticated users" ON public.chapters;
    CREATE POLICY "Public chapters are viewable by authenticated users"
        ON public.chapters FOR SELECT
        TO authenticated USING (true);
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students manage own learning position" ON public.student_learning_positions;
    CREATE POLICY "Students manage own learning position"
        ON public.student_learning_positions FOR ALL
        USING (student_id = auth.uid() OR public.is_teacher() OR public.is_admin_or_super());
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Students manage own practice attempts" ON public.practice_attempts;
    CREATE POLICY "Students manage own practice attempts"
        ON public.practice_attempts FOR ALL
        USING (student_id = auth.uid() OR public.is_teacher() OR public.is_admin_or_super());
EXCEPTION WHEN others THEN null; END $$;

-- 7. Seed Real Structured Curriculum Data
-- Ensure Subjects exist
INSERT INTO public.subjects (id, name, code, description, icon)
VALUES 
    ('a0000000-0000-0000-0000-000000000004', 'Chemistry', 'CHEM10', 'Atoms, molecules, reactions, and stoichiometry.', 'FlaskConical'),
    ('a0000000-0000-0000-0000-000000000005', 'Biology', 'BIO10', 'Living systems, cell biology, genetics, and ecology.', 'Dna')
ON CONFLICT (id) DO NOTHING;

-- Mathematics Modules
INSERT INTO public.modules (id, subject_id, title, description, order_index, icon)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Module 1: Algebra & Functions', 'Equations, polynomials, quadratic relationships, and progressions.', 1, 'Calculator'),
    ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Module 2: Geometry & Trigonometry', 'Spatial reasoning, triangles, trigonometric identities, and heights.', 2, 'Shapes'),
    ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Module 3: Coordinate Geometry & Statistics', 'Planes, distances, probability, and distribution analytics.', 3, 'TrendingUp')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Physics Modules
INSERT INTO public.modules (id, subject_id, title, description, order_index, icon)
VALUES 
    ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Module 1: Mechanics & Dynamics', 'Newtonian mechanics, friction, force vectors, and momentum.', 1, 'Atom'),
    ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Module 2: Optics, Waves & Energy', 'Light propagation, mirrors, refraction, and energy conservation.', 2, 'Sun')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Chemistry Modules
INSERT INTO public.modules (id, subject_id, title, description, order_index, icon)
VALUES 
    ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', 'Module 1: Chemical Dynamics & Bonding', 'Chemical equations, balancing, oxidation-reduction, and stoichiometry.', 1, 'FlaskConical')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Biology Modules
INSERT INTO public.modules (id, subject_id, title, description, order_index, icon)
VALUES 
    ('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000005', 'Module 1: Cellular Bioenergetics', 'Cell structure, photosynthesis, respiration, and ATP synthesis.', 1, 'Dna')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Chapters for Mathematics Module 1 (Algebra & Functions)
INSERT INTO public.chapters (id, module_id, title, description, order_index)
VALUES 
    ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Chapter 1: Linear Equations in Two Variables', 'Graphing lines, substitution method, elimination, and consistency.', 1),
    ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Chapter 2: Quadratic Equations', 'Standard form, roots, factoring, quadratic formula, and parabola graphs.', 2),
    ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Chapter 3: Arithmetic Progressions', 'nth term formula, common differences, and sum of series.', 3)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Chapters for Mathematics Module 2 (Geometry & Trigonometry)
INSERT INTO public.chapters (id, module_id, title, description, order_index)
VALUES 
    ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'Chapter 1: Trigonometric Ratios & Identities', 'Ratios in right triangles, unit circle, and Pythagorean identities.', 1),
    ('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000002', 'Chapter 2: Heights and Distances', 'Angles of elevation and depression applied to navigation.', 2)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Chapters for Physics Module 1 (Mechanics & Dynamics)
INSERT INTO public.chapters (id, module_id, title, description, order_index)
VALUES 
    ('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000004', 'Chapter 1: Laws of Motion', 'Inertia, F=ma, action-reaction pairs, and free-body diagrams.', 1),
    ('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000004', 'Chapter 2: Gravitation & Free Fall', 'Universal gravitation, acceleration due to gravity, and mass vs weight.', 2)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Chapters for Physics Module 2 (Optics, Waves & Energy)
INSERT INTO public.chapters (id, module_id, title, description, order_index)
VALUES 
    ('f0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000005', 'Chapter 1: Light - Reflection & Refraction', 'Mirrors, Snell''s law, lenses, and ray optics.', 1)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Chapters for Chemistry Module 1
INSERT INTO public.chapters (id, module_id, title, description, order_index)
VALUES 
    ('f0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000006', 'Chapter 1: Chemical Reactions & Equations', 'Conservation of mass, chemical combinations, and decomposition.', 1),
    ('f0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000006', 'Chapter 2: Acids, Bases, and Salts', 'pH scale, indicator titrations, and neutralization reactions.', 2)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Chapters for Biology Module 1
INSERT INTO public.chapters (id, module_id, title, description, order_index)
VALUES 
    ('f0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000007', 'Chapter 1: Cellular Respiration & Energy', 'Glycolysis, mitochondria, ATP energy production, and respiration.', 1)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Update existing Topics with chapter_id and module_id
UPDATE public.topics 
SET 
    module_id = 'e0000000-0000-0000-0000-000000000001',
    chapter_id = 'f0000000-0000-0000-0000-000000000002',
    learning_objectives = '{"Understand standard form ax² + bx + c = 0", "Identify coefficients a, b, and c", "Distinguish quadratic from linear equations"}',
    estimated_minutes = 15
WHERE id = 'b0000000-0000-0000-0000-000000000001';

UPDATE public.topics 
SET 
    module_id = 'e0000000-0000-0000-0000-000000000002',
    chapter_id = 'f0000000-0000-0000-0000-000000000004',
    learning_objectives = '{"Define sine, cosine, tangent in right triangles", "Apply Pythagorean trigonometric identities"}',
    estimated_minutes = 20
WHERE id = 'b0000000-0000-0000-0000-000000000002';

UPDATE public.topics 
SET 
    module_id = 'e0000000-0000-0000-0000-000000000001',
    chapter_id = 'f0000000-0000-0000-0000-000000000003',
    learning_objectives = '{"Calculate common difference d", "Determine nth term using an = a + (n-1)d", "Compute series sum"}',
    estimated_minutes = 15
WHERE id = 'b0000000-0000-0000-0000-000000000003';

UPDATE public.topics 
SET 
    module_id = 'e0000000-0000-0000-0000-000000000004',
    chapter_id = 'f0000000-0000-0000-0000-000000000006',
    learning_objectives = '{"Analyze Newton’s First Law and inertia", "Calculate acceleration from net force F = ma", "Identify action-reaction force pairs"}',
    estimated_minutes = 20
WHERE id = 'b0000000-0000-0000-0000-000000000004';

UPDATE public.topics 
SET 
    module_id = 'e0000000-0000-0000-0000-000000000005',
    chapter_id = 'f0000000-0000-0000-0000-000000000008',
    learning_objectives = '{"Apply laws of reflection", "Calculate angle of refraction using Snell''s Law", "Construct ray diagrams for concave and convex lenses"}',
    estimated_minutes = 25
WHERE id = 'b0000000-0000-0000-0000-000000000005';

UPDATE public.topics 
SET 
    module_id = 'e0000000-0000-0000-0000-000000000006',
    chapter_id = 'f0000000-0000-0000-0000-000000000009',
    learning_objectives = '{"Balance chemical equations using conservation of mass", "Differentiate synthesis, decomposition, and displacement reactions"}',
    estimated_minutes = 20
WHERE id = 'b0000000-0000-0000-0000-000000000008';

UPDATE public.topics 
SET 
    module_id = 'e0000000-0000-0000-0000-000000000006',
    chapter_id = 'f0000000-0000-0000-0000-000000000010',
    learning_objectives = '{"Understand hydrogen ion concentration and the pH logarithmic scale", "Predict products of acid-base neutralization reactions"}',
    estimated_minutes = 15
WHERE id = 'b0000000-0000-0000-0000-000000000009';

UPDATE public.topics 
SET 
    module_id = 'e0000000-0000-0000-0000-000000000007',
    chapter_id = 'f0000000-0000-0000-0000-000000000011',
    learning_objectives = '{"Trace aerobic breakdown of glucose", "Compare ATP yield between glycolysis and oxidative phosphorylation"}',
    estimated_minutes = 20
WHERE id = 'b0000000-0000-0000-0000-000000000010';

-- Insert Granular Concept Topics for Chapter 2: Quadratic Equations
INSERT INTO public.topics (id, subject_id, module_id, chapter_id, name, description, difficulty_level, order_index, learning_objectives, estimated_minutes)
VALUES 
    ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 
     'Quadratic Factorization & Roots', 'Splitting the middle term, zero product property, and finding real roots.', 2, 2, 
     '{"Factor ax² + bx + c by grouping", "Apply Zero Product Property to solve equations", "Identify common factor selection traps"}', 20),
    ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 
     'Quadratic Formula & Discriminant Analysis', 'Applying x = (-b ± √(b² - 4ac)) / (2a) and determining root nature.', 3, 3, 
     '{"Compute discriminant D = b² - 4ac", "Determine nature of roots (real distinct, real equal, complex)", "Avoid negative sign errors in -b"}', 20),
    ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 
     'Parabola Graphs & Vertex Analysis', 'Graphing quadratic parabolas, axis of symmetry, and vertex coordinates.', 3, 4, 
     '{"Find vertex coordinates (-b/2a, f(-b/2a))", "Identify axis of symmetry", "Interpret maximum and minimum values geometrically"}', 25),
    ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 
     'Real-World Projectile Motion Missions', 'Applying quadratic equations to basketball trajectories, satellite dishes, and physics.', 4, 5, 
     '{"Model height vs time h(t) = -1/2gt² + vt + h0", "Calculate maximum height reached by a projectile", "Determine impact time by setting h(t) = 0"}', 25)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Insert Lessons for Quadratic Factorization & Roots
INSERT INTO public.learning_content (id, topic_id, title, content_type, body_markdown)
VALUES 
    ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000012', 
     'Step-by-Step Guide to Factoring Quadratics', 'lesson',
     '# Mastering Quadratic Factorization\n\nFactoring is the process of breaking down a quadratic expression into the product of two linear binomials: `(px + q)(rx + s) = 0`.\n\n### The 4-Step Middle-Term Splitting Method:\n\n1. **Standard Form**: Ensure equation is `ax² + bx + c = 0`.\n2. **Product & Sum**: Find two numbers that multiply to `a × c` and add up to `b`.\n3. **Split**: Rewrite the middle term `bx` as the sum of these two terms.\n4. **Group & Solve**: Factor out the greatest common divisor from each pair and apply the Zero Product Property.\n\n### Worked Example: `x² - 5x + 6 = 0`\n- `a = 1`, `b = -5`, `c = 6`\n- Product = `6`, Sum = `-5`\n- Two numbers: `-2` and `-3` (since `-2 × -3 = 6` and `-2 + -3 = -5`)\n- Rewrite: `x² - 2x - 3x + 6 = 0`\n- Factor: `x(x - 2) - 3(x - 2) = 0`\n- Group: `(x - 2)(x - 3) = 0`\n- Roots: `x = 2` or `x = 3`.\n\n### 💡 Key Insight: The Zero Product Property\nIf `A × B = 0`, then either `A = 0` or `B = 0` (or both). That is why setting each factor to zero reveals the exact points where the parabola crosses the x-axis!')
ON CONFLICT (id) DO NOTHING;

-- Practice Questions for Topic: Quadratic Factorization & Roots
INSERT INTO public.questions (assessment_id, topic_id, question_text, options, correct_option_index, explanation, difficulty, marks)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000012',
     'What are the factors of the quadratic expression x² - 7x + 12?',
     '["(x - 3)(x - 4)", "(x + 3)(x + 4)", "(x - 2)(x - 6)", "(x - 1)(x - 12)"]'::jsonb,
     0, 'We need two numbers that multiply to 12 and add to -7. These are -3 and -4. Thus, (x - 3)(x - 4).', 1, 10),
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000012',
     'Solve by factoring: 2x² + 5x - 3 = 0. What are the solutions?',
     '["x = 1/2 and x = -3", "x = -1/2 and x = 3", "x = 1 and x = -3/2", "x = 2 and x = -3"]'::jsonb,
     0, 'Product ac = 2 × (-3) = -6. Sum b = 5. Numbers are 6 and -1. Rewrite: 2x² + 6x - x - 3 = 2x(x + 3) - 1(x + 3) = (2x - 1)(x + 3) = 0. Roots are x = 1/2 and x = -3.', 2, 10),
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000012',
     'A student attempted to factor x² - x - 20 and wrote (x - 5)(x + 4) = 0. Are their roots correct?',
     '["Yes, roots are x = 5 and x = -4", "No, factors should be (x + 5)(x - 4)", "No, roots are x = -5 and x = 4", "No, this equation has no real roots"]'::jsonb,
     0, 'The factors (x - 5)(x + 4) multiply to -20 and add to -1. Setting each to zero yields roots x = 5 and x = -4.', 2, 10)
ON CONFLICT (id) DO NOTHING;

COMMIT;
