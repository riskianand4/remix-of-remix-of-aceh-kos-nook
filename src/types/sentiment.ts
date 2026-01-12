export type SentimentType = 'positif' | 'negatif' | 'netral';

export interface SentimentStats {
  total: number;
  positif: number;
  negatif: number;
  netral: number;
}

export interface Mention {
  id: string;
  text: string;
  sentiment: SentimentType;
  confidence: number;
  createdAt: string;
}

export interface AnalysisResult {
  text: string;
  sentiment: SentimentType;
  confidence: number;
  probabilities: {
    positif: number;
    negatif: number;
    netral: number;
  };
  method?: 'ml' | 'llm';
  model?: string;
  reasoning?: string;
}

export interface DatasetItem {
  id: string;
  text: string;
  sentiment: SentimentType;
  source?: string;
}

export interface EvaluationResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  classification_report: Record<string, unknown>;
}
