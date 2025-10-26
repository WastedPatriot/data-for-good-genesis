-- Create leads table for marketing campaigns
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  company TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  confidence_score NUMERIC,
  data_interests TEXT[],
  last_reply_at TIMESTAMPTZ
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage leads"
ON public.leads FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create campaign_emails table
CREATE TABLE IF NOT EXISTS public.campaign_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  reply_body TEXT
);

ALTER TABLE public.campaign_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaign emails"
ON public.campaign_emails FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create enterprise_badges table
CREATE TABLE IF NOT EXISTS public.enterprise_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_tier TEXT NOT NULL,
  badge_code TEXT NOT NULL UNIQUE,
  badge_image_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.enterprise_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
ON public.enterprise_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all badges"
ON public.enterprise_badges FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create impact_allocation_history table
CREATE TABLE IF NOT EXISTS public.impact_allocation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  source_purchase_id UUID REFERENCES public.purchases(id),
  allocation_month DATE NOT NULL
);

ALTER TABLE public.impact_allocation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view impact allocations"
ON public.impact_allocation_history FOR SELECT
USING (true);

CREATE POLICY "Admins can manage impact allocations"
ON public.impact_allocation_history FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create project_comments table
CREATE TABLE IF NOT EXISTS public.project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  flagged BOOLEAN DEFAULT false
);

ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
ON public.project_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON public.project_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.project_comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments"
ON public.project_comments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add audit_logs enhancement for marketing
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS domain TEXT;