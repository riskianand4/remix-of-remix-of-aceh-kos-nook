import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AnalysisResult, SentimentType } from '@/types/sentiment';

export interface AnalysisHistoryItem {
  id: string;
  text: string;
  sentiment: SentimentType;
  confidence: number;
  method: 'ml' | 'llm';
  model?: string;
  reasoning?: string;
  source_url?: string;
  source_title?: string;
  probabilities: {
    positif: number;
    negatif: number;
    netral: number;
  };
  created_at: string;
}

interface SaveAnalysisParams {
  result: AnalysisResult;
  sourceUrl?: string;
  sourceTitle?: string;
}

export function useAnalysisHistory() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setHistory([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('analysis_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      setHistory((data || []).map(item => ({
        ...item,
        sentiment: item.sentiment as SentimentType,
        method: item.method as 'ml' | 'llm',
        probabilities: item.probabilities as AnalysisHistoryItem['probabilities'],
      })));
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat riwayat');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveAnalysis = async ({ result, sourceUrl, sourceTitle }: SaveAnalysisParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('User not authenticated, skipping save');
        return { success: false, error: 'Not authenticated' };
      }

      const { error: insertError } = await supabase
        .from('analysis_history')
        .insert({
          user_id: user.id,
          text: result.text,
          sentiment: result.sentiment,
          confidence: result.confidence,
          method: result.method || 'ml',
          model: result.model,
          reasoning: result.reasoning,
          source_url: sourceUrl,
          source_title: sourceTitle,
          probabilities: result.probabilities,
        });

      if (insertError) {
        throw insertError;
      }

      // Refresh history after save
      await fetchHistory();
      return { success: true };
    } catch (err) {
      console.error('Error saving analysis:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Gagal menyimpan' };
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('analysis_history')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setHistory(prev => prev.filter(item => item.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting analysis:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Gagal menghapus' };
    }
  };

  return {
    history,
    loading,
    error,
    saveAnalysis,
    deleteAnalysis,
    refetch: fetchHistory,
  };
}
