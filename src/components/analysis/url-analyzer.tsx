import { useState } from 'react';
import { Link2, Loader2, RotateCcw, ExternalLink, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useSentimentAnalysis } from '../../hooks/use-sentiment-api';
import { ResultCard } from './result-card';
import { supabase } from '@/integrations/supabase/client';

interface ScrapedData {
  content: string;
  title: string;
  description: string;
  sourceUrl: string;
}

export function UrlAnalyzer() {
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  
  const { result, loading, error, analyze, reset } = useSentimentAnalysis();

  const handleScrapeAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) return;

    setScraping(true);
    setScrapeError(null);
    setScrapedData(null);
    reset();

    try {
      // Step 1: Scrape the URL using edge function
      const { data, error: scrapeErr } = await supabase.functions.invoke('scrape-url', {
        body: { url: url.trim() }
      });

      if (scrapeErr) {
        throw new Error(scrapeErr.message || 'Gagal mengekstrak konten');
      }

      if (!data.success) {
        throw new Error(data.error || 'Gagal mengekstrak konten dari URL');
      }

      const scraped = data.data as ScrapedData;
      setScrapedData(scraped);

      // Step 2: Analyze the extracted content
      // Take first 2000 characters for analysis to avoid too long text
      const textToAnalyze = scraped.content.slice(0, 2000);
      
      if (textToAnalyze.trim()) {
        await analyze(textToAnalyze);
      } else {
        throw new Error('Konten yang diekstrak kosong');
      }
    } catch (err) {
      console.error('Scrape and analyze error:', err);
      setScrapeError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setScraping(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setScrapedData(null);
    setScrapeError(null);
    reset();
  };

  const isProcessing = scraping || loading;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleScrapeAndAnalyze} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="url-input" className="text-sm font-medium">
                URL Berita untuk dianalisis
              </label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="url-input"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/berita/..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Masukkan URL artikel berita untuk mengekstrak dan menganalisis sentimennya
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={!url.trim() || isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {scraping ? 'Mengekstrak...' : 'Menganalisis...'}
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Ekstrak & Analisis
                  </>
                )}
              </Button>
              
              {(result || scrapedData || url) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2"
                  disabled={isProcessing}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>

            {(scrapeError || error) && (
              <p className="text-sm text-destructive">{scrapeError || error}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Scraped Content Preview */}
      {scrapedData && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <CardTitle className="text-base font-medium truncate">
                  {scrapedData.title || 'Artikel'}
                </CardTitle>
                {scrapedData.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {scrapedData.description}
                  </p>
                )}
              </div>
              <a
                href={scrapedData.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-muted/50 rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                {scrapedData.content.slice(0, 500)}
                {scrapedData.content.length > 500 && '...'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              📄 {scrapedData.content.length.toLocaleString()} karakter diekstrak
            </p>
          </CardContent>
        </Card>
      )}

      {/* Analysis Result */}
      {result && <ResultCard result={result} />}
    </div>
  );
}
