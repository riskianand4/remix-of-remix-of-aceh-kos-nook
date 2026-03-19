import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import logoImg from '@/assets/Logo/Logo.png';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api').replace(/^['"]|['"]$/g, '');

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
    } catch (err: any) {
      toast({ title: err.message || 'Gagal mengirim email', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border shadow-sm">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Email Terkirim</h2>
            <p className="text-sm text-muted-foreground">Jika email terdaftar, link reset password telah dikirim ke <strong>{email}</strong>.</p>
            <Button variant="outline" className="w-full" asChild><Link to="/login">Kembali ke Login</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <img src={logoImg} alt="Logo" className="h-10 object-contain" />
          </div>
        </div>
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Lupa Password</CardTitle>
            <CardDescription>Masukkan email untuk menerima link reset password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="nama@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Mengirim...' : 'Kirim Link Reset'}</Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary font-medium hover:underline">Kembali ke Login</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = params.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast({ title: 'Password tidak cocok', variant: 'destructive' }); return; }
    if (password.length < 6) { toast({ title: 'Password minimal 6 karakter', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Password berhasil direset!' });
      navigate('/login');
    } catch (err: any) {
      toast({ title: err.message || 'Gagal reset password', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  if (!token) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Token tidak valid.</p></div>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <img src={logoImg} alt="Logo" className="h-10 object-contain" />
          </div>
        </div>
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Reset Password</CardTitle>
            <CardDescription>Buat password baru untuk akun Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password Baru</Label>
                <div className="relative">
                  <Input id="password" type={showPass ? 'text' : 'password'} placeholder="Min. 6 karakter" value={password} onChange={e => setPassword(e.target.value)} required className="pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Konfirmasi Password</Label>
                <Input id="confirm" type={showPass ? 'text' : 'password'} placeholder="Ulangi password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Password'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Route both forgot + reset from this file
export { ForgotPasswordPage, ResetPasswordPage };
export default ForgotPasswordPage;
