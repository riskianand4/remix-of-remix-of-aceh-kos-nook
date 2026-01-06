import { TextAnalyzer } from '@/components/analysis/text-analyzer';

export default function Analysis() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Analisis Sentimen</h1>
        <p className="mt-2 text-muted-foreground">
          Masukkan teks untuk menganalisis sentimennya menggunakan model Naive Bayes
        </p>
      </div>

      {/* Analyzer */}
      <TextAnalyzer />
    </div>
  );
}
