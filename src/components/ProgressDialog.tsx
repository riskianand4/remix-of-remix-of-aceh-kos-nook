import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ProgressState = {
  open: boolean;
  label: string;
  progress: number;
  status: 'loading' | 'success' | 'error';
  message?: string;
};

export const INITIAL_PROGRESS: ProgressState = {
  open: false, label: '', progress: 0, status: 'loading',
};

interface Props {
  state: ProgressState;
}

export default function ProgressDialog({ state }: Props) {
  return (
    <Dialog open={state.open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-sm [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{state.label || 'Proses'}</DialogTitle>
        <div className="flex flex-col items-center gap-4 py-2">
          <AnimatePresence mode="wait">
            {state.status === 'loading' && (
              <motion.div key="loading" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </motion.div>
            )}
            {state.status === 'success' && (
              <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <CheckCircle className="h-10 w-10 text-green-500" />
              </motion.div>
            )}
            {state.status === 'error' && (
              <motion.div key="error" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <AlertCircle className="h-10 w-10 text-destructive" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full space-y-2 text-center">
            <p className="text-sm font-medium text-foreground">
              {state.status === 'success' ? 'Berhasil!' : state.status === 'error' ? 'Gagal' : state.label}
            </p>
            {state.message && <p className="text-xs text-muted-foreground">{state.message}</p>}
            {state.status === 'loading' && (
              <div className="space-y-1">
                <Progress value={state.progress} className="h-2.5" />
                <p className="text-xs text-muted-foreground font-mono">{Math.round(state.progress)}%</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
