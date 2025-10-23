-- Add SUPABASE_ANON_KEY to config, max_external_releases_per_month to policy
-- Add provenance_collisions table, visitor_analytics table, complaint_resolutions table

-- Provenance hash collision logging
CREATE TABLE IF NOT EXISTS provenance_collisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  existing_id uuid,
  incoming_payload jsonb NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

-- Visitor analytics for temporary dataset generation
CREATE TABLE IF NOT EXISTS visitor_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  ip_address text,
  user_agent text,
  page_path text NOT NULL,
  referrer text,
  country text,
  city text,
  device_type text,
  browser text,
  os text,
  visited_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX idx_visitor_session ON visitor_analytics(session_id);
CREATE INDEX idx_visitor_created ON visitor_analytics(created_at DESC);

-- AI Complaint Resolution System
CREATE TABLE IF NOT EXISTS complaint_resolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_submission_id uuid REFERENCES contact_submissions(id) ON DELETE CASCADE,
  ai_analysis jsonb NOT NULL,
  resolution_status text NOT NULL DEFAULT 'analyzing', -- analyzing, auto_resolved, escalated, resolved
  ai_response text,
  confidence_score numeric(3,2),
  escalation_reason text,
  escalated_to_admin boolean DEFAULT false,
  admin_reviewed_at timestamptz,
  admin_reviewed_by uuid,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX idx_complaint_status ON complaint_resolutions(resolution_status);
CREATE INDEX idx_complaint_escalated ON complaint_resolutions(escalated_to_admin);

-- Add max_external_releases_per_month to release_policy
ALTER TABLE release_policy 
ADD COLUMN IF NOT EXISTS max_external_releases_per_month integer DEFAULT 2;

-- Enable RLS
ALTER TABLE provenance_collisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_resolutions ENABLE ROW LEVEL SECURITY;

-- Policies for provenance_collisions
CREATE POLICY "Admins can view provenance collisions" 
ON provenance_collisions FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert provenance collisions" 
ON provenance_collisions FOR INSERT 
WITH CHECK (true);

-- Policies for visitor_analytics
CREATE POLICY "Admins can view visitor analytics" 
ON visitor_analytics FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert visitor analytics" 
ON visitor_analytics FOR INSERT 
WITH CHECK (true);

-- Policies for complaint_resolutions
CREATE POLICY "Admins can manage complaint resolutions" 
ON complaint_resolutions FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for new tables
ALTER TABLE provenance_collisions REPLICA IDENTITY FULL;
ALTER TABLE visitor_analytics REPLICA IDENTITY FULL;
ALTER TABLE complaint_resolutions REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE provenance_collisions;
ALTER PUBLICATION supabase_realtime ADD TABLE visitor_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE complaint_resolutions;