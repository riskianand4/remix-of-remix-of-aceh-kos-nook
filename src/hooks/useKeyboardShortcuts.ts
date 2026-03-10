import { useEffect } from 'react';

interface ShortcutHandlers {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onPreview?: () => void;
  onShortcutsDialog?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          handlers.onSave?.();
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) handlers.onRedo?.();
          else handlers.onUndo?.();
          break;
        case 'p':
          e.preventDefault();
          handlers.onPreview?.();
          break;
        case '/':
          e.preventDefault();
          handlers.onShortcutsDialog?.();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
