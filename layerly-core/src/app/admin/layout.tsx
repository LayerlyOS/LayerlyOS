'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/Button';
import { safeJsonParse } from '@/lib/fetch-json';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Get data from user_profiles (includes isAdmin and role)
  useEffect(() => {
    // Don't check again if already checking or if no user
    if (isCheckingAdmin || isPending || !session?.user) {
      return;
    }
    
    let cancelled = false;
    async function checkAdmin() {
      setIsCheckingAdmin(true);
      
      try {
        const res = await fetch('/api/user/me');
        if (!res.ok) {
          if (!cancelled) {
            setIsAdmin(false);
            setIsCheckingAdmin(false);
          }
          return;
        }
        const userData = await safeJsonParse(res);
        // Check both isAdmin and role === 'ADMIN'
        const adminStatus = !!(userData?.isAdmin || userData?.role === 'ADMIN');
        if (!cancelled) {
          setIsAdmin(adminStatus);
          setIsCheckingAdmin(false);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setIsCheckingAdmin(false);
        }
      }
    }
    
    checkAdmin();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isCheckingAdmin stable; session?.user omitted to avoid rerun on object reference change
  }, [session?.user?.id, isPending]);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: 'fa-chart-line' },
    { href: '/admin/users', label: 'Users', icon: 'fa-users' },
    { href: '/admin/warehouse', label: 'Warehouse', icon: 'fa-boxes-stacked' },
    { href: '/admin/prints', label: 'Prints', icon: 'fa-print' },
    { href: '/admin/plans', label: 'Subscription plans', icon: 'fa-tags' },
    { href: '/admin/notifications', label: 'Notifications', icon: 'fa-bell' },
    { href: '/admin/settings', label: 'Settings', icon: 'fa-gear' },
    { href: '/admin/activity', label: 'Activity log', icon: 'fa-history' },
  ];

  // If session is loading and no user – show minimal loader
  if (isPending && !session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If user not logged in – redirect (proxy should handle it, but just in case)
  if (!isPending && !session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-slate-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Only when check is done, user is logged in and is not admin
  // Show "Access denied" only when check is done and user is not admin
  // Panel shows immediately (check in background) — no "Verifying permissions" state
  if (!isAdmin && !isCheckingAdmin && session?.user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-red-50/50 p-8 flex flex-col items-center border-b border-red-100">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-red-100 relative group">
              <div className="absolute inset-0 bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
              <i className="fa-solid fa-user-shield text-4xl text-red-500 relative z-10"></i>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Access denied</h1>
            <p className="text-red-600 text-sm font-medium mt-1">Admin area</p>
          </div>
          
          <div className="p-8 text-center space-y-6">
            <p className="text-slate-600 leading-relaxed">
              You do not have permission to view this page.
              This area is protected and available only to administrative staff.
            </p>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-500 flex flex-col items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Your status</span>
              <div className="flex items-center gap-2 text-slate-700 font-medium bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                <i className="fa-regular fa-id-badge text-blue-500"></i>
                User
              </div>
            </div>

            <Link href="/dashboard" className="block w-full">
              <Button 
                variant="primary" 
                fullWidth 
                size="lg"
                className="shadow-md hover:shadow-lg transition-shadow"
                leftIcon={<i className="fa-solid fa-chevron-left"></i>}
              >
                Back to dashboard
              </Button>
            </Link>
          </div>
          
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              ID Sesji: <span className="font-mono">{session?.user?.id?.slice(0, 8)}...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-50 min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 shadow-sm flex-shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Panel</h2>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            // Normalize pathname by removing locale prefix (e.g. /pl/admin -> /admin)
            const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');

            // For dashboard (/admin), exact match is required to avoid highlighting on subpages
            // For other pages, check if path starts with the href
            const isActive =
              item.href === '/admin'
                ? pathWithoutLocale === '/admin'
                : pathWithoutLocale.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <i
                  className={`fa-solid ${item.icon} w-5 text-center ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                ></i>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
