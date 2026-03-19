import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import logoImg from '@/assets/Logo/Logo.png';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api').replace(/^['"]|['"]$/g, '');

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMessage('Token tidak ditemukan.'); return; }

    fetch(`${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStatus('error'); setMessage(data.error); }
        else { setStatus('success'); setMessage(data.message || 'Email berhasil diverifikasi.'); }
      })
      .catch(() => { setStatus('error'); setMessage('Gagal menghubungi server. Coba lagi nanti.'); });
  }, [params]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <img src={logoImg} alt="Logo" className="h-10 object-contain" />
          </div>
        </div>
        <Card className="border shadow-sm">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Memverifikasi email...</p>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Email Terverifikasi!</h2>
                <p className="text-sm text-muted-foreground">{message}</p>
                <Button className="w-full" onClick={() => navigate('/login')}>Masuk Sekarang</Button>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-7 w-7 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Verifikasi Gagal</h2>
                <p className="text-sm text-muted-foreground">{message}</p>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/register">Daftar Ulang</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
