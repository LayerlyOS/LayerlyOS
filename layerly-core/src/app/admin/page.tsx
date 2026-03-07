'use client';

import { DataLoader } from '@/components/ui/DataLoader';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminCharts } from '@/features/admin/components/AdminCharts';
import { NotificationTester } from '@/features/admin/components/NotificationTester';
import { AdminStats } from '@/features/admin/components/AdminStats';
import { AdminRecentActivity } from '@/features/admin/components/AdminRecentActivity';
import { formatCurrency } from '@/lib/format';
import { Users, Package, Tag, DollarSign, Printer } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{
    usersCount: number;
    printsCount: number;
    filamentsCount: number;
    revenueByCurrency: Record<string, number>;
    profitByCurrency: Record<string, number>;
    totalWeightInStock: number;
  }>({
    usersCount: 0,
    printsCount: 0,
    filamentsCount: 0,
    revenueByCurrency: {},
    profitByCurrency: {},
    totalWeightInStock: 0,
  });
  const [rawData, setRawData] = useState<{
    users: any[];
    prints: any[];
    filaments: any[];
  }>({ users: [], prints: [], filaments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [uResult, pResult, fResult] = await Promise.allSettled([
          fetch('/api/admin/users'),
          fetch('/api/admin/prints'),
          fetch('/api/admin/filaments'),
        ]);

        const users =
          uResult.status === 'fulfilled' && uResult.value.ok ? await uResult.value.json() : [];
        const prints =
          pResult.status === 'fulfilled' && pResult.value.ok ? await pResult.value.json() : [];
        const filaments =
          fResult.status === 'fulfilled' && fResult.value.ok ? await fResult.value.json() : [];

        if (uResult.status === 'rejected') console.error('Users fetch failed', uResult.reason);
        if (pResult.status === 'rejected') console.error('Prints fetch failed', pResult.reason);
        if (fResult.status === 'rejected') console.error('Filaments fetch failed', fResult.reason);

        const revenueByCurrency: Record<string, number> = {};
        const profitByCurrency: Record<string, number> = {};
        
        prints.forEach((p: any) => {
          const lang = p.user?.settings?.language || 'en';
          const currency = lang === 'pl' ? 'PLN' : 'USD';
          const amount = (p.price || 0) * (p.qty || 1);
          const profit = p.profit || 0;

          revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + amount;
          profitByCurrency[currency] = (profitByCurrency[currency] || 0) + profit;
        });

        const totalWeight = filaments.reduce(
          (acc: number, f: any) => acc + (f.remainingWeight || 0),
          0
        );

        setStats({
          usersCount: users.length,
          printsCount: prints.length,
          filamentsCount: filaments.length,
          revenueByCurrency,
          profitByCurrency,
          totalWeightInStock: totalWeight,
        });

        setRawData({ users, prints, filaments });
      } catch (e) {
        console.error('Failed to fetch stats', e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 min-h-[60vh] flex flex-col items-center justify-center">
        <DataLoader minHeight="full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 min-h-screen bg-slate-50/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome to the Layerly.cloud management center.</p>
        </div>
        <div className="text-sm text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            Today: <span className="font-semibold text-slate-700">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <AdminStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                    Analytics
                 </h3>
                 <AdminCharts users={rawData.users} prints={rawData.prints} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Financial Summary */}
                 <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg border border-slate-700 p-6 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12">
                        <DollarSign size={100} />
                    </div>
                    <h3 className="font-bold text-white mb-2 relative z-10">Net Profit</h3>
                    <p className="text-slate-300 text-sm mb-6 relative z-10">
                        Total profit generated by the system (after deducting costs).
                    </p>
                    <div className="relative z-10 space-y-3">
                        {Object.keys(stats.profitByCurrency).length > 0 ? (
                            Object.entries(stats.profitByCurrency).map(([curr, val]) => (
                                <div key={curr} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${curr === 'USD' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{curr}</span>
                                    </div>
                                    <div className="text-3xl font-bold text-emerald-400">
                                        {formatCurrency(val, curr)}
                                    </div>
                                </div>
                            ))
                        ) : (
                             <div className="text-3xl font-bold text-emerald-400">
                                {formatCurrency(0, 'USD')}
                            </div>
                        )}
                    </div>
                 </div>

                 {/* Quick Actions */}
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Szybkie akcje</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/admin/users" className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-100 group">
                            <Users size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">Users</span>
                        </Link>
                        <Link href="/admin/warehouse" className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors border border-amber-100 group">
                            <Package size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">Warehouse</span>
                        </Link>
                        <Link href="/admin/plans" className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors border border-purple-100 group">
                            <Tag size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">Plans</span>
                        </Link>
                         <Link href="/admin/prints" className="flex flex-col items-center justify-center p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 transition-colors border border-green-100 group">
                            <Printer size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold">Prints</span>
                        </Link>
                    </div>
                 </div>
            </div>
        </div>

        <div className="lg:col-span-1">
            <AdminRecentActivity users={rawData.users} prints={rawData.prints} />
        </div>
      </div>
      
      <div className="mt-8 pt-8 border-t border-slate-200">
         <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Developer tools</h3>
         <NotificationTester />
      </div>
    </div>
  );
}
