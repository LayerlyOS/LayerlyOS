'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';
import { formatCurrency } from '@/lib/format';

type AdminPrint = {
  id: string;
  userId: string;
  printerId: string;
  filamentId: string | null;
  name: string;
  brand: string | null;
  color: string | null;
  weight: number;
  timeH: number;
  timeM: number;
  qty: number;
  price: number;
  profit: number;
  totalCost: number;
  extraCost: number | null;
  manualPrice: number | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    settings: {
      language: string;
    } | null;
  };
  printer: {
    id: string;
    userId: string;
    name: string;
    model: string | null;
  };
  filament: {
    id: string;
    materialName: string;
    brand: string;
    color: string;
  } | null;
};

export default function AdminPrintsPage() {
  const { error: showError } = useToast();
  const [prints, setPrints] = useState<AdminPrint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPrints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/prints');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setPrints(data);
    } catch (_e) {
      showError('Failed to fetch prints list.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchPrints();
  }, [fetchPrints]);

  const filteredPrints = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return prints;
    return prints.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.user?.email || '').toLowerCase().includes(q) ||
        (p.user?.name || '').toLowerCase().includes(q) ||
        (p.filament?.brand || '').toLowerCase().includes(q) ||
        (p.filament?.materialName || '').toLowerCase().includes(q) ||
        (p.printer?.name || '').toLowerCase().includes(q)
      );
    });
  }, [prints, searchQuery]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prints</h1>
          <p className="text-slate-600">Full history of all user operations.</p>
        </div>
        <Button
          onClick={fetchPrints}
          isLoading={loading}
          loadingText="Refreshing..."
          variant="outline"
          className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
          leftIcon={!loading ? <i className="fa-solid fa-sync"></i> : undefined}
        >
          Refresh
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10"></i>
            <Input
              type="text"
              placeholder="Search prints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">Total: {filteredPrints.length}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-3 border-b border-slate-200">Print / Date</th>
                <th className="px-6 py-3 border-b border-slate-200">User</th>
                <th className="px-6 py-3 border-b border-slate-200">Details</th>
                <th className="px-6 py-3 border-b border-slate-200 text-right">Cost</th>
                <th className="px-6 py-3 border-b border-slate-200 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-blue-500"></i>
                    <p>Loading prints...</p>
                  </td>
                </tr>
              ) : filteredPrints.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No search results.
                  </td>
                </tr>
              ) : (
                filteredPrints.map((print) => (
                  <tr key={print.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{print.name}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <i className="fa-regular fa-calendar"></i>
                        {new Date(print.date).toLocaleDateString('en-GB')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {print.user?.name?.[0] || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-700">
                            {print.user?.name || 'No name'}
                          </span>
                          <span className="text-xs text-slate-400">{print.user?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-xs text-slate-600 flex items-center gap-2">
                          <i className="fa-solid fa-cube w-4 text-center text-slate-400"></i>
                          {print.printer?.name}
                        </div>
                        {print.filament ? (
                          <div className="text-xs text-slate-600 flex items-center gap-2">
                            <i
                              className="fa-solid fa-circle-notch w-4 text-center"
                              style={{ color: print.filament.color }}
                            ></i>
                            {print.filament.brand} {print.filament.materialName}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <i className="fa-solid fa-ban w-4 text-center"></i>
                            No filament
                          </div>
                        )}
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <i className="fa-solid fa-weight-hanging w-4 text-center text-slate-400"></i>
                          {print.weight}g × {print.qty} szt.
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600">
                      {formatCurrency(
                        print.totalCost,
                        print.user.settings?.language === 'pl' ? 'PLN' : 'USD'
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-mono font-bold ${
                          print.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {print.profit > 0 ? '+' : ''}
                        {formatCurrency(
                          print.profit,
                          print.user.settings?.language === 'pl' ? 'PLN' : 'USD'
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
