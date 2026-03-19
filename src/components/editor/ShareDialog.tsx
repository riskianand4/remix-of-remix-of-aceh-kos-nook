import { useState, useEffect } from 'react';
import { DocumentData } from '@/types/document';
import { createShareLink, fetchShareLinks, deleteShareLink, ShareLinkApi } from '@/lib/api';
import { createLocalShareLink, getLocalShareLinks, deleteLocalShareLink, LocalShareLink } from '@/lib/share-storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Copy, Link2, Trash2, Loader2, Share2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  doc: DocumentData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type LinkItem = ShareLinkApi | LocalShareLink;

export default function ShareDialog({ doc, open, onOpenChange }: Props) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [customCode, setCustomCode] = useState('');

  useEffect(() => {
    if (open && doc.id) {
      setLoading(true);
      fetchShareLinks(doc.id)
        .then(setLinks)
        .catch(() => {
          // Backend unavailable, use localStorage
          setLinks(getLocalShareLinks(doc.id));
        })
        .finally(() => setLoading(false));
    }
  }, [open, doc.id]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const link = await createShareLink(doc.id, customCode || undefined);
      setLinks(prev => [link, ...prev]);
      setCustomCode('');
      toast({ title: '✓ Link share dibuat!', duration: 2000 });
    } catch {
      // Backend unavailable, use localStorage
      try {
        const link = createLocalShareLink(doc.id, customCode || undefined);
        setLinks(prev => [link, ...prev]);
        setCustomCode('');
        toast({ title: '✓ Link share dibuat! (lokal)', duration: 2000 });
      } catch (err: any) {
        toast({ title: 'Gagal membuat link', description: err.message, variant: 'destructive' });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteShareLink(id);
    } catch {
      deleteLocalShareLink(id);
    }
    setLinks(prev => prev.filter(l => l.id !== id));
    toast({ title: 'Link dihapus' });
  };

  const copyLink = (link: LinkItem) => {
    const url = `${window.location.origin}/review/${link.code}`;
    const text = `🔗 Link Review:\n${url}\n\n🔑 Kode Akses: ${link.accessCode}`;
    navigator.clipboard.writeText(text);
    toast({ title: '✓ Link & kode akses disalin!', duration: 2000 });
  };

  const activeLinks = links.filter(l => l.active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Bagikan untuk Review
          </DialogTitle>
          <DialogDescription>
            Buat link untuk reviewer melihat dokumen dan memberi komentar. Dilindungi kode akses.
          </DialogDescription>
        </DialogHeader>

        {/* Create new link */}
        <div className="space-y-3 border-b pb-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Kode Akses (opsional, auto-generate jika kosong)</Label>
            <div className="flex gap-2">
              <Input
                value={customCode}
                onChange={e => setCustomCode(e.target.value)}
                placeholder="Contoh: REVIEW2026"
                className="text-sm"
              />
              <Button onClick={handleCreate} disabled={creating} className="shrink-0 gap-1.5">
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                Buat Link
              </Button>
            </div>
          </div>
        </div>

        {/* Existing links */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : activeLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Belum ada link share. Buat yang baru di atas.
            </p>
          ) : (
            activeLinks.map(link => (
              <div key={link.id} className="flex items-center gap-3 rounded-lg border p-3 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono truncate">
                      /review/{link.code}
                    </code>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      Kode: {link.accessCode}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Dibuat {new Date(link.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyLink(link)} title="Salin link & kode">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`/review/${link.code}`, '_blank')} title="Buka">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDelete(link.id)} title="Hapus">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
