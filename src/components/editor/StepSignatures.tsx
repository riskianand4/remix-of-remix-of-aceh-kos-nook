import { useState } from 'react';
import { DocumentData, Signee } from '@/types/document';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Upload, X, Loader2 } from 'lucide-react';
import { normalizeImage } from '@/lib/image-utils';
import { toast } from '@/hooks/use-toast';
import DraggableList, { DragHandle } from '@/components/editor/DraggableList';
import ConfirmDialog from '@/components/editor/ConfirmDialog';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface Props {
  doc: DocumentData;
  updateDoc: (updates: Partial<DocumentData>) => void;
}

export default function StepSignatures({ doc, updateDoc }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const addSignee = () => {
    const signee: Signee = { id: crypto.randomUUID(), name: '', role: '' };
    updateDoc({ signees: [...doc.signees, signee] });
  };

  const updateSignee = (signeeId: string, updates: Partial<Signee>) => {
    updateDoc({
      signees: doc.signees.map((s) => (s.id === signeeId ? { ...s, ...updates } : s)),
    });
  };

  const removeSignee = (signeeId: string) => {
    updateDoc({ signees: doc.signees.filter((s) => s.id !== signeeId) });
    setDeleteTarget(null);
  };

  const handleUpload = async (signeeId: string, key: 'signatureDataUrl' | 'stampDataUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadKey = `${signeeId}-${key}`;
    setUploading(uploadKey);
    try {
      const dataUrl = await normalizeImage(file, 300);
      updateSignee(signeeId, { [key]: dataUrl });
    } catch {
      toast({ title: 'Gagal memproses gambar', variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tanda Tangan & Stempel</h2>
          <p className="text-sm text-muted-foreground">Tambahkan penanda tangan dan stempel basah. Seret untuk mengubah urutan.</p>
        </div>
        <Button onClick={addSignee} className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Penanda Tangan
        </Button>
      </div>

      {doc.signees.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Belum ada penanda tangan.</p>
          </CardContent>
        </Card>
      )}

      <DraggableList
        items={doc.signees}
        onReorder={(items) => updateDoc({ signees: items })}
        className="grid gap-4 md:grid-cols-2"
        renderItem={(signee, _idx, dragProps) => (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <DragHandle {...dragProps} />
                <CardTitle className="text-base">Penanda Tangan</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(signee.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input value={signee.name} onChange={(e) => updateSignee(signee.id, { name: e.target.value })} placeholder="Nama Lengkap" />
              </div>
              <div className="space-y-2">
                <Label>Jabatan / Role</Label>
                <Input value={signee.role} onChange={(e) => updateSignee(signee.id, { role: e.target.value })} placeholder="Direktur Utama" />
              </div>
              <div className="space-y-2">
                <Label>Jabatan (di atas TTD)</Label>
                <Textarea value={signee.titleAbove || ''} onChange={(e) => updateSignee(signee.id, { titleAbove: e.target.value })} placeholder={"Wakil Direktur\nBidang Kemahasiswaan dan Alumni"} rows={2} className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label>NIP / No. Identitas</Label>
                <Input value={signee.nip || ''} onChange={(e) => updateSignee(signee.id, { nip: e.target.value })} placeholder="NIP. 197012345678" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tanda Tangan</Label>
                  {signee.signatureDataUrl ? (
                    <div className="relative flex h-20 items-center justify-center rounded-lg border bg-muted/30 p-2">
                      <img src={signee.signatureDataUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                      <Button variant="destructive" size="icon" className="absolute -right-1 -top-1 h-5 w-5" onClick={() => updateSignee(signee.id, { signatureDataUrl: undefined })}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex h-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 hover:bg-muted/40">
                      {uploading === `${signee.id}-signatureDataUrl` ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Upload TTD</span>
                        </>
                      )}
                      <input type="file" accept="image/png" className="hidden" onChange={(e) => handleUpload(signee.id, 'signatureDataUrl', e)} disabled={!!uploading} />
                    </label>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Stempel Basah</Label>
                  {signee.stampDataUrl ? (
                    <div className="relative flex h-20 items-center justify-center rounded-lg border bg-muted/30 p-2">
                      <img src={signee.stampDataUrl} alt="Stamp" className="max-h-full max-w-full object-contain" />
                      <Button variant="destructive" size="icon" className="absolute -right-1 -top-1 h-5 w-5" onClick={() => updateSignee(signee.id, { stampDataUrl: undefined })}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex h-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 hover:bg-muted/40">
                      {uploading === `${signee.id}-stampDataUrl` ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Upload Stempel</span>
                        </>
                      )}
                      <input type="file" accept="image/png" className="hidden" onChange={(e) => handleUpload(signee.id, 'stampDataUrl', e)} disabled={!!uploading} />
                    </label>
                  )}
                </div>
              </div>

              {(signee.signatureDataUrl || signee.stampDataUrl) && (
                <div className="space-y-3">
                  {signee.signatureDataUrl && (
                    <div className="space-y-1">
                      <Label className="text-xs">Ukuran Tanda Tangan: {signee.signatureSize || 80}px</Label>
                      <Slider
                        value={[signee.signatureSize || 80]}
                        min={40}
                        max={150}
                        step={5}
                        onValueChange={([v]) => updateSignee(signee.id, { signatureSize: v })}
                      />
                    </div>
                  )}
                  {signee.stampDataUrl && (
                    <div className="space-y-1">
                      <Label className="text-xs">Ukuran Stempel: {signee.stampSize || 100}px</Label>
                      <Slider
                        value={[signee.stampSize || 100]}
                        min={40}
                        max={150}
                        step={5}
                        onValueChange={([v]) => updateSignee(signee.id, { stampSize: v })}
                      />
                    </div>
                  )}
                  <div className="rounded-lg border bg-card p-4 text-center">
                    <p className="mb-2 text-[10px] text-muted-foreground">Preview</p>
                    <div className="relative mx-auto" style={{ height: Math.max(signee.signatureSize || 80, signee.stampSize || 100) + 10, width: '8rem' }}>
                      {signee.stampDataUrl && <img src={signee.stampDataUrl} alt="Stamp" className="absolute inset-0 h-full w-full object-contain opacity-60" style={{ maxHeight: signee.stampSize || 100 }} />}
                      {signee.signatureDataUrl && <img src={signee.signatureDataUrl} alt="Signature" className="absolute inset-0 h-full w-full object-contain" style={{ maxHeight: signee.signatureSize || 80 }} />}
                    </div>
                    <div className="mt-2 border-t pt-2">
                      {signee.titleAbove && <p className="text-[10px] text-muted-foreground whitespace-pre-line mb-1">{signee.titleAbove}</p>}
                      <p className="text-sm font-bold text-foreground">{signee.name || '_______________'}</p>
                      <p className="text-xs text-muted-foreground">{signee.role || 'Jabatan'}</p>
                      {signee.nip && <p className="text-[10px] text-muted-foreground">{signee.nip}</p>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Hapus Penanda Tangan?"
        description="Data penanda tangan termasuk tanda tangan dan stempel akan dihapus permanen."
        onConfirm={() => deleteTarget && removeSignee(deleteTarget)}
      />
    </div>
  );
}
