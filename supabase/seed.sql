-- seed.sql
-- Smart Education Platform Initial Seed Data (Curriculum, Topics, Lessons, Diagnostic Assessments & Badges)

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
-- Mathematics Topics
INSERT INTO public.topics (id, subject_id, name, description, difficulty_level, order_index)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Quadratic Equations', 'Standard form, factoring, completing the square, and quadratic formula.', 2, 1),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Trigonometric Ratios', 'Sine, Cosine, Tangent values and trigonometric identities.', 2, 2),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Arithmetic Progressions', 'nth term formula, common difference, and sum of first n terms.', 1, 3);

-- Physics Topics
INSERT INTO public.topics (id, subject_id, name, description, difficulty_level, order_index)
VALUES 
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Laws of Motion', 'Newton’s three laws of motion, inertia, momentum, and impulse.', 2, 1),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Light - Reflection & Refraction', 'Snell’s Law, lens maker equations, and mirror ray diagrams.', 3, 2);

-- CS Topics
INSERT INTO public.topics (id, subject_id, name, description, difficulty_level, order_index)
VALUES 
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'Python Fundamentals', 'Variables, control flow, loops, and functional modularity.', 1, 1),
    ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'Data Structures (Arrays & Lists)', 'List operations, indexing, slicing, search, and algorithmic complexity.', 2, 2);

-- 6. Learning Content Lessons
INSERT INTO public.learning_content (id, topic_id, title, content_type, body_markdown)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Mastering Quadratic Equations', 'lesson', 
     '# Quadratic Equations Guide\n\nA quadratic equation is an equation of the second degree: **ax² + bx + c = 0** where a ≠ 0.\n\n### The Quadratic Formula\n\n`x = (-b ± √(b² - 4ac)) / (2a)`\n\n### The Discriminant\n- **D = b² - 4ac > 0**: Two distinct real roots.\n- **D = 0**: Two equal real roots.\n- **D < 0**: No real roots (complex roots).'),
    
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'Newton’s Laws of Motion Explained', 'lesson',
     '# Newton’s Laws of Motion\n\n### 1. First Law (Inertia)\nAn object at rest stays at rest, and an object in motion stays in motion unless acted upon by a net external force.\n\n### 2. Second Law (F = ma)\nThe acceleration of an object is directly proportional to the net force acting upon it.\n\n### 3. Third Law (Action & Reaction)\nFor every action, there is an equal and opposite reaction.'),

    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 'Python Control Flow and Loops', 'lesson',
     '# Python Control Flow\n\nIn Python, decisions are made using `if`, `elif`, and `else` statements.\n\n```python\nfor i in range(1, 6):\n    if i % 2 == 0:\n        print(f"{i} is even")\n    else:\n        print(f"{i} is odd")\n```\n\nMastering loops helps construct algorithmic solutions efficiently.');

-- 7. Diagnostic Assessments
INSERT INTO public.assessments (id, title, description, subject_id, topic_id, assessment_type, total_marks, duration_minutes)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'Mathematics Diagnostic Assessment', 'Evaluate core baseline proficiency in Quadratic Equations and Trigonometry.', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'initial_assessment', 30, 20),
    ('d0000000-0000-0000-0000-000000000002', 'Physics Diagnostic Assessment', 'Baseline assessment for Laws of Motion and Optics.', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'initial_assessment', 30, 20),
    ('d0000000-0000-0000-0000-000000000003', 'Computer Science Diagnostic Assessment', 'Baseline test on Python syntax and basic data structures.', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 'initial_assessment', 30, 20);

-- 8. Assessment Questions
-- Questions for Math Diagnostic
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
     1, 'sin²(θ) + cos²(θ) = 1 is the fundamental Pythagorean trigonometric identity.', 1, 10);

-- Questions for Physics Diagnostic
INSERT INTO public.questions (assessment_id, topic_id, question_text, options, correct_option_index, explanation, difficulty, marks)
VALUES 
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
     2, 'Refractive index n = c / v = (3 × 10⁸) / (2 × 10⁸) = 1.5.', 2, 10);

-- Questions for CS Diagnostic
INSERT INTO public.questions (assessment_id, topic_id, question_text, options, correct_option_index, explanation, difficulty, marks)
VALUES 
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

-- 9. Gamification Badges
INSERT INTO public.gamification_badges (id, code, title, description, icon, criteria_type, criteria_value)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', 'FIRST_ASSESSMENT', 'First Step', 'Completed your diagnostic assessment', 'Award', 'assessment_completed', 1),
    ('e0000000-0000-0000-0000-000000000002', 'STREAK_3', 'Flame Igniter', 'Maintained a 3-day study streak', 'Flame', 'streak', 3),
    ('e0000000-0000-0000-0000-000000000003', 'STREAK_7', 'Study Champion', 'Maintained a 7-day study streak', 'Zap', 'streak', 7),
    ('e0000000-0000-0000-0000-000000000004', 'PERFECT_SCORE', 'Mastermind', 'Scored 100% on any topic quiz', 'Star', 'perfect_score', 1),
    ('e0000000-0000-0000-0000-000000000005', 'WEAK_TOPIC_CONQUEROR', 'Phoenix Rising', 'Turned a weak topic into mastery through revision', 'ShieldCheck', 'weak_topic_resolved', 1)
ON CONFLICT (code) DO NOTHING;
