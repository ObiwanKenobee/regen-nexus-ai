import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AuthButton } from '@/components/AuthButton';
import SEOHead from '@/components/SEOHead';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useAuth } from '@/hooks/useAuth';
import {
  Award,
  Star,
  Zap,
  Flame,
  Sparkles,
  ChevronLeft,
  Trophy,
  Medal,
  Crown,
  Loader2,
  TrendingUp,
  Users,
} from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  total_score: number;
  badge: string;
  page_views_count: number;
  clicks_count: number;
  form_submissions_count: number;
  feature_uses_count: number;
  login_count: number;
  session_count: number;
  full_name?: string;
  email?: string;
}

const badgeConfig: Record<string, { icon: React.ReactNode; color: string; label: string; bgColor: string }> = {
  newcomer: {
    icon: <Star className="w-4 h-4" />,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500',
    label: 'Newcomer',
  },
  engaged: {
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    label: 'Engaged',
  },
  active: {
    icon: <Zap className="w-4 h-4" />,
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    label: 'Active',
  },
  power_user: {
    icon: <Flame className="w-4 h-4" />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
    label: 'Power User',
  },
  champion: {
    icon: <Award className="w-4 h-4" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    label: 'Champion',
  },
};

const podiumIcons = [
  <Trophy key="1" className="w-8 h-8 text-yellow-500" />,
  <Medal key="2" className="w-7 h-7 text-slate-400" />,
  <Medal key="3" className="w-6 h-6 text-amber-600" />,
];

