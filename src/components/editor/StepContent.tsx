import { useState } from 'react';
import { DocumentData, ImageSection, DocumentImage, TextBlock, FieldsBlock, ContentBlock } from '@/types/document';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Upload, X, Type, Copy, ClipboardPaste, Image, IndentIncrease, Wand2, ListChecks, FileText, AlignJustify } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { normalizeImage } from '@/lib/image-utils';
import DraggableList, { DragHandle } from '@/components/editor/DraggableList';
import ConfirmDialog from '@/components/editor/ConfirmDialog';
import { duplicateSection, duplicateTextBlock, getClipboard } from '@/lib/clipboard-storage';
import { useClipboard } from '@/hooks/useClipboard';
import { toast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { useTranslation } from 'react-i18next';

interface Props {
  doc: DocumentData;
  updateDoc: (updates: Partial<DocumentData>) => void;
  /** When true, hides the "Foto & Seksi" tab — used for Surat Resmi mode */
  suratResmiMode?: boolean;
}

const GRID_OPTIONS = [
  { value: '1x1', label: '1 Gambar/halaman (Full)' },
  { value: '1x2', label: '2 Gambar/halaman (1×2)' },
  { value: '2x2', label: '4 Gambar/halaman (2×2)' },
  { value: '2x3', label: '6 Gambar/halaman (2×3)' },
] as const;

const INDENT_OPTIONS = [
  { value: '0', label: 'Tanpa Indent' },
  { value: '10', label: 'Kecil (10mm)' },
  { value: '20', label: 'Sedang (20mm)' },
  { value: '40', label: 'Besar (40mm)' },
];

export default function StepContent({ doc, updateDoc, suratResmiMode = false }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'section' | 'image' | 'text' | 'attachedImage'; id: string; parentId?: string } | null>(null);
  const [quickCaptionSection, setQuickCaptionSection] = useState<string | null>(null);
  const [quickCaptionPrefix, setQuickCaptionPrefix] = useState('');
  const [quickCaptionStart, setQuickCaptionStart] = useState(1);
  const [quickCaptionEnd, setQuickCaptionEnd] = useState(1);
  const { clipboard, copy } = useClipboard();

  const addSection = () => {
    const section: ImageSection = {
      id: crypto.randomUUID(),
      title: `Section ${doc.sections.length + 1}`,
      gridLayout: '2x2',
      images: [],
    };
    updateDoc({ sections: [...doc.sections, section] });
  };

  const addTextBlock = () => {
    const block: TextBlock = {
      type: 'text',
      id: crypto.randomUUID(),
      title: `Paragraf ${(doc.contentBlocks?.length || 0) + 1}`,
      body: '',
      indent: 0,
      attachedImages: [],
    };
    updateDoc({ contentBlocks: [...(doc.contentBlocks || []), block] });
  };

  const addFieldsBlock = () => {
    const block: FieldsBlock = {
      type: 'fields',
      id: crypto.randomUUID(),
      title: 'Data',
      fields: [
        { key: 'Nama', value: '' },
        { key: 'NIM', value: '' },
      ],
    };
    updateDoc({ contentBlocks: [...(doc.contentBlocks || []), block] });
  };

  const updateSection = (sectionId: string, updates: Partial<ImageSection>) => {
    updateDoc({
      sections: doc.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
    });
  };

  const removeSection = (sectionId: string) => {
    updateDoc({ sections: doc.sections.filter((s) => s.id !== sectionId) });
    setDeleteTarget(null);
  };

  const updateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    updateDoc({
      contentBlocks: (doc.contentBlocks || []).map((b) => {
        if (b.id !== blockId) return b;
        if (b.type === 'text') return { ...b, ...updates } as TextBlock;
        if (b.type === 'fields') return { ...b, ...updates } as FieldsBlock;
        return b;
      }),
    });
  };

  const removeBlock = (blockId: string) => {
    updateDoc({ contentBlocks: (doc.contentBlocks || []).filter((b) => b.id !== blockId) });
    setDeleteTarget(null);
  };

  const handleDuplicateSection = (section: ImageSection) => {
    const dup = duplicateSection(section);
    updateDoc({ sections: [...doc.sections, dup] });
    toast({ title: '✓ Section diduplikasi', duration: 1500 });
  };

  const handleDuplicateTextBlock = (block: TextBlock) => {
    const dup = duplicateTextBlock(block);
    updateDoc({ contentBlocks: [...(doc.contentBlocks || []), dup] });
    toast({ title: '✓ Paragraf diduplikasi', duration: 1500 });
  };

  const handlePaste = () => {
    const cb = getClipboard();
    if (!cb) return;
    if (cb.type === 'section') {
      const s = { ...cb.data, id: crypto.randomUUID() } as ImageSection;
      s.images = s.images?.map(img => ({ ...img, id: crypto.randomUUID() })) || [];
      updateDoc({ sections: [...doc.sections, s] });
      toast({ title: '📋 Section ditempelkan', duration: 1500 });
    } else if (cb.type === 'textBlock') {
      const b = { ...cb.data, id: crypto.randomUUID() } as TextBlock;
      updateDoc({ contentBlocks: [...(doc.contentBlocks || []), b] });
      toast({ title: '📋 Paragraf ditempelkan', duration: 1500 });
    }
  };

  const handleBulkUpload = async (sectionId: string, files: FileList) => {
    const section = doc.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const newImages: DocumentImage[] = [];
    for (const file of Array.from(files)) {
      const dataUrl = await normalizeImage(file, 800);
      newImages.push({
        id: crypto.randomUUID(),
        dataUrl,
        caption: '',
        order: section.images.length + newImages.length,
      });
    }
    updateSection(sectionId, { images: [...section.images, ...newImages] });
    toast({ title: `✓ ${newImages.length} gambar ditambahkan`, duration: 1500 });
  };

  const handleAttachImage = async (blockId: string, files: FileList) => {
    const block = (doc.contentBlocks || []).find((b) => b.id === blockId);
    if (!block || block.type !== 'text') return;
    const newImages: DocumentImage[] = [];
    for (const file of Array.from(files)) {
      const dataUrl = await normalizeImage(file, 800);
      newImages.push({
        id: crypto.randomUUID(),
        dataUrl,
        caption: '',
        order: (block.attachedImages?.length || 0) + newImages.length,
      });
    }
    updateBlock(blockId, { attachedImages: [...(block.attachedImages || []), ...newImages] } as Partial<TextBlock>);
    toast({ title: `✓ ${newImages.length} gambar ditambahkan ke paragraf`, duration: 1500 });
  };

  const removeAttachedImage = (blockId: string, imageId: string) => {
    const block = (doc.contentBlocks || []).find((b) => b.id === blockId);
    if (!block || block.type !== 'text') return;
    updateBlock(blockId, { attachedImages: (block.attachedImages || []).filter(img => img.id !== imageId) } as Partial<TextBlock>);
    setDeleteTarget(null);
  };

  const updateImage = (sectionId: string, imageId: string, updates: Partial<DocumentImage>) => {
    const section = doc.sections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, {
      images: section.images.map((img) => (img.id === imageId ? { ...img, ...updates } : img)),
    });
  };

  const removeImage = (sectionId: string, imageId: string) => {
    const section = doc.sections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, { images: section.images.filter((img) => img.id !== imageId) });
    setDeleteTarget(null);
  };

  const applyQuickCaption = (sectionId: string) => {
    const section = doc.sections.find((s) => s.id === sectionId);
    if (!section || !quickCaptionPrefix.trim()) return;
    const start = quickCaptionStart || 1;
    const end = Math.min(quickCaptionEnd || section.images.length, section.images.length);
    const updated = section.images.map((img, i) => {
      if (i >= start - 1 && i < end) {
        return { ...img, caption: `${quickCaptionPrefix} ${i + 1}` };
      }
      return img;
    });
    updateSection(sectionId, { images: updated });
    toast({ title: `✓ Caption diterapkan ke ${end - start + 1} gambar`, duration: 1500 });
    setQuickCaptionSection(null);
    setQuickCaptionPrefix('');
  };

  const applyQuickCaptionToAttached = (blockId: string) => {
    const block = (doc.contentBlocks || []).find(b => b.id === blockId);
    if (!block || block.type !== 'text' || !quickCaptionPrefix.trim()) return;
    const imgs = block.attachedImages || [];
    const start = quickCaptionStart || 1;
    const end = Math.min(quickCaptionEnd || imgs.length, imgs.length);
    const updated = imgs.map((img, i) => {
      if (i >= start - 1 && i < end) {
        return { ...img, caption: `${quickCaptionPrefix} ${i + 1}` };
      }
      return img;
    });
    updateBlock(blockId, { attachedImages: updated } as Partial<TextBlock>);
    toast({ title: `✓ Caption diterapkan`, duration: 1500 });
    setQuickCaptionSection(null);
    setQuickCaptionPrefix('');
  };

  // Fields block helpers
  const updateFieldsBlock = (blockId: string, fields: FieldsBlock['fields']) => {
    updateBlock(blockId, { fields } as Partial<FieldsBlock>);
  };

  const addField = (blockId: string) => {
    const block = (doc.contentBlocks || []).find(b => b.id === blockId);
    if (!block || block.type !== 'fields') return;
    updateFieldsBlock(blockId, [...block.fields, { key: '', value: '' }]);
  };

  const removeField = (blockId: string, idx: number) => {
    const block = (doc.contentBlocks || []).find(b => b.id === blockId);
    if (!block || block.type !== 'fields') return;
    updateFieldsBlock(blockId, block.fields.filter((_, i) => i !== idx));
  };

  const updateField = (blockId: string, idx: number, updates: Partial<{ key: string; value: string }>) => {
    const block = (doc.contentBlocks || []).find(b => b.id === blockId);
    if (!block || block.type !== 'fields') return;
    updateFieldsBlock(blockId, block.fields.map((f, i) => i === idx ? { ...f, ...updates } : f));
  };

  const canPaste = clipboard && (clipboard.type === 'section' || clipboard.type === 'textBlock');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {suratResmiMode ? 'Isi Surat' : 'Konten & Gambar'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {suratResmiMode
              ? 'Isi konten surat: informasi surat, kepada, dan isi surat.'
              : 'Upload gambar, tambah paragraf teks, dan atur layout.'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canPaste && (
            <Button variant="outline" onClick={handlePaste} className="gap-2">
              <ClipboardPaste className="h-4 w-4" /> Paste
            </Button>
          )}
          <Button variant="outline" onClick={addTextBlock} className="gap-2">
            <Type className="h-4 w-4" /> Tambah Teks
          </Button>
          <Button variant="outline" onClick={addFieldsBlock} className="gap-2">
            <ListChecks className="h-4 w-4" /> Tambah Data Fields
          </Button>
          {!suratResmiMode && (
            <Button onClick={addSection} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Section Gambar
            </Button>
          )}
        </div>
      </div>

      {/* Content Blocks */}
      {(doc.contentBlocks || []).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Paragraf / Teks / Data</h3>
          <DraggableList
            items={doc.contentBlocks || []}
            onReorder={(items) => updateDoc({ contentBlocks: items })}
            className="space-y-3"
            renderItem={(block, _idx, dragProps) => {
              if (block.type === 'fields') {
                const isNewPage = block.newPageBefore !== false;
                return (
                  <Card className={!isNewPage ? 'border-dashed border-primary/40' : ''}>
                    <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
                      <DragHandle {...dragProps} />
                      <ListChecks className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        value={block.title}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                        className="flex-1 text-base font-semibold"
                        placeholder="Judul Data Fields (kosongkan jika tidak perlu)"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {isNewPage ? 'Halaman baru' : 'Inline (lanjutan)'}
                              </span>
                              <Switch
                                checked={isNewPage}
                                onCheckedChange={(v) => updateBlock(block.id, { newPageBefore: v } as any)}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs max-w-[200px] text-center">
                            {isNewPage ? 'Mulai di halaman baru. Matikan untuk melanjutkan di bawah blok sebelumnya.' : 'Mengalir inline setelah blok sebelumnya. Aktifkan untuk selalu mulai di halaman baru.'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: 'text', id: block.id })}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {block.fields.map((field, fi) => (
                        <div key={fi} className="flex items-center gap-2">
                          <Input
                            value={field.key}
                            onChange={(e) => updateField(block.id, fi, { key: e.target.value })}
                            placeholder="Label (cth: Nama)"
                            className="w-40 text-sm"
                          />
                          <span className="text-muted-foreground font-mono">:</span>
                          <Input
                            value={field.value}
                            onChange={(e) => updateField(block.id, fi, { value: e.target.value })}
                            placeholder="Isi (cth: Rizki Ananda)"
                            className="flex-1 text-sm"
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeField(block.id, fi)}>
                            <X className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => addField(block.id)}>
                        <Plus className="h-3 w-3" /> Tambah Field
                      </Button>

                      {/* Spacing & Font Size Controls */}
                      <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2 flex-1">
                          <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Jarak bawah</Label>
                          <Slider
                            value={[block.spacingAfter || 0]}
                            onValueChange={([v]) => updateBlock(block.id, { spacingAfter: v } as any)}
                            min={0}
                            max={40}
                            step={2}
                            className="flex-1 max-w-[120px]"
                          />
                          <span className="text-[10px] text-muted-foreground w-8">{block.spacingAfter || 0}pt</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Font</Label>
                          <Input
                            type="number"
                            min={8}
                            max={24}
                            value={block.fontSize || ''}
                            onChange={e => updateBlock(block.id, { fontSize: e.target.value ? Number(e.target.value) : undefined } as any)}
                            placeholder="default"
                            className="h-7 w-20 text-[10px]"
                          />
                          <span className="text-[10px] text-muted-foreground">pt</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              // TextBlock
              const textBlock = block as TextBlock;
              const isTextNewPage = textBlock.newPageBefore !== false;
              return (
                <Card className={!isTextNewPage ? 'border-dashed border-primary/40' : ''}>
                  <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
                    <DragHandle {...dragProps} />
                    <Type className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      value={textBlock.title}
                      onChange={(e) => updateBlock(textBlock.id, { title: e.target.value })}
                      className="flex-1 text-base font-semibold"
                      placeholder="Judul Paragraf (kosongkan jika tidak perlu)"
                    />
                    <Select
                      value={String(textBlock.indent || 0)}
                      onValueChange={(v) => updateBlock(textBlock.id, { indent: parseInt(v) } as Partial<TextBlock>)}
                    >
                      <SelectTrigger className="w-36">
                        <IndentIncrease className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INDENT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {isTextNewPage ? 'Halaman baru' : 'Inline'}
                            </span>
                            <Switch
                              checked={isTextNewPage}
                              onCheckedChange={(v) => updateBlock(textBlock.id, { newPageBefore: v } as any)}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[200px] text-center">
                          {isTextNewPage ? 'Mulai di halaman baru. Matikan untuk melanjutkan setelah blok sebelumnya.' : 'Mengalir inline setelah blok sebelumnya. Aktifkan untuk selalu mulai di halaman baru.'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button variant="ghost" size="icon" onClick={() => copy('textBlock', textBlock)} title="Copy ke clipboard">
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicateTextBlock(textBlock)} title="Duplikasi">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: 'text', id: textBlock.id })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <RichTextEditor
                      content={textBlock.htmlContent || textBlock.body}
                      onChange={(html) => updateBlock(textBlock.id, { htmlContent: html, body: html.replace(/<[^>]+>/g, '') } as Partial<TextBlock>)}
                      placeholder="Write your paragraph here..."
                    />

                    {/* Attached Images - uniform width */}
                    {(textBlock.attachedImages || []).length > 0 && (
                      <div className="space-y-2 mt-3">
                        <div className="grid gap-3 grid-cols-2">
                          {(textBlock.attachedImages || []).map((img) => (
                            <div key={img.id} className="group relative rounded-md border overflow-hidden">
                              <div className="w-full aspect-[4/3] overflow-hidden bg-muted">
                                <img src={img.dataUrl} alt={img.caption} className="w-full h-full object-cover" />
                              </div>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute right-1 top-1 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={() => setDeleteTarget({ type: 'attachedImage', id: img.id, parentId: textBlock.id })}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <Input
                                value={img.caption}
                                onChange={(e) => {
                                  const updated = (textBlock.attachedImages || []).map(i => i.id === img.id ? { ...i, caption: e.target.value } : i);
                                  updateBlock(textBlock.id, { attachedImages: updated } as Partial<TextBlock>);
                                }}
                                placeholder="Caption"
                                className="text-[10px] h-7 rounded-none border-0 border-t"
                              />
                            </div>
                          ))}
                        </div>
                        {/* Quick caption for attached images */}
                        {(textBlock.attachedImages || []).length >= 3 && (
                          quickCaptionSection === `attached-${textBlock.id}` ? (
                            <div className="flex items-end gap-2 p-2 rounded-md border bg-muted/30">
                              <div className="flex-1 space-y-1">
                                <Label className="text-[10px]">Prefix caption</Label>
                                <Input value={quickCaptionPrefix} onChange={e => setQuickCaptionPrefix(e.target.value)} placeholder="Rumah" className="h-7 text-xs" />
                              </div>
                              <div className="w-16 space-y-1">
                                <Label className="text-[10px]">Dari</Label>
                                <Input type="number" min={1} value={quickCaptionStart} onChange={e => setQuickCaptionStart(parseInt(e.target.value) || 1)} className="h-7 text-xs" />
                              </div>
                              <div className="w-16 space-y-1">
                                <Label className="text-[10px]">Sampai</Label>
                                <Input type="number" min={1} value={quickCaptionEnd} onChange={e => setQuickCaptionEnd(parseInt(e.target.value) || 1)} className="h-7 text-xs" />
                              </div>
                              <Button size="sm" className="h-7 text-xs" onClick={() => applyQuickCaptionToAttached(textBlock.id)}>Terapkan</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setQuickCaptionSection(null)}>Batal</Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-xs"
                              onClick={() => {
                                setQuickCaptionSection(`attached-${textBlock.id}`);
                                setQuickCaptionStart(1);
                                setQuickCaptionEnd((textBlock.attachedImages || []).length);
                              }}
                            >
                              <Wand2 className="h-3 w-3" /> Caption Cepat
                            </Button>
                          )
                        )}
                      </div>
                    )}

                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/30">
                      <Image className="h-3.5 w-3.5" />
                      <span>Tambah gambar ke paragraf ini (bisa banyak sekaligus)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleAttachImage(textBlock.id, e.target.files)}
                      />
                    </label>

                    {/* Spacing & Font Size Controls */}
                    <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2 flex-1">
                        <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Jarak bawah</Label>
                        <Slider
                          value={[textBlock.spacingAfter || 0]}
                          onValueChange={([v]) => updateBlock(textBlock.id, { spacingAfter: v } as Partial<TextBlock>)}
                          min={0}
                          max={40}
                          step={2}
                          className="flex-1 max-w-[120px]"
                        />
                        <span className="text-[10px] text-muted-foreground w-8">{textBlock.spacingAfter || 0}pt</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Font</Label>
                        <Input
                          type="number"
                          min={8}
                          max={24}
                          value={textBlock.fontSize || ''}
                          onChange={e => updateBlock(textBlock.id, { fontSize: e.target.value ? Number(e.target.value) : undefined } as Partial<TextBlock>)}
                          placeholder="default"
                          className="h-7 w-20 text-[10px]"
                        />
                        <span className="text-[10px] text-muted-foreground">pt</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }}
          />
        </div>
      )}

      {/* Image Sections */}
      {!suratResmiMode && doc.sections.length === 0 && (doc.contentBlocks || []).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Belum ada konten. Tambah section gambar atau paragraf teks.</p>
          </CardContent>
        </Card>
      )}
      {suratResmiMode && (doc.contentBlocks || []).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Belum ada konten surat. Tambah teks atau data fields.</p>
          </CardContent>
        </Card>
      )}

      {!suratResmiMode && (
        <DraggableList
        items={doc.sections}
        onReorder={(items) => updateDoc({ sections: items })}
        className="space-y-4"
        renderItem={(section, _idx, dragProps) => (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex flex-1 items-center gap-2">
                <DragHandle {...dragProps} />
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  className="text-base font-semibold"
                  placeholder="Judul Section"
                />
              </div>
              <div className="ml-4 flex items-center gap-2">
                <Select
                  value={section.gridLayout}
                  onValueChange={(v) => updateSection(section.id, { gridLayout: v as ImageSection['gridLayout'] })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRID_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => copy('section', section)} title="Copy ke clipboard">
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDuplicateSection(section)} title="Duplikasi">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ type: 'section', id: section.id })}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 py-6 transition-colors hover:bg-muted/40">
                <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Klik atau seret gambar ke sini (bisa banyak sekaligus)</span>
                <span className="text-xs text-muted-foreground/60">Gambar otomatis dikompresi saat upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleBulkUpload(section.id, e.target.files)}
                />
              </label>

              {section.images.length > 0 && (
                <div className="space-y-3">
                  {/* Quick Caption */}
                  {section.images.length >= 3 && (
                    quickCaptionSection === section.id ? (
                      <div className="flex items-end gap-2 p-3 rounded-md border bg-muted/30">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Prefix caption</Label>
                          <Input value={quickCaptionPrefix} onChange={e => setQuickCaptionPrefix(e.target.value)} placeholder="contoh: Rumah" className="h-8 text-sm" />
                        </div>
                        <div className="w-20 space-y-1">
                          <Label className="text-xs">Dari gambar</Label>
                          <Input type="number" min={1} max={section.images.length} value={quickCaptionStart} onChange={e => setQuickCaptionStart(parseInt(e.target.value) || 1)} className="h-8 text-sm" />
                        </div>
                        <div className="w-20 space-y-1">
                          <Label className="text-xs">Sampai</Label>
                          <Input type="number" min={1} max={section.images.length} value={quickCaptionEnd} onChange={e => setQuickCaptionEnd(parseInt(e.target.value) || 1)} className="h-8 text-sm" />
                        </div>
                        <Button size="sm" className="h-8" onClick={() => applyQuickCaption(section.id)}>Terapkan</Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setQuickCaptionSection(null)}>Batal</Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setQuickCaptionSection(section.id);
                          setQuickCaptionStart(1);
                          setQuickCaptionEnd(section.images.length);
                        }}
                      >
                        <Wand2 className="h-3.5 w-3.5" /> Caption Cepat ({section.images.length} gambar)
                      </Button>
                    )
                  )}

                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                    {section.images.map((img) => (
                      <div key={img.id} className="group relative space-y-2 rounded-lg border bg-card p-2">
                        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md bg-muted">
                          <img src={img.dataUrl} alt={img.caption} className="w-full h-full object-cover" />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => setDeleteTarget({ type: 'image', id: img.id, parentId: section.id })}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <Input
                          value={img.caption}
                          onChange={(e) => updateImage(section.id, img.id, { caption: e.target.value })}
                          placeholder="Nama Item / Deskripsi"
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={
          deleteTarget?.type === 'section' ? 'Hapus Section?' :
          deleteTarget?.type === 'text' ? 'Hapus Blok?' :
          deleteTarget?.type === 'attachedImage' ? 'Hapus Gambar?' : 'Hapus Gambar?'
        }
        description={
          deleteTarget?.type === 'section' ? 'Semua gambar di section ini akan ikut terhapus.' :
          deleteTarget?.type === 'text' ? 'Blok ini akan dihapus permanen.' :
          'Gambar ini akan dihapus permanen.'
        }
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'section') removeSection(deleteTarget.id);
          else if (deleteTarget.type === 'text') removeBlock(deleteTarget.id);
          else if (deleteTarget.type === 'attachedImage' && deleteTarget.parentId) removeAttachedImage(deleteTarget.parentId, deleteTarget.id);
          else if (deleteTarget.type === 'image' && deleteTarget.parentId) removeImage(deleteTarget.parentId, deleteTarget.id);
        }}
      />
    </div>
  );
}
