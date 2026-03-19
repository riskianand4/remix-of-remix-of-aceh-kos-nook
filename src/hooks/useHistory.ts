import { useCallback, useRef } from 'react';

const MAX_HISTORY = 30;

export function useHistory<T>() {
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);

  const pushState = useCallback((state: T) => {
    pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), state];
    futureRef.current = [];
  }, []);

  const undo = useCallback((currentState: T): T | null => {
    if (pastRef.current.length === 0) return null;
    const prev = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [currentState, ...futureRef.current];
    return prev;
  }, []);

  const redo = useCallback((currentState: T): T | null => {
    if (futureRef.current.length === 0) return null;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current, currentState];
    return next;
  }, []);

  const canUndo = useCallback(() => pastRef.current.length > 0, []);
  const canRedo = useCallback(() => futureRef.current.length > 0, []);

  return { pushState, undo, redo, canUndo, canRedo };
}
