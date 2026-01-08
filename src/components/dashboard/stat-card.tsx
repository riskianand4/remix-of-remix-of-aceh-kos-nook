import { cn } from '../../lib/utils';
import { Card } from '../ui/card';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'positive' | 'negative' | 'neutral';
  description?: string;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  variant = 'default', 
  description,
  className 
}: StatCardProps) {
  const iconColors = {
    default: 'bg-muted text-foreground',
    positive: 'bg-positive/10 text-positive',
    negative: 'bg-negative/10 text-negative',
    neutral: 'bg-muted text-muted-foreground',
  };

  return (
    <Card className={cn('p-3 sm:p-5 transition-all duration-200 hover:shadow-md', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xl sm:text-3xl font-semibold tracking-tight">{value.toLocaleString()}</p>
          {description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn('flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg', iconColors[variant])}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </Card>
  );
}
