-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create vault_projects table
CREATE TABLE public.vault_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES public.vaults(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  budget NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vault_milestones table
CREATE TABLE public.vault_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.vault_projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community_members table
CREATE TABLE public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID REFERENCES public.vaults(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
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

-- Create trigger function for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Vault projects RLS policies
CREATE POLICY "Anyone can view vault projects"
ON public.vault_projects FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create vault projects"
ON public.vault_projects FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage vault projects"
ON public.vault_projects FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Vault milestones RLS policies
CREATE POLICY "Anyone can view vault milestones"
ON public.vault_milestones FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create vault milestones"
ON public.vault_milestones FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage vault milestones"
ON public.vault_milestones FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Community members RLS policies
CREATE POLICY "Anyone can view community members"
ON public.community_members FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can join as community member"
ON public.community_members FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage community members"
ON public.community_members FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update vaults RLS to require auth for insert
DROP POLICY IF EXISTS "Anyone can create vaults" ON public.vaults;
CREATE POLICY "Authenticated users can create vaults"
ON public.vaults FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Update investors RLS to require auth for insert
DROP POLICY IF EXISTS "Anyone can create investors" ON public.investors;
CREATE POLICY "Authenticated users can create investors"
ON public.investors FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Update transactions RLS to require auth for insert
DROP POLICY IF EXISTS "Anyone can create transactions" ON public.transactions;
CREATE POLICY "Authenticated users can create transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Add update/delete policies for admins
CREATE POLICY "Admins can update vaults"
ON public.vaults FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vaults"
ON public.vaults FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update investors"
ON public.investors FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete investors"
ON public.investors FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update transactions"
ON public.transactions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete transactions"
ON public.transactions FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));