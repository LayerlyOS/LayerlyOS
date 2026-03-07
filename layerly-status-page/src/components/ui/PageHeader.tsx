'use client';

import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon, actions, className = '' }: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 ${className}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        {icon != null && (
          <div
            className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0 hidden sm:flex"
            aria-hidden
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none truncate">
            {title}
          </h1>
          {subtitle != null && subtitle !== '' && (
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions != null && (
        <div className="flex items-center gap-4 w-full sm:w-auto shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
