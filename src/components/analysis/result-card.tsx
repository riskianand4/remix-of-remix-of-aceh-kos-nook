import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SentimentBadge } from '@/components/dashboard/sentiment-badge';
import { cn } from '@/lib/utils';
import type { AnalysisResult } from '@/types/sentiment';

interface ResultCardProps {
  result: AnalysisResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const confidencePercent = Math.round(result.confidence * 100);

  const bars = [
    { label: 'Positif', value: result.probabilities.positif, colorClass: 'bg-positive' },
    { label: 'Negatif', value: result.probabilities.negatif, colorClass: 'bg-negative' },
    { label: 'Netral', value: result.probabilities.netral, colorClass: 'bg-neutral' },
  ];

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Hasil Analisis</CardTitle>
          <SentimentBadge sentiment={result.sentiment} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Analyzed text */}
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm leading-relaxed">"{result.text}"</p>
        </div>

        {/* Confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tingkat Keyakinan</span>
            <span className="font-medium">{confidencePercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-all duration-500',
                result.sentiment === 'positif' && 'bg-positive',
                result.sentiment === 'negatif' && 'bg-negative',
                result.sentiment === 'netral' && 'bg-neutral'
              )}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {/* Probability breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Probabilitas per Kategori</p>
          {bars.map((bar) => (
            <div key={bar.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{bar.label}</span>
                <span>{Math.round(bar.value * 100)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full transition-all duration-500', bar.colorClass)}
                  style={{ width: `${bar.value * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
