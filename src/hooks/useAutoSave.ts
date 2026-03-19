import { useState, useEffect, useRef, useCallback } from 'react';

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export function useAutoSave(saveFunc: () => void | Promise<void>, _delay?: number) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const isDirtyRef = useRef(false);
  const saveFuncRef = useRef(saveFunc);
  const savingRef = useRef(false);

  // Always keep the latest saveFunc in the ref
  saveFuncRef.current = saveFunc;

  /** Call this whenever the document changes — marks as dirty but does NOT auto-save */
  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
    setStatus('unsaved');
  }, []);

  /** Call this to manually trigger a save (from button click or Ctrl+S) */
  const save = useCallback(async () => {
    if (savingRef.current) return;
    if (!isDirtyRef.current) return;
    savingRef.current = true;
    setStatus('saving');
    try {
      await saveFuncRef.current();
      isDirtyRef.current = false;
      setStatus('saved');
    } catch (err) {
      console.error('Save failed:', err);
      setStatus('unsaved');
    } finally {
      savingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  return { status, markDirty, save, isDirty: () => isDirtyRef.current };
}
