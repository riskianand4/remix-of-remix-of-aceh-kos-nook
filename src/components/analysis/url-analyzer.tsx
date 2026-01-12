import { useState } from 'react';
import { Link2, Loader2, RotateCcw, ExternalLink, FileText, Sparkles, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useSentimentAnalysis } from '../../hooks/use-sentiment-api';
import { ResultCard } from './result-card';
import { supabase } from '@/integrations/supabase/client';
import type { AnalysisResult } from '../../types/sentiment';

interface ScrapedData {
  content: string;
  title: string;
  description: string;
  sourceUrl: string;
}

type AnalysisMode = 'ml' | 'llm';

export function UrlAnalyzer() {
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('llm');
  const [llmResult, setLlmResult] = useState<AnalysisResult | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  
  const { result: mlResult, loading: mlLoading, error: mlError, analyze: analyzeML, reset: resetML } = useSentimentAnalysis();

  const handleScrapeAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) return;

    setScraping(true);
    setScrapeError(null);
    setScrapedData(null);
    setLlmResult(null);
    resetML();

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

      // Step 2: Analyze based on selected mode
      const textToAnalyze = scraped.content.slice(0, 3000);
      
      if (!textToAnalyze.trim()) {
        throw new Error('Konten yang diekstrak kosong');
      }

      if (analysisMode === 'llm') {
        await analyzeLLM(textToAnalyze);
      } else {
        await analyzeML(textToAnalyze);
      }
    } catch (err) {
      console.error('Scrape and analyze error:', err);
      setScrapeError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setScraping(false);
    }
  };

  const analyzeLLM = async (text: string) => {
    setLlmLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-sentiment-llm', {
        body: { text }
      });

      if (error) {
        throw new Error(error.message || 'Gagal menganalisis dengan AI');
      }

      if (!data.success) {
        throw new Error(data.error || 'Gagal menganalisis sentimen');
      }

      setLlmResult(data.data as AnalysisResult);
    } catch (err) {
      console.error('LLM analysis error:', err);
      setScrapeError(err instanceof Error ? err.message : 'Gagal menganalisis dengan AI');
    } finally {
      setLlmLoading(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setScrapedData(null);
    setScrapeError(null);
    setLlmResult(null);
    resetML();
  };

  const isProcessing = scraping || mlLoading || llmLoading;
  const currentResult = analysisMode === 'llm' ? llmResult : mlResult;
  const currentError = analysisMode === 'llm' ? scrapeError : (scrapeError || mlError);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleScrapeAndAnalyze} className="space-y-4">
            {/* Analysis Mode Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Mode Analisis</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAnalysisMode('llm')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                    analysisMode === 'llm'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-muted bg-background hover:border-muted-foreground/30'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <div className="text-left">
                    <div className="text-sm font-medium">AI (LLM)</div>
                    <div className="text-xs opacity-70">Gemini - Lebih akurat</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAnalysisMode('ml')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                    analysisMode === 'ml'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-muted bg-background hover:border-muted-foreground/30'
                  }`}
                >
                  <Brain className="h-4 w-4" />
                  <div className="text-left">
                    <div className="text-sm font-medium">ML Model</div>
                    <div className="text-xs opacity-70">Naive Bayes - Cepat</div>
                  </div>
                </button>
              </div>
            </div>

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
                    {scraping ? 'Mengekstrak...' : llmLoading ? 'AI Menganalisis...' : 'Menganalisis...'}
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Ekstrak & Analisis
                  </>
                )}
              </Button>
              
              {(currentResult || scrapedData || url) && (
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

            {currentError && (
              <p className="text-sm text-destructive">{currentError}</p>
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
      {currentResult && <ResultCard result={currentResult} />}
    </div>
  );
}
