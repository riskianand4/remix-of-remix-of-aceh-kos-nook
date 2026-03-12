import { DocumentData } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Download, Loader2, AlertCircle, FileCode, Ruler, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { generatePdfHtml } from '@/lib/pdf-builder';
import { exportAsHtml } from '@/lib/client-pdf';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CustomThemeEditor from '@/components/editor/CustomThemeEditor';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { generatePdf } from '@/lib/api';
import { saveCustomTemplate } from '@/lib/storage';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import ProgressDialog from '@/components/ProgressDialog';
import { useProgress } from '@/hooks/useProgress';

interface Props {
  doc: DocumentData;
  updateDoc: (updates: Partial<DocumentData>) => void;
  onStepChange?: (step: number) => void;
}

export default function StepPreview({ doc, updateDoc, onStepChange }: Props) {
  const { t } = useTranslation();
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const progress = useProgress();

  const margins = doc.margins || { top: 20, bottom: 25, left: 15, right: 15 };
  const canGenerate = doc.title.trim().length > 0 
    || (doc.documentType === 'surat-resmi' && !!(doc as any).suratResmi?.suratPerihal?.trim());

  const updateMargin = (key: keyof typeof margins, value: number) => {
    updateDoc({ margins: { ...margins, [key]: value } });
  };

  const handleExportHtml = () => {
    progress.run('Mengekspor HTML...', async (update) => {
      update(30);
      exportAsHtml(doc);
      update(100);
    });
  };

  const handleGenerateBackend = async () => {
    if (!canGenerate) return;
    await progress.run('Mengunduh PDF...', async (update) => {
      update(10);
      const html = await generatePdfHtml(doc);
      update(40);
      const blob = await generatePdf(html, doc.footerEnabled);
      update(80);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title || (doc as any).suratResmi?.suratPerihal || 'document'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      updateDoc({ status: 'finished' });
      update(100);
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    setShowSaveTemplate(false);
    await progress.run('Menyimpan template...', async (update) => {
      update(30);
      const ok = await saveCustomTemplate(doc, templateName.trim(), templateDesc.trim());
      update(90);
      if (!ok) throw new Error('Gagal menyimpan template');
      setTemplateName('');
      setTemplateDesc('');
    });
  };

  return (
    <div className="space-y-6" data-tour="step-preview">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('preview.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('preview.description')}</p>
      </div>

      <CustomThemeEditor doc={doc} updateDoc={updateDoc} />

      {/* Margin Controls */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Ruler className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">{t('preview.pageMargins')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
              <div key={side} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs capitalize">{t(`preview.margin_${side}`)}</Label>
                  <span className="text-xs font-mono text-muted-foreground">{margins[side]}mm</span>
                </div>
                <Slider
                  value={[margins[side]]}
                  onValueChange={([v]) => updateMargin(side, v)}
                  min={5}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <motion.div
        className="flex flex-wrap gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button variant="outline" onClick={handleExportHtml} disabled={!canGenerate} className="gap-2">
          <FileCode className="h-4 w-4" /> {t('preview.exportHtml')}
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="default"
                  onClick={handleGenerateBackend}
                  disabled={!canGenerate}
                  className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                >
                  <Download className="h-4 w-4" />
                  {t('preview.generateBackend')}
                </Button>
              </span>
            </TooltipTrigger>
            {!canGenerate && (
              <TooltipContent className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> {t('preview.titleRequired')}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <Button variant="secondary" onClick={() => setShowSaveTemplate(true)} className="gap-2">
          <Save className="h-4 w-4" /> Simpan sebagai Template
        </Button>
      </motion.div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: `<strong>💡 Tip:</strong> ${t('preview.tip')}` }} />
        </CardContent>
      </Card>

      {/* Save as Template Dialog */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Simpan sebagai Template</DialogTitle>
            <DialogDescription>Template akan menyimpan seluruh konfigurasi dokumen ini untuk digunakan kembali.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nama Template</Label>
              <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="cth: Laporan Proyek Kantor" />
            </div>
            <div>
              <Label className="text-xs">Deskripsi (opsional)</Label>
              <Input value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} placeholder="cth: Template laporan dengan cover dan KOP" />
            </div>
            <Button onClick={handleSaveTemplate} disabled={!templateName.trim()} className="w-full">
              Simpan Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProgressDialog state={progress.state} />
    </div>
  );
}
