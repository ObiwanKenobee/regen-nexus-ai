import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EngagementScore {
  total_score: number;
  badge: string;
  page_views_count: number;
  clicks_count: number;
  form_submissions_count: number;
  feature_uses_count: number;
  login_count: number;
  session_count: number;
  last_calculated_at: string | null;
}

const badgeLabels: Record<string, string> = {
  newcomer: 'Newcomer',
  engaged: 'Engaged',
  active: 'Active',
  power_user: 'Power User',
  champion: 'Champion',
};

export const useEngagementScore = () => {
  const { user } = useAuth();
  const [score, setScore] = useState<EngagementScore | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchScore = useCallback(async () => {
    if (!user) {
      setScore(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_engagement_scores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setScore({
          total_score: data.total_score,
          badge: data.badge,
          page_views_count: data.page_views_count,
          clicks_count: data.clicks_count,
          form_submissions_count: data.form_submissions_count,
          feature_uses_count: data.feature_uses_count,
          login_count: data.login_count,
          session_count: data.session_count,
          last_calculated_at: data.last_calculated_at,
        });
      }
    } catch (error) {
      console.error('Error fetching engagement score:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const recalculateScore = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('calculate_engagement_score', {
        target_user_id: user.id,
      });

      if (error) throw error;

      // Refresh the score after calculation
      await fetchScore();
      return data;
    } catch (error) {
      console.error('Error recalculating engagement score:', error);
      return null;
    }
  }, [user, fetchScore]);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  const getBadgeLabel = (badge: string) => badgeLabels[badge] || 'Unknown';

  return {
    score,
    loading,
    fetchScore,
    recalculateScore,
    getBadgeLabel,
  };
};

export default useEngagementScore;
