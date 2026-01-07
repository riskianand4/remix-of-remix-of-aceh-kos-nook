import { BarChart3, ThumbsUp, ThumbsDown, Minus, TrendingUp } from 'lucide-react';
import { StatCard } from '../components/dashboard/stat-card';
import { SentimentChart } from '../components/dashboard/sentiment-chart';
import { MentionFeed } from '../components/dashboard/mention-feed';
import { WordCloud } from '../components/dashboard/word-cloud';
import { useSentimentStats, useMentions, safePercent } from '../hooks/use-sentiment-api';
import { BackendStatusBadge } from '../components/layout/backend-status';

export default function Dashboard() {
  const { stats, loading: statsLoading, isLive } = useSentimentStats();
  const { mentions, loading: mentionsLoading } = useMentions();

  if (statsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Analisis sentimen publik terhadap PT Pupuk Iskandar Muda
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Calculate percentages safely (avoid NaN/Infinity)
  const positivePercent = safePercent(stats.positif, stats.total);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
            <BackendStatusBadge isLive={isLive} />
          </div>
          <p className="mt-2 text-muted-foreground">
            Analisis sentimen publik terhadap PT Pupuk Iskandar Muda
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-positive" />
          <span>{positivePercent}% sentimen positif</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Data" 
          value={stats.total} 
          icon={BarChart3}
          description="Total komentar teranalisis"
        />
        <StatCard 
          title="Positif" 
          value={stats.positif} 
          icon={ThumbsUp} 
          variant="positive"
          description={`${safePercent(stats.positif, stats.total)}% dari total`}
        />
        <StatCard 
          title="Negatif" 
          value={stats.negatif} 
          icon={ThumbsDown} 
          variant="negative"
          description={`${safePercent(stats.negatif, stats.total)}% dari total`}
        />
        <StatCard 
          title="Netral" 
          value={stats.netral} 
          icon={Minus} 
          variant="neutral"
          description={`${safePercent(stats.netral, stats.total)}% dari total`}
        />
      </div>

      {/* Charts & Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SentimentChart stats={stats} />
        <WordCloud />
      </div>

      {/* Mention Feed - Full Width */}
      <MentionFeed mentions={mentions} loading={mentionsLoading} />
    </div>
  );
}
