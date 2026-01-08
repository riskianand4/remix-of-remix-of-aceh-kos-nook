import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart3, Database, Cpu, Users, ChevronRight } from 'lucide-react';
import { PageTransition } from '../components/ui/page-transition';
import { StaggerContainer, StaggerItem } from '../components/ui/stagger-container';

export default function About() {
  const features = [
    {
      icon: BarChart3,
      title: 'Analisis Real-time',
      description: 'Analisis sentimen secara langsung menggunakan model machine learning terlatih.',
    },
    {
      icon: Database,
      title: 'Dataset Terstruktur',
      description: 'Menggunakan data yang telah dibersihkan dan dilabeli dengan akurat.',
    },
    {
      icon: Cpu,
      title: 'Naive Bayes Classifier',
      description: 'Model klasifikasi yang efektif untuk analisis sentimen teks berbahasa Indonesia.',
    },
    {
      icon: Users,
      title: 'Fokus PT PIM',
      description: 'Dikhususkan untuk menganalisis sentimen publik terhadap PT Pupuk Iskandar Muda.',
    },
  ];

  const steps = [
    { title: 'Pengumpulan Data', desc: 'Mengumpulkan komentar dan opini publik dari berbagai platform' },
    { title: 'Preprocessing', desc: 'Case folding, tokenization, stopword removal, stemming' },
    { title: 'Feature Extraction', desc: 'Menggunakan TF-IDF Vectorizer untuk ekstraksi fitur' },
    { title: 'Training Model', desc: 'Melatih model menggunakan algoritma Naive Bayes' },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-8xl space-y-4 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight">Tentang Sistem</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
            Sistem Analisis Sentimen Publik terhadap PT Pupuk Iskandar Muda
          </p>
        </div>

        {/* Description */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-base font-medium">Deskripsi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Sistem ini dikembangkan untuk menganalisis sentimen publik terhadap PT Pupuk Iskandar Muda (PIM) 
              menggunakan pendekatan machine learning. Dengan memanfaatkan algoritma Naive Bayes dan teknik 
              preprocessing teks bahasa Indonesia, sistem ini dapat mengklasifikasikan opini menjadi tiga kategori: 
              positif, negatif, dan netral.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Data yang digunakan berasal dari berbagai sumber media sosial dan telah melalui proses pembersihan 
              meliputi case folding, tokenization, stopword removal, dan stemming untuk memastikan kualitas analisis.
            </p>
          </CardContent>
        </Card>

        {/* Features - 2 cols grid on mobile */}
        <StaggerContainer className="grid grid-cols-2 gap-3 sm:gap-4">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <Card className="h-full">
                <CardContent className="pt-4 sm:pt-5 p-3 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <feature.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-base font-medium">{feature.title}</h3>
                      <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Methodology */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-base font-medium">Metodologi</CardTitle>
          </CardHeader>
          <CardContent>
            <StaggerContainer className="space-y-3 sm:space-y-4">
              {steps.map((step, index) => (
                <StaggerItem key={step.title}>
                  <div className="flex items-start gap-2 sm:gap-4">
                    <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] sm:text-sm font-medium text-background">
                      {index + 1}
                    </div>
                    <div className="flex-1 pt-0 sm:pt-0.5">
                      <p className="text-xs sm:text-base font-medium">{step.title}</p>
                      <p className="mt-0.5 text-[10px] sm:text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <ChevronRight className="mt-1 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block" />
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
