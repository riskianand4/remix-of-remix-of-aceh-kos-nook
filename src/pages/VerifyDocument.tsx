import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, ShieldCheck, ShieldX, FileText, Calendar, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DocumentData } from '@/types/document';
import { verifyByCode } from '@/lib/storage';

export default function VerifyDocument() {
  const { code: urlCode } = useParams<{ code: string }>();
  const [searchCode, setSearchCode] = useState(urlCode || '');
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (codeToSearch?: string) => {
    const code = (codeToSearch || searchCode).trim();
    if (!code) return;
    setLoading(true);
    setSearched(false);
    setDoc(null);
    try {
      const result = await verifyByCode(code);
      setDoc(result);
    } catch {
      setDoc(null);
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlCode) handleSearch(urlCode);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-12 max-w-2xl">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-foreground mb-2">Verifikasi Keaslian Dokumen</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Masukkan kode verifikasi yang tertera pada dokumen untuk memastikan keasliannya.
          </p>
        </motion.div>

        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex gap-2">
            <Input
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              placeholder="DOC-XXXX-XXXX"
              className="font-mono text-lg h-12"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={() => handleSearch()} disabled={loading || !searchCode.trim()} className="h-12 px-6 gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Cari
            </Button>
          </div>
        </motion.div>

        {searched && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {doc ? (
              <div className="space-y-6">
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/15">
                      <ShieldCheck className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">Dokumen Terverifikasi</p>
                      <p className="text-xs text-muted-foreground">Dokumen ini valid dan terdaftar dalam sistem.</p>
                    </div>
                    <Badge className="bg-green-500/15 text-green-600 border-0 text-xs">VALID</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-lg">{doc.title || 'Untitled Document'}</h3>
                        {doc.subtitle && <p className="text-sm text-muted-foreground">{doc.subtitle}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Kode Verifikasi</p>
                        <p className="font-mono font-semibold text-primary">{doc.docCode}</p>
                      </div>
                      {doc.docNumber && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Nomor Dokumen</p>
                          <p className="font-medium">{doc.docNumber}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Tanggal</p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {doc.date || new Date(doc.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Status</p>
                        <Badge variant={doc.status === 'finished' ? 'default' : 'secondary'} className="text-xs">
                          {doc.status === 'finished' ? 'Selesai' : 'Draft'}
                        </Badge>
                      </div>
                      {doc.signees?.length > 0 && (
                        <div className="col-span-2 space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">Penandatangan</p>
                          <div className="flex flex-wrap gap-2">
                            {doc.signees.map((s) => (
                              <span key={s.id} className="inline-flex items-center gap-1 text-xs bg-muted/50 px-2 py-1 rounded">
                                <User className="h-3 w-3" /> {s.name} — {s.role}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15">
                    <ShieldX className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">❌ Dokumen Tidak Ditemukan</p>
                    <p className="text-xs text-muted-foreground">Kode verifikasi tidak terdaftar. Pastikan kode yang dimasukkan benar.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
