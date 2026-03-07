'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  isError: boolean;
  onClose: () => void;
}

export function Toast({ message, isError, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const wrapperClass = isError
    ? 'bg-red-50/95 backdrop-blur-sm border border-red-200/80 shadow-lg shadow-red-900/5'
    : 'bg-emerald-50/95 backdrop-blur-sm border border-emerald-200/80 shadow-lg shadow-emerald-900/5';
  const iconBoxClass = isError
    ? 'bg-red-100 text-red-600'
    : 'bg-emerald-100 text-emerald-600';
  const titleClass = isError ? 'text-red-800' : 'text-emerald-800';

  return (
    <div
      className={`fixed bottom-6 right-6 min-w-[320px] max-w-md py-4 px-5 rounded-2xl border flex items-center gap-4 transform transition-all duration-300 z-50 ${wrapperClass} ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBoxClass}`}>
        {isError ? (
          <AlertCircle className="w-5 h-5" strokeWidth={2.25} />
        ) : (
          <CheckCircle2 className="w-5 h-5" strokeWidth={2.25} />
        )}
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <p className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${titleClass}`}>
          {isError ? 'Error' : 'Success'}
        </p>
        <p className="text-sm font-medium text-slate-800 leading-snug">{message}</p>
      </div>
    </div>
  );
}
