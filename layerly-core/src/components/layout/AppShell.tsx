'use client';

import { useEffect, useState } from 'react';
import { AppFooter } from '@/components/layout/AppFooter';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { FullPageLoader } from '@/components/ui/DataLoader';
import { PlanProvider } from '@/features/subscription/PlanProvider';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import type { PlanConfig } from '@/config/subscription';

export function AppShell({
  children,
  initialPlan,
}: {
  children: React.ReactNode;
  initialPlan: PlanConfig;
}) {
  const [mounted, setMounted] = useState(false);
  const [authGrace, setAuthGrace] = useState(true);
  const { isPending, data: session } = useSession();
  const pathname = usePathname();
  const isKnownRoute =
    pathname === '/' ||
    pathname === '/contact' ||
    pathname === '/legal' ||
    pathname?.startsWith('/help') ||
    pathname === '/login' ||
    pathname === '/reset-password' ||
    pathname === '/two-factor' ||
    pathname === '/_not-found' ||
    pathname?.startsWith('/order') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/admin');
  const isProtectedRoute = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin');
  const shouldBypassChrome = pathname === '/_not-found' || !isKnownRoute;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Grace period for OAuth callback - give time for cookie to be set
  useEffect(() => {
    if (!isProtectedRoute) {
      setAuthGrace(false);
      return;
    }

    if (session?.user) {
      setAuthGrace(false);
      return;
    }

    // In production, give more time for cookie to be set after OAuth
    const graceTime = process.env.NODE_ENV === 'production' ? 5000 : 3000;
    setAuthGrace(true);
    const t = setTimeout(() => setAuthGrace(false), graceTime);
    return () => clearTimeout(t);
  }, [isProtectedRoute, session?.user]);

  if (shouldBypassChrome) return <>{children}</>;
  // Don't show skeleton for landing page on isPending to avoid scroll reset
  // Single Loader Principle: for dashboard/admin do not show loader here – let the page show one loader (but keep providers)
  if (!mounted) {
    if (pathname?.startsWith('/order')) return <>{children}</>;
    if (pathname === '/login' || pathname === '/reset-password' || pathname === '/two-factor')
      return <>{children}</>;
    if (pathname === '/') return <FullPageLoader />;
    if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')) {
      return (
        <PlanProvider initial={initialPlan}>
          <NotificationProvider>
            <div className="flex flex-col flex-1 min-h-screen">{children}</div>
          </NotificationProvider>
        </PlanProvider>
      );
    }
    if (pathname !== '/') return <FullPageLoader />;
  }

  if (
    pathname === '/login' ||
    pathname === '/reset-password' ||
    pathname === '/two-factor' ||
    pathname === '/' ||
    pathname === '/contact' ||
    pathname?.startsWith('/help') ||
    pathname === '/legal' ||
    pathname?.startsWith('/order')
  ) {
    return <>{children}</>;
  }

  // Security check: If not pending and no session on protected routes, do not render Layout/Header.
  if (isProtectedRoute && !isPending && !authGrace && !session) {
    return null;
  }

  // Dashboard has its own layout (sidebar + header) in app/dashboard/layout.tsx
  if (pathname?.startsWith('/dashboard')) {
    return (
      <PlanProvider initial={initialPlan}>
        <NotificationProvider>
          <div className="flex flex-col flex-1 min-h-screen">{children}</div>
        </NotificationProvider>
      </PlanProvider>
    );
  }

  // Admin and other protected routes – legacy header + footer
  return (
    <PlanProvider initial={initialPlan}>
      <NotificationProvider>
        <DashboardHeader />
        <div className="flex-1 flex flex-col">{children}</div>
        <AppFooter />
      </NotificationProvider>
    </PlanProvider>
  );
}
