import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, FolderOpen, Folder, FileText, ChevronRight,
  Clock, CheckCircle, Calendar, Hash, Archive,
  Filter, ArrowUpDown, Download, X, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { getDocuments } from '@/lib/storage';
import { DocumentData } from '@/types/document';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

type ViewTab = 'tree' | 'flat';
type StatusFilter = 'all' | 'draft' | 'finished';
type SortMode = 'newest' | 'oldest' | 'title';

interface YearGroup { year: string; count: number; months: MonthGroup[] }
interface MonthGroup { monthKey: string; monthLabel: string; count: number; docs: DocumentData[] }

// Export docs to CSV
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
  a.download = `arsip-dokumen-${new Date().toISOString().substring(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Mini preview card for hover tooltip
function DocPreview({ doc }: { doc: DocumentData }) {
  const imgCount = doc.sections?.reduce((s, sec) => s + sec.images.length, 0) ?? 0;
  const blockCount = doc.contentBlocks?.length ?? 0;
  const tableCount = doc.tables?.length ?? 0;
  return (
    <div className="w-64 space-y-2.5 p-1">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-foreground line-clamp-2">{doc.title || 'Untitled'}</p>
          {doc.subtitle && <p className="text-[10px] text-muted-foreground">{doc.subtitle}</p>}
        </div>
        <Badge
          variant={doc.status === 'finished' ? 'default' : 'secondary'}
          className={`text-[9px] h-4 px-1.5 shrink-0 ${doc.status === 'finished' ? 'bg-success/15 text-success border-0' : 'border-0'}`}
        >
          {doc.status === 'finished' ? 'Selesai' : 'Draft'}
        </Badge>
      </div>
      {doc.docNumber && (
        <div className="flex items-center gap-1 rounded bg-muted px-2 py-1">
          <Hash className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-mono text-muted-foreground">{doc.docNumber}</span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-1 text-center">
        {[
          { label: 'Foto', value: imgCount },
          { label: 'Blok', value: blockCount },
          { label: 'Tabel', value: tableCount },
        ].map(item => (
          <div key={item.label} className="rounded bg-muted/60 py-1.5">
            <p className="text-xs font-bold text-foreground">{item.value}</p>
            <p className="text-[9px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>Dibuat: {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
      </div>
    </div>
  );
}

export default function Arsip() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ViewTab>('tree');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    getDocuments().then(docs => {
      setDocuments(docs);
      setLoading(false);
      if (docs.length > 0) {
        const sorted = [...docs].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        const latest = sorted[0];
        if (latest?.createdAt) {
          const year = latest.createdAt.substring(0, 4);
          const month = latest.createdAt.substring(0, 7);
          setExpandedYears(new Set([year]));
          setExpandedMonths(new Set([month]));
        }
      }
    });
  }, []);

  const toggleYear = useCallback((year: string) => {
    setExpandedYears(prev => { const n = new Set(prev); n.has(year) ? n.delete(year) : n.add(year); return n; });
  }, []);
  const toggleMonth = useCallback((key: string) => {
    setExpandedMonths(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);

  // Apply status filter + sort
  const processedDocs = useMemo(() => {
    let docs = [...documents];
    if (statusFilter === 'draft') docs = docs.filter(d => d.status === 'draft');
    if (statusFilter === 'finished') docs = docs.filter(d => d.status === 'finished');
    switch (sortMode) {
      case 'newest': docs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')); break;
      case 'oldest': docs.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')); break;
      case 'title':  docs.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
    }
    return docs;
  }, [documents, statusFilter, sortMode]);

  // Build tree
  const tree = useMemo((): YearGroup[] => {
    const yearMap = new Map<string, Map<string, DocumentData[]>>();
    processedDocs.forEach(doc => {
      const date = doc.createdAt || doc.updatedAt || new Date().toISOString();
      const year = date.substring(0, 4);
      const monthKey = date.substring(0, 7);
      if (!yearMap.has(year)) yearMap.set(year, new Map());
      const mm = yearMap.get(year)!;
      if (!mm.has(monthKey)) mm.set(monthKey, []);
      mm.get(monthKey)!.push(doc);
    });
    return Array.from(yearMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([year, mm]) => {
        const months: MonthGroup[] = Array.from(mm.entries())
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([monthKey, docs]) => ({
            monthKey,
            monthLabel: MONTH_NAMES[parseInt(monthKey.substring(5), 10) - 1] || monthKey,
            count: docs.length,
            docs,
          }));
        return { year, count: months.reduce((s, m) => s + m.count, 0), months };
      });
  }, [processedDocs]);

  // Flat search
  const flatFiltered = useMemo(() => {
    if (!search.trim()) return processedDocs;
    const q = search.toLowerCase();
    return processedDocs.filter(d =>
      d.title?.toLowerCase().includes(q) ||
      d.subtitle?.toLowerCase().includes(q) ||
      d.docNumber?.toLowerCase().includes(q)
    );
  }, [processedDocs, search]);

  const stats = useMemo(() => ({
    total: documents.length,
    draft: documents.filter(d => d.status === 'draft').length,
    finished: documents.filter(d => d.status === 'finished').length,
  }), [documents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat arsip...</p>
        </div>
      </div>
    );
  }

  const hoveredDocData = hoveredDoc ? documents.find(d => d.id === hoveredDoc) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Floating preview tooltip */}
      <AnimatePresence>
        {hoveredDocData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] pointer-events-none rounded-xl border bg-popover shadow-xl p-3"
            style={{ left: hoverPos.x + 16, top: hoverPos.y - 20, maxWidth: 280 }}
          >
            <DocPreview doc={hoveredDocData} />
          </motion.div>
        )}
      </AnimatePresence>



      <main className="container mx-auto px-6 py-8 max-w-8xl">
        {/* Search + Filters */}
        <motion.div className="mb-6 space-y-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari judul, nomor surat, atau subtitle... (cth: SR-001)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-card pr-10"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View tabs */}
            <div className="flex gap-1 rounded-lg border bg-card p-1">
              {(['tree', 'flat'] as ViewTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'tree' ? 'Pohon' : 'Daftar'}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-36 h-8 text-xs bg-card">
                <Filter className="mr-1.5 h-3 w-3 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">📝 Draft saja</SelectItem>
                <SelectItem value="finished">✅ Selesai saja</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortMode} onValueChange={v => setSortMode(v as SortMode)}>
              <SelectTrigger className="w-36 h-8 text-xs bg-card">
                <ArrowUpDown className="mr-1.5 h-3 w-3 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru dulu</SelectItem>
                <SelectItem value="oldest">Terlama dulu</SelectItem>
                <SelectItem value="title">Judul A–Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Active filter badges */}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-[10px] h-6 cursor-pointer" onClick={() => setStatusFilter('all')}>
                {statusFilter === 'draft' ? 'Draft' : 'Selesai'}
                <X className="h-2.5 w-2.5" />
              </Badge>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Hover untuk preview</span>
            </div>
          </div>
        </motion.div>

        {documents.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-24 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Archive className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Arsip Kosong</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Belum ada dokumen tersimpan. Buat dokumen pertama Anda dari halaman utama.
            </p>
            <Button onClick={() => navigate('/')} className="gap-2">
              Kembali ke Dashboard
            </Button>
          </motion.div>
        ) : activeTab === 'flat' || search.trim() ? (
          /* ── FLAT LIST ── */
          <motion.div className="space-y-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {search.trim() && (
              <p className="text-xs text-muted-foreground mb-3">
                {flatFiltered.length} hasil untuk &ldquo;{search}&rdquo;
              </p>
            )}
            {!search.trim() && (
              <p className="text-xs text-muted-foreground mb-3">{processedDocs.length} dokumen</p>
            )}
            {flatFiltered.length === 0 ? (
              <div className="py-16 text-center">
                <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Tidak ada dokumen yang cocok</p>
              </div>
            ) : (
              flatFiltered.map(doc => (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  onClick={() => navigate(`/editor/${doc.id}`)}
                  onHover={(id, e) => { setHoveredDoc(id); setHoverPos({ x: e.clientX, y: e.clientY }); }}
                  onHoverEnd={() => setHoveredDoc(null)}
                />
              ))
            )}
          </motion.div>
        ) : (
          /* ── TREE VIEW ── */
          <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {tree.length === 0 ? (
              <div className="py-16 text-center">
                <Filter className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Tidak ada dokumen dengan filter ini</p>
                <Button variant="ghost" size="sm" className="mt-3 text-xs" onClick={() => setStatusFilter('all')}>
                  Hapus filter
                </Button>
              </div>
            ) : tree.map(yg => (
              <YearFolder
                key={yg.year}
                yearGroup={yg}
                expanded={expandedYears.has(yg.year)}
                onToggle={() => toggleYear(yg.year)}
                expandedMonths={expandedMonths}
                onToggleMonth={toggleMonth}
                onDocClick={doc => navigate(`/editor/${doc.id}`)}
                onDocHover={(id, e) => { setHoveredDoc(id); setHoverPos({ x: e.clientX, y: e.clientY }); }}
                onDocHoverEnd={() => setHoveredDoc(null)}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}

/* ── Year Folder ── */
function YearFolder({
  yearGroup, expanded, onToggle, expandedMonths, onToggleMonth, onDocClick, onDocHover, onDocHoverEnd
}: {
  yearGroup: YearGroup; expanded: boolean; onToggle: () => void;
  expandedMonths: Set<string>; onToggleMonth: (k: string) => void;
  onDocClick: (d: DocumentData) => void;
  onDocHover: (id: string, e: React.MouseEvent) => void;
  onDocHoverEnd: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </motion.div>
        {expanded ? <FolderOpen className="h-5 w-5 text-primary shrink-0" /> : <Folder className="h-5 w-5 text-primary shrink-0" />}
        <span className="font-bold text-foreground text-sm flex-1 text-left">{yearGroup.year}</span>
        <Badge variant="secondary" className="text-[10px] h-5 px-2">{yearGroup.count} dok</Badge>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pl-4 pb-2 space-y-1">
              {yearGroup.months.map(mg => (
                <MonthFolder
                  key={mg.monthKey}
                  monthGroup={mg}
                  expanded={expandedMonths.has(mg.monthKey)}
                  onToggle={() => onToggleMonth(mg.monthKey)}
                  onDocClick={onDocClick}
                  onDocHover={onDocHover}
                  onDocHoverEnd={onDocHoverEnd}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Month Folder ── */
function MonthFolder({
  monthGroup, expanded, onToggle, onDocClick, onDocHover, onDocHoverEnd
}: {
  monthGroup: MonthGroup; expanded: boolean; onToggle: () => void;
  onDocClick: (d: DocumentData) => void;
  onDocHover: (id: string, e: React.MouseEvent) => void;
  onDocHoverEnd: () => void;
}) {
  return (
    <div className="rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors rounded-lg"
        onClick={onToggle}
      >
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </motion.div>
        {expanded
          ? <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
          : <Folder className="h-4 w-4 text-amber-500 shrink-0" />
        }
        <span className="text-sm text-foreground font-medium flex-1 text-left">{monthGroup.monthLabel}</span>
        <Badge variant="outline" className="text-[10px] h-5 px-1.5">{monthGroup.count}</Badge>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pl-7 pr-1 pb-1 space-y-0.5">
              {monthGroup.docs.map(doc => (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  onClick={() => onDocClick(doc)}
                  compact
                  onHover={(id, e) => onDocHover(id, e)}
                  onHoverEnd={onDocHoverEnd}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Doc Row ── */
function DocRow({
  doc, onClick, compact = false, onHover, onHoverEnd
}: {
  doc: DocumentData;
  onClick: () => void;
  compact?: boolean;
  onHover: (id: string, e: React.MouseEvent) => void;
  onHoverEnd: () => void;
}) {
  const date = new Date(doc.createdAt || doc.updatedAt);
  const dateStr = date.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: compact ? undefined : 'numeric'
  });

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={e => onHover(doc.id, e)}
      onMouseLeave={onHoverEnd}
      onMouseMove={e => onHover(doc.id, e)}
      className={`w-full flex items-center gap-3 rounded-lg px-3 transition-colors hover:bg-muted/50 text-left group ${
        compact ? 'py-2' : 'py-3 border bg-card mb-1'
      }`}
      whileHover={{ x: 2 }}
      transition={{ duration: 0.15 }}
    >
      <FileText className={`shrink-0 text-muted-foreground group-hover:text-primary transition-colors ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-foreground truncate group-hover:text-primary transition-colors ${compact ? 'text-xs' : 'text-sm'}`}>
          {doc.title || 'Untitled Document'}
        </p>
        {doc.subtitle && (
          <p className="text-[10px] text-muted-foreground truncate">{doc.subtitle}</p>
        )}
      </div>

      {doc.docNumber && (
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <Hash className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-[10px] text-muted-foreground font-mono">{doc.docNumber}</span>
        </div>
      )}

      <div className="hidden sm:flex items-center gap-1 shrink-0 text-[10px] text-muted-foreground">
        <Calendar className="h-3 w-3" />
        {dateStr}
      </div>

      <Badge
        variant={doc.status === 'finished' ? 'default' : 'secondary'}
        className={`text-[9px] h-4 px-1.5 shrink-0 ${
          doc.status === 'finished' ? 'bg-success/15 text-success hover:bg-success/20 border-0' : 'border-0'
        }`}
      >
        {doc.status === 'finished'
          ? <><CheckCircle className="mr-0.5 h-2.5 w-2.5" />Selesai</>
          : <><Clock className="mr-0.5 h-2.5 w-2.5" />Draft</>
        }
      </Badge>
    </motion.button>
  );
}
