import { DocumentData } from '@/types/document';
import {
  fetchDocuments, fetchDocument, createDocument, updateDocument,
  deleteDocumentApi, duplicateDocumentApi,
  fetchTemplates, createTemplate, deleteTemplateApi,
  CustomTemplateApi
} from '@/lib/api';

export type CustomTemplate = CustomTemplateApi;

// ─── Documents (all auth-gated via api.ts JWT header) ───

export async function getDocuments(): Promise<DocumentData[]> {
  const result = await fetchDocuments({ limit: 1000 });
  return result.docs;
}

export async function getDocument(id: string): Promise<DocumentData | undefined> {
  try {
    return await fetchDocument(id);
  } catch {
    return undefined;
  }
}

export async function saveDocument(doc: DocumentData): Promise<void> {
  try {
    await updateDocument(doc.id, doc);
  } catch (updateErr: any) {
    if (updateErr?.message?.includes('404') || updateErr?.message?.includes('not found')) {
      await createDocument({ ...doc, _id: doc.id } as any);
    } else {
      throw updateErr;
    }
  }
}

export async function deleteDocument(id: string): Promise<void> {
  await deleteDocumentApi(id);
}

export async function duplicateDocument(id: string): Promise<DocumentData | undefined> {
  return duplicateDocumentApi(id);
}

// ─── Custom Templates ───

export async function getCustomTemplates(): Promise<CustomTemplate[]> {
  return fetchTemplates();
}

export async function saveCustomTemplate(doc: DocumentData, name: string, description: string): Promise<boolean> {
  await createTemplate({ name, description, snapshot: doc });
  return true;
}

export async function deleteCustomTemplate(id: string): Promise<void> {
  await deleteTemplateApi(id);
}

// ─── Verify by code (public) ───

export async function verifyByCode(code: string): Promise<DocumentData | null> {
  const { verifyDocumentByCode } = await import('@/lib/api');
  return verifyDocumentByCode(code);
}

// ─── Backend status ───

let _backendOnline: boolean | null = null;
let _lastCheck = 0;

export async function checkBackendStatus(): Promise<boolean> {
  const now = Date.now();
  if (_backendOnline !== null && now - _lastCheck < 10_000) return _backendOnline;
  _lastCheck = now;
  try {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    _backendOnline = res.ok;
  } catch {
    _backendOnline = false;
  }
  return _backendOnline;
}

export function resetBackendCache() {
  _backendOnline = null;
  _lastCheck = 0;
}
