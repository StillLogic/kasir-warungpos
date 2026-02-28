
-- Storage bucket for backup files
INSERT INTO storage.buckets (id, name, public) VALUES ('backups', 'backups', false);

-- Backup metadata table
CREATE TABLE public.backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  is_auto BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backups"
  ON public.backups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backups"
  ON public.backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups"
  ON public.backups FOR DELETE
  USING (auth.uid() = user_id);

-- User backup settings table
CREATE TABLE public.backup_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_backup_enabled BOOLEAN NOT NULL DEFAULT false,
  backup_interval TEXT NOT NULL DEFAULT 'daily',
  last_auto_backup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.backup_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.backup_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.backup_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Storage policies for backups bucket
CREATE POLICY "Users can upload own backups"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own backups"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own backups"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'backups' AND auth.uid()::text = (storage.foldername(name))[1]);
