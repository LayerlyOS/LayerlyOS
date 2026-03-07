'use client';

import {
  DollarSign,
  MapPin,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { DataLoader } from '@/components/ui/DataLoader';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useToast } from '@/components/ui/ToastProvider';
import { formatDate } from '@/lib/format';
import type { Printer as PrinterType } from '@/types';
import type { PrinterCardData, PrinterStatus } from './PrinterCard';
import PrintersModal from './PrintersModal';

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PrinterStatus, { label: string; badge: string; dot: string; pulse: boolean }> = {
  available:   { label: 'Available',    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', pulse: true },
  in_use:      { label: 'In use',       badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',   dot: 'bg-indigo-500',  pulse: false },
  maintenance: { label: 'Maintenance',  badge: 'bg-amber-100 text-amber-700 border-amber-200',      dot: 'bg-amber-500',   pulse: false },
};

const TYPE_CONFIG: Record<string, string> = {
  FDM: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  SLA: 'bg-purple-50 text-purple-600 border-purple-100',
  SLS: 'bg-amber-50 text-amber-600 border-amber-100',
};

const FILTER_TABS: { id: PrinterStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'in_use', label: 'In use' },
  { id: 'maintenance', label: 'Maintenance' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PrinterStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}>
      <span className="relative flex h-1.5 w-1.5">
        {cfg.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`} />}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
      </span>
      {cfg.label}
    </span>
  );
}

// ─── Main view ─────────────────────────────────────────────────────────────────

export default function PrintersView() {
  const { success, error: showError } = useToast();
  const { checkPrinterLimit, maxPrinters, isUnlimitedPrinters } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPrinterId, setEditingPrinterId] = useState<string | null>(null);

  const [printers, setPrinters] = useState<PrinterCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<PrinterStatus | 'all'>('all');

  const [itemToDelete, setItemToDelete] = useState<string | number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPrinters = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/printers');
      if (res.ok) {
        const data: PrinterType[] = await res.json();
        setPrinters(
          data.map((p) => ({
            ...p,
            status: (p.status ?? 'available') as PrinterStatus,
            type: p.type ?? 'FDM',
            location: p.location ?? null,
            lastMaintenance: p.lastMaintenance ?? p.purchaseDate ?? null,
            material: p.material
              ? {
                  type: p.material.materialType ?? p.material.materialName,
                  color: p.material.colorHex ?? p.material.color ?? '#64748b',
                  name: p.material.materialName,
                }
              : null,
            ip: p.ipAddress ?? null,
          }))
        );
      }
    } catch (e) {
      console.error('Error fetching printers:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrinters(); }, [fetchPrinters]);

  const filtered = printers.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.model.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const totalCount      = printers.length;
  const availableCount  = printers.filter((p) => p.status === 'available').length;
  const inUseCount      = printers.filter((p) => p.status === 'in_use').length;
  const maintenanceCount = printers.filter((p) => p.status === 'maintenance').length;

  const handleAdd = () => {
    if (!checkPrinterLimit(printers.length)) { setShowUpgradeModal(true); return; }
    setEditingPrinterId(null);
    setShowModal(true);
  };

  const handleEdit = (printer: PrinterCardData) => {
    setEditingPrinterId(printer.id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPrinterId(null);
    fetchPrinters();
  };

  const handleDelete = (id: string | number) => {
    if (printers.length <= 1) { showError('Cannot delete the last printer'); return; }
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (itemToDelete === null) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/printers/${itemToDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchPrinters();
      success('Printer deleted');
    } catch {
      showError('Failed to delete printer');
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  return (
    <>

        {/* ── Page Header ── */}
        <PageHeader
          title="Machine Fleet"
          subtitle="Printers, materials & service log"
          icon={<Printer className="w-6 h-6" />}
          actions={
            <div className="flex items-center gap-4">
              {!isUnlimitedPrinters && printers.length > 0 && (
                <span className="text-xs font-medium text-slate-500 hidden sm:block">
                  {printers.length} / {maxPrinters} printers
                </span>
              )}
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add machine
              </button>
            </div>
          }
        />

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-0.5">Total machines</p>
              <h3 className="text-2xl font-black text-slate-900">{totalCount}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-0.5">Available</p>
              <h3 className="text-2xl font-black text-slate-900">{availableCount}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-0.5">In use</p>
              <h3 className="text-2xl font-black text-slate-900">{inUseCount}</h3>
            </div>
          </div>
          <div className={`rounded-2xl p-6 border shadow-sm flex items-center gap-4 ${maintenanceCount > 0 ? 'bg-amber-50/30 border-amber-200' : 'bg-white border-slate-200'}`}>
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-sm font-medium mb-0.5 ${maintenanceCount > 0 ? 'text-amber-800' : 'text-slate-500'}`}>Maintenance</p>
              <h3 className={`text-2xl font-black ${maintenanceCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {maintenanceCount} <span className={`text-sm font-bold ${maintenanceCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>printers</span>
              </h3>
            </div>
          </div>
        </div>

        {/* ── Main table card ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Toolbar inside card */}
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full sm:w-72">
              <SearchInput
                placeholder="Search by name or model…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="sm"
              />
            </div>
            {/* Filter pills */}
            <nav className="flex rounded-xl bg-slate-100/80 p-1 border border-slate-200/80 w-fit shrink-0">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    filter === tab.id
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="min-h-[400px]">
              <DataLoader className="min-h-[400px]" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Printer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 hidden md:table-cell">Power</th>
                    <th className="px-6 py-4 hidden md:table-cell">Cost / h</th>
                    <th className="px-6 py-4 hidden lg:table-cell">Material</th>
                    <th className="px-6 py-4 hidden lg:table-cell">Location</th>
                    <th className="px-6 py-4 hidden xl:table-cell">Last check</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((printer) => {
                    const status: PrinterStatus = printer.status ?? 'available';
                    const typeLabel = printer.type ?? 'FDM';
                    const typeClass = TYPE_CONFIG[typeLabel] ?? 'bg-slate-50 text-slate-500 border-slate-100';
                    const lastCheckRaw = printer.lastMaintenance ?? printer.purchaseDate;
                    const lastCheck = lastCheckRaw ? formatDate(lastCheckRaw) : '—';

                    return (
                      <tr key={printer.id} className="hover:bg-slate-50/80 transition-colors group">

                        {/* Printer name + model */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              <Printer className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{printer.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-xs text-slate-500">{printer.model}</p>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${typeClass}`}>
                                  {typeLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <StatusBadge status={status} />
                        </td>

                        {/* Power */}
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-semibold text-slate-700">
                              {printer.power ? `${printer.power} W` : '—'}
                            </span>
                          </div>
                        </td>

                        {/* Cost per hour */}
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="font-semibold text-slate-700">
                              {printer.costPerHour ? `$${printer.costPerHour.toFixed(2)}` : '—'}
                            </span>
                          </div>
                        </td>

                        {/* Material */}
                        <td className="px-6 py-4 hidden lg:table-cell">
                          {printer.material ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full border-2 border-white shadow-md ring-1 ring-slate-200 shrink-0"
                                style={{ backgroundColor: printer.material.color }}
                              />
                              <span className="text-xs font-semibold text-slate-700 truncate max-w-[100px]">
                                {printer.material.type ?? printer.material.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">No spool</span>
                          )}
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            {printer.location ? (
                              <>
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-medium truncate max-w-[100px]">{printer.location}</span>
                              </>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                        </td>

                        {/* Last check */}
                        <td className="px-6 py-4 hidden xl:table-cell">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium">{lastCheck}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(printer)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(printer.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                {searchTerm || filter !== 'all'
                  ? <Search className="w-7 h-7 text-slate-400" />
                  : <Printer className="w-7 h-7 text-slate-400" />}
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-1">
                  {searchTerm || filter !== 'all' ? 'No results found' : 'No printers yet'}
                </p>
                <p className="text-sm font-medium text-slate-500">
                  {searchTerm || filter !== 'all'
                    ? 'Try adjusting your search or filter.'
                    : 'Add your first 3D printer to start tracking.'}
                </p>
              </div>
              {(searchTerm || filter !== 'all') ? (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setFilter('all'); }}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200"
                >
                  <Plus className="w-4 h-4" /> Add first machine
                </button>
              )}
            </div>
          )}
        </div>

      <PrintersModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onPrinterAdded={fetchPrinters}
        initialEditingPrinterId={editingPrinterId}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade Plan"
        description={`You have reached the limit of ${maxPrinters} printers. Upgrade to add more.`}
      />

      <ConfirmationModal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete printer?"
        message="Are you sure you want to delete this printer? This action cannot be undone."
        confirmLabel="Delete printer"
        isDanger
        isLoading={isDeleting}
      />
    </>
  );
}
