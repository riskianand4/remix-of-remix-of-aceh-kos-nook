import { DocumentData, CustomTheme } from '@/types/document';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette } from 'lucide-react';

interface Props {
  doc: DocumentData;
  updateDoc: (updates: Partial<DocumentData>) => void;
}

const FONT_OPTIONS = [
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { value: "'Arial', Helvetica, sans-serif", label: 'Arial' },
  { value: "'Helvetica Neue', Helvetica, sans-serif", label: 'Helvetica' },
  { value: "'Georgia', serif", label: 'Georgia' },
  { value: "'Calibri', 'Segoe UI', sans-serif", label: 'Calibri' },
  { value: "'Segoe UI', Tahoma, sans-serif", label: 'Segoe UI' },
];

const SPACING_OPTIONS = [
  { value: '1', label: '1.0' },
  { value: '1.15', label: '1.15' },
  { value: '1.5', label: '1.5' },
  { value: '2', label: '2.0' },
];

export default function CustomThemeEditor({ doc, updateDoc }: Props) {
  const theme = doc.customTheme || {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: 11,
    fontColor: '#000000',
    dividerColor: '#000000',
    tableHeaderBg: '#e5e7eb',
    tableHeaderColor: '#000000',
    altRowColor: '#f9f9f9',
  };

  const updateTheme = (updates: Partial<CustomTheme>) => {
    updateDoc({ customTheme: { ...theme, ...updates } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          Kustomisasi Tema PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Font Family */}
        <div className="space-y-2">
          <Label>Font</Label>
          <Select value={theme.fontFamily} onValueChange={(v) => updateTheme({ fontFamily: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Ukuran Font Body</Label>
            <span className="text-xs font-mono text-muted-foreground">{theme.fontSize}pt</span>
          </div>
          <Slider
            value={[theme.fontSize]}
            min={9}
            max={14}
            step={0.5}
            onValueChange={([v]) => updateTheme({ fontSize: v })}
          />
        </div>

        {/* Content Line Spacing */}
        <div className="space-y-2">
          <Label>Jarak Spasi Konten</Label>
          <Select
            value={String(doc.contentLineSpacing || 1.5)}
            onValueChange={(v) => updateDoc({ contentLineSpacing: parseFloat(v) })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SPACING_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Warna Font</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.fontColor}
                onChange={(e) => updateTheme({ fontColor: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
              <span className="text-xs font-mono text-muted-foreground">{theme.fontColor}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Warna Divider/Border</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.dividerColor}
                onChange={(e) => updateTheme({ dividerColor: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
              <span className="text-xs font-mono text-muted-foreground">{theme.dividerColor}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Header Tabel (BG)</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.tableHeaderBg}
                onChange={(e) => updateTheme({ tableHeaderBg: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
              <span className="text-xs font-mono text-muted-foreground">{theme.tableHeaderBg}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Header Tabel (Teks)</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.tableHeaderColor}
                onChange={(e) => updateTheme({ tableHeaderColor: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
              <span className="text-xs font-mono text-muted-foreground">{theme.tableHeaderColor}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Warna Baris Genap</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.altRowColor}
                onChange={(e) => updateTheme({ altRowColor: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
              <span className="text-xs font-mono text-muted-foreground">{theme.altRowColor}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
