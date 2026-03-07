'use client';

import { Search } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';
import { formatCurrency } from '@/lib/format';

type AdminFilament = {
  id: string;
  userId: string;
  materialName: string;
  brand: string;
  color: string;
  spoolWeight: number;
  remainingWeight: number | null;
  spoolPrice: number;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  createdAt: string;
  updatedAt: string;
  _count: {
    printEntries: number;
  };
};

export default function AdminWarehousePage() {
  const { success, error: showError } = useToast();
  const [filaments, setFilaments] = useState<AdminFilament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingWarehouse, setUpdatingWarehouse] = useState(false);
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);

  const fetchFilaments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/filaments');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setFilaments(data);
    } catch (_e) {
      showError('Failed to fetch filaments list.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchFilaments();
  }, [fetchFilaments]);

  const handleUpdateWarehouse = () => {
    setShowUpdateConfirmation(true);
  };

  const confirmUpdateWarehouse = async () => {
    setUpdatingWarehouse(true);
    try {
      const res = await fetch('/api/admin/warehouse/update', { method: 'POST' });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      success(data.message);
      fetchFilaments();
    } catch (e) {
      showError('An error occurred while updating warehouse');
      console.error(e);
    } finally {
      setUpdatingWarehouse(false);
      setShowUpdateConfirmation(false);
    }
  };

  const filteredFilaments = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return filaments;
    return filaments.filter((f) => {
      return (
        f.brand.toLowerCase().includes(q) ||
        f.materialName.toLowerCase().includes(q) ||
        f.color.toLowerCase().includes(q) ||
        (f.user?.email || '').toLowerCase().includes(q) ||
        (f.user?.name || '').toLowerCase().includes(q)
      );
    });
  }, [filaments, searchQuery]);

  const groupedFilaments = useMemo(() => {
    const groups: Record<string, AdminFilament[]> = {};
    const normalize = (s: string) => (s ? s.trim().toLowerCase().replace(/\s+/g, '') : '');

    filteredFilaments.forEach((f) => {
      // Group by User + Product Type
      const key = `${f.userId}|${normalize(f.brand)}|${normalize(f.materialName)}|${normalize(f.color)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });

    // Sort spools inside groups by createdAt
    Object.values(groups).forEach((group) => {
      group.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });

    return groups;
  }, [filteredFilaments]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Filament warehouse</h1>
          <p className="text-slate-600">Overview of warehouse stock for all users.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleUpdateWarehouse}
            disabled={loading}
            isLoading={updatingWarehouse}
            loadingText="Updating..."
            variant="indigo"
            leftIcon={<i className="fa-solid fa-rotate"></i>}
            className="font-bold shadow-sm"
          >
            Update warehouse (globally)
          </Button>
          <Button
            onClick={fetchFilaments}
            isLoading={loading}
            loadingText="Refreshing..."
            variant="outline"
            leftIcon={<i className="fa-solid fa-sync"></i>}
            className="font-medium shadow-sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Input
              type="text"
              placeholder="Search by name, brand, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500"
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Filament groups: {Object.keys(groupedFilaments).length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-3 border-b border-slate-200">Product / User</th>
                <th className="px-6 py-3 border-b border-slate-200">Spool status</th>
                <th className="px-6 py-3 border-b border-slate-200 text-right">Weight (g)</th>
                <th className="px-6 py-3 border-b border-slate-200 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-indigo-500"></i>
                    <p>Loading warehouse...</p>
                  </td>
                </tr>
              ) : Object.keys(groupedFilaments).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No filaments.
                  </td>
                </tr>
              ) : (
                Object.entries(groupedFilaments).map(([key, group]) => {
                  const first = group[0];
                  const totalWeight = group.reduce((sum, f) => sum + f.spoolWeight, 0);
                  const totalRemaining = group.reduce(
                    (sum, f) => sum + (f.remainingWeight || 0),
                    0
                  );
                  const percentRemaining =
                    totalWeight > 0 ? (totalRemaining / totalWeight) * 100 : 0;

                  return (
                    <Fragment key={key}>
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <td colSpan={4} className="px-6 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-base">
                                  {first.brand} {first.materialName}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className="inline-block w-3 h-3 rounded-full border border-slate-300 shadow-sm"
                                    style={{ backgroundColor: first.color }}
                                  ></span>
                                  <span className="text-slate-600 text-xs">{first.color}</span>
                                </div>
                              </div>
                              <div className="h-8 w-px bg-slate-300 mx-2"></div>
                              <div className="flex items-center gap-2 text-xs">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                  {first.user?.name?.[0] || 'U'}
                                </div>
                                <span className="text-slate-600">{first.user?.email}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
                                Total in warehouse
                              </div>
                              <div
                                className={`text-sm font-mono font-bold ${percentRemaining < 20 ? 'text-red-600' : 'text-slate-700'}`}
                              >
                                {totalRemaining.toFixed(1)}g / {totalWeight}g
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {group.map((f, idx) => {
                        const isExhausted = (f.remainingWeight || 0) <= 0;
                        const fPercent = ((f.remainingWeight || 0) / f.spoolWeight) * 100;

                        return (
                          <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 pl-12 text-slate-500 flex items-center gap-3">
                              <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                #{idx + 1}
                              </span>
                              <span className="text-xs text-slate-400 font-mono" title="Spool ID">
                                {f.id.split('-')[0]}...
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div
                                    className={`h-full rounded-full ${isExhausted ? 'bg-slate-300' : fPercent < 20 ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.max(0, fPercent)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-slate-500">
                                  {fPercent.toFixed(0)}%
                                </span>
                                {isExhausted && (
                                  <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded">
                                    Used
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-slate-700">
                              {(f.remainingWeight || 0).toFixed(1)}g
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-slate-700">
                              {formatCurrency(f.spoolPrice)}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showUpdateConfirmation}
        onClose={() => setShowUpdateConfirmation(false)}
        onConfirm={confirmUpdateWarehouse}
        title="Warehouse update"
        message={
          'Are you sure you want to recalculate warehouse stock for all users?\n\nWARNING: This will recalculate stock from print history. Manual stock corrections may be overwritten.'
        }
        confirmLabel="Update"
        isDanger={true}
        isLoading={updatingWarehouse}
      />
    </div>
  );
}
