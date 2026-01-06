import type { SentimentStats, Mention, AnalysisResult, DatasetItem } from '@/types/sentiment';

// URL backend Flask - sesuaikan dengan URL server Anda
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Track connection status
let isBackendConnected = false;

export function getBackendStatus() {
  return isBackendConnected;
}

// Mock data untuk development ketika backend tidak tersedia
const mockStats: SentimentStats = {
  total: 1847,
  positif: 892,
  negatif: 156,
  netral: 799,
};

const mockMentions: Mention[] = [
  { id: '1', text: 'Pupuk dari PIM sangat bagus untuk tanaman padi saya', sentiment: 'positif', confidence: 0.92, createdAt: '2024-01-15T10:30:00Z' },
  { id: '2', text: 'Harga pupuk PIM masih terjangkau dibanding merek lain', sentiment: 'positif', confidence: 0.88, createdAt: '2024-01-15T09:15:00Z' },
  { id: '3', text: 'Distribusi pupuk PIM ke daerah kami agak lambat', sentiment: 'negatif', confidence: 0.85, createdAt: '2024-01-14T16:45:00Z' },
  { id: '4', text: 'Kualitas pupuk PIM standar saja', sentiment: 'netral', confidence: 0.78, createdAt: '2024-01-14T14:20:00Z' },
  { id: '5', text: 'Pelayanan customer service PIM sangat membantu', sentiment: 'positif', confidence: 0.91, createdAt: '2024-01-14T11:00:00Z' },
  { id: '6', text: 'Stok pupuk PIM selalu tersedia di toko pertanian', sentiment: 'positif', confidence: 0.86, createdAt: '2024-01-13T15:30:00Z' },
  { id: '7', text: 'Kemasan pupuk PIM perlu diperbaiki', sentiment: 'negatif', confidence: 0.79, createdAt: '2024-01-13T12:00:00Z' },
  { id: '8', text: 'Pupuk PIM cukup untuk kebutuhan pertanian skala kecil', sentiment: 'netral', confidence: 0.72, createdAt: '2024-01-12T09:45:00Z' },
];

const mockDataset: DatasetItem[] = mockMentions.map((m, i) => ({
  id: m.id,
  text: m.text,
  sentiment: m.sentiment,
  source: i % 2 === 0 ? 'Twitter' : 'Facebook',
}));

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
    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) throw new Error('API Error');
      isBackendConnected = true;
      return response.json();
    } catch {
      isBackendConnected = false;
      // Mock response untuk development
      const sentiments: Array<'positif' | 'negatif' | 'netral'> = ['positif', 'negatif', 'netral'];
      const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)]!;
      const confidence = 0.75 + Math.random() * 0.2;
      
      return {
        text,
        sentiment: randomSentiment,
        confidence,
        probabilities: {
          positif: randomSentiment === 'positif' ? confidence : (1 - confidence) / 2,
          negatif: randomSentiment === 'negatif' ? confidence : (1 - confidence) / 2,
          netral: randomSentiment === 'netral' ? confidence : (1 - confidence) / 2,
        },
      };
    }
  },

  // Get statistik dashboard
  async getStats(): Promise<{ stats: SentimentStats; isLive: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/api/stats`);
      if (!response.ok) throw new Error('API Error');
      isBackendConnected = true;
      const stats = await response.json();
      return { stats, isLive: true };
    } catch {
      isBackendConnected = false;
      return { stats: mockStats, isLive: false };
    }
  },

  // Get feed mention
  async getMentions(page = 1, limit = 10): Promise<{ data: Mention[]; total: number; isLive: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/api/mentions?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('API Error');
      isBackendConnected = true;
      const result = await response.json();
      return { ...result, isLive: true };
    } catch {
      isBackendConnected = false;
      return { data: mockMentions, total: mockMentions.length, isLive: false };
    }
  },

  // Get dataset
  async getDataset(): Promise<{ data: DatasetItem[]; isLive: boolean }> {
    try {
      const response = await fetch(`${API_BASE}/api/dataset`);
      if (!response.ok) throw new Error('API Error');
      isBackendConnected = true;
      const data = await response.json();
      return { data, isLive: true };
    } catch {
      isBackendConnected = false;
      return { data: mockDataset, isLive: false };
    }
  },

  // Check backend health
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/stats`, { method: 'GET' });
      isBackendConnected = response.ok;
      return response.ok;
    } catch {
      isBackendConnected = false;
      return false;
    }
  },
};
