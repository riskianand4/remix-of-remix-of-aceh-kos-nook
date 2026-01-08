import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './button';
import { Card, CardContent } from './card';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  autoRetryDelay?: number; // seconds, 0 to disable
}

export function ErrorState({ 
  title = 'Terjadi Kesalahan', 
  message = 'Gagal memuat data. Pastikan backend sudah berjalan.',
  onRetry,
  autoRetryDelay = 10
}: ErrorStateProps) {
  const [countdown, setCountdown] = useState(autoRetryDelay);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
      setCountdown(autoRetryDelay);
    }
  }, [onRetry, isRetrying, autoRetryDelay]);

  useEffect(() => {
    if (!onRetry || autoRetryDelay <= 0 || isRetrying) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRetry();
          return autoRetryDelay;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRetry, autoRetryDelay, isRetrying, handleRetry]);

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-destructive/10"
        >
          <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
        </motion.div>
        <motion.h3 
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-3 sm:mt-4 text-sm sm:text-lg font-semibold"
        >
          {title}
        </motion.h3>
        <motion.p 
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-1 sm:mt-2 max-w-sm text-xs sm:text-sm text-muted-foreground"
        >
          {message}
        </motion.p>
        {onRetry && (
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 flex flex-col items-center gap-2"
          >
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry} 
              disabled={isRetrying}
              className="min-w-[140px]"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span className="text-xs sm:text-sm">Mencoba...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">
                    Coba Lagi {autoRetryDelay > 0 && `(${countdown}s)`}
                  </span>
                </>
              )}
            </Button>
            {autoRetryDelay > 0 && !isRetrying && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Auto-retry dalam {countdown} detik
              </p>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
