-- Create table for badge verification codes
CREATE TABLE IF NOT EXISTS public.badge_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  dataset_id uuid,
  purchase_id text,
  claimed boolean NOT NULL DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and restrict access to admins only (edge function uses service role)
ALTER TABLE public.badge_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'badge_codes' AND policyname = 'Admins can manage badge codes'
  ) THEN
    CREATE POLICY "Admins can manage badge codes"
    ON public.badge_codes
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Add defensive length constraints to data_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_submissions_email_length'
  ) THEN
    ALTER TABLE public.data_submissions
      ADD CONSTRAINT data_submissions_email_length CHECK (email IS NULL OR char_length(email) <= 255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_submissions_location_length'
  ) THEN
    ALTER TABLE public.data_submissions
      ADD CONSTRAINT data_submissions_location_length CHECK (location IS NULL OR char_length(location) <= 200);
  END IF;
END $$;