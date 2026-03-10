import { DocumentData } from '@/types/document';
import {
  fetchDocuments, fetchDocument, createDocument, updateDocument,
  deleteDocumentApi, duplicateDocumentApi,
  fetchTemplates, createTemplate, deleteTemplateApi,
  CustomTemplateApi
} from '@/lib/api';

export type CustomTemplate = CustomTemplateApi;

// ─── LocalStorage fallback helpers ───

const LS_DOCS_INDEX = 'ls_docs_index';
const LS_TMPLS_INDEX = 'ls_tmpls_index';

function lsGetDocIndex(): { id: string; title: string; updatedAt: string }[] {
  try { return JSON.parse(localStorage.getItem(LS_DOCS_INDEX) || '[]'); } catch { return []; }
}
function lsSetDocIndex(arr: { id: string; title: string; updatedAt: string }[]) {
  try { localStorage.setItem(LS_DOCS_INDEX, JSON.stringify(arr)); } catch {}
}
function lsGetDoc(id: string): DocumentData | undefined {
  try {
    const raw = localStorage.getItem(`ls_doc_${id}`);
    return raw ? JSON.parse(raw) : undefined;
  } catch { return undefined; }
}
function lsSetDoc(doc: DocumentData) {
  try {
    localStorage.setItem(`ls_doc_${doc.id}`, JSON.stringify(doc));
    const idx = lsGetDocIndex();
    const entry = { id: doc.id, title: doc.title, updatedAt: doc.updatedAt };
    const existing = idx.findIndex(d => d.id === doc.id);
    if (existing >= 0) idx[existing] = entry; else idx.push(entry);
    lsSetDocIndex(idx);
  } catch {}
}
function lsDeleteDoc(id: string) {
  try {
    localStorage.removeItem(`ls_doc_${id}`);
    lsSetDocIndex(lsGetDocIndex().filter(d => d.id !== id));
  } catch {}
}
function lsGetAllDocs(): DocumentData[] {
  const idx = lsGetDocIndex();
  return idx.map(e => lsGetDoc(e.id)).filter(Boolean) as DocumentData[];
}

function lsGetTmplIndex(): CustomTemplate[] {
  try { return JSON.parse(localStorage.getItem(LS_TMPLS_INDEX) || '[]'); } catch { return []; }
}
function lsSetTmplIndex(arr: CustomTemplate[]) {
  try { localStorage.setItem(LS_TMPLS_INDEX, JSON.stringify(arr)); } catch {}
}

// ─── Documents (async, calls backend with localStorage fallback) ───

export async function getDocuments(): Promise<DocumentData[]> {
  try {
    const result = await fetchDocuments({ limit: 1000 });
    // Cache all docs to localStorage
    result.docs.forEach(lsSetDoc);
    return result.docs;
  } catch {
    // Backend offline — return from localStorage
    return lsGetAllDocs();
  }
}

export async function getDocument(id: string): Promise<DocumentData | undefined> {
  try {
    const doc = await fetchDocument(id);
    lsSetDoc(doc);
    return doc;
  } catch {
    return lsGetDoc(id);
  }
}

export async function saveDocument(doc: DocumentData): Promise<void> {
  // Always update localStorage first (instant, never fails)
  lsSetDoc(doc);
  try {
    // Try update first; if 404, create instead
    try {
      await updateDocument(doc.id, doc);
    } catch (updateErr: any) {
      if (updateErr?.message?.includes('404') || updateErr?.message?.includes('not found')) {
        await createDocument({ ...doc, _id: doc.id } as any);
      } else {
        throw updateErr;
      }
    }
  } catch (err) {
    console.warn('Save to backend failed, stored locally:', err);
  }
}

export async function deleteDocument(id: string): Promise<void> {
  lsDeleteDoc(id);
  try {
    await deleteDocumentApi(id);
  } catch (err) {
    console.warn('Backend delete failed, removed locally:', err);
  }
}

export async function duplicateDocument(id: string): Promise<DocumentData | undefined> {
  try {
    const dup = await duplicateDocumentApi(id);
    lsSetDoc(dup);
    return dup;
  } catch {
    // Offline fallback
    const original = lsGetDoc(id);
    if (!original) return undefined;
    const dup: DocumentData = {
      ...JSON.parse(JSON.stringify(original)),
      id: crypto.randomUUID(),
      title: `${original.title} (Salinan)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    lsSetDoc(dup);
    return dup;
  }
}

// ─── Custom Templates (async, calls backend with localStorage fallback) ───

export async function getCustomTemplates(): Promise<CustomTemplate[]> {
  try {
    const templates = await fetchTemplates();
    // Cache to localStorage
    lsSetTmplIndex(templates);
    return templates;
  } catch {
    return lsGetTmplIndex();
  }
}

export async function saveCustomTemplate(doc: DocumentData, name: string, description: string): Promise<boolean> {
  try {
    const tmpl = await createTemplate({ name, description, snapshot: doc });
    // Update local cache
    const idx = lsGetTmplIndex();
    idx.push(tmpl);
    lsSetTmplIndex(idx);
    return true;
  } catch {
    // Offline fallback: save locally
    const localTemplate: CustomTemplate = {
      id: crypto.randomUUID(),
      name,
      description,
      icon: 'FileText',
      category: 'custom',
      snapshot: doc,
      createdAt: new Date().toISOString(),
    };
    const idx = lsGetTmplIndex();
    idx.push(localTemplate);
    lsSetTmplIndex(idx);
    return true;
  }
}

export async function deleteCustomTemplate(id: string): Promise<void> {
  // Remove from local cache immediately
  lsSetTmplIndex(lsGetTmplIndex().filter(t => t.id !== id));
  try {
    await deleteTemplateApi(id);
  } catch (err) {
    console.warn('Backend template delete failed, removed locally:', err);
  }
}

// ─── Verify by code ───

export async function verifyByCode(code: string): Promise<DocumentData | null> {
  try {
    const { verifyDocumentByCode } = await import('@/lib/api');
    const doc = await verifyDocumentByCode(code);
    return doc;
  } catch {
    // Offline fallback: search localStorage
    const allDocs = lsGetAllDocs();
    return allDocs.find(d => d.docCode === code) || null;
  }
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
