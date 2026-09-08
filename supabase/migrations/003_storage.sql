-- 003_storage.sql
-- Smart Education Platform Storage Buckets and Policies

-- 1. Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('learning-materials', 'learning-materials', true),
    ('assignments', 'assignments', false),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for avatars
CREATE POLICY "Avatars are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 3. Storage Policies for learning-materials
CREATE POLICY "Authenticated users can read learning materials"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'learning-materials');

CREATE POLICY "Teachers and admins can upload learning materials"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'learning-materials'
        AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'super_admin')
            )
        )
    );

-- 4. Storage Policies for assignments
CREATE POLICY "Students and teachers can access assignment files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'assignments');

CREATE POLICY "Authenticated users can upload assignment files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'assignments');