const Leaderboard = () => {
  const { trackPageView } = useActivityTracker();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    trackPageView("Leaderboard");
    fetchLeaderboard();
  }, [trackPageView]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data: scores, error } = await supabase
        .from('user_engagement_scores')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (scores && scores.length > 0) {
        const userIds = scores.map(s => s.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', userIds);

        const enrichedScores: LeaderboardEntry[] = scores.map(score => {
          const profile = profiles?.find(p => p.user_id === score.user_id);
          return {
            ...score,
            full_name: profile?.full_name,
            email: profile?.email,
          };
        });

        setLeaderboard(enrichedScores);

        // Find current user's rank
        if (user) {
          const rank = enrichedScores.findIndex(s => s.user_id === user.id);
          if (rank !== -1) {
            setUserRank(rank + 1);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    if (entry.full_name) return entry.full_name;
    if (entry.email) return entry.email.split('@')[0];
    return 'Anonymous User';
  };

  const getInitials = (entry: LeaderboardEntry) => {
    const name = getDisplayName(entry);
    return name.substring(0, 2).toUpperCase();
  };

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <>
      <SEOHead
        title="Leaderboard"
        description="See top engaged users on the RDX Platform. Compete for badges and recognition through platform engagement."
        keywords="leaderboard, engagement, badges, community, recognition"
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <AuthButton />
          <ThemeToggle />
        </header>

        <div className="container px-4 py-8">
          {/* Back Button */}
          <Link to="/">
            <Button variant="ghost" className="gap-2 mb-6">
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>

          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Engagement Leaderboard</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Recognizing our most active community members. Earn points through page views, 
              feature usage, and platform engagement to climb the ranks!
            </p>
            {userRank && (
              <Badge variant="outline" className="mt-4 text-lg py-2 px-4">
                <TrendingUp className="w-4 h-4 mr-2" />
                Your Rank: #{userRank}
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : leaderboard.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Rankings Yet</h2>
              <p className="text-muted-foreground">
                Be the first to climb the leaderboard! Start engaging with the platform to earn points.
              </p>
            </Card>
          ) : (
            <>
              {/* Top 3 Podium */}
              {top3.length > 0 && (
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  {/* Second Place */}
                  {top3[1] && (
                    <Card className="p-6 text-center order-1 md:order-1 md:mt-8 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-slate-300 dark:border-slate-700">
                      <div className="flex justify-center mb-4">
                        {podiumIcons[1]}
                      </div>
                      <div className="w-16 h-16 rounded-full bg-slate-400 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3">
                        {getInitials(top3[1])}
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{getDisplayName(top3[1])}</h3>
                      <Badge className={`${badgeConfig[top3[1].badge]?.bgColor || 'bg-slate-500'} text-white gap-1 mb-3`}>
                        {badgeConfig[top3[1].badge]?.icon}
                        {badgeConfig[top3[1].badge]?.label}
                      </Badge>
                      <p className="text-3xl font-bold text-slate-500">{top3[1].total_score}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </Card>
                  )}

                  {/* First Place */}
                  {top3[0] && (
                    <Card className="p-8 text-center order-0 md:order-2 bg-gradient-to-b from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-300 dark:border-yellow-700 ring-2 ring-yellow-400/50">
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <Crown className="w-10 h-10 text-yellow-500 absolute -top-6 left-1/2 -translate-x-1/2" />
                          {podiumIcons[0]}
                        </div>
                      </div>
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-3 ring-4 ring-yellow-300">
                        {getInitials(top3[0])}
                      </div>
                      <h3 className="font-bold text-xl mb-1">{getDisplayName(top3[0])}</h3>
                      <Badge className={`${badgeConfig[top3[0].badge]?.bgColor || 'bg-slate-500'} text-white gap-1 mb-3`}>
                        {badgeConfig[top3[0].badge]?.icon}
                        {badgeConfig[top3[0].badge]?.label}
                      </Badge>
                      <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{top3[0].total_score}</p>
                      <p className="text-sm text-muted-foreground">points</p>
                    </Card>
                  )}

                  {/* Third Place */}
                  {top3[2] && (
                    <Card className="p-6 text-center order-2 md:order-3 md:mt-12 bg-gradient-to-b from-amber-100 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300 dark:border-amber-700">
                      <div className="flex justify-center mb-4">
                        {podiumIcons[2]}
                      </div>
                      <div className="w-14 h-14 rounded-full bg-amber-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-3">
                        {getInitials(top3[2])}
                      </div>
                      <h3 className="font-semibold mb-1">{getDisplayName(top3[2])}</h3>
                      <Badge className={`${badgeConfig[top3[2].badge]?.bgColor || 'bg-slate-500'} text-white gap-1 mb-3`}>
                        {badgeConfig[top3[2].badge]?.icon}
                        {badgeConfig[top3[2].badge]?.label}
                      </Badge>
                      <p className="text-2xl font-bold text-amber-600">{top3[2].total_score}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </Card>
                  )}
                </div>
              )}

              {/* Rest of Leaderboard */}
              {rest.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Rankings
                  </h2>
                  <div className="space-y-3">
                    {rest.map((entry, index) => {
                      const badgeInfo = badgeConfig[entry.badge] || badgeConfig.newcomer;
                      const isCurrentUser = user?.id === entry.user_id;
                      
                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                            isCurrentUser 
                              ? 'bg-primary/10 ring-2 ring-primary' 
                              : 'bg-muted/50 hover:bg-muted'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                            #{index + 4}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                            {getInitials(entry)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {getDisplayName(entry)}
                              {isCurrentUser && (
                                <span className="text-xs text-primary ml-2">(You)</span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{entry.page_views_count} views</span>
                              <span>•</span>
                              <span>{entry.feature_uses_count} features</span>
                              <span>•</span>
                              <span>{entry.login_count} logins</span>
                            </div>
                          </div>
                          <Badge className={`${badgeInfo.bgColor} text-white gap-1`}>
                            {badgeInfo.icon}
                            {badgeInfo.label}
                          </Badge>
                          <div className="text-right min-w-[80px]">
                            <p className="text-xl font-bold">{entry.total_score}</p>
                            <p className="text-xs text-muted-foreground">points</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Scoring Guide */}
              <Card className="p-6 mt-8">
                <h2 className="text-lg font-semibold mb-4">How Points Are Earned</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium">Page Views</p>
                    <p className="text-2xl font-bold text-primary">+1 point</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium">Clicks</p>
                    <p className="text-2xl font-bold text-primary">+2 points</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium">Feature Usage</p>
                    <p className="text-2xl font-bold text-primary">+3 points</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium">Form Submissions</p>
                    <p className="text-2xl font-bold text-primary">+5 points</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium">Sessions</p>
                    <p className="text-2xl font-bold text-primary">+5 points</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium">Logins</p>
                    <p className="text-2xl font-bold text-primary">+10 points</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Scores are calculated based on the last 30 days of activity.
                </p>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Leaderboard;
