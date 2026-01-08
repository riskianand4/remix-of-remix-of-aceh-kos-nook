import { TextAnalyzer } from '../components/analysis/text-analyzer';
import { PageTransition } from '../components/ui/page-transition';

export default function Analysis() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-8xl space-y-4 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight">Analisis Sentimen</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
            Masukkan teks untuk menganalisis sentimennya menggunakan model Naive Bayes
          </p>
        </div>

        {/* Analyzer */}
        <TextAnalyzer />
      </div>
    </PageTransition>
  );
}
