import { useState, useEffect } from 'react';

import { getCompanyProfile, saveCompanyProfile, CompanyProfile } from '@/lib/company-profile';
import { normalizeImage } from '@/lib/image-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Upload, X, Building2 } from 'lucide-react';

export default function CompanyProfilePage() {
  
  const [profile, setProfile] = useState<CompanyProfile>({
    name: '', address: '', phone: '', email: '', website: '',
  });

  useEffect(() => {
    const saved = getCompanyProfile();
    if (saved) setProfile(saved);
  }, []);

  const handleSave = () => {
    saveCompanyProfile(profile);
    toast({ title: '✓ Profil tersimpan!', description: 'KOP surat akan otomatis terisi saat buat dokumen baru.', duration: 3000 });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await normalizeImage(file, 400);
      setProfile(p => ({ ...p, logoDataUrl: dataUrl }));
    } catch {
      toast({ title: 'Gagal memproses gambar', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-xl px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Informasi Perusahaan / Instansi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Perusahaan / Instansi</Label>
              <Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="PT. Contoh Sejahtera" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Alamat</Label>
              <Input value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} placeholder="Jl. Sudirman No. 123, Jakarta" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Telepon</Label>
                <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="021-1234567" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="info@perusahaan.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Website</Label>
              <Input value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))} placeholder="www.perusahaan.com" />
            </div>

            {/* Logo */}
            <div className="space-y-1.5">
              <Label className="text-xs">Logo</Label>
              {profile.logoDataUrl ? (
                <div className="flex items-center gap-3">
                  <img src={profile.logoDataUrl} alt="Logo" className="h-12 w-12 object-contain rounded border" />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setProfile(p => ({ ...p, logoDataUrl: undefined }))}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex h-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Upload Logo</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              )}
            </div>

            <Button onClick={handleSave} className="w-full">
              Simpan Profil
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
