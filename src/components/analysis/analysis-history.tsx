import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { SentimentBadge } from '../dashboard/sentiment-badge';
import { useAnalysisHistory, AnalysisHistoryItem } from '@/hooks/use-analysis-history';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from '../auth/auth-modal';
import { 
  History, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Brain, 
  Loader2,
  LogIn,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AnalysisHistory() {
  const { user, loading: authLoading } = useAuth();
  const { history, loading, deleteAnalysis, refetch } = useAnalysisHistory();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteAnalysis(id);
    setDeletingId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <>
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <History className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-medium">Riwayat Analisis</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Masuk untuk menyimpan dan melihat riwayat analisis Anda
                </p>
              </div>
              <Button onClick={() => setShowAuthModal(true)} className="gap-2">
                <LogIn className="h-4 w-4" />
                Masuk / Daftar
              </Button>
            </div>
          </CardContent>
        </Card>
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          onSuccess={refetch}
        />
      </>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            Riwayat Analisis
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {history.length} hasil
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada riwayat analisis
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {history.map((item) => (
              <HistoryItem 
                key={item.id} 
                item={item}
                isExpanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onDelete={() => handleDelete(item.id)}
                isDeleting={deletingId === item.id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface HistoryItemProps {
  item: AnalysisHistoryItem;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function HistoryItem({ item, isExpanded, onToggle, onDelete, isDeleting }: HistoryItemProps) {
  const isLLM = item.method === 'llm';
  
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SentimentBadge sentiment={item.sentiment} />
            <span className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
              isLLM 
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" 
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            )}>
              {isLLM ? <Sparkles className="h-3 w-3" /> : <Brain className="h-3 w-3" />}
              {isLLM ? 'AI' : 'ML'}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(item.confidence * 100)}%
            </span>
          </div>
          
          {item.source_title && (
            <p className="text-sm font-medium mt-1 truncate">{item.source_title}</p>
          )}
          
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {item.text}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-2 border-t space-y-2">
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              {item.source_url}
            </a>
          )}
          
          {item.reasoning && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2">
              <p className="text-xs text-purple-700 dark:text-purple-300">
                <Sparkles className="h-3 w-3 inline mr-1" />
                {item.reasoning}
              </p>
            </div>
          )}
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>📊 P: {Math.round(item.probabilities.positif * 100)}%</span>
            <span>N: {Math.round(item.probabilities.negatif * 100)}%</span>
            <span>Ne: {Math.round(item.probabilities.netral * 100)}%</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            🕐 {formatDate(item.created_at)}
          </p>
        </div>
      )}
      
      {!isExpanded && (
        <p className="text-xs text-muted-foreground">
          🕐 {formatDate(item.created_at)}
        </p>
      )}
    </div>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
