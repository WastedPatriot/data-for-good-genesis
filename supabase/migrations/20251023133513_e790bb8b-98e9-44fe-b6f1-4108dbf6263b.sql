-- Fix recursive RLS policy on user_roles causing 42P17 errors
-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Recreate using SECURITY DEFINER helper to avoid recursion
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
AS PERMISSIVE
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ensure the self-view policy for users remains (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_roles' 
      AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;