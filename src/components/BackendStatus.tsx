import { useEffect, useState } from 'react';
import { checkBackendStatus, resetBackendCache } from '@/lib/storage';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  /** Show an inline banner when offline. Defaults to false. */
  showBanner?: boolean;
  onStatusChange?: (online: boolean) => void;
}

export default function BackendStatus({ showBanner = false, onStatusChange }: Props) {
  const [online, setOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    resetBackendCache();
    const status = await checkBackendStatus();
    setOnline(status);
    onStatusChange?.(status);
    setChecking(false);
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (online === null) return null;

  const statusLabel = checking ? '' : online ? 'Online' : 'Offline';
  const iconClass = checking ? 'text-muted-foreground animate-spin' : online ? 'text-success' : 'text-warning';
  const labelClass = online ? 'text-success' : 'text-warning';

  const dot = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={check}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/60"
          >
            {checking ? (
              <RefreshCw className={`h-3 w-3 ${iconClass}`} />
            ) : online ? (
              <Wifi className={`h-3 w-3 ${iconClass}`} />
            ) : (
              <WifiOff className={`h-3 w-3 ${iconClass}`} />
            )}
            {!checking && (
              <span className={`${labelClass} text-xs`}>{statusLabel}</span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          {online
            ? 'Backend terhubung ke MongoDB. Data tersimpan di server.'
            : 'Backend tidak dapat dijangkau. Data disimpan lokal di browser. Pastikan backend berjalan di localhost:3002.'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (!showBanner || online) return dot;

  return (
    <div className="w-full space-y-1.5">
      {dot}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
        <WifiOff className="h-3.5 w-3.5 shrink-0 text-warning" />
        <span>
          <strong className="text-foreground">Mode Offline</strong> — Backend tidak terhubung.
          Data tersimpan di browser. Jalankan:{' '}
          <code className="rounded bg-muted px-1 text-foreground">cd pdf-backend && node server.js</code>
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-6 shrink-0 px-2 text-xs"
          onClick={check}
        >
          <RefreshCw className="mr-1 h-3 w-3" /> Coba Lagi
        </Button>
      </div>
    </div>
  );
}
