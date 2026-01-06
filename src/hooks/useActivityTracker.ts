import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ActivityMetadata {
  [key: string]: unknown;
}

export const useActivityTracker = () => {
  const { user } = useAuth();
  const lastActivityRef = useRef<string | null>(null);

  const trackActivity = useCallback(
    async (activityType: string, metadata?: ActivityMetadata) => {
      if (!user) return;

      // Debounce similar activities within 1 second
      const activityKey = `${activityType}-${JSON.stringify(metadata)}`;
      if (lastActivityRef.current === activityKey) return;
      lastActivityRef.current = activityKey;

      setTimeout(() => {
        if (lastActivityRef.current === activityKey) {
          lastActivityRef.current = null;
        }
      }, 1000);

      try {
        const { error } = await supabase.from('user_activity').insert({
          user_id: user.id,
          activity_type: activityType,
          metadata: metadata as never,
        });

        if (error) {
          console.error('Error tracking activity:', error);
        }
      } catch (err) {
        console.error('Failed to track activity:', err);
      }
    },
    [user]
  );

  // Track page views
  const trackPageView = useCallback(
    (page: string) => {
      trackActivity('page_view', { page, url: window.location.pathname });
    },
    [trackActivity]
  );

  // Track clicks on important elements
  const trackClick = useCallback(
    (element: string, metadata?: ActivityMetadata) => {
      trackActivity('click', { element, ...metadata });
    },
    [trackActivity]
  );

  // Track login events
  const trackLogin = useCallback(() => {
    trackActivity('login', { timestamp: new Date().toISOString() });
  }, [trackActivity]);

  // Track logout events
  const trackLogout = useCallback(() => {
    trackActivity('logout', { timestamp: new Date().toISOString() });
  }, [trackActivity]);

  // Track form submissions
  const trackFormSubmit = useCallback(
    (formName: string, metadata?: ActivityMetadata) => {
      trackActivity('form_submit', { form: formName, ...metadata });
    },
    [trackActivity]
  );

  // Track feature usage
  const trackFeatureUse = useCallback(
    (feature: string, metadata?: ActivityMetadata) => {
      trackActivity('feature_use', { feature, ...metadata });
    },
    [trackActivity]
  );

  // Auto-track session start when user logs in
  useEffect(() => {
    if (user) {
      trackActivity('session_start', {
        user_agent: navigator.userAgent,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
      });
    }
  }, [user, trackActivity]);

  return {
    trackActivity,
    trackPageView,
    trackClick,
    trackLogin,
    trackLogout,
    trackFormSubmit,
    trackFeatureUse,
  };
};

export default useActivityTracker;
