-- Fix search_path for remaining plpgsql functions
-- All plpgsql functions should have search_path set for security

CREATE OR REPLACE FUNCTION public.check_blocked_associations(project_data text, charity_name text, website text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.auto_flag_blocked_projects()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
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