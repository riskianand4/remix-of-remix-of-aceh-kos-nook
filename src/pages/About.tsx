import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart3, Database, Cpu, Users, ChevronRight } from 'lucide-react';

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
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tentang Sistem</h1>
        <p className="mt-2 text-muted-foreground">
          Sistem Analisis Sentimen Publik terhadap PT Pupuk Iskandar Muda
        </p>
      </div>

      {/* Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Deskripsi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sistem ini dikembangkan untuk menganalisis sentimen publik terhadap PT Pupuk Iskandar Muda (PIM) 
            menggunakan pendekatan machine learning. Dengan memanfaatkan algoritma Naive Bayes dan teknik 
            preprocessing teks bahasa Indonesia, sistem ini dapat mengklasifikasikan opini menjadi tiga kategori: 
            positif, negatif, dan netral.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Data yang digunakan berasal dari berbagai sumber media sosial dan telah melalui proses pembersihan 
            meliputi case folding, tokenization, stopword removal, dan stemming untuk memastikan kualitas analisis.
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardContent className="pt-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Methodology */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Metodologi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.title} className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">
                  {index + 1}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="mt-1.5 h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
