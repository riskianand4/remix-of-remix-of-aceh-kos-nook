import { useState } from 'react';
import { DocumentData, generateDocCode } from '@/types/document';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Upload, X, Loader2 } from 'lucide-react';
import { normalizeImage } from '@/lib/image-utils';
import CoverDesigner from '@/components/editor/CoverDesigner';

interface Props {
  doc: DocumentData;
  updateDoc: (updates: Partial<DocumentData>) => void;
}

const SPACING_OPTIONS = [
  { value: '1', label: '1.0' },
  { value: '1.15', label: '1.15' },
  { value: '1.5', label: '1.5' },
  { value: '2', label: '2.0' },
];

export default function StepCover({ doc, updateDoc }: Props) {
  const [uploading, setUploading] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: 'logo1DataUrl' | 'logo2DataUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(key);
    try {
      const dataUrl = await normalizeImage(file, 400);
      updateDoc({ [key]: dataUrl });
    } catch {
      toast({ title: 'Gagal memproses gambar', description: 'File mungkin rusak atau format tidak didukung.', variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Setup Cover & Dokumen</h2>
        <p className="text-sm text-muted-foreground">Desain cover: tambah teks, geser posisi, atur ukuran.</p>
      </div>

      {/* Cover Visual Designer */}
      {doc.includeCover && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desain Cover</CardTitle>
          </CardHeader>
          <CardContent>
            <CoverDesigner doc={doc} updateDoc={updateDoc} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo Perusahaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {(['logo1DataUrl', 'logo2DataUrl'] as const).map((key, i) => (
              <div key={key} className="space-y-2">
                <Label>Logo {i + 1}</Label>
                {doc[key] ? (
                  <div className="relative flex h-32 items-center justify-center rounded-lg border bg-muted/30 p-4">
                    <img src={doc[key]} alt={`Logo ${i + 1}`} className="max-h-full max-w-full object-contain" />
                    <Button variant="destructive" size="icon" className="absolute right-2 top-2 h-6 w-6" onClick={() => updateDoc({ [key]: undefined })}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:bg-muted/40">
                    {uploading === key ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload Logo {i + 1}</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, key)} disabled={!!uploading} />
                  </label>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Ukuran Logo Cover ({doc.coverLogoSize || 80}px)</Label>
            <Slider value={[doc.coverLogoSize || 80]} min={40} max={200} step={5} onValueChange={([v]) => updateDoc({ coverLogoSize: v })} />
          </div>
          <div className="space-y-2">
            <Label>Jarak Antar Logo ({doc.coverLayout?.logoGap ?? 40}px)</Label>
            <Slider value={[doc.coverLayout?.logoGap ?? 40]} min={0} max={120} step={5} onValueChange={([v]) => updateDoc({ coverLayout: { ...(doc.coverLayout || { logos: { x: 50, y: 12 }, logoGap: 40, logoWidth: 30, logoAlignment: 'horizontal' as const, textElements: [], imageElements: [], tableElements: [] }), logoGap: v } })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pengaturan Halaman</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Orientasi</Label>
              <Select value={doc.pageOrientation || 'portrait'} onValueChange={(v) => updateDoc({ pageOrientation: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ukuran Kertas</Label>
              <Select value={doc.paperSize || 'A4'} onValueChange={(v) => updateDoc({ paperSize: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="F4">F4 / Folio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Spasi Cover</Label>
              <Select value={String(doc.coverLineSpacing || 1.5)} onValueChange={(v) => updateDoc({ coverLineSpacing: parseFloat(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPACING_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nomor Dokumen</Label>
              <Input value={doc.docNumber || ''} onChange={(e) => updateDoc({ docNumber: e.target.value })} placeholder="DOC-2026-001" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Kode Verifikasi Surat</Label>
            <div className="flex gap-2">
              <Input
                value={doc.docCode || ''}
                onChange={(e) => updateDoc({ docCode: e.target.value })}
                placeholder="DOC-2026-A7X3K"
                className="font-mono"
              />
              <Button variant="outline" size="sm" onClick={() => updateDoc({ docCode: generateDocCode() })} title="Generate kode baru">
                🔄
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Kode unik untuk verifikasi keaslian dokumen. Bisa diedit manual.</p>
          </div>
        </CardContent>
      </Card>

      {/* TOC / List toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Isi & Daftar Lainnya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">Daftar Isi</p>
              <p className="text-xs text-muted-foreground">Tampilkan halaman daftar isi di PDF</p>
            </div>
            <Switch checked={doc.includeToc !== false} onCheckedChange={(v) => updateDoc({ includeToc: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">Daftar Gambar</p>
              <p className="text-xs text-muted-foreground">Tampilkan daftar gambar di PDF</p>
            </div>
            <Switch checked={doc.includeImageList !== false} onCheckedChange={(v) => updateDoc({ includeImageList: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">Daftar Tabel</p>
              <p className="text-xs text-muted-foreground">Tampilkan daftar tabel di PDF</p>
            </div>
            <Switch checked={doc.includeTableList !== false} onCheckedChange={(v) => updateDoc({ includeTableList: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Watermark</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">Aktifkan Watermark</p>
              <p className="text-xs text-muted-foreground">Teks transparan diagonal di setiap halaman</p>
            </div>
            <Switch checked={doc.watermarkEnabled || false} onCheckedChange={(v) => updateDoc({ watermarkEnabled: v })} />
          </div>
          {doc.watermarkEnabled && (
            <>
              <div className="space-y-2">
                <Label>Teks Watermark</Label>
                <Select value={doc.watermarkText || 'DRAFT'} onValueChange={(v) => updateDoc({ watermarkText: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                    <SelectItem value="CONFIDENTIAL">CONFIDENTIAL</SelectItem>
                    <SelectItem value="RAHASIA">RAHASIA</SelectItem>
                    <SelectItem value="COPY">COPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Opacity ({Math.round((doc.watermarkOpacity || 0.1) * 100)}%)</Label>
                <Slider value={[(doc.watermarkOpacity || 0.1) * 100]} min={5} max={50} step={5} onValueChange={([v]) => updateDoc({ watermarkOpacity: v / 100 })} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium text-foreground">Sertakan Halaman Cover</p>
            <p className="text-xs text-muted-foreground">Tampilkan cover di halaman pertama PDF</p>
          </div>
          <Switch checked={doc.includeCover} onCheckedChange={(v) => updateDoc({ includeCover: v })} />
        </CardContent>
      </Card>
    </div>
  );
}
