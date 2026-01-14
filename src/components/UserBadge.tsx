import { useEngagementScore } from '@/hooks/useEngagementScore';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Award,
  Star,
  Zap,
  Flame,
  Sparkles,
} from 'lucide-react';

const badgeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  newcomer: {
    icon: <Star className="w-3 h-3" />,
    color: 'bg-slate-500 hover:bg-slate-600',
    label: 'Newcomer',
  },
  engaged: {
    icon: <Sparkles className="w-3 h-3" />,
    color: 'bg-blue-500 hover:bg-blue-600',
    label: 'Engaged',
  },
  active: {
    icon: <Zap className="w-3 h-3" />,
    color: 'bg-green-500 hover:bg-green-600',
    label: 'Active',
  },
  power_user: {
    icon: <Flame className="w-3 h-3" />,
    color: 'bg-orange-500 hover:bg-orange-600',
    label: 'Power User',
  },
  champion: {
    icon: <Award className="w-3 h-3" />,
    color: 'bg-yellow-500 hover:bg-yellow-600',
    label: 'Champion',
  },
};

interface UserBadgeProps {
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const UserBadge = ({ showScore = false, size = 'md' }: UserBadgeProps) => {
  const { score, loading } = useEngagementScore();

  if (loading || !score) return null;

  const config = badgeConfig[score.badge] || badgeConfig.newcomer;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`${config.color} text-white gap-1 cursor-default ${sizeClasses[size]}`}
          >
            {config.icon}
            {config.label}
            {showScore && (
              <span className="ml-1 opacity-75">({score.total_score})</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">Engagement Score: {score.total_score}</p>
            <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-0.5">
              <span>Page Views: {score.page_views_count}</span>
              <span>Clicks: {score.clicks_count}</span>
              <span>Forms: {score.form_submissions_count}</span>
              <span>Features: {score.feature_uses_count}</span>
              <span>Logins: {score.login_count}</span>
              <span>Sessions: {score.session_count}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UserBadge;
