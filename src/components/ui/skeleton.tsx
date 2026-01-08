import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circle' | 'text' | 'card';
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  const variants = {
    default: 'h-4 w-full',
    circle: 'h-10 w-10 rounded-full',
    text: 'h-3 w-3/4',
    card: 'h-24 w-full rounded-xl',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-[shimmer_1.5s_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent',
        variants[variant],
        className
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          className={i === lines - 1 ? 'w-1/2' : 'w-full'} 
        />
      ))}
    </div>
  );
}
