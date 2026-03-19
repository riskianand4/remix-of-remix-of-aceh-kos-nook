import { DocumentData } from '@/types/document';
import { importDocumentsApi, exportDocumentsApi } from '@/lib/api';

export function exportDocuments(docs: DocumentData[]): void {
  const json = JSON.stringify(docs, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pdf-generator-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSingleDocument(doc: DocumentData): void {
  const json = JSON.stringify(doc, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.title || 'dokumen'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importDocuments(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const docs: DocumentData[] = Array.isArray(data) ? data : [data];
        const result = await importDocumentsApi(docs);
        resolve(result.imported);
      } catch (err) {
        reject(new Error('File JSON tidak valid'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsText(file);
  });
}
