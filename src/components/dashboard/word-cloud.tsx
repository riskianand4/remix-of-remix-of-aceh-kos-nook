import { useState } from 'react';
import ReactWordcloud from 'react-wordcloud';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWordCloud } from '@/hooks/use-sentiment-api';
import type { SentimentType } from '@/types/sentiment';

const options = {
  rotations: 2,
  rotationAngles: [-90, 0] as [number, number],
  fontSizes: [14, 60] as [number, number],
  padding: 2,
  deterministic: true,
  enableTooltip: true,
  fontFamily: 'system-ui, sans-serif',
};

const sentimentColors: Record<SentimentType | 'all', string[]> = {
  all: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
  positif: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0'],
  negatif: ['#ef4444', '#dc2626', '#f87171', '#fca5a5', '#fecaca'],
  netral: ['#6b7280', '#4b5563', '#9ca3af', '#d1d5db', '#e5e7eb'],
};

export function WordCloud() {
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentType | 'all'>('all');
  const { wordData, loading } = useWordCloud(selectedSentiment);

  const filters: Array<{ value: SentimentType | 'all'; label: string }> = [
    { value: 'all', label: 'Semua' },
    { value: 'positif', label: 'Positif' },
    { value: 'negatif', label: 'Negatif' },
    { value: 'netral', label: 'Netral' },
  ];

  const callbacks = {
    getWordColor: (word: { text: string; value: number }) => {
      const colors = sentimentColors[selectedSentiment];
      const index = Math.floor(Math.random() * colors.length);
      return colors[index];
    },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Kata Populer</CardTitle>
          <div className="flex items-center gap-1">
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={selectedSentiment === f.value ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSelectedSentiment(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[250px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : wordData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            Tidak ada data
          </div>
        ) : (
          <div className="h-[250px]">
            <ReactWordcloud 
              words={wordData} 
              options={options} 
              callbacks={callbacks}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
