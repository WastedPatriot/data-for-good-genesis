-- Add charity verification and filtering fields to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS blocked_associations TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS verification_flags JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS charity_verification_status TEXT DEFAULT 'pending' CHECK (charity_verification_status IN ('pending', 'verified', 'flagged', 'blocked'));

-- Add comment explaining the blocking system
COMMENT ON COLUMN projects.blocked_associations IS 'List of blocked associations (e.g., political affiliations) that prevent project approval';
COMMENT ON COLUMN projects.verification_flags IS 'JSON object containing verification details and flags';
COMMENT ON COLUMN projects.charity_verification_status IS 'Charity verification status: pending, verified, flagged, or blocked';

-- Create function to check for blocked associations
CREATE OR REPLACE FUNCTION check_blocked_associations(project_data TEXT, charity_name TEXT, website TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  blocked_keywords TEXT[] := ARRAY['zionist', 'zionism', 'israel defense', 'idf'];
  result JSONB := '{"blocked": false, "matches": []}'::jsonb;
  keyword TEXT;
  combined_text TEXT;
BEGIN
  -- Combine all text for checking
  combined_text := LOWER(COALESCE(project_data, '') || ' ' || COALESCE(charity_name, '') || ' ' || COALESCE(website, ''));
  
  -- Check for blocked keywords
  FOREACH keyword IN ARRAY blocked_keywords
  LOOP
    IF combined_text LIKE '%' || keyword || '%' THEN
      result := jsonb_set(result, '{blocked}', 'true'::jsonb);
      result := jsonb_set(result, '{matches}', result->'matches' || to_jsonb(keyword));
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Create trigger to auto-flag projects with blocked associations
CREATE OR REPLACE FUNCTION auto_flag_blocked_projects()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  check_result JSONB;
BEGIN
  -- Check for blocked associations
  check_result := check_blocked_associations(
    NEW.description || ' ' || COALESCE(NEW.long_description, ''),
    NEW.organization_name,
    COALESCE(NEW.website_url, '')
  );
  
  -- If blocked associations found, flag the project
  IF (check_result->>'blocked')::boolean = true THEN
    NEW.blocked_associations := ARRAY(SELECT jsonb_array_elements_text(check_result->'matches'));
    NEW.charity_verification_status := 'blocked';
    NEW.status := 'rejected';
    NEW.verification_notes := COALESCE(NEW.verification_notes, '') || E'\n\nAUTO-BLOCKED: Contains blocked associations: ' || (check_result->>'matches');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new projects
DROP TRIGGER IF EXISTS trigger_check_blocked_associations ON projects;
CREATE TRIGGER trigger_check_blocked_associations
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_flag_blocked_projects();

-- Delete any existing sample/fake projects (keeping only user-submitted ones)
-- This will only run if there are projects without a submitted_by field
DELETE FROM projects WHERE submitted_by IS NULL;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_charity_verification_status ON projects(charity_verification_status);
CREATE INDEX IF NOT EXISTS idx_blocked_associations ON projects USING GIN(blocked_associations);