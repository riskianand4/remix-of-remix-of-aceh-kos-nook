import { Save, Loader2, Check } from 'lucide-react';
import { SaveStatus } from '@/hooks/useAutoSave';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  status: SaveStatus;
  onClick: () => void;
}

export default function SaveIndicator({ status, onClick }: Props) {
  const isSaved = status === 'saved';
  const isSaving = status === 'saving';

  return (
    <Button
      size="sm"
      variant={isSaved ? 'ghost' : 'default'}
      disabled={isSaved || isSaving}
      onClick={onClick}
      className={cn(
        'gap-1.5 h-8 text-xs font-medium transition-all duration-200',
        isSaved && 'text-muted-foreground cursor-default',
        isSaving && 'opacity-70',
      )}
    >
      {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {isSaved && <Check className="h-3.5 w-3.5" />}
      {!isSaving && !isSaved && <Save className="h-3.5 w-3.5" />}
      {isSaving ? 'Menyimpan...' : isSaved ? 'Tersimpan' : 'Simpan'}
    </Button>
  );
}
