import { DocumentData } from '@/types/document';
import { generatePdfHtml } from '@/lib/pdf-builder';

/**
 * Export document as standalone HTML file
 */
export async function exportAsHtml(doc: DocumentData): Promise<void> {
  const html = await generatePdfHtml(doc);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.title || 'dokumen'}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
