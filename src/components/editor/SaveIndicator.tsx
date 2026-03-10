import { Check, Cloud, Loader2 } from 'lucide-react';
import { SaveStatus } from '@/hooks/useAutoSave';
import { cn } from '@/lib/utils';

interface Props {
  status: SaveStatus;
}

export default function SaveIndicator({ status }: Props) {
  return (
    <div className={cn(
      'flex items-center gap-1.5 text-[11px] font-medium transition-all duration-300',
      status === 'saved' && 'text-success',
      status === 'saving' && 'text-warning',
      status === 'unsaved' && 'text-muted-foreground',
    )}>
      {status === 'saved' && <><Check className="h-3 w-3" /> Tersimpan</>}
      {status === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...</>}
      {status === 'unsaved' && <><Cloud className="h-3 w-3" /> Belum disimpan</>}
    </div>
  );
}
