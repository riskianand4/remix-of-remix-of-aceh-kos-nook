import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SentimentBadge } from './sentiment-badge';
import type { Mention } from '@/types/sentiment';

interface MentionFeedProps {
  mentions: Mention[];
  loading?: boolean;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m lalu`;
  if (diffHours < 24) return `${diffHours}j lalu`;
  return `${diffDays}h lalu`;
}

export function MentionFeed({ mentions, loading }: MentionFeedProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Komentar Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Komentar Terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mentions.slice(0, 6).map((mention) => (
            <div
              key={mention.id}
              className="group flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed line-clamp-2">{mention.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRelativeTime(mention.createdAt)}
                </p>
              </div>
              <SentimentBadge sentiment={mention.sentiment} size="sm" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
