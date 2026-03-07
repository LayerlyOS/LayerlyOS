'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  Mail,
  Settings,
  Calculator,
  Printer,
  Database,
  ArrowRight,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { FullPageLoader } from '@/components/ui/DataLoader';
import { safeJsonParse } from '@/lib/fetch-json';

interface ProfileUser {
  id: string;
  name?: string | null;
  email?: string;
  emailVerified?: boolean;
  image?: string | null;
  role?: string;
  isAdmin?: boolean;
  subscriptionTier?: string;
  updatedAt?: string | Date;
}

interface Stats {
  quotes: number;
  printers: number;
  filaments: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: sessionData, isPending } = useSession();
  const session = sessionData as { user?: ProfileUser; twoFactorRequired?: boolean } | null;
  const userId = session?.user?.id;
  const twoFactorRequired = !!session?.twoFactorRequired;
  const [authGrace, setAuthGrace] = useState(true);
  const [userData, setUserData] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<Stats>({ quotes: 0, printers: 0, filaments: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      setAuthGrace(false);
      return;
    }
    const t = setTimeout(() => setAuthGrace(false), 900);
    return () => clearTimeout(t);
  }, [userId]);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data = await safeJsonParse(res);
        setUserData(data);
      }
    } catch (e) {
      console.error('Error fetching user data:', e);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchUserData();
  }, [userId, fetchUserData]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setStatsLoading(true);
    Promise.all([
      fetch('/api/prints').then((r) => r.ok ? r.json() : []),
      fetch('/api/printers').then((r) => r.ok ? r.json() : []),
      fetch('/api/filaments?page=1&limit=1').then(async (r) => {
        if (!r.ok) return { pagination: { total: 0 } };
        const data = await safeJsonParse(r);
        return data;
      }),
    ])
      .then(([prints, printersList, filamentsRes]) => {
        if (cancelled) return;
        const totalFilaments = filamentsRes?.pagination?.total ?? 0;
        setStats({
          quotes: Array.isArray(prints) ? prints.length : 0,
          printers: Array.isArray(printersList) ? printersList.length : 0,
          filaments: totalFilaments,
        });
      })
      .catch(() => {
        if (!cancelled) setStats({ quotes: 0, printers: 0, filaments: 0 });
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (isPending || authGrace) return;
    if (userId) return;
    if (twoFactorRequired) {
      router.replace('/two-factor');
      return;
    }
    router.replace('/');
  }, [authGrace, isPending, router, twoFactorRequired, userId]);

  if (isPending || authGrace || !session?.user) {
    return <FullPageLoader />;
  }

  const user = userData || session.user;
  const displayName = user.name?.trim() || user.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
  const roleLabel =
    user.role === 'ADMIN' || user.role === 'admin' || user.isAdmin
      ? 'Admin'
      : 'Account owner';

  const statCards = [
    {
      label: 'Quotes generated',
      value: statsLoading ? '–' : String(stats.quotes),
      icon: <Calculator className="w-6 h-6 text-indigo-500" />,
    },
    {
      label: 'Machines in fleet',
      value: statsLoading ? '–' : String(stats.printers),
      icon: <Printer className="w-6 h-6 text-blue-500" />,
    },
    {
      label: 'Materials in warehouse',
      value: statsLoading ? '–' : String(stats.filaments),
      icon: <Database className="w-6 h-6 text-emerald-500" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
              {user.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-semibold text-slate-500">
                  {initials}
                </span>
              )}
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {displayName}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">{roleLabel}</p>
              <p className="text-sm text-slate-600 mt-2 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{user.email || '–'}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {statCards.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4 hover:border-indigo-200 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                {stat.icon}
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">Account management</h3>
            <p className="text-sm text-indigo-700">
              Change password, update billing details (tax ID), or manage your subscription.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <Settings className="w-4 h-4" /> Go to settings
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
    </div>
  );
}
