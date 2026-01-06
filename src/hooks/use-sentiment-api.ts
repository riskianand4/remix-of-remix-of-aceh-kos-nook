import { useState, useEffect, useCallback } from 'react';
import { sentimentApi, safePercent } from '@/lib/api';
import type { SentimentStats, Mention, AnalysisResult, DatasetItem, EvaluationResult, SentimentType } from '@/types/sentiment';

export { safePercent };

export interface WordData {
  text: string;
  value: number;
}

export function useSentimentStats() {
  const [stats, setStats] = useState<SentimentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const result = await sentimentApi.getStats();
        setStats(result.stats);
        setIsLive(result.isLive);
      } catch (err) {
        setError('Gagal memuat statistik');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return { stats, loading, error, isLive };
}

export function useMentions() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchMentions = async () => {
      try {
        setLoading(true);
        const result = await sentimentApi.getMentions();
        setMentions(result.data);
        setIsLive(result.isLive);
      } catch (err) {
        setError('Gagal memuat data mention');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMentions();
  }, []);

  return { mentions, loading, error, isLive };
}

export function useSentimentAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await sentimentApi.analyze(text);
      setResult(data);
    } catch (err) {
      setError('Gagal menganalisis teks');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, analyze, reset };
}

export function useDataset() {
  const [dataset, setDataset] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        setLoading(true);
        const result = await sentimentApi.getDataset();
        setDataset(result.data);
        setIsLive(result.isLive);
      } catch (err) {
        setError('Gagal memuat dataset');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDataset();
  }, []);

  return { dataset, loading, error, isLive };
}

export function useBackendStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkBackend = async () => {
      setChecking(true);
      const connected = await sentimentApi.checkHealth();
      setIsConnected(connected);
      setChecking(false);
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isConnected, checking };
}

export function useEvaluation() {
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        setLoading(true);
        const result = await sentimentApi.getEvaluation();
        setEvaluation(result.data);
        setIsLive(result.isLive);
      } catch (err) {
        setError('Gagal memuat data evaluasi');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvaluation();
  }, []);

  return { evaluation, loading, error, isLive };
}

export function useWordCloud(sentiment: SentimentType | 'all' = 'all') {
  const [wordData, setWordData] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWordCloud = async () => {
      try {
        setLoading(true);
        const result = await sentimentApi.getWordCloud(sentiment);
        setWordData(result.data);
      } catch (err) {
        setError('Gagal memuat data wordcloud');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWordCloud();
  }, [sentiment]);

  return { wordData, loading, error };
}
