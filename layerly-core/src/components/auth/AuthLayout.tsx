'use client';

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';

/**
 * Auth pages layout – blobs, card, trust badge.
 */
export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Decorative background (Blobs) – full viewport width */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[15%] -right-[5%] w-[90vw] h-[85%] max-w-[1400px] rounded-full bg-indigo-100/60 blur-[100px]" />
        <div className="absolute -bottom-[15%] -left-[5%] w-[85vw] h-[80%] max-w-[1200px] rounded-full bg-purple-100/60 blur-[90px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-[900px] aspect-square rounded-full bg-indigo-50/40 blur-[80px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity w-40 sm:w-48">
            <Logo variant="dark" />
          </Link>
        </div>

        <div className="bg-white py-10 px-6 sm:px-12 shadow-xl shadow-slate-200/50 rounded-[2rem] border border-slate-200 animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{title}</h2>
            <p className="text-sm font-medium text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>

        {/* Security - Trust Badge */}
        <div className="mt-8 text-center animate-in fade-in duration-700 delay-300 relative z-10">
          <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure SSL login
          </p>
        </div>
      </div>
    </div>
  );
}
