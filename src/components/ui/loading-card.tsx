import { cn } from '../../lib/utils';
import { Card } from './card';
import { Skeleton } from './skeleton';

interface LoadingCardProps {
  className?: string;
  variant?: 'stat' | 'chart' | 'table';
}

export function LoadingCard({ className, variant = 'stat' }: LoadingCardProps) {
  if (variant === 'stat') {
    return (
      <Card className={cn('p-3 sm:p-5', className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-16 sm:w-20" />
            <Skeleton className="h-6 w-12 sm:h-8 sm:w-16" />
            <Skeleton className="h-2 w-20 sm:w-24" />
          </div>
          <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
        </div>
      </Card>
    );
  }

  if (variant === 'chart') {
    return (
      <Card className={cn('p-4 sm:p-6', className)}>
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="flex items-end justify-center gap-2 h-[180px] sm:h-[220px]">
          {[60, 80, 40, 90, 50].map((h, i) => (
            <Skeleton 
              key={i} 
              className="w-8 sm:w-12 rounded-t-md" 
              style={{ height: `${h}%` }} 
            />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-4', className)}>
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function LoadingGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} variant="stat" />
      ))}
    </div>
  );
}
