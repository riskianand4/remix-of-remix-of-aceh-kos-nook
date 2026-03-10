import { DocumentData } from '@/types/document';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Documents ───

export interface PaginatedDocs {
  docs: DocumentData[];
  total: number;
  page: number;
  pages: number;
}

export interface DocStats {
  total: number;
  draft: number;
  finished: number;
  monthly: { _id: string; count: number }[];
}

export async function fetchDocuments(params?: {
  search?: string; status?: string; sort?: string; page?: number; limit?: number;
}): Promise<PaginatedDocs> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.sort) query.set('sort', params.sort);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return request<PaginatedDocs>(`/documents${qs ? `?${qs}` : ''}`);
}

export async function fetchDocument(id: string): Promise<DocumentData> {
  return request<DocumentData>(`/documents/${id}`);
}

export async function createDocument(data: Partial<DocumentData>): Promise<DocumentData> {
  return request<DocumentData>('/documents', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateDocument(id: string, data: Partial<DocumentData>): Promise<DocumentData> {
  return request<DocumentData>(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteDocumentApi(id: string): Promise<void> {
  await request(`/documents/${id}`, { method: 'DELETE' });
}

export async function duplicateDocumentApi(id: string): Promise<DocumentData> {
  return request<DocumentData>(`/documents/${id}/duplicate`, { method: 'POST' });
}

export async function bulkDeleteDocuments(ids: string[]): Promise<{ deleted: number }> {
  return request('/documents/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) });
}

export async function fetchDocStats(): Promise<DocStats> {
  return request<DocStats>('/documents/stats');
}

export async function verifyDocumentByCode(code: string): Promise<DocumentData | null> {
  try {
    return await request<DocumentData>(`/documents/verify/${encodeURIComponent(code)}`);
  } catch {
    return null;
  }
}

export async function exportDocumentsApi(ids?: string[]): Promise<DocumentData[]> {
  return request<DocumentData[]>('/documents/export', { method: 'POST', body: JSON.stringify({ ids }) });
}

export async function importDocumentsApi(docs: DocumentData[]): Promise<{ imported: number }> {
  return request('/documents/import', { method: 'POST', body: JSON.stringify(docs) });
}

// ─── Templates ───

export interface CustomTemplateApi {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  snapshot: DocumentData;
  createdAt: string;
}

export async function fetchTemplates(): Promise<CustomTemplateApi[]> {
  return request<CustomTemplateApi[]>('/templates');
}

export async function createTemplate(data: { name: string; description: string; snapshot: DocumentData }): Promise<CustomTemplateApi> {
  return request<CustomTemplateApi>('/templates', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteTemplateApi(id: string): Promise<void> {
  await request(`/templates/${id}`, { method: 'DELETE' });
}

export async function createDocFromTemplate(templateId: string): Promise<DocumentData> {
  return request<DocumentData>(`/templates/${templateId}/create-doc`, { method: 'POST' });
}

// ─── Versions ───

export interface DocumentVersionApi {
  id: string;
  documentId: string;
  snapshot: DocumentData;
  createdAt: string;
}

export async function fetchVersions(docId: string): Promise<DocumentVersionApi[]> {
  return request<DocumentVersionApi[]>(`/documents/${docId}/versions`);
}

export async function saveVersionApi(docId: string, snapshot: DocumentData): Promise<DocumentVersionApi> {
  return request<DocumentVersionApi>(`/documents/${docId}/versions`, { method: 'POST', body: JSON.stringify(snapshot) });
}

export async function restoreVersionApi(docId: string, versionId: string): Promise<DocumentData> {
  return request<DocumentData>(`/documents/${docId}/versions/${versionId}/restore`, { method: 'POST' });
}

// ─── PDF Generation ───

export async function generatePdf(html: string, footerEnabled?: boolean): Promise<Blob> {
  const res = await fetch(`${API_BASE}/generate-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, footerEnabled }),
  });
  if (!res.ok) throw new Error('PDF generation failed');
  return res.blob();
}

// ─── Share Links ───

export interface ShareLinkApi {
  id: string;
  documentId: string;
  code: string;
  accessCode: string;
  createdBy: string;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

export async function createShareLink(docId: string, accessCode?: string, expiresAt?: string): Promise<ShareLinkApi> {
  return request<ShareLinkApi>(`/documents/${docId}/share`, {
    method: 'POST',
    body: JSON.stringify({ accessCode, expiresAt }),
  });
}

export async function fetchShareLinks(docId: string): Promise<ShareLinkApi[]> {
  return request<ShareLinkApi[]>(`/documents/${docId}/shares`);
}

export async function deleteShareLink(id: string): Promise<void> {
  await request(`/shares/${id}`, { method: 'DELETE' });
}

export async function accessReview(code: string, accessCode: string): Promise<{ document: DocumentData; shareCode: string }> {
  return request(`/review/${code}/access`, {
    method: 'POST',
    body: JSON.stringify({ accessCode }),
  });
}

// ─── Comments ───

export interface CommentApi {
  id: string;
  documentId: string;
  shareCode: string;
  author: string;
  text: string;
  resolved: boolean;
  parentId: string | null;
  createdAt: string;
}

export async function fetchComments(code: string): Promise<CommentApi[]> {
  return request<CommentApi[]>(`/review/${code}/comments`);
}

export async function addComment(code: string, author: string, text: string, parentId?: string): Promise<CommentApi> {
  return request<CommentApi>(`/review/${code}/comments`, {
    method: 'POST',
    body: JSON.stringify({ author, text, parentId }),
  });
}

export async function resolveComment(id: string, resolved: boolean): Promise<CommentApi> {
  return request<CommentApi>(`/comments/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({ resolved }),
  });
}

export async function deleteComment(id: string): Promise<void> {
  await request(`/comments/${id}`, { method: 'DELETE' });
}
