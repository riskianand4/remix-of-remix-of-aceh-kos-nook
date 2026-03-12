import { useState, useCallback, useRef } from 'react';
import { ProgressState, INITIAL_PROGRESS } from '@/components/ProgressDialog';

export function useProgress() {
  const [state, setState] = useState<ProgressState>(INITIAL_PROGRESS);
  const timerRef = useRef<NodeJS.Timeout>();

  const start = useCallback((label: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState({ open: true, label, progress: 0, status: 'loading' });
  }, []);

  const update = useCallback((progress: number, message?: string) => {
    setState(s => ({ ...s, progress: Math.min(progress, 99), message }));
  }, []);

  const complete = useCallback((message?: string) => {
    setState(s => ({ ...s, progress: 100, status: 'success', message }));
    timerRef.current = setTimeout(() => {
      setState(INITIAL_PROGRESS);
    }, 1500);
  }, []);

  const fail = useCallback((message?: string) => {
    setState(s => ({ ...s, status: 'error', message }));
    timerRef.current = setTimeout(() => {
      setState(INITIAL_PROGRESS);
    }, 2500);
  }, []);

  /** Run an async function with automatic progress simulation */
  const run = useCallback(async <T>(label: string, fn: (update: (p: number) => void) => Promise<T>): Promise<T | undefined> => {
    start(label);
    try {
      const result = await fn((p) => update(p));
      complete();
      return result;
    } catch (err: any) {
      fail(err?.message || 'Terjadi kesalahan');
      return undefined;
    }
  }, [start, update, complete, fail]);

  return { state, start, update, complete, fail, run };
}
