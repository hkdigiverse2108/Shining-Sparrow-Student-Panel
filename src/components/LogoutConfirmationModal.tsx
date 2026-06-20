import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const { student } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-6 text-center overflow-hidden"
          >
            {/* Playful top background light */}
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-105 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Mascot Image */}
            <div className="mx-auto w-32 h-32 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-xl scale-95" />
              <img
                src="/mascot.png"
                alt="Mascot Owl"
                className="w-28 h-28 object-contain relative z-10 animate-bounce"
                style={{ animationDuration: '3s' }}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="font-display font-black text-xl text-slate-900 dark:text-white leading-tight">
                Wait! Sparky will miss you! 🦉
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-xs mx-auto">
                Are you sure you want to sign out? Make sure to save your access key so you can return to play!
              </p>
            </div>

            {/* Key Reminder Box */}
            {student?.otr && (
              <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100/30 dark:border-slate-800 rounded-2xl p-3.5 space-y-1">
                <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Your Secret Key
                </span>
                <span className="block font-mono font-black text-lg text-brand-primary dark:text-brand-secondary tracking-widest">
                  {student.otr}
                </span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary/95 hover:scale-[1.01] active:scale-95 text-white font-black rounded-xl text-sm transition-all shadow-md shadow-orange-500/20"
              >
                Stay and Play! 🚀
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 hover:scale-[1.01] active:scale-95 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <LogOut size={14} />
                Yes, Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
