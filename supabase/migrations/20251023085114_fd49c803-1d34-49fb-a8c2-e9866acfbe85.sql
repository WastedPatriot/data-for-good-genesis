-- Create admin role enum (already exists, but ensuring it's there)
-- The app_role enum should already exist with 'admin', 'moderator', 'user'

-- Create security definer function to check roles (avoiding RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update RLS policies to use the security definer function
-- Admin access to data_submissions
CREATE POLICY "Admins can manage all submissions"
ON public.data_submissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin access to data_processing_queue  
CREATE POLICY "Admins can view processing queue"
ON public.data_processing_queue
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update processing queue"
ON public.data_processing_queue
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin access to contact_submissions
CREATE POLICY "Admins can delete contact submissions"
ON public.contact_submissions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin access to organization_profiles for verification
CREATE POLICY "Admins can delete organization profiles"
ON public.organization_profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin access to purchases
CREATE POLICY "Admins can delete purchases"
ON public.purchases
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin access to datasets
CREATE POLICY "Admins can delete datasets"
ON public.datasets
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin access to badge_codes
CREATE POLICY "Admins can view badge codes"
ON public.badge_codes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert badge codes"
ON public.badge_codes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update badge codes"
ON public.badge_codes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete badge codes"
ON public.badge_codes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin access to audit_logs
CREATE POLICY "Admins can delete audit logs"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));