import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackendStatusBadge } from '@/components/layout/backend-status';
import { useEvaluation } from '@/hooks/use-sentiment-api';
import { CheckCircle, XCircle, Target, TrendingUp } from 'lucide-react';

export default function Evaluation() {
  const { evaluation, loading, isLive } = useEvaluation();

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Evaluasi Model</h1>
          <p className="mt-2 text-muted-foreground">Performa model machine learning</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-[300px] animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Evaluasi Model</h1>
          <p className="mt-2 text-muted-foreground">Gagal memuat data evaluasi</p>
        </div>
      </div>
    );
  }

  const metrics = [
    { 
      label: 'Accuracy', 
      value: (evaluation.accuracy * 100).toFixed(1) + '%', 
      icon: Target,
      description: 'Ketepatan prediksi keseluruhan'
    },
    { 
      label: 'Precision', 
      value: (evaluation.precision * 100).toFixed(1) + '%', 
      icon: CheckCircle,
      description: 'Ketepatan prediksi positif'
    },
    { 
      label: 'Recall', 
      value: (evaluation.recall * 100).toFixed(1) + '%', 
      icon: TrendingUp,
      description: 'Kemampuan mendeteksi kelas'
    },
    { 
      label: 'F1-Score', 
      value: (evaluation.f1_score * 100).toFixed(1) + '%', 
      icon: XCircle,
      description: 'Keseimbangan precision & recall'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Evaluasi Model</h1>
            <BackendStatusBadge isLive={isLive} />
          </div>
          <p className="mt-2 text-muted-foreground">
            Performa model Naive Bayes untuk analisis sentimen
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <metric.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confusion Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Confusion Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border border-border p-3 text-left bg-muted font-medium">Aktual \ Prediksi</th>
                  <th className="border border-border p-3 text-center bg-muted font-medium">Negatif</th>
                  <th className="border border-border p-3 text-center bg-muted font-medium">Netral</th>
                  <th className="border border-border p-3 text-center bg-muted font-medium">Positif</th>
                </tr>
              </thead>
              <tbody>
                {evaluation.confusion_matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="border border-border p-3 font-medium bg-muted">
                      {['Negatif', 'Netral', 'Positif'][i]}
                    </td>
                    {row.map((val, j) => (
                      <td 
                        key={j} 
                        className={`border border-border p-3 text-center font-medium ${
                          i === j 
                            ? 'bg-primary/20 text-primary' 
                            : val > 0 
                              ? 'bg-destructive/10 text-destructive' 
                              : ''
                        }`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Diagonal (hijau) menunjukkan prediksi yang benar. Nilai di luar diagonal menunjukkan kesalahan prediksi.
          </p>
        </CardContent>
      </Card>

      {/* Classification Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Classification Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border border-border p-3 text-left bg-muted font-medium">Kelas</th>
                  <th className="border border-border p-3 text-center bg-muted font-medium">Precision</th>
                  <th className="border border-border p-3 text-center bg-muted font-medium">Recall</th>
                  <th className="border border-border p-3 text-center bg-muted font-medium">F1-Score</th>
                  <th className="border border-border p-3 text-center bg-muted font-medium">Support</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(evaluation.classification_report).map(([key, value]) => {
                  if (typeof value !== 'object' || !value) return null;
                  const report = value as { precision: number; recall: number; 'f1-score': number; support: number };
                  if (!('precision' in report)) return null;
                  
                  return (
                    <tr key={key}>
                      <td className="border border-border p-3 font-medium capitalize">{key}</td>
                      <td className="border border-border p-3 text-center">
                        {(report.precision * 100).toFixed(1)}%
                      </td>
                      <td className="border border-border p-3 text-center">
                        {(report.recall * 100).toFixed(1)}%
                      </td>
                      <td className="border border-border p-3 text-center">
                        {(report['f1-score'] * 100).toFixed(1)}%
                      </td>
                      <td className="border border-border p-3 text-center">{report.support}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
