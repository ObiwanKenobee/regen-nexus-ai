-- First create the app_role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create has_role function if it doesn't exist
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

-- Create user_engagement_scores table to track engagement metrics
CREATE TABLE IF NOT EXISTS public.user_engagement_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  page_views_count INTEGER NOT NULL DEFAULT 0,
  clicks_count INTEGER NOT NULL DEFAULT 0,
  form_submissions_count INTEGER NOT NULL DEFAULT 0,
  feature_uses_count INTEGER NOT NULL DEFAULT 0,
  login_count INTEGER NOT NULL DEFAULT 0,
  session_count INTEGER NOT NULL DEFAULT 0,
  badge TEXT DEFAULT 'newcomer',
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_engagement_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own engagement score" ON public.user_engagement_scores;
DROP POLICY IF EXISTS "Admins can view all engagement scores" ON public.user_engagement_scores;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.user_engagement_scores;
DROP POLICY IF EXISTS "Allow update for own engagement score" ON public.user_engagement_scores;

-- Users can view their own engagement score
CREATE POLICY "Users can view their own engagement score"
ON public.user_engagement_scores
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all engagement scores
CREATE POLICY "Admins can view all engagement scores"
ON public.user_engagement_scores
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- System can insert/update engagement scores
CREATE POLICY "Allow insert for authenticated users"
ON public.user_engagement_scores
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update for own engagement score"
ON public.user_engagement_scores
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create scheduled_reports table to track report schedules
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_scheduled_at TIMESTAMP WITH TIME ZONE,
  recipient_emails TEXT[],
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (report_type)
);

-- Enable RLS
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Admins can manage scheduled reports" ON public.scheduled_reports;

-- Only admins can manage scheduled reports
CREATE POLICY "Admins can manage scheduled reports"
ON public.scheduled_reports
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_user_engagement_scores_updated_at ON public.user_engagement_scores;
DROP TRIGGER IF EXISTS update_scheduled_reports_updated_at ON public.scheduled_reports;

CREATE TRIGGER update_user_engagement_scores_updated_at
BEFORE UPDATE ON public.user_engagement_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at
BEFORE UPDATE ON public.scheduled_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate engagement score for a user
CREATE OR REPLACE FUNCTION public.calculate_engagement_score(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_count RECORD;
  total_score INTEGER := 0;
  badge_level TEXT;
BEGIN
  -- Count activities by type from last 30 days
  SELECT
    COUNT(*) FILTER (WHERE activity_type = 'page_view') as page_views,
    COUNT(*) FILTER (WHERE activity_type = 'click') as clicks,
    COUNT(*) FILTER (WHERE activity_type = 'form_submit') as form_submissions,
    COUNT(*) FILTER (WHERE activity_type = 'feature_use') as feature_uses,
    COUNT(*) FILTER (WHERE activity_type = 'login') as logins,
    COUNT(*) FILTER (WHERE activity_type = 'session_start') as sessions
  INTO activity_count
  FROM user_activity
  WHERE user_id = target_user_id
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Calculate score with weights
  total_score := 
    COALESCE(activity_count.page_views, 0) * 1 +
    COALESCE(activity_count.clicks, 0) * 2 +
    COALESCE(activity_count.form_submissions, 0) * 5 +
    COALESCE(activity_count.feature_uses, 0) * 3 +
    COALESCE(activity_count.logins, 0) * 10 +
    COALESCE(activity_count.sessions, 0) * 5;

  -- Determine badge based on score
  IF total_score >= 500 THEN
    badge_level := 'champion';
  ELSIF total_score >= 200 THEN
    badge_level := 'power_user';
  ELSIF total_score >= 100 THEN
    badge_level := 'active';
  ELSIF total_score >= 25 THEN
    badge_level := 'engaged';
  ELSE
    badge_level := 'newcomer';
  END IF;

  -- Upsert engagement score
  INSERT INTO user_engagement_scores (
    user_id, total_score, page_views_count, clicks_count,
    form_submissions_count, feature_uses_count, login_count,
    session_count, badge, last_calculated_at
  )
  VALUES (
    target_user_id, total_score, 
    COALESCE(activity_count.page_views, 0),
    COALESCE(activity_count.clicks, 0),
    COALESCE(activity_count.form_submissions, 0),
    COALESCE(activity_count.feature_uses, 0),
    COALESCE(activity_count.logins, 0),
    COALESCE(activity_count.sessions, 0),
    badge_level, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_score = EXCLUDED.total_score,
    page_views_count = EXCLUDED.page_views_count,
    clicks_count = EXCLUDED.clicks_count,
    form_submissions_count = EXCLUDED.form_submissions_count,
    feature_uses_count = EXCLUDED.feature_uses_count,
    login_count = EXCLUDED.login_count,
    session_count = EXCLUDED.session_count,
    badge = EXCLUDED.badge,
    last_calculated_at = NOW(),
    updated_at = NOW();

  RETURN total_score;
END;
$$;