import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Automatically dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast Portal/Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border backdrop-blur-md glass-premium"
              style={{
                borderColor: 
                  toast.type === 'success' ? 'rgba(16, 185, 129, 0.3)' :
                  toast.type === 'error' ? 'rgba(239, 68, 68, 0.3)' :
                  toast.type === 'warning' ? 'rgba(245, 158, 11, 0.3)' :
                  'rgba(99, 102, 241, 0.3)'
              }}
            >
              <div className="flex items-center gap-3">
                {toast.type === 'success' && <CheckCircle className="text-emerald-500 shrink-0" size={20} />}
                {toast.type === 'error' && <AlertCircle className="text-rose-500 shrink-0" size={20} />}
                {toast.type === 'warning' && <AlertTriangle className="text-amber-500 shrink-0" size={20} />}
                {toast.type === 'info' && <Info className="text-brand-primary shrink-0" size={20} />}
                
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {toast.message}
                </p>
              </div>
              
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
