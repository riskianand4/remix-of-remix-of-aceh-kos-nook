import { DocumentData } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Eye, Download, Loader2, AlertCircle, FileCode, Ruler, Save } from 'lucide-react';
import { useState, useCallback } from 'react';
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

interface Props {
  doc: DocumentData;
  updateDoc: (updates: Partial<DocumentData>) => void;
  onStepChange?: (step: number) => void;
}

export default function StepPreview({ doc, updateDoc, onStepChange }: Props) {
  const { t } = useTranslation();
  const [generating, setGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  // Progress dialog state
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressTitle, setProgressTitle] = useState('');
  const [progressValue, setProgressValue] = useState(0);

  const margins = doc.margins || { top: 15, bottom: 15, left: 15, right: 15 };
  const canGenerate = doc.title.trim().length > 0 
    || (doc.documentType === 'surat-resmi' && !!(doc as any).suratResmi?.suratPerihal?.trim());

  const updateMargin = (key: keyof typeof margins, value: number) => {
    updateDoc({ margins: { ...margins, [key]: value } });
  };

  const closeProgress = useCallback(() => setProgressOpen(false), []);

  const handleExportHtml = () => {
    setProgressTitle('Mengekspor HTML...');
    setProgressValue(0);
    setProgressOpen(true);
    setTimeout(() => setProgressValue(50), 100);
    exportAsHtml(doc);
    setProgressValue(100);
    toast({ title: `📄 ${t('preview.htmlExported')}` });
  };

  const handleGenerateBackend = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setProgressTitle('Membuat PDF...');
    setProgressValue(0);
    setProgressOpen(true);
    try {
      setProgressValue(10);
      const html = await generatePdfHtml(doc);
      setProgressValue(30);
      // Generate QR data URL if enabled
      let qrDataUrl: string | undefined;
      if (doc.qrEnabled !== false && doc.docCode) {
        const { generateQrDataUrl } = await import('@/lib/qr-utils');
        const origin = window.location.origin;
        const verifyUrl = `${origin}/verify/${encodeURIComponent(doc.docCode)}`;
        qrDataUrl = await generateQrDataUrl(verifyUrl, 100) || undefined;
        setProgressValue(50);
      } else {
        setProgressValue(50);
      }
      const blob = await generatePdf(html, doc.footerEnabled, qrDataUrl);
      setProgressValue(80);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title || (doc as any).suratResmi?.suratPerihal || 'document'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      updateDoc({ status: 'finished' });
      setProgressValue(100);
      toast({ title: t('preview.pdfGenerated') });
    } catch {
      setProgressOpen(false);
      toast({
        title: t('preview.backendUnavailable'),
        description: t('preview.backendUnavailableDesc'),
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    setProgressTitle('Menyimpan template...');
    setProgressValue(0);
    setProgressOpen(true);
    try {
      setProgressValue(30);
      const ok = await saveCustomTemplate(doc, templateName.trim(), templateDesc.trim());
      setProgressValue(100);
      if (ok) {
        setShowSaveTemplate(false);
        setTemplateName('');
        setTemplateDesc('');
        toast({ title: '✅ Template tersimpan!' });
      } else {
        setProgressOpen(false);
        toast({ title: 'Gagal menyimpan template', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Save template error:', err);
      setProgressOpen(false);
      toast({ title: 'Gagal menyimpan template', description: String(err), variant: 'destructive' });
    }
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
                  disabled={generating || !canGenerate}
                  className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {generating ? t('preview.generating') : t('preview.generateBackend')}
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

      {showPreview && (
        <Card className="animate-fade-in">
          <CardContent className="p-0">
            <div className="border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
              {t('preview.docPreview')}
            </div>
            <div className="overflow-auto bg-white p-0" style={{ maxHeight: '80vh' }}>
              <iframe
                srcDoc={previewHtml}
                className="h-[800px] w-full border-0"
                title="PDF Preview"
              />
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Progress Dialog */}
      <ProgressDialog open={progressOpen} title={progressTitle} progress={progressValue} onDone={closeProgress} />
    </div>
  );
}
