-- Create site_themes table for seasonal/holiday themes
CREATE TABLE IF NOT EXISTS public.site_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  config JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_themes ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  -- Allow anyone to read (themes are public-facing)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'site_themes' AND policyname = 'Anyone can read themes'
  ) THEN
    CREATE POLICY "Anyone can read themes" ON public.site_themes FOR SELECT USING (true);
  END IF;

  -- Only authenticated users can insert/update/delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'site_themes' AND policyname = 'Authenticated can modify themes'
  ) THEN
    CREATE POLICY "Authenticated can modify themes" ON public.site_themes FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_site_themes_updated_at ON public.site_themes;
CREATE TRIGGER update_site_themes_updated_at
BEFORE UPDATE ON public.site_themes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();