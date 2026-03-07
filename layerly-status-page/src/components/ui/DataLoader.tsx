'use client';

import { Loader2 } from 'lucide-react';

interface DataLoaderProps {
  message?: string;
  subtitle?: string;
  minHeight?: 'default' | 'full';
  className?: string;
}

export function DataLoader({
  message = 'Loading...',
  subtitle,
  minHeight = 'default',
  className = '',
}: DataLoaderProps) {
  const minHeightClass = minHeight === 'full' ? 'min-h-[60vh]' : 'min-h-[400px]';

  return (
    <div
      className={`flex flex-col items-center justify-center ${minHeightClass} ${className}`}
      role="status"
      aria-label={message}
    >
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
      <p className="text-sm font-bold text-slate-600">{message}</p>
      {subtitle && (
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <DataLoader message={message} subtitle="Preparing your dashboard" minHeight="full" />
    </div>
  );
}
