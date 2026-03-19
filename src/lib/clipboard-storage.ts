import { ImageSection, TextBlock, TableData } from '@/types/document';

const CLIPBOARD_KEY = 'pdf-gen-clipboard';

export type ClipboardItemType = 'section' | 'textBlock' | 'table';

export interface ClipboardData {
  type: ClipboardItemType;
  data: ImageSection | TextBlock | TableData;
  copiedAt: string;
}

export function copyToClipboard(type: ClipboardItemType, data: ImageSection | TextBlock | TableData) {
  const item: ClipboardData = {
    type,
    data: { ...data, id: crypto.randomUUID() },
    copiedAt: new Date().toISOString(),
  };
  localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(item));
}

export function getClipboard(): ClipboardData | null {
  const raw = localStorage.getItem(CLIPBOARD_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ClipboardData;
  } catch {
    return null;
  }
}

export function clearClipboard() {
  localStorage.removeItem(CLIPBOARD_KEY);
}

export function duplicateSection(section: ImageSection): ImageSection {
  return {
    ...section,
    id: crypto.randomUUID(),
    title: `${section.title} (Copy)`,
    images: section.images.map(img => ({ ...img, id: crypto.randomUUID() })),
  };
}

export function duplicateTextBlock(block: TextBlock): TextBlock {
  return {
    ...block,
    id: crypto.randomUUID(),
    title: `${block.title} (Copy)`,
  };
}

export function duplicateTable(table: TableData): TableData {
  return {
    ...table,
    id: crypto.randomUUID(),
    title: `${table.title} (Copy)`,
    rows: table.rows.map(row => [...row]),
  };
}
