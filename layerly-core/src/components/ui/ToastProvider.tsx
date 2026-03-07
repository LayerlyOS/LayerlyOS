'use client';

import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';
import type React from 'react';
import { createContext, useCallback, useContext, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastConfig = {
  success: {
    wrapper: 'bg-emerald-50/95 backdrop-blur-sm border border-emerald-200/80 shadow-lg shadow-emerald-900/5',
    iconBox: 'bg-emerald-100 text-emerald-600',
    title: 'text-emerald-800',
    Icon: CheckCircle2,
  },
  error: {
    wrapper: 'bg-red-50/95 backdrop-blur-sm border border-red-200/80 shadow-lg shadow-red-900/5',
    iconBox: 'bg-red-100 text-red-600',
    title: 'text-red-800',
    Icon: AlertCircle,
  },
  info: {
    wrapper: 'bg-indigo-50/95 backdrop-blur-sm border border-indigo-200/80 shadow-lg shadow-indigo-900/5',
    iconBox: 'bg-indigo-100 text-indigo-600',
    title: 'text-indigo-800',
    Icon: Info,
  },
  warning: {
    wrapper: 'bg-amber-50/95 backdrop-blur-sm border border-amber-200/80 shadow-lg shadow-amber-900/5',
    iconBox: 'bg-amber-100 text-amber-600',
    title: 'text-amber-800',
    Icon: AlertTriangle,
  },
};

const toastTitles: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Information',
  warning: 'Warning',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (msg: string) => addToast(msg, 'success');
  const error = (msg: string) => addToast(msg, 'error');
  const info = (msg: string) => addToast(msg, 'info');
  const warning = (msg: string) => addToast(msg, 'warning');

  return (
    <ToastContext.Provider value={{ addToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const config = toastConfig[toast.type];
          const IconComponent = config.Icon;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto min-w-[320px] max-w-md rounded-2xl py-4 px-5 flex items-center gap-4 animate-in slide-in-from-right-full fade-in duration-300 ${config.wrapper}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.iconBox}`}
              >
                <IconComponent className="w-5 h-5" strokeWidth={2.25} />
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <p className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${config.title}`}>
                  {toastTitles[toast.type]}
                </p>
                <p className="text-sm font-medium text-slate-800 leading-snug">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 focus:outline-none focus:ring-2 focus:ring-slate-400/30 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
