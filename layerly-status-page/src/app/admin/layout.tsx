'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  BarChart3,
  ExternalLink,
  LogOut,
  Settings,
  Shield,
  Wifi,
  Wrench,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { authClient } from '@/lib/auth-client';

const navItems = [
  { href: '/admin',              label: 'Dashboard',   icon: BarChart3 },
  { href: '/admin/monitors',     label: 'Monitors',    icon: Wifi       },
  { href: '/admin/incidents',    label: 'Incidents',   icon: Activity   },
  { href: '/admin/maintenance',  label: 'Maintenance', icon: Wrench     },
  { href: '/admin/settings',     label: 'Settings',    icon: Settings   },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session, isPending } = useSession();
  const [isAdmin, setIsAdmin]               = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    if (isCheckingAdmin || isPending || !session?.user) return;
    let cancelled = false;
    async function checkAdmin() {
      setIsCheckingAdmin(true);
      try {
        const res  = await fetch('/api/admin/me');
        if (!res.ok) {
          if (!cancelled) { setIsAdmin(false); setIsCheckingAdmin(false); }
          return;
        }
        const data = await res.json();
        if (!cancelled) { setIsAdmin(!!data?.isAdmin); setIsCheckingAdmin(false); }
      } catch {
        if (!cancelled) { setIsAdmin(false); setIsCheckingAdmin(false); }
      }
    }
    checkAdmin();
    return () => { cancelled = true; };
  }, [session?.user?.id, isPending]);

  const handleLogout = async () => {
    await authClient.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  /* ── Loading ── */
  if (isPending && !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  /* ── Not authenticated ── */
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">Admin Access Required</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Please sign in to access the admin panel.
          </p>
          <Link href="/login" className="block mt-6">
            <Button variant="primary" fullWidth>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ── Access denied ── */
  if (!isAdmin && !isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-red-50 p-8 flex flex-col items-center border-b border-red-100/60">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-red-600" />
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Access Denied</h1>
            <p className="text-red-600 text-sm font-medium mt-1 text-center">
              You do not have admin access to this status page.
            </p>
          </div>
          <div className="p-6">
            <Button variant="outline" fullWidth onClick={handleLogout}>Sign Out</Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main layout ── */
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-64 bg-slate-950 flex-shrink-0 flex flex-col">

        {/* Logo + label */}
        <div className="px-5 py-5 border-b border-white/[0.05]">
          <Logo variant="light" className="h-7 w-auto" />
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-2.5">
            Admin Panel
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 pt-4">
          {navItems.map((item) => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-300'
                    : 'text-slate-500 hover:text-white hover:bg-white/[0.06]',
                ].join(' ')}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-full" />
                )}
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.05] space-y-0.5">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            View Status Page
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
          {session?.user?.email && (
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-700 uppercase tracking-widest truncate">
              {session.user.email}
            </p>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-x-hidden p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
