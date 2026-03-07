'use client';

import type { ReactNode } from 'react';

/**
 * Reusable page header for dashboard pages (Layerly design system).
 * Renders directly on the page background (e.g. bg-slate-50) – no card, no border, no shadow.
 * Flexbox: left = icon + title + subtitle, right = actions (search, primary button, etc.).
 */
export interface PageHeaderProps {
  /** Main page title */
  title: string;
  /** Optional short description or category label (e.g. "Production management") */
  subtitle?: string;
  /** Optional icon in the indigo box (e.g. Package, Users) */
  icon?: ReactNode;
  /** Right-side content: search input, primary button, filters, etc. */
  actions?: ReactNode;
  /** Optional class for the outer wrapper */
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
