import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BackendStatusBadge } from '../components/layout/backend-status';
import { useEvaluation } from '../hooks/use-sentiment-api';
import { CheckCircle, XCircle, Target, TrendingUp } from 'lucide-react';
import { PageTransition } from '../components/ui/page-transition';
import { StaggerContainer, StaggerItem } from '../components/ui/stagger-container';
import { LoadingGrid, LoadingCard } from '../components/ui/loading-card';

export default function Evaluation() {
  const { evaluation, loading, isLive } = useEvaluation();

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-4 sm:space-y-8">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight">Evaluasi Model</h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">Performa model machine learning</p>
          </div>
          <LoadingGrid count={4} />
          <LoadingCard variant="table" className="h-[300px]" />
        </div>
      </PageTransition>
    );
  }

  if (!evaluation) {
    return (
      <PageTransition>
        <div className="space-y-4 sm:space-y-8">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight">Evaluasi Model</h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">Gagal memuat data evaluasi</p>
          </div>
        </div>
      </PageTransition>
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
    <PageTransition>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight">Evaluasi Model</h1>
              <BackendStatusBadge isLive={isLive} />
            </div>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
              Performa model Naive Bayes untuk analisis sentimen
            </p>
          </div>
        </div>

        {/* Metrics Grid - Always 2 cols on mobile */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {metrics.map((metric) => (
            <StaggerItem key={metric.label}>
              <Card>
                <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                      <metric.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-base sm:text-2xl font-bold">{metric.value}</p>
                      <p className="text-[10px] sm:text-sm font-medium text-muted-foreground">{metric.label}</p>
                    </div>
                  </div>
                  <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{metric.description}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Confusion Matrix */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-base font-medium">Confusion Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full text-[10px] sm:text-sm min-w-[280px]">
                <thead>
                  <tr>
                    <th className="border border-border p-1.5 sm:p-3 text-left bg-muted font-medium text-[10px] sm:text-sm">Aktual \ Prediksi</th>
                    <th className="border border-border p-1.5 sm:p-3 text-center bg-muted font-medium">Negatif</th>
                    <th className="border border-border p-1.5 sm:p-3 text-center bg-muted font-medium">Netral</th>
                    <th className="border border-border p-1.5 sm:p-3 text-center bg-muted font-medium">Positif</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluation.confusion_matrix.map((row, i) => (
                    <tr key={i}>
                      <td className="border border-border p-1.5 sm:p-3 font-medium bg-muted text-[10px] sm:text-sm">
                        {['Negatif', 'Netral', 'Positif'][i]}
                      </td>
                      {row.map((val, j) => (
                        <td 
                          key={j} 
                          className={`border border-border p-1.5 sm:p-3 text-center font-medium ${
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
            <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-muted-foreground">
              Diagonal (hijau) menunjukkan prediksi yang benar. Nilai di luar diagonal menunjukkan kesalahan prediksi.
            </p>
          </CardContent>
        </Card>

        {/* Classification Report */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-base font-medium">Classification Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full text-[10px] sm:text-sm min-w-[320px]">
                <thead>
                  <tr>
                    <th className="border border-border p-1.5 sm:p-3 text-left bg-muted font-medium">Kelas</th>
                    <th className="border border-border p-1.5 sm:p-3 text-center bg-muted font-medium">Precision</th>
                    <th className="border border-border p-1.5 sm:p-3 text-center bg-muted font-medium">Recall</th>
                    <th className="border border-border p-1.5 sm:p-3 text-center bg-muted font-medium">F1-Score</th>
                    <th className="border border-border p-1.5 sm:p-3 text-center bg-muted font-medium">Support</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(evaluation.classification_report).map(([key, value]) => {
                    if (typeof value !== 'object' || !value) return null;
                    const report = value as { precision: number; recall: number; 'f1-score': number; support: number };
                    if (!('precision' in report)) return null;
                    
                    return (
                      <tr key={key}>
                        <td className="border border-border p-1.5 sm:p-3 font-medium capitalize">{key}</td>
                        <td className="border border-border p-1.5 sm:p-3 text-center">
                          {(report.precision * 100).toFixed(1)}%
                        </td>
                        <td className="border border-border p-1.5 sm:p-3 text-center">
                          {(report.recall * 100).toFixed(1)}%
                        </td>
                        <td className="border border-border p-1.5 sm:p-3 text-center">
                          {(report['f1-score'] * 100).toFixed(1)}%
                        </td>
                        <td className="border border-border p-1.5 sm:p-3 text-center">{report.support}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
