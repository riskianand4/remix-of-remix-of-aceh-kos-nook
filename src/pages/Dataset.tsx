import { useState } from 'react';
import { Search, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { SentimentBadge } from '../components/dashboard/sentiment-badge';
import { ExportButton } from '../components/dataset/export-button';
import { useDataset } from '../hooks/use-sentiment-api';
import { BackendStatusBadge } from '../components/layout/backend-status';
import { PageTransition } from '../components/ui/page-transition';
import { StaggerContainer, StaggerItem } from '../components/ui/stagger-container';
import { LoadingCard } from '../components/ui/loading-card';
import type { SentimentType } from '../types/sentiment';

export default function Dataset() {
  const { dataset, loading, isLive } = useDataset();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SentimentType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredData = dataset.filter((item) => {
    const matchesSearch = item.text.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || item.sentiment === filter;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const filters: Array<{ value: SentimentType | 'all'; label: string }> = [
    { value: 'all', label: 'Semua' },
    { value: 'positif', label: 'Positif' },
    { value: 'negatif', label: 'Negatif' },
    { value: 'netral', label: 'Netral' },
  ];

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-4 sm:space-y-8">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight">Dataset</h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">Data sentimen yang digunakan untuk training model</p>
          </div>
          <LoadingCard variant="table" className="h-[400px]" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight">Dataset</h1>
              <BackendStatusBadge isLive={isLive} />
            </div>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
              Data sentimen yang digunakan untuk training model
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ExportButton data={filteredData} />
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-muted px-2 py-1.5 sm:px-3 sm:py-2">
              <Database className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">{dataset.length} data</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-3 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari teks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 sm:h-10 w-full rounded-lg border border-input bg-background pl-8 sm:pl-10 pr-3 sm:pr-4 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Filter buttons - 2x2 grid on mobile */}
              <div className="grid grid-cols-4 sm:flex sm:items-center gap-1.5 sm:gap-2">
                {filters.map((f) => (
                  <Button
                    key={f.value}
                    variant={filter === f.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f.value)}
                    className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
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
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-base font-medium">
              Data {filter !== 'all' ? `(${filter})` : ''} — {filteredData.length} hasil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StaggerContainer className="space-y-1.5 sm:space-y-2">
              {filteredData.length === 0 ? (
                <div className="py-8 sm:py-12 text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Tidak ada data yang ditemukan</p>
                </div>
              ) : (
                paginatedData.map((item) => (
                  <StaggerItem key={item.id}>
                    <div className="flex items-start justify-between gap-2 sm:gap-4 rounded-lg border border-border p-2.5 sm:p-4 transition-colors hover:bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm leading-relaxed">{item.text}</p>
                      </div>
                      <SentimentBadge sentiment={item.sentiment} />
                    </div>
                  </StaggerItem>
                ))
              )}
            </StaggerContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                >
                  Prev
                </Button>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-7 sm:w-9 h-7 sm:h-9 text-xs sm:text-sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
