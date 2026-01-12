import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SentimentBadge } from '../dashboard/sentiment-badge';
import { cn } from '../../lib/utils';
import type { AnalysisResult } from '../../types/sentiment';
import { Bot, Brain, Sparkles } from 'lucide-react';

interface ResultCardProps {
  result: AnalysisResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const confidencePercent = Math.round(result.confidence * 100);
  const isLLM = result.method === 'llm';

  const bars = [
    { label: 'Positif', value: result.probabilities.positif, colorClass: 'bg-positive' },
    { label: 'Negatif', value: result.probabilities.negatif, colorClass: 'bg-negative' },
    { label: 'Netral', value: result.probabilities.netral, colorClass: 'bg-neutral' },
  ];

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium">Hasil Analisis</CardTitle>
            {/* Method badge */}
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              isLLM 
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" 
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            )}>
              {isLLM ? <Sparkles className="h-3 w-3" /> : <Brain className="h-3 w-3" />}
              {isLLM ? 'AI/LLM' : 'ML Model'}
            </span>
          </div>
          <SentimentBadge sentiment={result.sentiment} />
        </div>
        {isLLM && result.model && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Bot className="h-3 w-3" />
            Model: {result.model}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Analyzed text */}
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm leading-relaxed">"{result.text}"</p>
        </div>

        {/* LLM Reasoning (if available) */}
        {isLLM && result.reasoning && (
          <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3 border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Penjelasan AI
            </p>
            <p className="text-sm text-purple-900 dark:text-purple-100">{result.reasoning}</p>
          </div>
        )}

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
