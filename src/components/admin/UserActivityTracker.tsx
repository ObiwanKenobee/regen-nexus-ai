import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Activity, Users, Eye, MousePointerClick, 
  LogIn, LogOut, RefreshCw, Clock, BarChart3 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  metadata: unknown;
  created_at: string;
}

interface UserSummary {
  user_id: string;
  email: string | null;
  full_name: string | null;
  last_active: string;
  activity_count: number;
}

interface ActivityTypeCount {
  type: string;
  count: number;
}

const UserActivityTracker = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);
  const [activityCounts, setActivityCounts] = useState<ActivityTypeCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      // Fetch recent activities
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (activityError) throw activityError;
      setActivities((activityData as UserActivity[]) || []);

      // Process activity counts by type
      const typeCounts: Record<string, number> = {};
      (activityData || []).forEach((a: UserActivity) => {
        typeCounts[a.activity_type] = (typeCounts[a.activity_type] || 0) + 1;
      });

      setActivityCounts(
        Object.entries(typeCounts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
      );

      // Fetch profiles to get user info
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, updated_at');

      if (profilesError) throw profilesError;

      // Create user summaries
      const summaries: UserSummary[] = (profiles || []).map((p) => {
        const userActivities = (activityData || []).filter(
          (a: UserActivity) => a.user_id === p.user_id
        );
        const lastActivity = userActivities[0]?.created_at || p.updated_at;

        return {
          user_id: p.user_id,
          email: p.email,
          full_name: p.full_name,
          last_active: lastActivity,
          activity_count: userActivities.length,
        };
      });

      // Sort by last active
      summaries.sort(
        (a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime()
      );
      setUserSummaries(summaries);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivityData();
    setRefreshing(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'page_view':
        return <Eye className="w-3 h-3 text-blue-500" />;
      case 'click':
        return <MousePointerClick className="w-3 h-3 text-green-500" />;
      case 'login':
        return <LogIn className="w-3 h-3 text-purple-500" />;
      case 'logout':
        return <LogOut className="w-3 h-3 text-orange-500" />;
      default:
        return <Activity className="w-3 h-3 text-primary" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'page_view':
        return 'hsl(217, 91%, 60%)';
      case 'click':
        return 'hsl(142, 76%, 36%)';
      case 'login':
        return 'hsl(262, 83%, 58%)';
      case 'logout':
        return 'hsl(25, 95%, 53%)';
      default:
        return 'hsl(var(--primary))';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">User Activity Tracking</h2>
            <p className="text-sm text-muted-foreground">
              Monitor user engagement and activity patterns
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity by Type Chart */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Activity by Type
          </h3>
          {activityCounts.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityCounts} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="type"
                    width={80}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {activityCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getActivityColor(entry.type)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              No activity data yet
            </div>
          )}
        </Card>

        {/* Active Users */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Recently Active Users
          </h3>
          <ScrollArea className="h-48">
            {userSummaries.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No user activity recorded
              </div>
            ) : (
              <div className="space-y-3">
                {userSummaries.slice(0, 10).map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {user.full_name || 'Unnamed User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.activity_count} activities
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(user.last_active), { addSuffix: true })}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Activity Feed
        </h3>
        <ScrollArea className="h-64">
          {activities.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No activities recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {activities.slice(0, 20).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-full bg-background">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {activity.activity_type.replace('_', ' ')}
                      </Badge>
                      {activity.metadata && (
                        <span className="text-xs text-muted-foreground truncate">
                          {JSON.stringify(activity.metadata).slice(0, 50)}...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(activity.created_at), 'MMM d, yyyy HH:mm:ss')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};

export default UserActivityTracker;
