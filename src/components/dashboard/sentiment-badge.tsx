import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import type { SentimentType } from '../../types/sentiment';

const badgeVariants = cva(
  'inline-flex items-center font-medium',
  {
    variants: {
      sentiment: {
        positif: 'bg-positive/10 text-positive',
        negatif: 'bg-negative/10 text-negative',
        netral: 'bg-muted text-muted-foreground',
      },
      size: {
        sm: 'rounded px-2 py-0.5 text-xs',
        md: 'rounded-md px-2.5 py-1 text-xs',
      },
    },
    defaultVariants: {
      sentiment: 'netral',
      size: 'md',
    },
  }
);

interface SentimentBadgeProps extends VariantProps<typeof badgeVariants> {
  sentiment: SentimentType;
  size?: 'sm' | 'md';
  className?: string;
}

export function SentimentBadge({ sentiment, size, className }: SentimentBadgeProps) {
  const labels: Record<SentimentType, string> = {
    positif: 'Positif',
    negatif: 'Negatif',
    netral: 'Netral',
  };

  return (
    <span className={cn(badgeVariants({ sentiment, size }), className)}>
      {labels[sentiment]}
    </span>
  );
}
