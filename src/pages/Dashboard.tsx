import { BarChart3, ThumbsUp, ThumbsDown, Minus, TrendingUp } from 'lucide-react';
import { StatCard } from '../components/dashboard/stat-card';
import { SentimentChart } from '../components/dashboard/sentiment-chart';
import { MentionFeed } from '../components/dashboard/mention-feed';
import { WordCloud } from '../components/dashboard/word-cloud';
import { useSentimentStats, useMentions, safePercent } from '../hooks/use-sentiment-api';
import { BackendStatusBadge } from '../components/layout/backend-status';
import { PageTransition } from '../components/ui/page-transition';
import { StaggerContainer, StaggerItem } from '../components/ui/stagger-container';
import { LoadingGrid, LoadingCard } from '../components/ui/loading-card';

export default function Dashboard() {
  const { stats, loading: statsLoading, isLive } = useSentimentStats();
  const { mentions, loading: mentionsLoading } = useMentions();

  if (statsLoading) {
    return (
      <PageTransition>
        <div className="space-y-6 sm:space-y-8">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
              Analisis sentimen publik terhadap PT Pupuk Iskandar Muda
            </p>
          </div>
          <LoadingGrid count={4} />
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-6">
            <LoadingCard variant="chart" />
            <LoadingCard variant="chart" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!stats) return null;

  const positivePercent = safePercent(stats.positif, stats.total);

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
              <BackendStatusBadge isLive={isLive} />
            </div>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
              Analisis sentimen publik terhadap PT Pupuk Iskandar Muda
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-positive" />
            <span>{positivePercent}% sentimen positif</span>
          </div>
        </div>

        {/* Stats Grid - Always 2 cols on mobile */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StaggerItem>
            <StatCard 
              title="Total Data" 
              value={stats.total} 
              icon={BarChart3}
              description="Total komentar teranalisis"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard 
              title="Positif" 
              value={stats.positif} 
              icon={ThumbsUp} 
              variant="positive"
              description={`${safePercent(stats.positif, stats.total)}% dari total`}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard 
              title="Negatif" 
              value={stats.negatif} 
              icon={ThumbsDown} 
              variant="negative"
              description={`${safePercent(stats.negatif, stats.total)}% dari total`}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard 
              title="Netral" 
              value={stats.netral} 
              icon={Minus} 
              variant="neutral"
              description={`${safePercent(stats.netral, stats.total)}% dari total`}
            />
          </StaggerItem>
        </StaggerContainer>

        {/* Charts - 2 cols on mobile */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-6">
          <StaggerItem>
            <SentimentChart stats={stats} />
          </StaggerItem>
          <StaggerItem>
            <WordCloud />
          </StaggerItem>
        </StaggerContainer>

        {/* Mention Feed */}
        <MentionFeed mentions={mentions} loading={mentionsLoading} />
      </div>
    </PageTransition>
  );
}
