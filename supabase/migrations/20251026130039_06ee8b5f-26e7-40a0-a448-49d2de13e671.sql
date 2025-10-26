-- SECURITY: Add strict RLS policies for sensitive tables
CREATE POLICY "Only admins can view visitor analytics"
ON public.visitor_analytics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can view data submissions"
ON public.data_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add region_impact for Palestine, Sudan, Congo, etc.
CREATE TYPE public.region_impact AS ENUM (
  'palestine',
  'sudan',
  'congo',
  'refugee',
  'housing',
  'reforestation',
  'river_cleanup',
  'soil_restoration',
  'medical',
  'global'
);

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS region_impact region_impact DEFAULT 'global',
ADD COLUMN IF NOT EXISTS urgency_level text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS recommended_funding_sources jsonb DEFAULT '[]'::jsonb;

-- Voting cooldown tracking
CREATE TABLE IF NOT EXISTS public.vote_cooldowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_vote_at timestamptz NOT NULL DEFAULT now(),
  vote_count_this_month integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.vote_cooldowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cooldowns"
ON public.vote_cooldowns
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage cooldowns"
ON public.vote_cooldowns
FOR ALL
USING (true)
WITH CHECK (true);

-- Rate limiting for login attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  fingerprint text,
  email text,
  success boolean DEFAULT false,
  attempted_at timestamptz DEFAULT now(),
  user_agent text
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view login attempts"
ON public.login_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);

-- Impact transparency ledger
CREATE TABLE IF NOT EXISTS public.funding_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  source text NOT NULL,
  region_impact region_impact,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.funding_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view funding ledger"
ON public.funding_ledger
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage funding ledger"
ON public.funding_ledger
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Sharecards generation tracking
CREATE TABLE IF NOT EXISTS public.sharecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  badge_level text,
  seed text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sharecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sharecards"
ON public.sharecards
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create sharecards"
ON public.sharecards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view public sharecards"
ON public.sharecards
FOR SELECT
USING (true);