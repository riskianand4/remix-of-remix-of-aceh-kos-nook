import { useRef, useState, useCallback, useMemo } from 'react';
import { DocumentData, CoverLayout, CoverElementPos, CoverTextElement, CoverImageElement, CoverTableElement, CoverTableRow, DEFAULT_COVER_LAYOUT } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RotateCcw, Trash2, Bold, ImagePlus, Type, AlignCenter, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, TableIcon, Plus, Minus } from 'lucide-react';
import { compressImage } from '@/lib/image-utils';

interface Props {
  doc: DocumentData;
  updateDoc: (updates: Partial<DocumentData>) => void;
}

type DragTarget =
  | { type: 'logos' }
  | { type: 'text'; id: string }
  | { type: 'image'; id: string }
  | { type: 'table'; id: string };

export default function CoverDesigner({ doc, updateDoc }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragTarget | null>(null);
  const [selected, setSelected] = useState<DragTarget | null>(null);
  const offsetRef = useRef({ dx: 0, dy: 0 });
  const imgInputRef = useRef<HTMLInputElement>(null);

  const layout: CoverLayout = useMemo(() => ({
    ...DEFAULT_COVER_LAYOUT,
    ...doc.coverLayout,
    textElements: doc.coverLayout?.textElements || [],
    imageElements: doc.coverLayout?.imageElements || [],
    tableElements: doc.coverLayout?.tableElements || [],
    logoWidth: doc.coverLayout?.logoWidth ?? 30,
    logoAlignment: doc.coverLayout?.logoAlignment ?? 'horizontal',
  }), [doc.coverLayout]);

  const layoutRef = useRef<CoverLayout>(layout);
  layoutRef.current = layout;

  const updateLayout = useCallback((updates: Partial<CoverLayout>) => {
    updateDoc({ coverLayout: { ...layoutRef.current, ...updates } });
  }, [updateDoc]);

  const getPos = useCallback((target: DragTarget): CoverElementPos => {
    const l = layoutRef.current;
    if (target.type === 'logos') return l.logos;
    if (target.type === 'text') return l.textElements.find(t => t.id === target.id)?.pos || { x: 50, y: 50 };
    if (target.type === 'image') return l.imageElements.find(t => t.id === target.id)?.pos || { x: 50, y: 50 };
    return l.tableElements.find(t => t.id === target.id)?.pos || { x: 50, y: 50 };
  }, []);

  const getWidth = useCallback((target: DragTarget): number => {
    const l = layoutRef.current;
    if (target.type === 'logos') return l.logoWidth || 30;
    if (target.type === 'text') return l.textElements.find(t => t.id === target.id)?.width || 80;
    if (target.type === 'image') return l.imageElements.find(t => t.id === target.id)?.width || 30;
    return l.tableElements.find(t => t.id === target.id)?.width || 60;
  }, []);

  const setPos = useCallback((target: DragTarget, pos: CoverElementPos) => {
    const l = layoutRef.current;
    if (target.type === 'logos') {
      updateDoc({ coverLayout: { ...l, logos: pos } });
    } else if (target.type === 'text') {
      updateDoc({ coverLayout: { ...l, textElements: l.textElements.map(t => t.id === target.id ? { ...t, pos } : t) } });
    } else if (target.type === 'image') {
      updateDoc({ coverLayout: { ...l, imageElements: l.imageElements.map(t => t.id === target.id ? { ...t, pos } : t) } });
    } else {
      updateDoc({ coverLayout: { ...l, tableElements: l.tableElements.map(t => t.id === target.id ? { ...t, pos } : t) } });
    }
  }, [updateDoc]);

  const handleMouseDown = useCallback((target: DragTarget) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = getPos(target);
    // The element anchor is at (pos.x%, pos.y%) — translate(-50%,-50%) means visual center = anchor
    // So the drag offset is the mouse position relative to the anchor point
    const elXPx = (pos.x / 100) * rect.width;
    const elYPx = (pos.y / 100) * rect.height;
    offsetRef.current = { dx: e.clientX - rect.left - elXPx, dy: e.clientY - rect.top - elYPx };
    setDragging(target);
    setSelected(target);
  }, [getPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left - offsetRef.current.dx) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top - offsetRef.current.dy) / rect.height) * 100));
    setPos(dragging, { x, y });
  }, [dragging, setPos]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const addTextElement = () => {
    const newEl: CoverTextElement = { id: crypto.randomUUID(), text: 'Teks Baru', fontSize: 14, bold: false, pos: { x: 50, y: 50 }, width: 80 };
    updateLayout({ textElements: [...layoutRef.current.textElements, newEl] });
    setSelected({ type: 'text', id: newEl.id });
  };

  const addTableElement = () => {
    const newEl: CoverTableElement = {
      id: crypto.randomUUID(),
      rows: [{ key: 'Nama', value: '' }, { key: 'NIM', value: '' }],
      pos: { x: 50, y: 65 },
      width: 60,
      fontSize: 12,
      bold: false,
      keyWidth: 35,
    };
    updateLayout({ tableElements: [...layoutRef.current.tableElements, newEl] });
    setSelected({ type: 'table', id: newEl.id });
  };

  const addImageElement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file, 800, 800, 0.8);
    const newEl: CoverImageElement = { id: crypto.randomUUID(), dataUrl, pos: { x: 50, y: 50 }, width: 30 };
    updateLayout({ imageElements: [...layoutRef.current.imageElements, newEl] });
    setSelected({ type: 'image', id: newEl.id });
    e.target.value = '';
  };

  const updateTextElement = (id: string, updates: Partial<CoverTextElement>) => {
    updateLayout({ textElements: layoutRef.current.textElements.map(t => t.id === id ? { ...t, ...updates } : t) });
  };

  const updateImageElement = (id: string, updates: Partial<CoverImageElement>) => {
    updateLayout({ imageElements: layoutRef.current.imageElements.map(t => t.id === id ? { ...t, ...updates } : t) });
  };

  const updateTableElement = (id: string, updates: Partial<CoverTableElement>) => {
    updateLayout({ tableElements: layoutRef.current.tableElements.map(t => t.id === id ? { ...t, ...updates } : t) });
  };

  const updateTableRow = (tableId: string, rowIdx: number, field: 'key' | 'value', val: string) => {
    const tbl = layoutRef.current.tableElements.find(t => t.id === tableId);
    if (!tbl) return;
    const newRows = tbl.rows.map((r, i) => i === rowIdx ? { ...r, [field]: val } : r);
    updateTableElement(tableId, { rows: newRows });
  };

  const addTableRow = (tableId: string) => {
    const tbl = layoutRef.current.tableElements.find(t => t.id === tableId);
    if (!tbl) return;
    updateTableElement(tableId, { rows: [...tbl.rows, { key: 'Label', value: '' }] });
  };

  const removeTableRow = (tableId: string, rowIdx: number) => {
    const tbl = layoutRef.current.tableElements.find(t => t.id === tableId);
    if (!tbl || tbl.rows.length <= 1) return;
    updateTableElement(tableId, { rows: tbl.rows.filter((_, i) => i !== rowIdx) });
  };

  const removeTextElement = (id: string) => { updateLayout({ textElements: layoutRef.current.textElements.filter(t => t.id !== id) }); setSelected(null); };
  const removeImageElement = (id: string) => { updateLayout({ imageElements: layoutRef.current.imageElements.filter(t => t.id !== id) }); setSelected(null); };
  const removeTableElement = (id: string) => { updateLayout({ tableElements: layoutRef.current.tableElements.filter(t => t.id !== id) }); setSelected(null); };

  const centerElement = (target: DragTarget) => {
    if (target.type === 'logos') {
      updateLayout({ logos: { ...layoutRef.current.logos, x: 50 } });
    } else if (target.type === 'text') {
      updateLayout({ textElements: layoutRef.current.textElements.map(t => t.id === (target as any).id ? { ...t, pos: { ...t.pos, x: 50 } } : t) });
    } else if (target.type === 'image') {
      updateLayout({ imageElements: layoutRef.current.imageElements.map(t => t.id === (target as any).id ? { ...t, pos: { ...t.pos, x: 50 } } : t) });
    } else {
      updateLayout({ tableElements: layoutRef.current.tableElements.map(t => t.id === (target as any).id ? { ...t, pos: { ...t.pos, x: 50 } } : t) });
    }
  };

  const selectedText = selected?.type === 'text' ? layout.textElements.find(t => t.id === selected.id) : null;
  const selectedImage = selected?.type === 'image' ? layout.imageElements.find(t => t.id === selected.id) : null;
  const selectedTable = selected?.type === 'table' ? layout.tableElements.find(t => t.id === selected.id) : null;

  const targetId = (t: DragTarget) => t.type === 'logos' ? 'logos' : (t as any).id;
  const isSame = (a: DragTarget | null, b: DragTarget) => a?.type === b.type && targetId(a!) === targetId(b);

  const renderDraggable = (target: DragTarget, content: React.ReactNode, label: string) => {
    const pos = getPos(target);
    const width = getWidth(target);
    const isSelected = isSame(selected, target);
    const isDrag = isSame(dragging, target);

    return (
      <div
        key={targetId(target)}
        className={`absolute cursor-move select-none transition-shadow ${
          isSelected ? 'ring-2 ring-primary ring-offset-1 z-30' : ''
        } ${isDrag ? 'z-50 opacity-80 scale-105' : 'z-10 hover:ring-2 hover:ring-primary/50'}`}
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          width: `${width}%`,
          transform: 'translate(-50%, -50%)',
        }}
        onMouseDown={handleMouseDown(target)}
      >
        {content}
        {isSelected && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-primary px-1.5 py-0.5 text-[9px] text-primary-foreground font-medium">
            {label}
          </div>
        )}
      </div>
    );
  };

  const logoWidth = layout.logoWidth || 30;
  const logoAlignment = layout.logoAlignment || 'horizontal';
  const hasLogo2 = !!doc.logo2DataUrl;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground">Klik & seret elemen. Tambah teks/gambar/tabel sendiri.</p>
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={addTextElement}>
            <Type className="h-3 w-3" /> Tambah Teks
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={addTableElement}>
            <TableIcon className="h-3 w-3" /> Tambah Tabel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => imgInputRef.current?.click()}>
            <ImagePlus className="h-3 w-3" /> Tambah Gambar
          </Button>
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={addImageElement} />
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-7"
            onClick={() => updateDoc({ coverLayout: { ...DEFAULT_COVER_LAYOUT, textElements: [], imageElements: [], tableElements: [] } })}
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative mx-auto border-2 border-dashed border-border bg-white shadow-sm select-none overflow-hidden"
        style={{ aspectRatio: '210 / 297', maxWidth: '420px' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
      >
        {/* Guide lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-muted/40" />
          <div className="absolute top-1/3 left-0 right-0 border-t border-dashed border-muted/30" />
          <div className="absolute top-2/3 left-0 right-0 border-t border-dashed border-muted/30" />
        </div>

        {/* Logos */}
        {renderDraggable({ type: 'logos' }, (
          <div
            className="flex items-center justify-center rounded bg-white/95 px-2 py-1 shadow-sm w-full"
            style={{
              flexDirection: logoAlignment === 'vertical' ? 'column' : 'row',
              gap: `${Math.max(4, layout.logoGap / 4)}px`,
            }}
          >
            {doc.logo1DataUrl
              ? <img src={doc.logo1DataUrl} className="object-contain flex-1 max-h-20" alt="Logo 1" />
              : <div className="h-12 flex-1 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center text-[7px] text-muted-foreground">Logo 1</div>
            }
            {hasLogo2 && doc.logo2DataUrl && (
              <img src={doc.logo2DataUrl} className="object-contain flex-1 max-h-20" alt="Logo 2" />
            )}
          </div>
        ), 'Logo')}

        {/* Cover image elements */}
        {layout.imageElements.map((el) =>
          renderDraggable({ type: 'image', id: el.id }, (
            <img src={el.dataUrl} alt="Cover image" className="w-full h-auto object-contain pointer-events-none rounded" />
          ), 'Gambar')
        )}

        {/* Custom text elements */}
        {layout.textElements.map((el) =>
          renderDraggable({ type: 'text', id: el.id }, (
            <div className="rounded bg-white/95 px-1 py-0.5 shadow-sm w-full">
              <p
                style={{
                  fontSize: `${Math.max(7, el.fontSize / 2.5)}px`,
                  fontWeight: el.bold ? 'bold' : 'normal',
                  color: el.color || '#000000',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {el.text || '...'}
              </p>
            </div>
          ), 'Teks')
        )}

        {/* Cover table elements */}
        {layout.tableElements.map((tbl) =>
          renderDraggable({ type: 'table', id: tbl.id }, (
            <div className="rounded bg-white/95 px-1 py-0.5 shadow-sm w-full">
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <tbody>
                  {(tbl.rows || []).map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: `${Math.max(6, (tbl.fontSize || 12) / 2.5)}px`, fontWeight: tbl.bold ? 'bold' : 'normal', color: tbl.color || '#000000', textAlign: 'left', whiteSpace: 'nowrap', }}>{row.key}</td>
                      <td style={{ fontSize: `${Math.max(6, (tbl.fontSize || 12) / 2.5)}px`, padding: '0 3px', color: tbl.color || '#000000', whiteSpace: 'nowrap' }}>:</td>
                      <td style={{ fontSize: `${Math.max(6, (tbl.fontSize || 12) / 2.5)}px`, fontWeight: tbl.bold ? 'bold' : 'normal', color: tbl.color || '#000000', textAlign: 'left' }}>{row.value || '...'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ), 'Tabel')
        )}
      </div>

      {/* Properties panel — Logos */}
      {selected?.type === 'logos' && (
        <div className="space-y-3 rounded-md border p-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Logo — X: {Math.round(layout.logos.x)}%, Y: {Math.round(layout.logos.y)}%</p>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => centerElement({ type: 'logos' })} title="Tengahkan secara horizontal">
              <AlignCenter className="h-3 w-3" /> Tengahkan
            </Button>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Lebar Logo ({logoWidth}%)</Label>
            <Slider value={[logoWidth]} min={10} max={80} step={5} onValueChange={([v]) => updateLayout({ logoWidth: v })} />
          </div>
          {hasLogo2 && (
            <div className="space-y-1">
              <Label className="text-xs">Susunan Logo</Label>
              <div className="flex gap-2">
                <Button variant={logoAlignment === 'horizontal' ? 'default' : 'outline'} size="sm" className="flex-1 h-7 gap-1.5 text-xs" onClick={() => updateLayout({ logoAlignment: 'horizontal' })}>
                  <AlignHorizontalJustifyCenter className="h-3 w-3" /> Horizontal
                </Button>
                <Button variant={logoAlignment === 'vertical' ? 'default' : 'outline'} size="sm" className="flex-1 h-7 gap-1.5 text-xs" onClick={() => updateLayout({ logoAlignment: 'vertical' })}>
                  <AlignVerticalJustifyCenter className="h-3 w-3" /> Vertikal
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Properties panel — Text */}
      {selectedText && (
        <div className="space-y-3 rounded-md border p-3 bg-muted/30">
          <div className="flex items-start gap-2">
            <Textarea
              value={selectedText.text}
              onChange={(e) => updateTextElement(selectedText.id, { text: e.target.value })}
              placeholder="Isi teks... (Enter untuk baris baru)"
              className="flex-1 text-sm min-h-[60px] resize-none"
              rows={3}
            />
            <div className="flex flex-col gap-1 shrink-0">
              <Button variant={selectedText.bold ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => updateTextElement(selectedText.id, { bold: !selectedText.bold })} title="Bold">
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => centerElement({ type: 'text', id: selectedText.id })} title="Tengahkan secara horizontal">
                <AlignCenter className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeTextElement(selectedText.id)} title="Hapus">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Ukuran Font ({selectedText.fontSize}pt)</Label>
              <Slider value={[selectedText.fontSize]} min={8} max={48} step={1} onValueChange={([v]) => updateTextElement(selectedText.id, { fontSize: v })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lebar ({selectedText.width || 80}%)</Label>
              <Slider value={[selectedText.width || 80]} min={10} max={100} step={5} onValueChange={([v]) => updateTextElement(selectedText.id, { width: v })} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">X: {Math.round(selectedText.pos.x)}%, Y: {Math.round(selectedText.pos.y)}%</p>
        </div>
      )}

      {/* Properties panel — Image */}
      {selectedImage && (
        <div className="space-y-3 rounded-md border p-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Gambar Cover</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => centerElement({ type: 'image', id: selectedImage.id })} title="Tengahkan secara horizontal">
                <AlignCenter className="h-3 w-3" /> Tengahkan
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeImageElement(selectedImage.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Lebar ({selectedImage.width}%)</Label>
            <Slider value={[selectedImage.width]} min={5} max={100} step={5} onValueChange={([v]) => updateImageElement(selectedImage.id, { width: v })} />
          </div>
          <p className="text-[10px] text-muted-foreground">X: {Math.round(selectedImage.pos.x)}%, Y: {Math.round(selectedImage.pos.y)}%</p>
        </div>
      )}

      {/* Properties panel — Table */}
      {selectedTable && (
        <div className="space-y-3 rounded-md border p-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Tabel Identitas (tanpa border)</p>
            <div className="flex gap-1">
              <Button variant={selectedTable.bold ? 'default' : 'outline'} size="icon" className="h-7 w-7" onClick={() => updateTableElement(selectedTable.id, { bold: !selectedTable.bold })} title="Bold">
                <Bold className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => centerElement({ type: 'table', id: selectedTable.id })}>
                <AlignCenter className="h-3 w-3" /> Tengahkan
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeTableElement(selectedTable.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Rows editor */}
          <div className="space-y-2">
            {selectedTable.rows.map((row, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Input
                  value={row.key}
                  onChange={(e) => updateTableRow(selectedTable.id, i, 'key', e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="Label"
                />
                <span className="text-xs text-muted-foreground shrink-0">:</span>
                <Input
                  value={row.value}
                  onChange={(e) => updateTableRow(selectedTable.id, i, 'value', e.target.value)}
                  className="h-7 text-xs flex-[2]"
                  placeholder="Nilai"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeTableRow(selectedTable.id, i)} disabled={selectedTable.rows.length <= 1}>
                  <Minus className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="h-7 w-full gap-1 text-xs" onClick={() => addTableRow(selectedTable.id)}>
              <Plus className="h-3 w-3" /> Tambah Baris
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Ukuran Font ({selectedTable.fontSize || 12}pt)</Label>
              <Slider value={[selectedTable.fontSize || 12]} min={8} max={24} step={1} onValueChange={([v]) => updateTableElement(selectedTable.id, { fontSize: v })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lebar Tabel ({selectedTable.width || 60}%)</Label>
              <Slider value={[selectedTable.width || 60]} min={20} max={100} step={5} onValueChange={([v]) => updateTableElement(selectedTable.id, { width: v })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Lebar Kolom Label ({selectedTable.keyWidth || 35}%)</Label>
            <Slider value={[selectedTable.keyWidth || 35]} min={10} max={60} step={5} onValueChange={([v]) => updateTableElement(selectedTable.id, { keyWidth: v })} />
          </div>
          <p className="text-[10px] text-muted-foreground">X: {Math.round(selectedTable.pos.x)}%, Y: {Math.round(selectedTable.pos.y)}%</p>
        </div>
      )}
    </div>
  );
}
