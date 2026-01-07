import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BackendStatusBadgeProps {
  isLive: boolean;
  className?: string;
}

export function BackendStatusBadge({ isLive, className }: BackendStatusBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        isLive 
          ? 'bg-positive/10 text-positive' 
          : 'bg-muted text-muted-foreground',
        className
      )}
    >
      {isLive ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Demo</span>
        </>
      )}
    </div>
  );
}
