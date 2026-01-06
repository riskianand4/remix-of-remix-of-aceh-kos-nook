import type { SentimentStats, Mention, AnalysisResult, DatasetItem } from '@/types/sentiment';

// URL backend Flask - sesuaikan dengan URL server Anda
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Track connection status
let isBackendConnected = false;

export function getBackendStatus() {
  return isBackendConnected;
}

// Helper function untuk menghitung persentase dengan aman (hindari NaN/Infinity)
export function safePercent(value: number, total: number): string {
  if (!total || total === 0) return '0.0';
  const result = (value / total) * 100;
  if (!isFinite(result)) return '0.0';
  return result.toFixed(1);
}

export const sentimentApi = {
  // Analisis teks baru
  async analyze(text: string): Promise<AnalysisResult> {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'API Error' }));
      throw new Error(error.error || 'Gagal menganalisis teks');
    }
    
    isBackendConnected = true;
    return response.json();
  },

  // Get statistik dashboard
  async getStats(): Promise<{ stats: SentimentStats; isLive: boolean }> {
    const response = await fetch(`${API_BASE}/api/stats`);
    
    if (!response.ok) {
      throw new Error('Gagal mengambil statistik');
    }
    
    isBackendConnected = true;
    const stats = await response.json();
    return { stats, isLive: true };
  },

  // Get feed mention
  async getMentions(page = 1, limit = 10): Promise<{ data: Mention[]; total: number; isLive: boolean }> {
    const response = await fetch(`${API_BASE}/api/mentions?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Gagal mengambil mentions');
    }
    
    isBackendConnected = true;
    const result = await response.json();
    return { ...result, isLive: true };
  },

  // Get dataset
  async getDataset(): Promise<{ data: DatasetItem[]; isLive: boolean }> {
    const response = await fetch(`${API_BASE}/api/dataset`);
    
    if (!response.ok) {
      throw new Error('Gagal mengambil dataset');
    }
    
    isBackendConnected = true;
    const data = await response.json();
    return { data, isLive: true };
  },

  // Check backend health
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
      isBackendConnected = response.ok;
      return response.ok;
    } catch {
      isBackendConnected = false;
      return false;
    }
  },
};
