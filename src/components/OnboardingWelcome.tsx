import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Sparkles, Layers, Table2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

const features = [
  { icon: FileText, key: 'richText' },
  { icon: Layers, key: 'multiPage' },
  { icon: Table2, key: 'tables' },
  { icon: Printer, key: 'pdfExport' },
];

export default function OnboardingWelcome({ open, onClose, onStartTour }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <motion.div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Sparkles className="h-8 w-8 text-primary" />
          </motion.div>
          <DialogTitle className="text-2xl">{t('onboarding.welcomeTitle')}</DialogTitle>
          <DialogDescription className="text-sm mt-1">
            {t('onboarding.welcomeDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 my-4">
          {features.map((f, i) => (
            <motion.div
              key={f.key}
              className="flex items-center gap-3 rounded-lg border p-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold">{t(`onboarding.feature.${f.key}`)}</p>
                <p className="text-[10px] text-muted-foreground">{t(`onboarding.featureDesc.${f.key}`)}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>{t('onboarding.skip')}</Button>
          <Button onClick={onStartTour} className="gap-2 gradient-primary border-0">
            <Sparkles className="h-4 w-4" /> {t('onboarding.startTour')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
