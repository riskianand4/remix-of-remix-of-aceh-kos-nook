import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TourStep } from '@/hooks/useOnboarding';

interface Props {
  show: boolean;
  step: TourStep;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export default function OnboardingTour({ show, step, currentIndex, totalSteps, onNext, onPrev, onSkip }: Props) {
  const { t } = useTranslation();
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [show, step.target, currentIndex]);

  if (!show) return null;

  const tooltipTop = pos.top + pos.height + 12;
  const tooltipLeft = Math.max(16, Math.min(pos.left, window.innerWidth - 340));
  const isBottom = tooltipTop + 200 > window.innerHeight;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-[100]" style={{ pointerEvents: 'none' }}>
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <mask id="tour-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <rect
                    x={pos.left - 4}
                    y={pos.top - 4}
                    width={pos.width + 8}
                    height={pos.height + 8}
                    rx="8"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                x="0" y="0" width="100%" height="100%"
                fill="rgba(0,0,0,0.5)"
                mask="url(#tour-mask)"
                style={{ pointerEvents: 'auto' }}
                onClick={onSkip}
              />
            </svg>

            {/* Highlight ring */}
            <motion.div
              className="absolute border-2 border-primary rounded-lg"
              style={{
                left: pos.left - 4,
                top: pos.top - 4,
                width: pos.width + 8,
                height: pos.height + 8,
                pointerEvents: 'none',
              }}
              animate={{ boxShadow: ['0 0 0 0 hsl(var(--primary) / 0.3)', '0 0 0 6px hsl(var(--primary) / 0)', '0 0 0 0 hsl(var(--primary) / 0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            className="fixed z-[101] w-80 rounded-xl border bg-popover p-4 shadow-2xl"
            style={{
              left: tooltipLeft,
              top: isBottom ? pos.top - 180 : tooltipTop,
            }}
            initial={{ opacity: 0, y: isBottom ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            key={currentIndex}
          >
            {/* Arrow */}
            <div
              className="absolute w-3 h-3 bg-popover border rotate-45"
              style={{
                left: Math.min(Math.max(pos.left - tooltipLeft + pos.width / 2 - 6, 16), 280),
                ...(isBottom
                  ? { bottom: -6, borderTop: 'none', borderLeft: 'none' }
                  : { top: -6, borderBottom: 'none', borderRight: 'none' }),
              }}
            />

            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {currentIndex + 1} / {totalSteps}
                </p>
                <h3 className="text-sm font-bold">{t(step.title)}</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1" onClick={onSkip}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{t(step.description)}</p>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={onPrev} disabled={currentIndex === 0} className="gap-1 text-xs h-7">
                <ChevronLeft className="h-3 w-3" /> {t('onboarding.back')}
              </Button>
              <Button size="sm" onClick={onNext} className="gap-1 text-xs h-7 gradient-primary border-0">
                {currentIndex === totalSteps - 1 ? t('onboarding.finish') : t('onboarding.next')}
                {currentIndex < totalSteps - 1 && <ChevronRight className="h-3 w-3" />}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
