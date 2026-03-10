import { useState, useCallback, useEffect } from 'react';
import {
  ClipboardData,
  ClipboardItemType,
  copyToClipboard,
  getClipboard,
} from '@/lib/clipboard-storage';
import { ImageSection, TextBlock, TableData } from '@/types/document';
import { toast } from '@/hooks/use-toast';

export function useClipboard() {
  const [clipboard, setClipboard] = useState<ClipboardData | null>(getClipboard());

  // Refresh clipboard state periodically (for cross-document paste)
  useEffect(() => {
    const handler = () => setClipboard(getClipboard());
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, []);

  const copy = useCallback((type: ClipboardItemType, data: ImageSection | TextBlock | TableData) => {
    copyToClipboard(type, data);
    setClipboard(getClipboard());
    const labels: Record<ClipboardItemType, string> = {
      section: 'Section gambar',
      textBlock: 'Paragraf teks',
      table: 'Tabel',
    };
    toast({ title: `📋 ${labels[type]} di-copy ke clipboard`, duration: 2000 });
  }, []);

  return { clipboard, copy };
}
