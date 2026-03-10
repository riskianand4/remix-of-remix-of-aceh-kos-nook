import { DocumentData } from '@/types/document';
import { fetchVersions, saveVersionApi, restoreVersionApi, DocumentVersionApi } from '@/lib/api';

export type DocumentVersion = DocumentVersionApi;

export async function getVersions(docId: string): Promise<DocumentVersion[]> {
  try {
    return await fetchVersions(docId);
  } catch {
    return [];
  }
}

export async function saveVersion(doc: DocumentData): Promise<void> {
  try {
    await saveVersionApi(doc.id, doc);
  } catch (err) {
    console.error('Version save failed:', err);
  }
}

export async function restoreVersion(docId: string, versionId: string): Promise<DocumentData | null> {
  try {
    return await restoreVersionApi(docId, versionId);
  } catch {
    return null;
  }
}

export async function deleteVersions(_docId: string): Promise<void> {
  // Versions are deleted server-side when document is deleted
}
