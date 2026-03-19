import { DocumentData, SuratResmiData, ContentBlock, TextBlock, FieldsBlock } from '@/types/document';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Plus, Trash2, AlignLeft, AlignCenter, AlignRight,
  ChevronDown, ChevronUp, Type, Table2, Copy, Minus, Hash
} from 'lucide-react';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { useCallback, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { generateNextNumber } from '@/lib/auto-number';

interface Props {
  doc: DocumentData;
  updateDoc: (updates: Partial<DocumentData>) => void;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, '').trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

export default function StepSuratResmi({ doc, updateDoc }: Props) {
  const surat = { ...{
    suratNomor: '', suratLampiran: '-', suratPerihal: '',
    suratTujuan: { nama: '', jabatan: '', alamat: 'Tempat' },
    suratTempat: '', suratTembusan: [], signaturePosition: 'right' as const,
    suratFormat: 'dengan-tujuan' as const, suratJudul: '',
  }, ...(doc.suratResmi || {}) };

  const blocks = doc.contentBlocks || [];

  const totalWordCount = useMemo(() => {
    return blocks.reduce((sum, b) => {
      if (b.type === 'text') return sum + countWords(b.htmlContent || b.body);
      return sum;
    }, 0);
  }, [blocks]);

  const updateSurat = (updates: Partial<SuratResmiData>) => {
    updateDoc({ suratResmi: { ...surat, ...updates } });
  };

  const updateBlocks = useCallback((newBlocks: ContentBlock[]) => {
    updateDoc({ contentBlocks: newBlocks });
  }, [updateDoc]);

  const addTextBlock = () => {
    const newBlock: TextBlock = {
      type: 'text',
      id: crypto.randomUUID(),
      title: '',
      body: '',
      htmlContent: '',
      indent: 0,
      newPageBefore: false,
      spacingAfter: 0,
    };
    updateBlocks([...blocks, newBlock]);
  };

  const addFieldsBlock = () => {
    const newBlock: FieldsBlock = {
      type: 'fields',
      id: crypto.randomUUID(),
      title: '',
      fields: [{ key: '', value: '' }],
      newPageBefore: false,
      spacingAfter: 0,
    };
    updateBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    updateBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } as ContentBlock : b));
  };

  const removeBlock = (id: string) => {
    updateBlocks(blocks.filter(b => b.id !== id));
  };

  const duplicateBlock = (block: ContentBlock) => {
    const dup = { ...block, id: crypto.randomUUID() } as ContentBlock;
    if (dup.type === 'fields') {
      dup.fields = [...dup.fields.map(f => ({ ...f }))];
    }
    updateBlocks([...blocks, dup]);
    toast({ title: '✓ Blok diduplikasi', duration: 1500 });
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const arr = [...blocks];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    updateBlocks(arr);
  };

  const addField = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block?.type !== 'fields') return;
    updateBlock(blockId, { fields: [...block.fields, { key: '', value: '' }] } as any);
  };

  const updateField = (blockId: string, fieldIdx: number, key: string, value: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block?.type !== 'fields') return;
    const fields = [...block.fields];
    fields[fieldIdx] = { key, value };
    updateBlock(blockId, { fields } as any);
  };

  const removeField = (blockId: string, fieldIdx: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (block?.type !== 'fields') return;
    updateBlock(blockId, { fields: block.fields.filter((_, i) => i !== fieldIdx) } as any);
  };

  const formatTanggal = () => {
    const d = new Date(doc.date);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const addTembusan = () => {
    updateSurat({ suratTembusan: [...surat.suratTembusan, ''] });
  };

  const updateTembusan = (index: number, value: string) => {
    const arr = [...surat.suratTembusan];
    arr[index] = value;
    updateSurat({ suratTembusan: arr });
  };

  const removeTembusan = (index: number) => {
    updateSurat({ suratTembusan: surat.suratTembusan.filter((_, i) => i !== index) });
  };

  const INDENT_OPTIONS = [
    { value: '0', label: 'Tanpa Indent' },
    { value: '10', label: '10mm' },
    { value: '20', label: '20mm' },
    { value: '30', label: '30mm' },
    { value: '40', label: '40mm' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">Isi Surat Resmi</h2>
          <p className="text-sm text-muted-foreground">Lengkapi informasi surat, tambahkan paragraf & data secara dinamis.</p>
        </div>
        {totalWordCount > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {totalWordCount} kata
          </span>
        )}
      </div>

      {/* Format Surat */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold text-foreground">Format Surat</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={surat.suratFormat !== 'judul-tengah' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => updateSurat({ suratFormat: 'dengan-tujuan' })}
            >
              Dengan Tujuan (Yth.)
            </Button>
            <Button
              variant={surat.suratFormat === 'judul-tengah' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => updateSurat({ suratFormat: 'judul-tengah' })}
            >
              Judul Tengah
            </Button>
          </div>
          {surat.suratFormat === 'judul-tengah' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Judul Surat</Label>
              <Input value={surat.suratJudul} onChange={e => updateSurat({ suratJudul: e.target.value })} placeholder="SURAT REKOMENDASI" className="text-sm font-bold text-center uppercase" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informasi Surat — Compact */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold text-foreground">Informasi Surat</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tempat / Kota</Label>
              <Input value={surat.suratTempat} onChange={e => updateSurat({ suratTempat: e.target.value })} placeholder="Banda Aceh" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tanggal Surat</Label>
              <Input type="date" value={doc.date} onChange={e => updateDoc({ date: e.target.value })} className="text-sm" />
              <p className="text-[10px] text-muted-foreground">
                {surat.suratTempat ? `${surat.suratTempat}, ` : ''}{formatTanggal()}
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
              <Label className="text-xs">Nomor Surat</Label>
              <div className="flex gap-2">
                <Input value={surat.suratNomor} onChange={e => updateSurat({ suratNomor: e.target.value })} placeholder="001/DIR/III/2026" className="text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 shrink-0 text-xs h-10"
                  onClick={() => {
                    const num = generateNextNumber();
                    updateSurat({ suratNomor: num });
                    toast({ title: `✓ Nomor: ${num}`, duration: 1500 });
                  }}
                >
                  <Hash className="h-3.5 w-3.5" /> Auto
                </Button>
              </div>
            </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Lampiran</Label>
              <Input value={surat.suratLampiran} onChange={e => updateSurat({ suratLampiran: e.target.value })} placeholder="-" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Perihal</Label>
              <Input value={surat.suratPerihal} onChange={e => updateSurat({ suratPerihal: e.target.value })} placeholder="Permohonan Kerjasama" className="text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Penerima — only show for dengan-tujuan format */}
      {surat.suratFormat !== 'judul-tengah' && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold text-foreground">Penerima Surat</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Kepada Yth.</Label>
              <Input value={surat.suratTujuan.nama} onChange={e => updateSurat({ suratTujuan: { ...surat.suratTujuan, nama: e.target.value } })} placeholder="Bapak/Ibu [Nama]" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Jabatan</Label>
              <Input value={surat.suratTujuan.jabatan} onChange={e => updateSurat({ suratTujuan: { ...surat.suratTujuan, jabatan: e.target.value } })} placeholder="Direktur PT. [Nama]" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Di</Label>
              <Input value={surat.suratTujuan.alamat} onChange={e => updateSurat({ suratTujuan: { ...surat.suratTujuan, alamat: e.target.value } })} placeholder="Tempat" className="text-sm" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Content Blocks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Isi Surat</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={addTextBlock}>
              <Type className="h-3.5 w-3.5" /> Tambah Paragraf
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={addFieldsBlock}>
              <Table2 className="h-3.5 w-3.5" /> Tambah Data Fields
            </Button>
          </div>
        </div>

        {blocks.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Type className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Belum ada konten. Klik "Tambah Paragraf" untuk mulai menulis.</p>
            </CardContent>
          </Card>
        )}

        {blocks.map((block, idx) => (
          <div key={block.id}>
            {/* Page break indicator */}
            {block.newPageBefore && idx > 0 && (
              <div className="flex items-center gap-2 py-2">
                <div className="flex-1 border-t-2 border-dashed border-primary/30" />
                <span className="text-[10px] text-primary/60 font-medium uppercase tracking-wider">Halaman Baru</span>
                <div className="flex-1 border-t-2 border-dashed border-primary/30" />
              </div>
            )}

            <Card className="relative group/block">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5">
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveBlock(idx, -1)} disabled={idx === 0}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveBlock(idx, 1)} disabled={idx === blocks.length - 1}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                    {block.type === 'text' ? 'PARAGRAF' : 'DATA FIELDS'}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">#{idx + 1}</span>
                  {block.type === 'text' && (
                    <span className="text-[10px] text-muted-foreground/60 shrink-0">
                      {countWords(block.htmlContent || block.body)} kata
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {block.type === 'text' && (
                    <Select value={String(block.indent || 0)} onValueChange={v => updateBlock(block.id, { indent: Number(v) })}>
                      <SelectTrigger className="h-7 w-28 text-[10px]">
                        <SelectValue placeholder="Indent" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDENT_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="flex items-center gap-1">
                    <Label className="text-[10px] text-muted-foreground">Hal baru</Label>
                    <Switch
                      checked={block.newPageBefore || false}
                      onCheckedChange={v => updateBlock(block.id, { newPageBefore: v })}
                      className="scale-75"
                    />
                  </div>

                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/block:opacity-100 transition-opacity" onClick={() => duplicateBlock(block)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>

                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover/block:opacity-100 transition-opacity" onClick={() => removeBlock(block.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                {block.type === 'text' ? (
                  <RichTextEditor
                    content={block.htmlContent || block.body}
                    onChange={html => updateBlock(block.id, {
                      htmlContent: html,
                      body: html.replace(/<[^>]*>/g, ''),
                    } as any)}
                    placeholder="Tulis isi paragraf di sini..."
                  />
                ) : (
                  <div className="space-y-2">
                    {block.fields.map((field, fi) => (
                      <div key={fi} className="flex items-center gap-2">
                        <Input
                          value={field.key}
                          onChange={e => updateField(block.id, fi, e.target.value, field.value)}
                          placeholder="Label (misal: Nama)"
                          className="text-sm flex-[2]"
                        />
                        <span className="text-muted-foreground text-sm shrink-0">:</span>
                        <Input
                          value={field.value}
                          onChange={e => updateField(block.id, fi, field.key, e.target.value)}
                          placeholder="Nilai"
                          className="text-sm flex-[3]"
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => removeField(block.id, fi)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => addField(block.id)}>
                      <Plus className="h-3 w-3" /> Tambah Baris
                    </Button>
                  </div>
                )}

                {/* Spacing & Font Size Controls */}
                <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Jarak bawah</Label>
                    <Slider
                      value={[block.spacingAfter || 0]}
                      onValueChange={([v]) => updateBlock(block.id, { spacingAfter: v })}
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
                      onChange={e => updateBlock(block.id, { fontSize: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="default"
                      className="h-7 w-20 text-[10px]"
                    />
                    <span className="text-[10px] text-muted-foreground">pt</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {blocks.length > 0 && (
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addTextBlock}>
              <Plus className="h-3 w-3" /> Paragraf
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addFieldsBlock}>
              <Plus className="h-3 w-3" /> Data Fields
            </Button>
          </div>
        )}
      </div>

      {/* Posisi Tanda Tangan */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold text-foreground">Posisi Tanda Tangan</h3>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {([
              { value: 'left', icon: AlignLeft, label: 'Kiri' },
              { value: 'center', icon: AlignCenter, label: 'Tengah' },
              { value: 'right', icon: AlignRight, label: 'Kanan' },
            ] as const).map(opt => (
              <Button
                key={opt.value}
                variant={surat.signaturePosition === opt.value ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 flex-1"
                onClick={() => updateSurat({ signaturePosition: opt.value })}
              >
                <opt.icon className="h-3.5 w-3.5" />
                {opt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tembusan */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Tembusan</h3>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={addTembusan}>
            <Plus className="h-3 w-3" /> Tambah
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {surat.suratTembusan.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Belum ada tembusan. Klik "Tambah" untuk menambahkan.</p>
          )}
          {surat.suratTembusan.map((t, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
              <Input
                value={t}
                onChange={e => updateTembusan(i, e.target.value)}
                placeholder="Arsip / Nama pejabat"
                className="text-sm flex-1"
              />
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => removeTembusan(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
