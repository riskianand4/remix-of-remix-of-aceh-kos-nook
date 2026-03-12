import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, FileText, Copy, Trash2, Clock, CheckCircle, Search,
  LayoutGrid, List, Filter, ArrowUpDown, Calendar, MoreHorizontal,
  TrendingUp, Download, ShieldCheck,
  FileUp, BookTemplate, CheckSquare, Save, Archive, Mail, Camera, Building2, Star, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { getDocuments, deleteDocument, duplicateDocument, saveDocument, getCustomTemplates, deleteCustomTemplate, saveCustomTemplate } from '@/lib/storage';
import { CustomTemplate } from '@/lib/storage';
import { DocumentData, createNewDocument } from '@/types/document';
import { toast } from '@/hooks/use-toast';
import { TEMPLATES } from '@/lib/templates';
import ConfirmDialog from '@/components/editor/ConfirmDialog';
import { exportDocuments, exportSingleDocument, importDocuments } from '@/lib/export-import';
import ProgressDialog from '@/components/ProgressDialog';
import { useProgress } from '@/hooks/useProgress';
import OnboardingWelcome from '@/components/OnboardingWelcome';
import { useOnboarding } from '@/hooks/useOnboarding';
import { createDocument, updateDocument } from '@/lib/api';

type ViewMode = 'grid' | 'list';
type SortMode = 'newest' | 'oldest' | 'title' | 'status';
type FilterMode = 'all' | 'draft' | 'finished';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const onboarding = useOnboarding();
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [saveTemplateTarget, setSaveTemplateTarget] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('favorite_templates') || '[]')); } catch { return new Set(); }
  });

  // Rename state
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem('favorite_templates', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const loadData = useCallback(async () => {
    try {
      const [docs, tmpls] = await Promise.all([getDocuments(), getCustomTemplates()]);
      setDocuments(docs);
      setCustomTemplates(tmpls);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Listen for sidebar actions
  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail;
      if (action === 'create') setShowCreatePicker(true);
      if (action === 'template') setShowTemplates(true);
      if (action === 'import') importRef.current?.click();
      if (action === 'export') handleExportAll();
    };
    window.addEventListener('sidebar-action', handler);
    return () => window.removeEventListener('sidebar-action', handler);
  }, [documents]);

  const filtered = useMemo(() => {
    let docs = [...documents];
    if (filterMode === 'draft') docs = docs.filter(d => d.status === 'draft');
    if (filterMode === 'finished') docs = docs.filter(d => d.status === 'finished');
    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter(d => d.title.toLowerCase().includes(q) || d.subtitle.toLowerCase().includes(q) || (d.docCode || '').toLowerCase().includes(q) || (d.docNumber || '').toLowerCase().includes(q));
    }
    switch (sortMode) {
      case 'newest': docs.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')); break;
      case 'oldest': docs.sort((a, b) => (a.updatedAt || '').localeCompare(b.updatedAt || '')); break;
      case 'title': docs.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
      case 'status': docs.sort((a, b) => a.status.localeCompare(b.status)); break;
    }
    return docs;
  }, [documents, search, sortMode, filterMode]);


  const handleCreate = async (type: 'dokumentasi' | 'surat-resmi' = 'dokumentasi') => {
    const doc = createNewDocument(type);
    try {
      const created = await createDocument(doc);
      navigate(`/editor/${created.id}`);
    } catch {
      const { saveDocument: saveDoc } = await import('@/lib/storage');
      await saveDoc(doc);
      navigate(`/editor/${doc.id}`);
    }
  };

  const [showCreatePicker, setShowCreatePicker] = useState(false);

  const handleCreateFromTemplate = async (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const doc = template.create();
    try {
      const created = await createDocument(doc);
      setShowTemplates(false);
      navigate(`/editor/${created.id}`);
    } catch {
      const { saveDocument: saveDoc } = await import('@/lib/storage');
      await saveDoc(doc);
      setShowTemplates(false);
      navigate(`/editor/${doc.id}`);
    }
  };

  const handleCreateFromCustomTemplate = async (tmpl: CustomTemplate) => {
    const newDoc = {
      ...JSON.parse(JSON.stringify(tmpl.snapshot)),
      id: crypto.randomUUID(),
      title: tmpl.name,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    delete (newDoc as any)._id;
    try {
      const created = await createDocument(newDoc);
      setShowTemplates(false);
      navigate(`/editor/${created.id}`);
    } catch {
      const { saveDocument: saveDoc } = await import('@/lib/storage');
      await saveDoc(newDoc);
      setShowTemplates(false);
      navigate(`/editor/${newDoc.id}`);
    }
  };


  const handleSaveAsTemplate = async () => {
    if (!saveTemplateTarget || !templateName.trim()) return;
    const doc = documents.find(d => d.id === saveTemplateTarget);
    if (!doc) return;
    await saveCustomTemplate(doc, templateName.trim(), templateDesc.trim());
    const tmpls = await getCustomTemplates();
    setCustomTemplates(tmpls);
    setSaveTemplateTarget(null);
    setTemplateName('');
    setTemplateDesc('');
    toast({ title: 'Template tersimpan!' });
  };

  const handleDeleteCustomTemplate = async (id: string) => {
    await deleteCustomTemplate(id);
    const tmpls = await getCustomTemplates();
    setCustomTemplates(tmpls);
    toast({ title: 'Template dihapus' });
  };

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    await loadData();
    setDeleteTarget(null);
    toast({ title: t('dashboard.docDeleted') });
  };

  const handleDuplicate = async (id: string) => {
    await duplicateDocument(id);
    await loadData();
    toast({ title: t('dashboard.docDuplicated') });
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await updateDocument(renameTarget.id, { title: renameValue.trim() });
      await loadData();
      toast({ title: 'Nama dokumen diperbarui' });
    } catch {
      toast({ title: 'Gagal mengubah nama', variant: 'destructive' });
    }
    setRenameTarget(null);
  };

  const handleExportAll = () => {
    exportDocuments(documents);
    toast({ title: t('dashboard.docsExported', { count: documents.length }) });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await importDocuments(file);
      await loadData();
      toast({ title: t('dashboard.docsImported', { count }) });
    } catch (err: any) {
      toast({ title: t('dashboard.importFailed'), description: err.message, variant: 'destructive' });
    }
    e.target.value = '';
  };

  // Bulk operations
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => setSelectedIds(new Set(filtered.map(d => d.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteDocument(id);
    }
    await loadData();
    setSelectedIds(new Set());
    setBulkMode(false);
    toast({ title: `${selectedIds.size} documents deleted` });
  };

  const handleBulkExport = () => {
    const docs = documents.filter(d => selectedIds.has(d.id));
    exportDocuments(docs);
    toast({ title: t('dashboard.docsExported', { count: docs.length }) });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat dokumen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingWelcome
        open={onboarding.showWelcome}
        onClose={onboarding.completeOnboarding}
        onStartTour={onboarding.completeOnboarding}
      />
      <main className="container mx-auto px-6 py-8">


        {documents.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-24 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-2 text-2xl font-bold text-foreground">{t('dashboard.noDocsTitle')}</h2>
            <p className="mb-8 max-w-md text-sm text-muted-foreground leading-relaxed">{t('dashboard.noDocsDescription')}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowTemplates(true)} className="gap-2">
                <BookTemplate className="h-4 w-4" /> {t('dashboard.fromTemplate')}
              </Button>
              <Button onClick={() => setShowCreatePicker(true)} size="lg" className="gap-2 bg-primary hover:bg-primary/90 px-8">
                <Plus className="h-5 w-5" /> {t('dashboard.createBlank')}
              </Button>
            </div>

            <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 text-center">
              {[
                { icon: FileText, text: t('dashboard.coverLetterhead') },
                { icon: LayoutGrid, text: t('dashboard.imageGrid') },
                { icon: TrendingUp, text: t('dashboard.tableAppendix') },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                    <f.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{f.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            {/* Toolbar */}
            <motion.div
              className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t('dashboard.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card" />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={bulkMode ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
                  className="gap-1.5 text-xs"
                >
                  <CheckSquare className="h-3.5 w-3.5" /> {t('dashboard.bulkSelect')}
                </Button>

                <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
                  <SelectTrigger className="w-32 bg-card">
                    <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboard.all')}</SelectItem>
                    <SelectItem value="draft">{t('dashboard.draft')}</SelectItem>
                    <SelectItem value="finished">{t('dashboard.finished')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                  <SelectTrigger className="w-36 bg-card">
                    <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('dashboard.newest')}</SelectItem>
                    <SelectItem value="oldest">{t('dashboard.oldest')}</SelectItem>
                    <SelectItem value="title">{t('dashboard.titleAZ')}</SelectItem>
                    <SelectItem value="status">{t('dashboard.status')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Bulk actions bar */}
            <AnimatePresence>
              {bulkMode && selectedIds.size > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
                    <span className="text-xs font-medium text-foreground">
                      {t('dashboard.selected', { count: selectedIds.size })}
                    </span>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={selectAll}>
                      {t('dashboard.selectAll')}
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={deselectAll}>
                      {t('dashboard.deselectAll')}
                    </Button>
                    <div className="flex-1" />
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleBulkExport}>
                      <Download className="h-3 w-3" /> {t('dashboard.bulkExport')}
                    </Button>
                    <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={handleBulkDelete}>
                      <Trash2 className="h-3 w-3" /> {t('dashboard.bulkDelete')}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mb-4 text-xs text-muted-foreground">
              {t('dashboard.docsFound', { count: filtered.length })}
            </p>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{t('dashboard.noResults')}</p>
              </div>
            ) : viewMode === 'grid' ? (
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
              >
                {filtered.map((doc) => (
                  <motion.div
                    key={doc.id}
                    variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                  >
                    <DocumentCard
                      doc={doc}
                      onOpen={() => navigate(`/editor/${doc.id}`)}
                      onDuplicate={() => handleDuplicate(doc.id)}
                      onDelete={() => setDeleteTarget(doc.id)}
                      onExport={() => { exportSingleDocument(doc); toast({ title: t('dashboard.docExported') }); }}
                      onSaveTemplate={() => { setSaveTemplateTarget(doc.id); setTemplateName(doc.title); }}
                      onRename={() => { setRenameTarget({ id: doc.id, title: doc.title }); setRenameValue(doc.title || ''); }}
                      bulkMode={bulkMode}
                      selected={selectedIds.has(doc.id)}
                      onToggleSelect={() => toggleSelect(doc.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="space-y-2"
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
              >
                {filtered.map((doc) => (
                  <motion.div
                    key={doc.id}
                    variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
                  >
                    <DocumentListItem
                      doc={doc}
                      onOpen={() => navigate(`/editor/${doc.id}`)}
                      onDuplicate={() => handleDuplicate(doc.id)}
                      onDelete={() => setDeleteTarget(doc.id)}
                      onExport={() => { exportSingleDocument(doc); toast({ title: t('dashboard.docExported') }); }}
                      onSaveTemplate={() => { setSaveTemplateTarget(doc.id); setTemplateName(doc.title); }}
                      onRename={() => { setRenameTarget({ id: doc.id, title: doc.title }); setRenameValue(doc.title || ''); }}
                      bulkMode={bulkMode}
                      selected={selectedIds.has(doc.id)}
                      onToggleSelect={() => toggleSelect(doc.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Template Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('dashboard.selectTemplate')}</DialogTitle>
            <DialogDescription>{t('dashboard.selectTemplateDesc')}</DialogDescription>
          </DialogHeader>
          {/* Favorites */}
          {(() => {
            const favTemplates = TEMPLATES.filter(t => favorites.has(t.id));
            const favCustom = customTemplates.filter(t => favorites.has(t.id));
            if (favTemplates.length === 0 && favCustom.length === 0) return null;
            return (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                  <Star className="h-3 w-3 fill-primary" /> Favorit
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {favTemplates.map((tmpl) => (
                    <motion.button
                      key={tmpl.id}
                      onClick={() => handleCreateFromTemplate(tmpl.id)}
                      className="flex flex-col items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4 text-left transition-all hover:bg-primary/10"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-2xl">{tmpl.icon}</span>
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      </div>
                      <span className="font-semibold text-sm text-foreground">{tmpl.name}</span>
                    </motion.button>
                  ))}
                  {favCustom.map((tmpl) => (
                    <motion.button
                      key={tmpl.id}
                      onClick={() => handleCreateFromCustomTemplate(tmpl)}
                      className="flex flex-col items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4 text-left transition-all hover:bg-primary/10"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-2xl">{tmpl.icon}</span>
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      </div>
                      <span className="font-semibold text-sm text-foreground">{tmpl.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })()}
          {(['bisnis', 'teknis', 'legal', 'keuangan'] as const).map((cat) => {
            const items = TEMPLATES.filter(t => t.category === cat);
            if (items.length === 0) return null;
            const catLabels = { bisnis: 'Bisnis', teknis: 'Teknis', legal: 'Legal', keuangan: 'Keuangan' };
            return (
              <div key={cat} className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{catLabels[cat]}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((tmpl) => (
                    <div key={tmpl.id} className="relative group/tmpl">
                      <motion.button
                        onClick={() => handleCreateFromTemplate(tmpl.id)}
                        className="w-full flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:bg-muted/50 hover:border-primary/50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-2xl">{tmpl.icon}</span>
                        <span className="font-semibold text-sm text-foreground">{tmpl.name}</span>
                        <span className="text-xs text-muted-foreground">{tmpl.description}</span>
                      </motion.button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/tmpl:opacity-100"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(tmpl.id); }}
                      >
                        <Star className={`h-3 w-3 ${favorites.has(tmpl.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {/* Custom Templates */}
          {customTemplates.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Template Kustom</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {customTemplates.map((tmpl) => (
                  <div key={tmpl.id} className="relative group/tmpl">
                    <motion.button
                      onClick={() => handleCreateFromCustomTemplate(tmpl)}
                      className="w-full flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:bg-muted/50 hover:border-primary/50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-2xl">{tmpl.icon}</span>
                      <span className="font-semibold text-sm text-foreground">{tmpl.name}</span>
                      <span className="text-xs text-muted-foreground">{tmpl.description || 'Template kustom'}</span>
                    </motion.button>
                    <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover/tmpl:opacity-100">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); toggleFavorite(tmpl.id); }}>
                        <Star className={`h-3 w-3 ${favorites.has(tmpl.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteCustomTemplate(tmpl.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Save as Template Dialog */}
      <Dialog open={!!saveTemplateTarget} onOpenChange={() => setSaveTemplateTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Simpan sebagai Template</DialogTitle>
            <DialogDescription>Template menyimpan seluruh konfigurasi dokumen untuk dipakai ulang.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nama Template</Label>
              <Input value={templateName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateName(e.target.value)} placeholder="cth: Laporan Proyek" />
            </div>
            <div>
              <Label className="text-xs">Deskripsi (opsional)</Label>
              <Input value={templateDesc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateDesc(e.target.value)} placeholder="cth: Template dengan cover dan KOP" />
            </div>
            <Button onClick={handleSaveAsTemplate} disabled={!templateName.trim()} className="w-full">
              Simpan Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Picker Dialog */}
      <Dialog open={showCreatePicker} onOpenChange={setShowCreatePicker}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Dokumen Baru</DialogTitle>
            <DialogDescription>Pilih jenis dokumen yang ingin Anda buat.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2 py-2">
            <motion.button
              onClick={() => { setShowCreatePicker(false); handleCreate('surat-resmi'); }}
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-border p-6 text-center transition-all hover:border-primary hover:bg-primary/5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Surat Resmi</p>
                <p className="text-[11px] text-muted-foreground mt-1">Surat dinas dengan KOP, nomor surat, dan tanda tangan</p>
              </div>
            </motion.button>
            <motion.button
              onClick={() => { setShowCreatePicker(false); handleCreate('dokumentasi'); }}
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-border p-6 text-center transition-all hover:border-primary hover:bg-primary/5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Camera className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Laporan Foto Proyek</p>
                <p className="text-[11px] text-muted-foreground mt-1">Dokumentasi visual dengan cover, tabel, dan gambar</p>
              </div>
            </motion.button>
          </div>
          {(TEMPLATES.length > 0 || customTemplates.length > 0) && (
            <div className="border-t pt-3">
              <Button variant="ghost" size="sm" className="w-full gap-2 text-xs text-muted-foreground" onClick={() => { setShowCreatePicker(false); setShowTemplates(true); }}>
                <BookTemplate className="h-3.5 w-3.5" /> Lihat semua template
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={() => setRenameTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Nama Dokumen</DialogTitle>
            <DialogDescription>Masukkan nama baru untuk dokumen ini.</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Nama dokumen..."
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Batal</Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={t('dashboard.deleteDoc')}
        description={t('dashboard.deleteDocDesc')}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </div>
  );
}

/* ─── Sub-components ─── */


function DocumentCard({ doc, onOpen, onDuplicate, onDelete, onExport, onSaveTemplate, onRename, bulkMode, selected, onToggleSelect }: {
  doc: DocumentData; onOpen: () => void; onDuplicate: () => void; onDelete: () => void; onExport: () => void; onSaveTemplate: () => void; onRename: () => void;
  bulkMode: boolean; selected: boolean; onToggleSelect: () => void;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card
        className={`group cursor-pointer transition-colors hover:bg-card/80 ${selected ? 'ring-1 ring-primary' : ''}`}
        onClick={bulkMode ? onToggleSelect : onOpen}
      >
        <CardContent className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              {bulkMode && (
                <Checkbox checked={selected} onCheckedChange={onToggleSelect} onClick={(e) => e.stopPropagation()} />
              )}
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={doc.status === 'finished' ? 'default' : 'secondary'}
                className={`text-[10px] font-medium ${doc.status === 'finished' ? 'bg-success/15 text-success hover:bg-success/20 border-0' : 'border-0'}`}
              >
                {doc.status === 'finished' ? <><CheckCircle className="mr-1 h-3 w-3" /> Finished</> : <><Clock className="mr-1 h-3 w-3" /> Draft</>}
              </Badge>
              {!bulkMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={onOpen}><FileText className="mr-2 h-3.5 w-3.5" /> Open</DropdownMenuItem>
                    <DropdownMenuItem onClick={onRename}><Pencil className="mr-2 h-3.5 w-3.5" /> Rename</DropdownMenuItem>
                    <DropdownMenuItem onClick={onDuplicate}><Copy className="mr-2 h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
                    <DropdownMenuItem onClick={onExport}><Download className="mr-2 h-3.5 w-3.5" /> Export</DropdownMenuItem>
                    <DropdownMenuItem onClick={onSaveTemplate}><Save className="mr-2 h-3.5 w-3.5" /> Simpan Template</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <h3 className="mb-1 font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {doc.title || 'Untitled Document'}
          </h3>
          {doc.subtitle && <p className="mb-2 text-xs text-muted-foreground line-clamp-1">{doc.subtitle}</p>}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(doc.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {doc.sections?.length > 0 && (
              <><span className="text-border">•</span><span>{doc.sections.reduce((acc, s) => acc + s.images.length, 0)} images</span></>
            )}
            {doc.tables?.length > 0 && (
              <><span className="text-border">•</span><span>{doc.tables.length} tables</span></>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DocumentListItem({ doc, onOpen, onDuplicate, onDelete, onExport, onSaveTemplate, onRename, bulkMode, selected, onToggleSelect }: {
  doc: DocumentData; onOpen: () => void; onDuplicate: () => void; onDelete: () => void; onExport: () => void; onSaveTemplate: () => void; onRename: () => void;
  bulkMode: boolean; selected: boolean; onToggleSelect: () => void;
}) {
  return (
    <Card
      className={`group cursor-pointer transition-colors duration-200 hover:bg-card/80 ${selected ? 'ring-1 ring-primary' : ''}`}
      onClick={bulkMode ? onToggleSelect : onOpen}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {bulkMode && (
          <Checkbox checked={selected} onCheckedChange={onToggleSelect} onClick={(e) => e.stopPropagation()} />
        )}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors text-sm">
            {doc.title || 'Untitled Document'}
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
            <span>{new Date(doc.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {doc.sections?.length > 0 && (
              <><span className="text-border">•</span><span>{doc.sections.reduce((a, s) => a + s.images.length, 0)} images</span></>
            )}
          </div>
        </div>
        <Badge
          variant={doc.status === 'finished' ? 'default' : 'secondary'}
          className={`shrink-0 text-[10px] font-medium ${doc.status === 'finished' ? 'bg-success/15 text-success hover:bg-success/20 border-0' : 'border-0'}`}
        >
          {doc.status === 'finished' ? 'Finished' : 'Draft'}
        </Badge>
        {!bulkMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onOpen}><FileText className="mr-2 h-3.5 w-3.5" /> Open</DropdownMenuItem>
              <DropdownMenuItem onClick={onRename}><Pencil className="mr-2 h-3.5 w-3.5" /> Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}><Copy className="mr-2 h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={onExport}><Download className="mr-2 h-3.5 w-3.5" /> Export</DropdownMenuItem>
              <DropdownMenuItem onClick={onSaveTemplate}><Save className="mr-2 h-3.5 w-3.5" /> Simpan Template</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );
}
