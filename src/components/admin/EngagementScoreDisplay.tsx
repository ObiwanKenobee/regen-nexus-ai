import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import {
  Award,
  Star,
  Zap,
  Flame,
  Sparkles,
  Loader2,
  RefreshCw,
  TrendingUp,
  Eye,
  MousePointer,
  FileText,
  Rocket,
  LogIn,
  Activity,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface EngagementScore {
  id: string;
  user_id: string;
  total_score: number;
  page_views_count: number;
  clicks_count: number;
  form_submissions_count: number;
  feature_uses_count: number;
  login_count: number;
  session_count: number;
  badge: string;
  last_calculated_at: string;
}

interface UserWithEngagement extends EngagementScore {
  email?: string;
  full_name?: string;
}

const badgeConfig: Record<string, { icon: React.ReactNode; color: string; label: string; minScore: number }> = {
  newcomer: {
    icon: <Star className="w-4 h-4" />,
    color: 'bg-slate-500',
    label: 'Newcomer',
    minScore: 0,
  },
  engaged: {
    icon: <Sparkles className="w-4 h-4" />,
    color: 'bg-blue-500',
    label: 'Engaged',
    minScore: 25,
  },
  active: {
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-green-500',
    label: 'Active',
    minScore: 100,
  },
  power_user: {
    icon: <Flame className="w-4 h-4" />,
    color: 'bg-orange-500',
    label: 'Power User',
    minScore: 200,
  },
  champion: {
    icon: <Award className="w-4 h-4" />,
    color: 'bg-yellow-500',
    label: 'Champion',
    minScore: 500,
  },
};

const EngagementScoreDisplay = () => {
  const { user, isAdmin } = useAuth();
  const [scores, setScores] = useState<UserWithEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchScores();
  }, [isAdmin]);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const { data: scoresData, error: scoresError } = await supabase
        .from('user_engagement_scores')
        .select('*')
        .order('total_score', { ascending: false });

      if (scoresError) throw scoresError;

      // Fetch user profiles for display names
      if (scoresData && scoresData.length > 0) {
        const userIds = scoresData.map(s => s.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', userIds);

        const enrichedScores: UserWithEngagement[] = scoresData.map(score => {
          const profile = profiles?.find(p => p.user_id === score.user_id);
          return {
            ...score,
            email: profile?.email,
            full_name: profile?.full_name,
          };
        });

        setScores(enrichedScores);
      } else {
        setScores([]);
      }
    } catch (error) {
      console.error('Error fetching engagement scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const recalculateAllScores = async () => {
    if (!isAdmin) return;
    
    setCalculating(true);
    try {
      // Get all users with activity
      const { data: activities } = await supabase
        .from('user_activity')
        .select('user_id')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const uniqueUserIds = [...new Set(activities?.map(a => a.user_id) || [])];

      // Calculate score for each user
      for (const userId of uniqueUserIds) {
        await supabase.rpc('calculate_engagement_score', { target_user_id: userId });
      }

      toast({
        title: 'Scores Recalculated',
        description: `Updated engagement scores for ${uniqueUserIds.length} users.`,
      });

      fetchScores();
    } catch (error) {
      console.error('Error recalculating scores:', error);
      toast({
        title: 'Error',
        description: 'Failed to recalculate engagement scores.',
        variant: 'destructive',
      });
    } finally {
      setCalculating(false);
    }
  };

  const getNextBadge = (currentBadge: string) => {
    const badges = Object.entries(badgeConfig);
    const currentIndex = badges.findIndex(([key]) => key === currentBadge);
    if (currentIndex < badges.length - 1) {
      return badges[currentIndex + 1];
    }
    return null;
  };

  const getProgressToNextBadge = (score: number, currentBadge: string) => {
    const next = getNextBadge(currentBadge);
    if (!next) return 100;
    
    const currentConfig = badgeConfig[currentBadge];
    const nextConfig = next[1];
    
    const range = nextConfig.minScore - currentConfig.minScore;
    const progress = score - currentConfig.minScore;
    
    return Math.min(100, Math.max(0, (progress / range) * 100));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">User Engagement Scores</h2>
              <p className="text-sm text-muted-foreground">
                Track user activity levels and award badges for engagement
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button
              onClick={recalculateAllScores}
              disabled={calculating}
              variant="outline"
              className="gap-2"
            >
              {calculating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Recalculate All
            </Button>
          )}
        </div>

        {/* Badge Legend */}
        <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">Badge Levels:</span>
          {Object.entries(badgeConfig).map(([key, config]) => (
            <Badge
              key={key}
              className={`${config.color} text-white gap-1`}
            >
              {config.icon}
              {config.label} ({config.minScore}+)
            </Badge>
          ))}
        </div>
      </Card>

      {/* Scores Table */}
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="text-center">
                <Eye className="w-4 h-4 inline mr-1" />
                Views
              </TableHead>
              <TableHead className="text-center">
                <MousePointer className="w-4 h-4 inline mr-1" />
                Clicks
              </TableHead>
              <TableHead className="text-center">
                <FileText className="w-4 h-4 inline mr-1" />
                Forms
              </TableHead>
              <TableHead className="text-center">
                <Rocket className="w-4 h-4 inline mr-1" />
                Features
              </TableHead>
              <TableHead className="text-center">
                <LogIn className="w-4 h-4 inline mr-1" />
                Logins
              </TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No engagement data yet. Activity will be tracked as users interact with the platform.
                </TableCell>
              </TableRow>
            ) : (
              scores.map((score) => {
                const badgeInfo = badgeConfig[score.badge] || badgeConfig.newcomer;
                const progress = getProgressToNextBadge(score.total_score, score.badge);
                const nextBadge = getNextBadge(score.badge);

                return (
                  <TableRow key={score.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{score.full_name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground">{score.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${badgeInfo.color} text-white gap-1`}>
                        {badgeInfo.icon}
                        {badgeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold text-lg">
                      {score.total_score}
                    </TableCell>
                    <TableCell className="text-center">{score.page_views_count}</TableCell>
                    <TableCell className="text-center">{score.clicks_count}</TableCell>
                    <TableCell className="text-center">{score.form_submissions_count}</TableCell>
                    <TableCell className="text-center">{score.feature_uses_count}</TableCell>
                    <TableCell className="text-center">{score.login_count}</TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress value={progress} className="h-2" />
                        {nextBadge && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.round(progress)}% to {nextBadge[1].label}
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default EngagementScoreDisplay;
