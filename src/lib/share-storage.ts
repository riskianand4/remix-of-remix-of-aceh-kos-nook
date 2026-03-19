// localStorage-based share links & comments (fallback when backend is unavailable)

export interface LocalShareLink {
  id: string;
  documentId: string;
  code: string;
  accessCode: string;
  createdBy: string;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface LocalComment {
  id: string;
  documentId: string;
  shareCode: string;
  author: string;
  text: string;
  resolved: boolean;
  parentId: string | null;
  createdAt: string;
}

const LS_SHARES = 'ls_share_links';
const LS_COMMENTS = 'ls_comments';

function uid(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function genCode(len = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getShares(): LocalShareLink[] {
  try { return JSON.parse(localStorage.getItem(LS_SHARES) || '[]'); } catch { return []; }
}
function setShares(links: LocalShareLink[]) {
  localStorage.setItem(LS_SHARES, JSON.stringify(links));
}

function getComments(): LocalComment[] {
  try { return JSON.parse(localStorage.getItem(LS_COMMENTS) || '[]'); } catch { return []; }
}
function setComments(comments: LocalComment[]) {
  localStorage.setItem(LS_COMMENTS, JSON.stringify(comments));
}

// ─── Share Links ───

export function createLocalShareLink(docId: string, customAccessCode?: string): LocalShareLink {
  const link: LocalShareLink = {
    id: uid(),
    documentId: docId,
    code: genCode(10),
    accessCode: customAccessCode || genCode(6),
    createdBy: '',
    expiresAt: null,
    active: true,
    createdAt: new Date().toISOString(),
  };
  setShares([link, ...getShares()]);
  return link;
}

export function getLocalShareLinks(docId: string): LocalShareLink[] {
  return getShares().filter(l => l.documentId === docId);
}

export function deleteLocalShareLink(id: string): void {
  setShares(getShares().map(l => l.id === id ? { ...l, active: false } : l));
}

export function accessLocalReview(code: string, accessCode: string): { link: LocalShareLink } | { error: string } {
  const link = getShares().find(l => l.code === code && l.active);
  if (!link) return { error: 'Link tidak ditemukan atau sudah tidak aktif' };
  if (link.expiresAt && new Date() > new Date(link.expiresAt)) return { error: 'Link sudah kedaluwarsa' };
  if (accessCode !== link.accessCode) return { error: 'Kode akses salah' };
  return { link };
}

// ─── Comments ───

export function getLocalComments(shareCode: string): LocalComment[] {
  return getComments().filter(c => c.shareCode === shareCode).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function addLocalComment(shareCode: string, docId: string, author: string, text: string, parentId?: string): LocalComment {
  const comment: LocalComment = {
    id: uid(),
    documentId: docId,
    shareCode,
    author,
    text,
    resolved: false,
    parentId: parentId || null,
    createdAt: new Date().toISOString(),
  };
  setComments([...getComments(), comment]);
  return comment;
}

export function resolveLocalComment(id: string): LocalComment | null {
  const all = getComments();
  const idx = all.findIndex(c => c.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], resolved: !all[idx].resolved };
  setComments(all);
  return all[idx];
}

export function deleteLocalComment(id: string): void {
  setComments(getComments().filter(c => c.id !== id));
}
