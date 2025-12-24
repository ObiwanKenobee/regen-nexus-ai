-- Create audit_logs table for tracking admin actions
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins and moderators can insert audit logs
CREATE POLICY "Admins and moderators can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'moderator')
);

-- Create has_moderator_role function for convenience
CREATE OR REPLACE FUNCTION public.has_moderator_or_admin_role(_user_id uuid)
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
      AND role IN ('admin', 'moderator')
  )
$$;

-- Update vaults policies to allow moderators to update
CREATE POLICY "Moderators can update vaults"
ON public.vaults
FOR UPDATE
USING (public.has_role(auth.uid(), 'moderator'));

-- Update vault_projects policies to allow moderators to update
CREATE POLICY "Moderators can update vault projects"
ON public.vault_projects
FOR UPDATE
USING (public.has_moderator_or_admin_role(auth.uid()));

-- Update vault_milestones policies to allow moderators to update
CREATE POLICY "Moderators can update vault milestones"
ON public.vault_milestones
FOR UPDATE
USING (public.has_moderator_or_admin_role(auth.uid()));

-- Update community_members policies to allow moderators to update
CREATE POLICY "Moderators can update community members"
ON public.community_members
FOR UPDATE
USING (public.has_moderator_or_admin_role(auth.uid()));

-- Allow moderators to delete community members
CREATE POLICY "Moderators can delete community members"
ON public.community_members
FOR DELETE
USING (public.has_moderator_or_admin_role(auth.uid()));