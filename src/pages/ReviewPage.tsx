import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { accessReview, fetchComments, addComment, resolveComment, deleteComment, CommentApi } from '@/lib/api';
import { accessLocalReview, getLocalComments, addLocalComment, resolveLocalComment, deleteLocalComment, LocalComment } from '@/lib/share-storage';
import { DocumentData } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Lock, Send, MessageSquare, CheckCircle, Trash2, Loader2, FileText, ArrowLeft } from 'lucide-react';

type Phase = 'gate' | 'review';
type AnyComment = CommentApi | LocalComment;

const PAPER_SIZES: Record<string, [number, number]> = {
  A4: [794, 1123],
  Letter: [816, 1056],
  Legal: [816, 1344],
  F4: [813, 1249],
};

/* ─── Gate Screen ─── */
function GateScreen({ code, onAccess }: { code: string; onAccess: (doc: DocumentData, shareCode: string, isLocal: boolean, comments: AnyComment[]) => void }) {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccess = async () => {
    if (!code || !accessCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await accessReview(code, accessCode.trim());
      const cmts = await fetchComments(code);
      // Try to load the latest saved version instead of the share snapshot
      try {
        const raw = localStorage.getItem(`ls_doc_${result.document.id}`);
        const latestDoc = raw ? JSON.parse(raw) : result.document;
        onAccess(latestDoc, result.shareCode, false, cmts);
      } catch {
        onAccess(result.document, result.shareCode, false, cmts);
      }
    } catch {
      const result = accessLocalReview(code, accessCode.trim());
      if ('error' in result) { setError(result.error); setLoading(false); return; }
      try {
        const raw = localStorage.getItem(`ls_doc_${result.link.documentId}`);
        if (raw) {
          onAccess(JSON.parse(raw), code, true, getLocalComments(code));
        } else {
          setError('Dokumen tidak ditemukan di perangkat ini');
        }
      } catch { setError('Gagal memuat dokumen'); }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg">Review Dokumen</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Masukkan kode akses untuk melihat dokumen dan memberi komentar.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="Kode akses..." className="text-center text-lg tracking-widest font-mono" onKeyDown={e => e.key === 'Enter' && handleAccess()} autoFocus />
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button onClick={handleAccess} disabled={loading || !accessCode.trim()} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Buka Dokumen
          </Button>
        </CardContent>
      </Card>
      <div className="fixed top-4 right-4"><ThemeToggle /></div>
    </div>
  );
}

/* ─── Document Preview (paper-style pages) ─── */
function DocumentPreview({ doc }: { doc: DocumentData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [fullHtml, setFullHtml] = useState('');
  const [scale, setScale] = useState(1);

  const orientation = (doc as any).pageOrientation || 'portrait';
  const sizeKey = (doc as any).paperSize || 'A4';
  const [baseW, baseH] = PAPER_SIZES[sizeKey] || PAPER_SIZES.A4;
  const paperW = orientation === 'landscape' ? baseH : baseW;
  const paperH = orientation === 'landscape' ? baseW : baseH;

  const recalcScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const availW = el.clientWidth - 48;
    setScale(availW < paperW ? availW / paperW : 1);
  }, [paperW]);

  useEffect(() => {
    recalcScale();
    const obs = new ResizeObserver(recalcScale);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [recalcScale]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { generatePdfHtml } = await import('@/lib/pdf-builder');
        setFullHtml(await generatePdfHtml(doc));
      } catch (err) { console.error('Preview error:', err); }
      finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [doc]);

  const pages = useMemo(() => {
    if (!fullHtml) return [];
    const parsed = new DOMParser().parseFromString(fullHtml, 'text/html');
    return Array.from(parsed.querySelectorAll('.page')).map(p => p.outerHTML);
  }, [fullHtml]);

  const styles = useMemo(() => {
    if (!fullHtml) return '';
    const m = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    return m ? m[1] : '';
  }, [fullHtml]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-auto rounded-lg" style={{ background: '#e5e7eb' }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {!loading && pages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Tidak ada halaman untuk ditampilkan</p>
        </div>
      )}
      <div className="flex flex-col items-center gap-6 py-6 px-6">
        {pages.map((pageHtml, i) => (
          <div
            key={i}
            style={{
              width: paperW,
              height: paperH,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
              border: '1px solid #d1d5db',
              marginBottom: scale < 1 ? `${-(paperH * (1 - scale))}px` : 0,
            }}
          >
            <iframe
              srcDoc={`<!DOCTYPE html><html><head><style>${styles}</style><style>html,body{margin:0;padding:0;overflow:hidden;}</style></head><body>${pageHtml}</body></html>`}
              style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none', display: 'block', background: 'white' }}
              title={`Page ${i + 1}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Comment Panel ─── */
function CommentPanel({ comments, onAdd, onResolve, onDelete }: {
  comments: AnyComment[];
  onAdd: (author: string, text: string) => Promise<void>;
  onResolve: (c: AnyComment) => void;
  onDelete: (id: string) => void;
}) {
  const [authorName, setAuthorName] = useState(() => {
    try { return localStorage.getItem('review_author') || ''; } catch { return ''; }
  });
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const unresolvedCount = comments.filter(c => !c.resolved).length;

  const handleSend = async () => {
    if (!newComment.trim()) return;
    const author = authorName.trim() || 'Anonim';
    try { localStorage.setItem('review_author', author); } catch {}
    setSending(true);
    try { await onAdd(author, newComment.trim()); setNewComment(''); }
    catch { toast({ title: 'Gagal mengirim komentar', variant: 'destructive' }); }
    finally { setSending(false); }
  };

  return (
    <div className="lg:w-96 border-t lg:border-t-0 lg:border-l bg-card flex flex-col max-h-[calc(100vh-57px)] lg:sticky lg:top-[57px]">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Komentar & Feedback
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">{comments.length}</Badge>
          {unresolvedCount > 0 && <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">{unresolvedCount} open</Badge>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada komentar.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Jadi yang pertama memberikan feedback!</p>
          </div>
        ) : comments.map(comment => (
          <div key={comment.id} className={`rounded-lg border p-3 space-y-1.5 transition-colors ${comment.resolved ? 'opacity-60 bg-muted/20' : 'bg-background'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{comment.author[0]?.toUpperCase() || 'A'}</div>
                <span className="text-xs font-medium text-foreground">{comment.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{new Date(comment.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onResolve(comment)} title={comment.resolved ? 'Buka kembali' : 'Tandai selesai'}>
                  <CheckCircle className={`h-3 w-3 ${comment.resolved ? 'text-green-500' : 'text-muted-foreground/40'}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive opacity-50 hover:opacity-100" onClick={() => onDelete(comment.id)}>
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{comment.text}</p>
            {comment.resolved && <Badge variant="outline" className="text-[9px] text-primary">✓ Resolved</Badge>}
          </div>
        ))}
      </div>

      <div className="border-t p-4 space-y-2">
        <Input value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Nama Anda..." className="h-8 text-xs" />
        <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Tulis komentar atau feedback..." rows={2} className="text-sm resize-none" onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }} />
        <Button onClick={handleSend} disabled={sending || !newComment.trim()} className="w-full gap-2 h-8 text-xs" size="sm">
          {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          Kirim Komentar
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">Ctrl+Enter untuk kirim cepat</p>
      </div>
    </div>
  );
}

/* ─── Main Review Page ─── */
export default function ReviewPage() {
  const { code } = useParams<{ code: string }>();
  const [phase, setPhase] = useState<Phase>('gate');
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [comments, setComments] = useState<AnyComment[]>([]);
  const [isLocal, setIsLocal] = useState(false);

  const handleAccessSuccess = (d: DocumentData, sc: string, local: boolean, cmts: AnyComment[]) => {
    setDoc(d); setShareCode(sc); setIsLocal(local); setComments(cmts); setPhase('review');
  };

  const handleAddComment = async (author: string, text: string) => {
    if (isLocal) {
      const c = addLocalComment(shareCode, doc?.id || '', author, text);
      setComments(prev => [...prev, c]);
    } else {
      const c = await addComment(shareCode, author, text);
      setComments(prev => [...prev, c]);
    }
  };

  const handleResolve = async (comment: AnyComment) => {
    try {
      if (isLocal) {
        const u = resolveLocalComment(comment.id);
        if (u) setComments(prev => prev.map(c => c.id === u.id ? u : c));
      } else {
        const u = await resolveComment(comment.id, comment.resolved);
        setComments(prev => prev.map(c => c.id === u.id ? u : c));
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      if (isLocal) deleteLocalComment(id); else await deleteComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch {}
  };

  if (phase === 'gate') {
    return <GateScreen code={code || ''} onAccess={handleAccessSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">{doc?.title || 'Dokumen'}</h1>
            </div>
            <Badge variant="outline" className="text-[10px]">Review Mode</Badge>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 min-h-[calc(100vh-57px)]">
          {doc && <DocumentPreview doc={doc} />}
        </div>
        <CommentPanel comments={comments} onAdd={handleAddComment} onResolve={handleResolve} onDelete={handleDelete} />
      </div>
    </div>
  );
}
