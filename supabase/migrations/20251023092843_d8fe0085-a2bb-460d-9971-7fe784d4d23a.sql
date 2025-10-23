-- Add unique constraint on dataset names to prevent duplicates
ALTER TABLE public.datasets ADD CONSTRAINT datasets_name_unique UNIQUE (name);

-- Add unique constraint on badge codes to prevent duplicates
ALTER TABLE public.badge_codes ADD CONSTRAINT badge_codes_code_unique UNIQUE (code);