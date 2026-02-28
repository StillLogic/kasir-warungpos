
-- Drop existing storage policies for backups bucket and recreate
DROP POLICY IF EXISTS "Users can upload own backups" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own backups" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own backups" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own backups" ON storage.objects;

-- Recreate with proper permissions
CREATE POLICY "Users can upload own backups"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own backups"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read own backups"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own backups"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
