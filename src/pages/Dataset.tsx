import { useState } from 'react';
import { Search, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SentimentBadge } from '@/components/dashboard/sentiment-badge';
import { useDataset } from '@/hooks/use-sentiment-api';
import { BackendStatusBadge } from '@/components/layout/backend-status';
import type { SentimentType } from '@/types/sentiment';

export default function Dataset() {
  const { dataset, loading, isLive } = useDataset();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SentimentType | 'all'>('all');

  const filteredData = dataset.filter((item) => {
    const matchesSearch = item.text.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || item.sentiment === filter;
    return matchesSearch && matchesFilter;
  });

  const filters: Array<{ value: SentimentType | 'all'; label: string }> = [
    { value: 'all', label: 'Semua' },
    { value: 'positif', label: 'Positif' },
    { value: 'negatif', label: 'Negatif' },
    { value: 'netral', label: 'Netral' },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dataset</h1>
          <p className="mt-2 text-muted-foreground">Data sentimen yang digunakan untuk training model</p>
        </div>
        <div className="h-[400px] animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dataset</h1>
            <BackendStatusBadge isLive={isLive} />
          </div>
          <p className="mt-2 text-muted-foreground">
            Data sentimen yang digunakan untuk training model
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{dataset.length} data</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari teks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              {filters.map((f) => (
                <Button
                  key={f.value}
                  variant={filter === f.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Data {filter !== 'all' ? `(${filter})` : ''} — {filteredData.length} hasil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredData.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Tidak ada data yang ditemukan</p>
              </div>
            ) : (
              filteredData.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{item.text}</p>
                    {item.source && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Sumber: {item.source}
                      </p>
                    )}
                  </div>
                  <SentimentBadge sentiment={item.sentiment} />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
