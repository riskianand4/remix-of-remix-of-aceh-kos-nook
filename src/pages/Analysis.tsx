import { useState } from 'react';
import { TextAnalyzer } from '../components/analysis/text-analyzer';
import { UrlAnalyzer } from '../components/analysis/url-analyzer';
import { AnalysisHistory } from '../components/analysis/analysis-history';
import { PageTransition } from '../components/ui/page-transition';
import { FileText, Link2 } from 'lucide-react';
import { useAnalysisHistory } from '@/hooks/use-analysis-history';
import type { AnalysisResult } from '@/types/sentiment';

type AnalysisMode = 'text' | 'url';

export default function Analysis() {
  const [mode, setMode] = useState<AnalysisMode>('text');
  const { saveAnalysis } = useAnalysisHistory();

  const handleTextAnalysisComplete = async (result: AnalysisResult) => {
    await saveAnalysis({ result });
  };

  const handleUrlAnalysisComplete = async (
    result: AnalysisResult, 
    sourceUrl?: string, 
    sourceTitle?: string
  ) => {
    await saveAnalysis({ result, sourceUrl, sourceTitle });
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-8xl space-y-4 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight">Analisis Sentimen</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
            Analisis sentimen teks atau URL berita menggunakan AI atau model Naive Bayes
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Analysis Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Mode Tabs */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
              <button
                onClick={() => setMode('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'text'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4" />
                Teks
              </button>
              <button
                onClick={() => setMode('url')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'url'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Link2 className="h-4 w-4" />
                URL Berita
              </button>
            </div>

            {/* Analyzer Components */}
            {mode === 'text' ? (
              <TextAnalyzer onAnalysisComplete={handleTextAnalysisComplete} />
            ) : (
              <UrlAnalyzer onAnalysisComplete={handleUrlAnalysisComplete} />
            )}
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <AnalysisHistory />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
