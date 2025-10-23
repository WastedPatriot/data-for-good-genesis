-- ============================================
-- PROJECTS & VOTING SYSTEM WITH VERIFICATION
-- ============================================

-- Enum for project status
CREATE TYPE project_status AS ENUM ('proposed', 'under_review', 'verified', 'active', 'funded', 'completed', 'rejected');

-- Enum for charity partnership status
CREATE TYPE partnership_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  category TEXT NOT NULL,
  
  -- Organization/submitter
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_name TEXT NOT NULL,
  organization_id UUID REFERENCES organization_profiles(id) ON DELETE SET NULL,
  
  -- Financial
  funding_goal NUMERIC NOT NULL CHECK (funding_goal > 0),
  funded_amount NUMERIC NOT NULL DEFAULT 0,
  
  -- Status & verification
  status project_status NOT NULL DEFAULT 'proposed',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_notes TEXT,
  
  -- Voting
  votes_count INTEGER NOT NULL DEFAULT 0,
  active_from TIMESTAMP WITH TIME ZONE,
  active_until TIMESTAMP WITH TIME ZONE,
  
  -- Documentation
  website_url TEXT,
  documentation_url TEXT,
  proof_of_work_url TEXT,
  charity_registration_number TEXT,
  
  -- Metadata
  tags TEXT[],
  icon TEXT DEFAULT 'Leaf',
  image_url TEXT,
  
  -- Fraud prevention
  flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT
);

-- Project votes table
CREATE TABLE public.project_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Voting power (can be weighted by contribution)
  vote_weight INTEGER NOT NULL DEFAULT 1 CHECK (vote_weight > 0),
  
  UNIQUE(project_id, user_id)
);

-- Charity partnerships table
CREATE TABLE public.charity_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Organization info
  organization_name TEXT NOT NULL,
  organization_id UUID REFERENCES organization_profiles(id) ON DELETE SET NULL,
  
  -- Legal verification
  charity_registration_number TEXT NOT NULL,
  country TEXT NOT NULL,
  registration_proof_url TEXT,
  
  -- Contact
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  
  -- Verification
  status partnership_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_notes TEXT,
  
  -- Partnership details
  agreement_url TEXT,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  website_url TEXT,
  impact_areas TEXT[],
  
  UNIQUE(charity_registration_number, country)
);

-- Project milestones table
CREATE TABLE public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_proof_url TEXT,
  
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Anyone can view active projects"
  ON public.projects FOR SELECT
  USING (status IN ('verified', 'active', 'funded', 'completed'));

CREATE POLICY "Admins can view all projects"
  ON public.projects FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can propose projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Project submitters can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = submitted_by AND status = 'proposed');

CREATE POLICY "Admins can update any project"
  ON public.projects FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for project_votes
CREATE POLICY "Anyone can view project votes"
  ON public.project_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.project_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.project_votes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for charity_partnerships
CREATE POLICY "Anyone can view verified partnerships"
  ON public.charity_partnerships FOR SELECT
  USING (status = 'verified');

CREATE POLICY "Admins can view all partnerships"
  ON public.charity_partnerships FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage partnerships"
  ON public.charity_partnerships FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for project_milestones
CREATE POLICY "Anyone can view milestones of active projects"
  ON public.project_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
        AND projects.status IN ('verified', 'active', 'funded', 'completed')
    )
  );

CREATE POLICY "Admins can manage milestones"
  ON public.project_milestones FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_charity_partnerships_updated_at
  BEFORE UPDATE ON public.charity_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_milestones_updated_at
  BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update vote count on projects
CREATE OR REPLACE FUNCTION update_project_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects
    SET votes_count = votes_count + NEW.vote_weight
    WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects
    SET votes_count = votes_count - OLD.vote_weight
    WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to update vote counts
CREATE TRIGGER update_project_votes_count_trigger
  AFTER INSERT OR DELETE ON public.project_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_votes_count();

-- Indexes for performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_votes_count ON projects(votes_count DESC);
CREATE INDEX idx_projects_active_dates ON projects(active_from, active_until) WHERE status = 'active';
CREATE INDEX idx_project_votes_project_id ON project_votes(project_id);
CREATE INDEX idx_project_votes_user_id ON project_votes(user_id);
CREATE INDEX idx_charity_partnerships_status ON charity_partnerships(status);
CREATE INDEX idx_project_milestones_project_id ON project_milestones(project_id);