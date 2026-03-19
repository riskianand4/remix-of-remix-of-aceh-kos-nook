import { DocumentData } from '@/types/document';
import { toast } from '@/hooks/use-toast';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api').replace(/^['"]|['"]$/g, '');

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

/** Authenticated request — redirects to /login on 401 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    if (res.status === 429) {
      toast({ title: 'Terlalu banyak permintaan', description: 'Silakan coba beberapa saat lagi.', variant: 'destructive' });
    }
    if (res.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

/** Public request — does NOT redirect on 401, does NOT attach auth token */
async function requestPublic<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
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
    return await requestPublic<DocumentData>(`/documents/verify/${encodeURIComponent(code)}`);
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

// ─── Published / Fork (remix system) ───

export async function fetchPublishedDocuments(): Promise<DocumentData[]> {
  return requestPublic<DocumentData[]>('/documents/published');
}

export async function forkDocument(id: string): Promise<DocumentData> {
  return request<DocumentData>(`/documents/${id}/fork`, { method: 'POST' });
}

export async function publishDocument(id: string, isPublished: boolean): Promise<DocumentData> {
  return request<DocumentData>(`/documents/${id}/publish`, { method: 'PATCH', body: JSON.stringify({ isPublished }) });
}


// ─── Archive ───

export async function fetchArchiveDocuments(params?: {
  search?: string; status?: string; sort?: string; folderId?: string;
}): Promise<DocumentData[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.sort) query.set('sort', params.sort);
  if (params?.folderId !== undefined) query.set('folderId', params.folderId);
  const qs = query.toString();
  return request<DocumentData[]>(`/documents/archive${qs ? `?${qs}` : ''}`);
}

export async function moveDocumentToFolder(docId: string, folderId: string | null): Promise<DocumentData> {
  return request<DocumentData>(`/documents/${docId}/move`, {
    method: 'POST',
    body: JSON.stringify({ folderId }),
  });
}

export async function archiveDeleteDocuments(ids: string[], password: string): Promise<{ deleted: number }> {
  return request('/documents/archive-delete', {
    method: 'POST',
    body: JSON.stringify({ ids, password }),
  });
}

// ─── Folders ───

export interface FolderApi {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  createdAt: string;
}

export async function fetchFolders(): Promise<FolderApi[]> {
  return request<FolderApi[]>('/folders');
}

export async function createFolderApi(name: string, parentId?: string | null): Promise<FolderApi> {
  return request<FolderApi>('/folders', { method: 'POST', body: JSON.stringify({ name, parentId }) });
}

export async function renameFolderApi(id: string, name: string): Promise<FolderApi> {
  return request<FolderApi>(`/folders/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
}

export async function deleteFolderApi(id: string): Promise<void> {
  await request(`/folders/${id}`, { method: 'DELETE' });
}

export async function verifyPassword(password: string): Promise<{ valid: boolean }> {
  return request('/auth/verify-password', { method: 'POST', body: JSON.stringify({ password }) });
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

// ─── PDF Generation ───

export async function generatePdf(html: string, footerEnabled?: boolean, qrDataUrl?: string): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/generate-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ html, footerEnabled, qrDataUrl }),
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
  return requestPublic(`/review/${code}/access`, {
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
  return requestPublic<CommentApi[]>(`/review/${code}/comments`);
}

export async function addComment(code: string, author: string, text: string, parentId?: string): Promise<CommentApi> {
  return requestPublic<CommentApi>(`/review/${code}/comments`, {
    method: 'POST',
    body: JSON.stringify({ author, text, parentId }),
  });
}

export async function resolveComment(id: string, resolved: boolean): Promise<CommentApi> {
  return requestPublic<CommentApi>(`/comments/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({ resolved }),
  });
}

export async function deleteComment(id: string): Promise<void> {
  await requestPublic(`/comments/${id}`, { method: 'DELETE' });
}

// ─── Auth Profile ───

export async function updateProfile(data: { name?: string; avatarUrl?: string }): Promise<void> {
  await request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await request('/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
}

// ─── Admin ───

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  verified: boolean;
  documentCount: number;
  createdAt: string;
}

export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
  page: number;
  pages: number;
}

export async function fetchAdminUsers(params?: { page?: number; search?: string }): Promise<PaginatedUsers> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  return request<PaginatedUsers>(`/admin/users${qs ? `?${qs}` : ''}`);
}

export async function updateUserRole(userId: string, role: 'user' | 'admin'): Promise<AdminUser> {
  return request<AdminUser>(`/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
}

export async function deleteUserAdmin(userId: string): Promise<void> {
  await request(`/admin/users/${userId}`, { method: 'DELETE' });
}
