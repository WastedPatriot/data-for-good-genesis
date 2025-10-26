-- Fix enterprise_badges missing columns used by code
ALTER TABLE public.enterprise_badges
  ADD COLUMN IF NOT EXISTS badge_seed TEXT,
  ADD COLUMN IF NOT EXISTS volume_purchased NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS eco_funding_contributed NUMERIC DEFAULT 0;

-- Ensure there is a default release policy for on_site channel
INSERT INTO public.release_policy (channel)
SELECT 'on_site'
WHERE NOT EXISTS (
  SELECT 1 FROM public.release_policy WHERE channel = 'on_site'
);

-- Harden function search_path to avoid mutable search_path warnings
CREATE OR REPLACE FUNCTION public.update_review_queue_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; 
$$;