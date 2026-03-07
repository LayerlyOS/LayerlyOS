'use client';

import { Loader2 } from 'lucide-react';

interface DataLoaderProps {
  /** Optional custom message below the spinner */
  message?: string;
  /** Optional secondary line (e.g. "Preparing your farm") */
  subtitle?: string;
  /** Minimum height of the container. Default: min-h-[400px]. Use min-h-[60vh] for full-page. */
  minHeight?: 'default' | 'full';
  className?: string;
}

export function DataLoader({
  message = 'Loading data...',
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

/** Full-page loader for route/session loading (e.g. before auth resolves). */
export function FullPageLoader({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <DataLoader message={message} subtitle="Preparing your farm" minHeight="full" />
    </div>
  );
}
