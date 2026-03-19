import { ArrowLeft, Check, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DocumentData } from '@/types/document';

interface Step {
  id: string;
  label: string;
  step: number;
}

interface EditorSidebarProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  docTitle: string;
  onBack: () => void;
  doc?: DocumentData;
  /** 'surat' shows a special badge in the sidebar header */
  mode?: 'default' | 'surat';
}

function getStepValidation(doc: DocumentData | undefined, stepIdx: number): 'complete' | 'incomplete' | 'empty' {
  if (!doc) return 'empty';
  switch (stepIdx) {
    case 0: return doc.title.trim() ? 'complete' : 'incomplete';
    case 1: return (doc.kopText || doc.kopLogoDataUrl) ? 'complete' : 'empty';
    case 2: return doc.sections.length > 0 || (doc.contentBlocks || []).length > 0 ? 'complete' : 'empty';
    case 3: return doc.tables.length > 0 ? 'complete' : 'empty';
    case 4: return doc.signees.length > 0 ? 'complete' : 'empty';
    case 5: return 'empty';
    default: return 'empty';
  }
}

export default function EditorSidebar({
  steps, currentStep, onStepChange, docTitle, onBack, doc, mode = 'default',
}: EditorSidebarProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground shrink-0">
      {/* Header */}
      <div className="border-b border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </div>

      {/* Steps */}
      <nav className="flex-1 overflow-y-auto p-3" data-tour="sidebar-nav">
        <ul className="space-y-0.5">
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            const validation = getStepValidation(doc, idx);

            return (
              <li key={step.id} className="opacity-0 animate-fade-in" style={{ animationDelay: `${0.1 + idx * 0.05}s` }}>
                <button
                  onClick={() => onStepChange(idx)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : isCompleted
                      ? 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground'
                        : validation === 'complete'
                        ? 'bg-success/20 text-success'
                        : validation === 'incomplete'
                        ? 'bg-warning/20 text-warning'
                        : isCompleted
                        ? 'bg-success/20 text-success'
                        : 'bg-sidebar-accent text-sidebar-foreground/40'
                    )}
                  >
                    {validation === 'complete' && !isActive ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : validation === 'incomplete' && !isActive ? (
                      <AlertCircle className="h-3.5 w-3.5" />
                    ) : isCompleted && !isActive ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      step.step
                    )}
                  </span>
                  <span className="truncate font-medium">{step.label}</span>
                  {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-60" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <p className="text-[10px] text-sidebar-foreground/40 text-center">
          Step {currentStep + 1} dari {steps.length}
        </p>
      </div>
    </aside>
  );
}
