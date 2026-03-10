import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { getDocument, saveDocument, saveCustomTemplate } from '@/lib/storage';
import { DocumentData, DEFAULT_COVER_LAYOUT, DEFAULT_SURAT_RESMI, generateDocCode } from '@/types/document';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Undo2, Redo2, HelpCircle, Keyboard, Save, PanelRightOpen, PanelRightClose, Share2, Image, FileText, Type, Table2, PenTool, Eye, Mail } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import EditorSidebar from '@/components/editor/EditorSidebar';
import StepCover from '@/components/editor/StepCover';
import StepLetterhead from '@/components/editor/StepLetterhead';
import StepContent from '@/components/editor/StepContent';
import StepTables from '@/components/editor/StepTables';
import StepSignatures from '@/components/editor/StepSignatures';
import StepPreview from '@/components/editor/StepPreview';
import StepSuratResmi from '@/components/editor/StepSuratResmi';
import SaveIndicator from '@/components/editor/SaveIndicator';
import ConfirmDialog from '@/components/editor/ConfirmDialog';
import VersionHistory from '@/components/editor/VersionHistory';
import OnboardingTour from '@/components/OnboardingTour';
import KeyboardShortcutsDialog from '@/components/KeyboardShortcutsDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { CommandPalette } from '@/components/CommandPalette';
import { useHistory } from '@/hooks/useHistory';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOnboarding } from '@/hooks/useOnboarding';
import { saveVersion } from '@/lib/versioning';

import BackendStatus from '@/components/BackendStatus';
import LivePreview from '@/components/editor/LivePreview';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ShareDialog from '@/components/editor/ShareDialog';

// All steps for general documents
const ALL_STEPS = [
  { id: 'cover',      label: 'Cover & Dokumen',    step: 1, icon: Image },
  { id: 'letterhead', label: 'KOP & Footer',        step: 2, icon: FileText },
  { id: 'content',    label: 'Konten & Gambar',     step: 3, icon: Type },
  { id: 'tables',     label: 'Tabel & Lampiran',    step: 4, icon: Table2 },
  { id: 'signatures', label: 'Tanda Tangan',        step: 5, icon: PenTool },
  { id: 'preview',    label: 'Preview & Generate',  step: 6, icon: Eye },
];

// Steps for Surat Resmi
const SURAT_RESMI_STEPS = [
  { id: 'letterhead', label: 'KOP & Footer',        step: 1, icon: FileText },
  { id: 'surat',      label: 'Isi Surat',           step: 2, icon: Mail },
  { id: 'signatures', label: 'Tanda Tangan',        step: 3, icon: PenTool },
  { id: 'preview',    label: 'Preview & Generate',  step: 4, icon: Eye },
];

function isSuratResmi(doc: DocumentData): boolean {
  if (doc.documentType === 'surat-resmi') return true;
  if (!doc.documentType) {
    const titleLower = doc.title?.toLowerCase() || '';
    return titleLower.includes('surat resmi') || titleLower.includes('surat');
  }
  return false;
}

