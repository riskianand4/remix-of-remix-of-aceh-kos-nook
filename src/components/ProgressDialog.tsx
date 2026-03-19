import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProgressDialogProps {
  open: boolean;
  title: string;
  progress: number; // 0-100
  onDone?: () => void;
}

export default function ProgressDialog({ open, title, progress, onDone }: ProgressDialogProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const isDone = progress >= 100;

  useEffect(() => {
    if (isDone && open) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onDone?.();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isDone, open, onDone]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-sm [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-4 py-4">
          {showSuccess ? (
            <>
              <CheckCircle className="h-10 w-10 text-primary animate-in zoom-in-50" />
              <p className="text-sm font-medium text-foreground">Berhasil!</p>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">{title}</p>
              <div className="w-full space-y-1.5">
                <Progress value={progress} className="h-2.5" />
                <p className="text-xs text-muted-foreground text-center font-mono">{Math.round(progress)}%</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
