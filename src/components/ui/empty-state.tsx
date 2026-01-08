import { motion } from 'motion/react';
import { Card, CardContent } from './card';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

function EmptyIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground/30"
    >
      <rect
        x="16"
        y="20"
        width="48"
        height="40"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 2"
      />
      <circle cx="40" cy="36" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M32 52h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <motion.circle
        cx="40"
        cy="40"
        r="28"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="4 4"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '50%', originY: '50%' }}
      />
    </svg>
  );
}

export function EmptyState({ 
  icon,
  title = 'Tidak Ada Data', 
  message = 'Belum ada data yang tersedia.',
  action 
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {icon || <EmptyIllustration />}
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-4 text-sm sm:text-lg font-semibold"
        >
          {title}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-1 sm:mt-2 max-w-sm text-xs sm:text-sm text-muted-foreground"
        >
          {message}
        </motion.p>
        {action && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-4"
          >
            {action}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
