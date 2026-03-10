import { useState, useEffect } from 'react';
import { DocumentData } from '@/types/document';
import { getVersions, restoreVersion, DocumentVersion } from '@/lib/versioning';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  doc: DocumentData;
  onRestore: (snapshot: DocumentData) => void;
}

export default function VersionHistory({ doc, onRestore }: Props) {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getVersions(doc.id).then(setVersions).catch(() => setVersions([]));
  }, [doc.id, doc.updatedAt]);

  const handleRestore = async (versionId: string) => {
    const snapshot = await restoreVersion(doc.id, versionId);
    if (snapshot) {
      onRestore(snapshot);
      setOpen(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="gap-2">
        <History className="h-3.5 w-3.5" />
        {t('versioning.title')} ({versions.length})
      </Button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/20"
              onClick={() => setOpen(false)}
            />
            {/* Floating panel */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-14 right-4 z-50 w-80 rounded-xl border bg-card shadow-xl"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{t('versioning.title')}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ScrollArea className="max-h-72 p-3">
                {versions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    {t('versioning.noVersions')}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {[...versions].map((v, i) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <span className="font-medium text-foreground">
                            {new Date(v.createdAt).toLocaleString()}
                          </span>
                          {i === 0 && (
                            <span className="ml-2 text-[10px] text-primary font-semibold">
                              {t('versioning.current')}
                            </span>
                          )}
                          <p className="text-muted-foreground text-[10px] mt-0.5">
                            {t('versioning.autoSaved')}
                          </p>
                        </div>
                        {i > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 gap-1 text-[10px]"
                            onClick={() => handleRestore(v.id)}
                          >
                            <RotateCcw className="h-3 w-3" />
                            {t('versioning.restore')}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
