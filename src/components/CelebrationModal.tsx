import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  buttonText?: string;
  showConfetti?: boolean;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  buttonText = "Let's Go!",
  showConfetti = true,
}) => {
  useEffect(() => {
    if (isOpen && showConfetti) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.7 },
          colors: ['#f97316', '#fb923c', '#fdba74', '#fbbf24', '#34d399'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.7 },
          colors: ['#f97316', '#fb923c', '#fdba74', '#fbbf24', '#34d399'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fb923c', '#fdba74', '#fbbf24', '#34d399'],
      });
    }
  }, [isOpen, showConfetti]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-8 shadow-2xl z-10 text-center overflow-hidden"
          >
            <div className="absolute -top-16 -left-16 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
              className="mx-auto w-36 h-36 flex items-center justify-center relative"
            >
              <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-2xl scale-95" />
              <img
                src="/mascot.png"
                alt="Mascot"
                className="w-32 h-32 object-contain relative z-10"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2 mt-4"
            >
              <h3 className="font-display font-black text-2xl text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {subtitle}
                </p>
              )}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={onClose}
              className="mt-6 w-full py-3.5 bg-brand-primary hover:bg-brand-primary/95 hover:scale-[1.02] active:scale-95 text-white font-black rounded-xl text-sm transition-all shadow-md shadow-orange-500/20"
            >
              {buttonText}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
