import { useState } from 'react';
import { Send, Loader2, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSentimentAnalysis } from '@/hooks/use-sentiment-api';
import { ResultCard } from './result-card';

export function TextAnalyzer() {
  const [text, setText] = useState('');
  const { result, loading, error, analyze, reset } = useSentimentAnalysis();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      analyze(text);
    }
  };

  const handleReset = () => {
    setText('');
    reset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                disabled={!text.trim() || loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menganalisis...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Analisis
                  </>
                )}
              </Button>
              
              {(result || text) && (
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

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {result && <ResultCard result={result} />}
    </div>
  );
}
