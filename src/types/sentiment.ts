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
}

export interface DatasetItem {
  id: string;
  text: string;
  sentiment: SentimentType;
  source?: string;
}
