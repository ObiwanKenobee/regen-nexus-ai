import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipBack, SkipForward, Calendar } from 'lucide-react';
import { format, subDays, differenceInDays, addDays } from 'date-fns';

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
}

interface TimelinePlaybackProps {
  transactions: Transaction[];
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  onPlaybackPositionChange: (date: Date) => void;
}

export const TimelinePlayback = ({
  transactions,
  onDateRangeChange,
  onPlaybackPositionChange,
}: TimelinePlaybackProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentPosition, setCurrentPosition] = useState(100);
  
  // Calculate date range from transactions
  const dates = transactions.map(tx => new Date(tx.created_at));
  const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : subDays(new Date(), 30);
  const maxDate = new Date();
  const totalDays = Math.max(differenceInDays(maxDate, minDate), 1);

  const getCurrentDate = useCallback(() => {
    const daysFromStart = (currentPosition / 100) * totalDays;
    return addDays(minDate, daysFromStart);
  }, [currentPosition, totalDays, minDate]);

  const getTransactionsUpToPosition = useCallback(() => {
    const currentDate = getCurrentDate();
    return transactions.filter(tx => new Date(tx.created_at) <= currentDate);
  }, [getCurrentDate, transactions]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentPosition(prev => {
        const next = prev + (0.5 * playbackSpeed);
        if (next >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  useEffect(() => {
    const currentDate = getCurrentDate();
    onPlaybackPositionChange(currentDate);
    onDateRangeChange(minDate, currentDate);
  }, [currentPosition, getCurrentDate, onPlaybackPositionChange, onDateRangeChange, minDate]);

  const handleSliderChange = (value: number[]) => {
    setCurrentPosition(value[0]);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentPosition(0);
  };
  const handleSkipToEnd = () => {
    setIsPlaying(false);
    setCurrentPosition(100);
  };

  const activeTransactions = getTransactionsUpToPosition();
  const totalVolume = activeTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Timeline Playback
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {activeTransactions.length} transactions
          </Badge>
          <Badge variant="secondary" className="text-xs">
            ${(totalVolume / 1000000).toFixed(0)}M volume
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {/* Date display */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{format(minDate, 'MMM d, yyyy')}</span>
          <span className="font-medium text-primary">
            {format(getCurrentDate(), 'MMM d, yyyy')}
          </span>
          <span>{format(maxDate, 'MMM d, yyyy')}</span>
        </div>

        {/* Timeline slider */}
        <Slider
          value={[currentPosition]}
          onValueChange={handleSliderChange}
          max={100}
          step={0.1}
          className="w-full"
        />

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          {isPlaying ? (
            <Button
              variant="default"
              size="icon"
              onClick={handlePause}
              className="h-10 w-10"
            >
              <Pause className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              onClick={handlePlay}
              className="h-10 w-10"
            >
              <Play className="w-5 h-5" />
            </Button>
          )}
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleSkipToEnd}
            className="h-8 w-8"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          {/* Speed control */}
          <div className="ml-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Speed:</span>
            {[0.5, 1, 2, 4].map((speed) => (
              <Button
                key={speed}
                variant={playbackSpeed === speed ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPlaybackSpeed(speed)}
                className="h-6 px-2 text-xs"
              >
                {speed}x
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
