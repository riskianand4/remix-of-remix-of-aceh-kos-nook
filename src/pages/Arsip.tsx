import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Folder, FolderPlus, FileText, ChevronRight,
  Clock, CheckCircle, Calendar, Archive, Trash2,
  Filter, ArrowUpDown, Download, X, MoreHorizontal, Pencil, FolderInput, Lock, Home, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { DocumentData } from '@/types/document';
import { toast } from '@/hooks/use-toast';
import {
  fetchArchiveDocuments, fetchFolders, createFolderApi, renameFolderApi,
  deleteFolderApi, moveDocumentToFolder, archiveDeleteDocuments, FolderApi
} from '@/lib/api';

type StatusFilter = 'all' | 'draft' | 'finished';
type SortMode = 'newest' | 'oldest' | 'title';

function exportToCSV(docs: DocumentData[]) {
  const headers = ['Judul', 'Nomor Surat', 'Subtitle', 'Status', 'Tanggal Dibuat', 'Tanggal Update'];
  const rows = docs.map(d => [
    `"${(d.title || '').replace(/"/g, '""')}"`,
    `"${(d.docNumber || '-').replace(/"/g, '""')}"`,
    `"${(d.subtitle || '-').replace(/"/g, '""')}"`,
    d.status === 'finished' ? 'Selesai' : 'Draft',
    d.createdAt ? new Date(d.createdAt).toLocaleDateString('id-ID') : '-',
    d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('id-ID') : '-',
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arsip-dokumen-${new Date().toISOString().substring(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Arsip() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [folders, setFolders] = useState<FolderApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Dialog states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameFolder, setRenameFolder] = useState<FolderApi | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[] } | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [moveTarget, setMoveTarget] = useState<{ docId: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [docs, flds] = await Promise.all([
        fetchArchiveDocuments({}),
        fetchFolders(),
      ]);
      setDocuments(docs);
      setFolders(flds);
    } catch (err) {
      console.error('Failed to load archive:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Build breadcrumb path
  const breadcrumb = useMemo(() => {
    const path: FolderApi[] = [];
    let id = currentFolderId;
    while (id) {
      const folder = folders.find(f => f.id === id);
      if (folder) {
        path.unshift(folder);
        id = folder.parentId;
      } else break;
    }
    return path;
  }, [currentFolderId, folders]);

  // Items in current folder
  const currentFolders = useMemo(() =>
    folders.filter(f => (f.parentId || null) === currentFolderId).sort((a, b) => a.name.localeCompare(b.name)),
    [folders, currentFolderId]
  );

  const currentDocs = useMemo(() => {
    let docs = documents.filter(d => (d.folderId || null) === currentFolderId);
    if (statusFilter === 'draft') docs = docs.filter(d => d.status === 'draft');
    if (statusFilter === 'finished') docs = docs.filter(d => d.status === 'finished');
    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter(d =>
        d.title?.toLowerCase().includes(q) ||
        d.subtitle?.toLowerCase().includes(q) ||
        d.docNumber?.toLowerCase().includes(q) ||
        d.docCode?.toLowerCase().includes(q)
      );
    }
    switch (sortMode) {
      case 'newest': docs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')); break;
      case 'oldest': docs.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')); break;
      case 'title': docs.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
    }
    return docs;
  }, [documents, currentFolderId, statusFilter, sortMode, search]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolderApi(newFolderName.trim(), currentFolderId);
      setShowCreateFolder(false);
      setNewFolderName('');
      await loadData();
      toast({ title: 'Folder dibuat' });
    } catch (err: any) {
      toast({ title: 'Gagal membuat folder', description: err.message, variant: 'destructive' });
    }
  };

  const handleRenameFolder = async () => {
    if (!renameFolder || !renameFolderValue.trim()) return;
    try {
      await renameFolderApi(renameFolder.id, renameFolderValue.trim());
      setRenameFolder(null);
      await loadData();
      toast({ title: 'Folder diubah namanya' });
    } catch (err: any) {
      toast({ title: 'Gagal mengubah nama', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await deleteFolderApi(id);
      if (currentFolderId === id) setCurrentFolderId(null);
      await loadData();
      toast({ title: 'Folder dihapus, dokumen dipindah ke parent' });
    } catch (err: any) {
      toast({ title: 'Gagal menghapus folder', description: err.message, variant: 'destructive' });
    }
  };

  const handleMoveDoc = async (docId: string, folderId: string | null) => {
    try {
      await moveDocumentToFolder(docId, folderId);
      setMoveTarget(null);
      await loadData();
      toast({ title: 'Dokumen dipindahkan' });
    } catch (err: any) {
      toast({ title: 'Gagal memindahkan', description: err.message, variant: 'destructive' });
    }
  };

  const handleArchiveDelete = async () => {
    if (!deleteConfirm || !deletePassword) return;
    setDeleteLoading(true);
    try {
      const result = await archiveDeleteDocuments(deleteConfirm.ids, deletePassword);
      setDeleteConfirm(null);
      setDeletePassword('');
      setSelectedIds(new Set());
      setBulkMode(false);
      await loadData();
      toast({ title: `${result.deleted} dokumen dihapus permanen` });
    } catch (err: any) {
      toast({ title: 'Gagal menghapus', description: err.message, variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(currentDocs);
    toast({ title: `${currentDocs.length} dokumen diekspor ke CSV` });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Memuat arsip...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 max-w-8xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Archive className="h-6 w-6 text-primary" /> Arsip Dokumen
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {documents.length} dokumen tersimpan
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setNewFolderName(''); setShowCreateFolder(true); }} className="gap-1.5 text-xs">
              <FolderPlus className="h-3.5 w-3.5" /> Folder Baru
            </Button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 mb-4 text-sm">
          <button
            onClick={() => setCurrentFolderId(null)}
            className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors ${
              currentFolderId === null ? 'text-foreground font-medium' : 'text-muted-foreground'
            }`}
          >
            <Home className="h-3.5 w-3.5" /> Arsip
          </button>
          {breadcrumb.map(f => (
            <div key={f.id} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <button
                onClick={() => setCurrentFolderId(f.id)}
                className={`px-2 py-1 rounded hover:bg-muted transition-colors ${
                  currentFolderId === f.id ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                {f.name}
              </button>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari judul, nomor surat, kode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-card pr-10"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={bulkMode ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
              className="gap-1.5 text-xs"
            >
              <Checkbox className="h-3 w-3" /> Pilih
            </Button>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-32 h-8 text-xs bg-card">
                <Filter className="mr-1.5 h-3 w-3 text-muted-foreground" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="finished">Selesai</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortMode} onValueChange={v => setSortMode(v as SortMode)}>
              <SelectTrigger className="w-32 h-8 text-xs bg-card">
                <ArrowUpDown className="mr-1.5 h-3 w-3 text-muted-foreground" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="oldest">Terlama</SelectItem>
                <SelectItem value="title">Judul A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk actions */}
        <AnimatePresence>
          {bulkMode && selectedIds.size > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-3 overflow-hidden"
            >
              <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
                <span className="text-xs font-medium">{selectedIds.size} dipilih</span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds(new Set(currentDocs.map(d => d.id)))}>
                  Pilih Semua
                </Button>
                <div className="flex-1" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setDeleteConfirm({ ids: [...selectedIds] })}
                >
                  <Trash2 className="h-3 w-3" /> Hapus Permanen
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content: folders + documents */}
        <div className="space-y-1">
          {/* Folders */}
          {currentFolders.map(folder => (
            <div
              key={folder.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group"
              onDoubleClick={() => setCurrentFolderId(folder.id)}
            >
              <Folder className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {folders.filter(f => f.parentId === folder.id).length} sub-folder •{' '}
                  {documents.filter(d => d.folderId === folder.id).length} dokumen
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCurrentFolderId(folder.id)} className="gap-2">
                    <Folder className="h-3.5 w-3.5" /> Buka
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setRenameFolder(folder); setRenameFolderValue(folder.name); }} className="gap-2">
                    <Pencil className="h-3.5 w-3.5" /> Ubah Nama
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDeleteFolder(folder.id)} className="gap-2 text-destructive focus:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" /> Hapus Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {/* Documents */}
          {currentDocs.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:bg-muted/50 transition-colors group"
            >
              {bulkMode && (
                <Checkbox
                  checked={selectedIds.has(doc.id)}
                  onCheckedChange={() => toggleSelect(doc.id)}
                />
              )}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => navigate(`/editor/${doc.id}`)}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">{doc.title || 'Tanpa Judul'}</span>
                  <Badge variant={doc.status === 'finished' ? 'default' : 'secondary'} className="text-[10px] h-5 shrink-0">
                    {doc.status === 'finished' ? <><CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Selesai</> : <><Clock className="h-2.5 w-2.5 mr-0.5" /> Draft</>}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                  {doc.docNumber && <span>#{doc.docNumber}</span>}
                  {doc.createdAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(doc.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/editor/${doc.id}`)} className="gap-2">
                    <FileText className="h-3.5 w-3.5" /> Buka
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2">
                      <FolderInput className="h-3.5 w-3.5" /> Pindahkan ke
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => handleMoveDoc(doc.id, null)} className="gap-2">
                        <Home className="h-3.5 w-3.5" /> Root (Tanpa Folder)
                      </DropdownMenuItem>
                      {folders.filter(f => f.id !== doc.folderId).map(f => (
                        <DropdownMenuItem key={f.id} onClick={() => handleMoveDoc(doc.id, f.id)} className="gap-2">
                          <Folder className="h-3.5 w-3.5" /> {f.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteConfirm({ ids: [doc.id] })}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus Permanen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {/* Empty state */}
          {currentFolders.length === 0 && currentDocs.length === 0 && (
            <div className="py-16 text-center">
              <Archive className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {search.trim() ? 'Tidak ada yang cocok' : 'Folder ini kosong'}
              </p>
            </div>
          )}
        </div>

        {/* Create Folder Dialog */}
        <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Folder Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nama Folder</Label>
                <Input
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Nama folder..."
                  onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateFolder(false)}>Batal</Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Buat</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Folder Dialog */}
        <Dialog open={!!renameFolder} onOpenChange={() => setRenameFolder(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Ubah Nama Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nama Baru</Label>
                <Input
                  value={renameFolderValue}
                  onChange={e => setRenameFolderValue(e.target.value)}
                  placeholder="Nama folder..."
                  onKeyDown={e => e.key === 'Enter' && handleRenameFolder()}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameFolder(null)}>Batal</Button>
              <Button onClick={handleRenameFolder} disabled={!renameFolderValue.trim()}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation with Password */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => { setDeleteConfirm(null); setDeletePassword(''); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Lock className="h-5 w-5" /> Hapus Permanen
              </DialogTitle>
              <DialogDescription>
                {deleteConfirm?.ids.length === 1
                  ? 'Dokumen ini akan dihapus permanen dan tidak bisa dikembalikan.'
                  : `${deleteConfirm?.ids.length} dokumen akan dihapus permanen.`}
                <br />Masukkan password akun Anda untuk konfirmasi.
              </DialogDescription>
            </DialogHeader>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="Masukkan password..."
                onKeyDown={e => e.key === 'Enter' && handleArchiveDelete()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDeleteConfirm(null); setDeletePassword(''); }}>Batal</Button>
              <Button variant="destructive" onClick={handleArchiveDelete} disabled={!deletePassword || deleteLoading}>
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
