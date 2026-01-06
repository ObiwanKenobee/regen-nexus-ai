-- Create update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create notification_settings table for admin preferences
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  large_transaction_threshold NUMERIC NOT NULL DEFAULT 100000,
  email_on_large_transaction BOOLEAN NOT NULL DEFAULT true,
  email_on_new_user BOOLEAN NOT NULL DEFAULT true,
  email_on_role_change BOOLEAN NOT NULL DEFAULT true,
  email_on_milestone BOOLEAN NOT NULL DEFAULT true,
  notification_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies - admins can manage notification settings
CREATE POLICY "Admins can view notification settings"
ON public.notification_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert notification settings"
ON public.notification_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND auth.uid() = user_id);

CREATE POLICY "Admins can update their notification settings"
ON public.notification_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND auth.uid() = user_id);

-- Create user_activity table for tracking engagement
CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own activity"
ON public.user_activity
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
ON public.user_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
ON public.user_activity
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Create index for faster queries
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX idx_user_activity_type ON public.user_activity(activity_type);

-- Add trigger for updated_at on notification_settings
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();