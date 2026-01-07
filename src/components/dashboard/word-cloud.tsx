import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useWordCloud } from '../../hooks/use-sentiment-api';
import type { SentimentType } from '../../types/sentiment';

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

  const { minVal, maxVal } = useMemo(() => {
    if (!wordData || wordData.length === 0) return { minVal: 1, maxVal: 1 };
    const values = wordData.map((w) => w.value);
    return { minVal: Math.min(...values), maxVal: Math.max(...values) };
  }, [wordData]);

  const getFontSize = (value: number) => {
    if (minVal === maxVal) return 20;
    const ratio = (value - minVal) / (maxVal - minVal);
    return 12 + ratio * 32; // 12px to 44px
  };

  const handleMouseEnter = (word: { text: string; value: number }, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parent = e.currentTarget.parentElement?.getBoundingClientRect();
    if (parent) {
      setTooltip({
        text: word.text,
        value: word.value,
        x: rect.left - parent.left + rect.width / 2,
        y: rect.top - parent.top,
      });
    }
  };

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
          <div className="h-[250px] w-full flex items-center justify-center relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-center gap-2 p-4 max-h-full overflow-hidden">
              {wordData.slice(0, 40).map((word, i) => (
                <span
                  key={`${word.text}-${i}`}
                  className="cursor-pointer transition-all duration-200 hover:scale-110 hover:opacity-80 inline-block"
                  style={{
                    fontSize: `${getFontSize(word.value)}px`,
                    color: colors[i % colors.length],
                    fontWeight: word.value > (maxVal + minVal) / 2 ? 600 : 400,
                    lineHeight: 1.2,
                  }}
                  onMouseEnter={(e) => handleMouseEnter(word, e)}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {word.text}
                </span>
              ))}
            </div>
            {tooltip && (
              <div
                className="absolute pointer-events-none bg-popover text-popover-foreground px-3 py-1.5 rounded-md shadow-lg text-sm font-medium border animate-fade-in z-10"
                style={{
                  left: tooltip.x,
                  top: tooltip.y - 35,
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
