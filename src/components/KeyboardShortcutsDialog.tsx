import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Keyboard } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
  { keys: ['Ctrl', 'S'], action: 'shortcuts.save' },
  { keys: ['Ctrl', 'Z'], action: 'shortcuts.undo' },
  { keys: ['Ctrl', 'Shift', 'Z'], action: 'shortcuts.redo' },
  { keys: ['Ctrl', 'P'], action: 'shortcuts.preview' },
  { keys: ['Ctrl', 'K'], action: 'shortcuts.commandPalette' },
  { keys: ['Ctrl', '/'], action: 'shortcuts.showShortcuts' },
];

export default function KeyboardShortcutsDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            {t('shortcuts.title')}
          </DialogTitle>
          <DialogDescription>{t('shortcuts.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {SHORTCUTS.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-foreground">{t(shortcut.action)}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, ki) => (
                  <span key={ki}>
                    <kbd className="inline-flex h-6 items-center justify-center rounded border bg-muted px-2 text-[10px] font-mono font-medium text-muted-foreground shadow-sm">
                      {key}
                    </kbd>
                    {ki < shortcut.keys.length - 1 && <span className="mx-0.5 text-muted-foreground text-[10px]">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
