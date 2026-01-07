import { useState, useMemo } from 'react';
import Wordcloud from '@visx/wordcloud/lib/Wordcloud';
import { Text } from '@visx/text';
import { scaleLog } from '@visx/scale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWordCloud } from '@/hooks/use-sentiment-api';
import type { SentimentType } from '@/types/sentiment';

const sentimentColors: Record<SentimentType | 'all', string[]> = {
  all: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
  positif: ['#10b981', '#059669', '#34d399'],
  negatif: ['#ef4444', '#dc2626', '#f87171'],
  netral: ['#6b7280', '#4b5563', '#9ca3af'],
};

interface TooltipData {
  text: string;
  value: number;
  x: number;
  y: number;
}

export function WordCloud() {
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentType | 'all'>('all');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const { wordData, loading } = useWordCloud(selectedSentiment);

  const filters: Array<{ value: SentimentType | 'all'; label: string }> = [
    { value: 'all', label: 'Semua' },
    { value: 'positif', label: 'Positif' },
    { value: 'negatif', label: 'Negatif' },
    { value: 'netral', label: 'Netral' },
  ];

  const colors = sentimentColors[selectedSentiment];

  const fontScale = useMemo(() => {
    if (!wordData || wordData.length === 0) return () => 20;
    const values = wordData.map((w) => w.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    if (minVal === maxVal) return () => 30;
    return scaleLog({
      domain: [minVal, maxVal],
      range: [14, 60],
    });
  }, [wordData]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
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
        ) : !wordData || wordData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            Tidak ada data
          </div>
        ) : (
          <div className="h-[250px] w-full flex items-center justify-center relative">
            <svg width={500} height={250}>
              <Wordcloud
                words={wordData}
                width={500}
                height={250}
                fontSize={(w) => fontScale(w.value)}
                spiral="archimedean"
                rotate={0}
                padding={2}
                random={() => 0.5}
              >
              {(cloudWords) =>
                cloudWords.map((w, i) => {
                  const originalWord = wordData.find(d => d.text === w.text);
                  return (
                    <Text
                      key={`${w.text}-${i}`}
                      fill={colors[i % colors.length]}
                      textAnchor="middle"
                      transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
                      fontSize={w.size}
                      fontFamily="system-ui, sans-serif"
                      className="cursor-pointer"
                      style={{ 
                        transition: 'transform 0.2s ease, opacity 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        const target = e.currentTarget;
                        target.style.transform = `translate(${w.x}, ${w.y}) rotate(${w.rotate}) scale(1.15)`;
                        target.style.opacity = '0.9';
                        setTooltip({
                          text: w.text || '',
                          value: originalWord?.value || 0,
                          x: (w.x || 0) + 250,
                          y: (w.y || 0) + 125,
                        });
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget;
                        target.style.transform = `translate(${w.x}, ${w.y}) rotate(${w.rotate}) scale(1)`;
                        target.style.opacity = '1';
                        setTooltip(null);
                      }}
                    >
                      {w.text}
                    </Text>
                  );
                })
              }
              </Wordcloud>
            </svg>
            {tooltip && (
              <div
                className="absolute pointer-events-none bg-popover text-popover-foreground px-3 py-1.5 rounded-md shadow-lg text-sm font-medium border animate-fade-in z-10"
                style={{
                  left: tooltip.x,
                  top: tooltip.y - 40,
                  transform: 'translateX(-50%)',
                }}
              >
                <span className="font-semibold">{tooltip.text}</span>
                <span className="text-muted-foreground ml-1">({tooltip.value}x)</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