export default function DocumentEditor() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [undoRedoKey, setUndoRedoKey] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [splitView, setSplitView] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Inline title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const onboarding = useOnboarding();
  const history = useHistory<DocumentData>();
  const versionInterval = useRef<NodeJS.Timeout>();

  const STEPS = useMemo(() => doc && isSuratResmi(doc) ? SURAT_RESMI_STEPS : ALL_STEPS, [doc]);

  const saveFunc = useCallback(async () => {
    if (doc) {
      try {
        await saveDocument(doc);
      } catch (err) {
        console.error('Save failed:', err);
      }
    }
  }, [doc]);
  const { status: saveStatus, markDirty, isDirty } = useAutoSave(saveFunc, 800);

  useEffect(() => {
    if (!doc) return;
    versionInterval.current = setInterval(() => {
      if (doc) saveVersion(doc);
    }, 5 * 60 * 1000);
    return () => clearInterval(versionInterval.current);
  }, [doc?.id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const found = await getDocument(id);
        if (cancelled) return;
        if (!found) {
          toast({ title: t('editor.exitEditor'), variant: 'destructive' });
          navigate('/');
          return;
        }
        if (!found.contentBlocks) found.contentBlocks = [];
        if (!found.docNumber) found.docNumber = '';
        if (found.revision === undefined) found.revision = 1;
        if (found.watermarkEnabled === undefined) found.watermarkEnabled = false;
        if (!found.watermarkText) found.watermarkText = 'DRAFT';
        if (found.watermarkOpacity === undefined) found.watermarkOpacity = 0.1;
        if (!found.pageOrientation) found.pageOrientation = 'portrait';
        if (!found.paperSize) found.paperSize = 'A4';
        if (!found.margins) found.margins = { top: 20, bottom: 25, left: 15, right: 15 };
        if (!found.kopLogoPosition) found.kopLogoPosition = 'left';
        if (!found.footerText) found.footerText = '';
        if (!found.coverLogoSize) found.coverLogoSize = 80;
        if (!found.customTheme) found.customTheme = { fontFamily: "'Times New Roman', Times, serif", fontSize: 11, fontColor: '#000000', dividerColor: '#000000', tableHeaderBg: '#e5e7eb', tableHeaderColor: '#000000', altRowColor: '#f9f9f9' };
        if (!found.coverLineSpacing) found.coverLineSpacing = 1.5;
        if (!found.contentLineSpacing) found.contentLineSpacing = 1.5;
        if (!found.kopPosition) found.kopPosition = 'top';
        if (found.kopDividerEnabled === undefined) found.kopDividerEnabled = false;
        if (!found.kopSpacing) found.kopSpacing = 8;
        if (!found.coverLayout) found.coverLayout = { ...DEFAULT_COVER_LAYOUT };
        if (!found.coverLayout.textElements) found.coverLayout.textElements = [];
        if (!found.coverLayout.imageElements) found.coverLayout.imageElements = [];
        if (!found.coverLayout.logoWidth) found.coverLayout.logoWidth = 30;
        if (found.includeToc === undefined) found.includeToc = true;
        if (found.includeImageList === undefined) found.includeImageList = true;
        if (found.includeTableList === undefined) found.includeTableList = true;
        if (!found.sections) found.sections = [];
        if (!found.tables) found.tables = [];
        if (!found.signees) found.signees = [];
        if (!found.documentType) found.documentType = 'dokumentasi';
        if (!found.docCode) found.docCode = generateDocCode();
        if (!found.suratResmi) found.suratResmi = { ...DEFAULT_SURAT_RESMI };
        setDoc(found as DocumentData);
        saveVersion(found as DocumentData);
      } catch (err) {
        if (!cancelled) {
          toast({ title: 'Gagal memuat dokumen', variant: 'destructive' });
          navigate('/');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, navigate, t]);

  const updateDoc = useCallback(
    (updates: Partial<DocumentData>) => {
      if (!doc) return;
      history.pushState(doc);
      const updated = { ...doc, ...updates, updatedAt: new Date().toISOString() };
      setDoc(updated);
      markDirty();
    },
    [doc, history, markDirty]
  );

  const handleVersionRestore = useCallback((snapshot: DocumentData) => {
    setDoc(snapshot);
    saveDocument(snapshot).catch(console.error);
    setUndoRedoKey(k => k + 1);
    toast({ title: `✓ ${t('versioning.restored')}`, duration: 1500 });
  }, [t]);

  const handleUndo = useCallback(() => {
    if (!doc) return;
    const prev = history.undo(doc);
    if (prev) {
      setDoc(prev);
      saveDocument(prev).catch(console.error);
      setUndoRedoKey(k => k + 1);
      toast({ title: `↩ ${t('editor.undoSuccess')}`, duration: 1500 });
    }
  }, [doc, history, t]);

  const handleRedo = useCallback(() => {
    if (!doc) return;
    const next = history.redo(doc);
    if (next) {
      setDoc(next);
      saveDocument(next).catch(console.error);
      setUndoRedoKey(k => k + 1);
      toast({ title: `↪ ${t('editor.redoSuccess')}`, duration: 1500 });
    }
  }, [doc, history, t]);

  const handleSave = useCallback(async () => {
    if (doc) {
      try {
        await saveDocument(doc);
        toast({ title: `✓ ${t('editor.saved')}`, duration: 1500 });
      } catch {
        toast({ title: 'Gagal menyimpan', variant: 'destructive' });
      }
    }
  }, [doc, t]);

  const handleStepChange = useCallback((step: number) => {
    if (!doc) return;
    const steps = isSuratResmi(doc) ? SURAT_RESMI_STEPS : ALL_STEPS;
    if (step < 0 || step >= steps.length) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentStep(step);
      setTransitioning(false);
    }, 150);
  }, [doc]);

  const handlePreviewShortcut = useCallback(() => {
    if (!doc) return;
    const steps = isSuratResmi(doc) ? SURAT_RESMI_STEPS : ALL_STEPS;
    handleStepChange(steps.length - 1);
  }, [handleStepChange, doc]);

  useKeyboardShortcuts({
    onSave: handleSave,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onPreview: handlePreviewShortcut,
    onShortcutsDialog: () => setShowShortcuts(true),
  });

  const handleBack = () => {
    if (isDirty()) {
      setShowBackConfirm(true);
    } else {
      navigate('/');
    }
  };

  // Inline title editing handlers
  const startTitleEdit = () => {
    if (!doc) return;
    setTitleDraft(doc.title || '');
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  const saveTitleEdit = () => {
    if (!doc) return;
    const newTitle = titleDraft.trim();
    if (newTitle !== doc.title) {
      updateDoc({ title: newTitle });
    }
    setEditingTitle(false);
  };

  const cancelTitleEdit = () => {
    setEditingTitle(false);
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

  if (!doc) return null;

  const isSurat = isSuratResmi(doc);

  const renderStep = () => {
    const stepId = STEPS[currentStep]?.id;
    switch (stepId) {
      case 'cover':      return <StepCover doc={doc} updateDoc={updateDoc} />;
      case 'letterhead': return <StepLetterhead doc={doc} updateDoc={updateDoc} />;
      case 'content':    return <StepContent doc={doc} updateDoc={updateDoc} suratResmiMode={isSurat} />;
      case 'surat':      return <StepSuratResmi doc={doc} updateDoc={updateDoc} />;
      case 'tables':     return <StepTables doc={doc} updateDoc={updateDoc} />;
      case 'signatures': return <StepSignatures doc={doc} updateDoc={updateDoc} />;
      case 'preview':    return <StepPreview doc={doc} updateDoc={updateDoc} onStepChange={handleStepChange} />;
      default: return null;
    }
  };

  const renderStepWithTour = () => {
    const stepContent = renderStep();
    const stepId = STEPS[currentStep]?.id;
    const tourMap: Record<string, string> = { cover: 'step-cover', content: 'step-content' };
    const tourAttr = tourMap[stepId];
    if (tourAttr) return <div data-tour={tourAttr}>{stepContent}</div>;
    return stepContent;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header toolbar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5 text-xs h-8">
            <ChevronLeft className="h-4 w-4" /> Kembali
          </Button>
          <div className="h-4 w-px bg-border" />
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitleEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitleEdit();
                if (e.key === 'Escape') cancelTitleEdit();
              }}
              className="text-xs bg-transparent border-b border-primary outline-none px-1 py-0.5 max-w-[200px] text-foreground"
              placeholder="Nama dokumen..."
            />
          ) : (
            <span
              className="text-xs text-muted-foreground truncate max-w-[200px] cursor-pointer hover:text-foreground transition-colors"
              onDoubleClick={startTitleEdit}
              title="Double-click untuk rename"
            >
              {doc.title || 'Untitled'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} disabled={!history.canUndo()}>
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} disabled={!history.canRedo()}>
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <VersionHistory doc={doc} onRestore={handleVersionRestore} />
          <SaveIndicator status={saveStatus} />
          <div className="h-4 w-px bg-border" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => {
                  setTemplateName(doc.title || '');
                  setTemplateDesc('');
                  setShowSaveTemplate(true);
                }}>
                  <Save className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Template</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Simpan sebagai template</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowShare(true)}>
                  <Share2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Share</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bagikan untuk review</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={splitView ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setSplitView(!splitView)}>
                  {splitView ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{splitView ? 'Tutup Preview' : 'Live Preview'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span data-tour="language-switcher"><LanguageSwitcher /></span>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowShortcuts(true)} title="Keyboard Shortcuts">
            <Keyboard className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 49px)' }}>
        {/* Vertical step icon strip */}
        <div className="flex flex-col items-center gap-1 border-r bg-muted/30 py-3 px-1.5 shrink-0 h-full overflow-y-auto">
          <TooltipProvider delayDuration={200}>
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              return (
                <Tooltip key={step.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleStepChange(idx)}
                      className={cn(
                        'relative flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-300 ease-out',
                        isActive
                          ? 'text-primary-foreground shadow-md scale-110'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-step-bg"
                          className="absolute inset-0 rounded-lg bg-primary"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                      <StepIcon className="h-4 w-4 relative z-10" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    <span className="font-medium">{step.step}.</span> {step.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        {/* Editor + Preview */}
        {splitView ? (
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel defaultSize={55} minSize={30}>
              <div className="h-full overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {renderStepWithTour()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={45} minSize={25}>
              <LivePreview doc={doc} />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {renderStepWithTour()}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 z-30 flex items-center justify-between border-t bg-background/95 backdrop-blur px-4 py-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8"
          onClick={() => handleStepChange(currentStep - 1)}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
        </Button>
        <div className="flex items-center gap-1">
          {STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleStepChange(idx)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                idx === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-border hover:bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
        <Button
          variant={currentStep === STEPS.length - 1 ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5 text-xs h-8"
          onClick={() => handleStepChange(currentStep + 1)}
          disabled={currentStep === STEPS.length - 1}
        >
          Selanjutnya <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={showBackConfirm}
        onOpenChange={setShowBackConfirm}
        title={t('editor.exitEditor')}
        description={t('editor.exitConfirm')}
        onConfirm={() => navigate('/')}
      />

      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
      <CommandPalette />

      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Simpan sebagai Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nama</Label>
              <Input value={templateName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateName(e.target.value)} placeholder="cth: Laporan Proyek" />
            </div>
            <div>
              <Label className="text-xs">Deskripsi (opsional)</Label>
              <Input value={templateDesc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateDesc(e.target.value)} placeholder="cth: Template standar" />
            </div>
            <Button className="w-full" disabled={!templateName.trim()} onClick={async () => {
              await saveCustomTemplate(doc, templateName.trim(), templateDesc.trim());
              setShowSaveTemplate(false);
              toast({ title: 'Template tersimpan!' });
            }}>
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ShareDialog open={showShare} onOpenChange={setShowShare} doc={doc} />

      <OnboardingTour
        active={onboarding.showTour}
        onComplete={onboarding.completeOnboarding}
        onSkip={onboarding.completeOnboarding}
      />
    </div>
  );
}
