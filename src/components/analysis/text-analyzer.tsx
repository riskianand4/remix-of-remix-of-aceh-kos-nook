import { useState } from 'react';
import { Send, Loader2, RotateCcw, Sparkles, Brain } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useSentimentAnalysis } from '../../hooks/use-sentiment-api';
import { ResultCard } from './result-card';
import { supabase } from '@/integrations/supabase/client';
import type { AnalysisResult } from '../../types/sentiment';

type AnalysisMode = 'ml' | 'llm';

export function TextAnalyzer() {
  const [text, setText] = useState('');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('llm');
  const [llmResult, setLlmResult] = useState<AnalysisResult | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);
  
  const { result: mlResult, loading: mlLoading, error: mlError, analyze: analyzeML, reset: resetML } = useSentimentAnalysis();

  const analyzeLLM = async (inputText: string) => {
    setLlmLoading(true);
    setLlmError(null);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-sentiment-llm', {
        body: { text: inputText }
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
      setLlmError(err instanceof Error ? err.message : 'Gagal menganalisis dengan AI');
    } finally {
      setLlmLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (analysisMode === 'llm') {
      await analyzeLLM(text);
    } else {
      analyzeML(text);
    }
  };

  const handleReset = () => {
    setText('');
    setLlmResult(null);
    setLlmError(null);
    resetML();
  };

  const isLoading = analysisMode === 'llm' ? llmLoading : mlLoading;
  const currentResult = analysisMode === 'llm' ? llmResult : mlResult;
  const currentError = analysisMode === 'llm' ? llmError : mlError;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label htmlFor="text-input" className="text-sm font-medium">
                Teks untuk dianalisis
              </label>
              <Textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Contoh: Pupuk dari PIM sangat bagus untuk tanaman padi saya..."
                className="min-h-[140px] resize-none"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={!text.trim() || isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {analysisMode === 'llm' ? 'AI Menganalisis...' : 'Menganalisis...'}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Analisis
                  </>
                )}
              </Button>
              
              {(currentResult || text) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2"
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

      {currentResult && <ResultCard result={currentResult} />}
    </div>
  );
}
