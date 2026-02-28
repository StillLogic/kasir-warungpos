-- Allow users to update their own backup metadata (needed for single-file overwrite)
CREATE POLICY "Users can update own backups"
ON public.backups
FOR UPDATE
USING (auth.uid() = user_id);