'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import { DashboardOverview } from '@/features/dashboard/components/DashboardOverview';
import { PrinterComparison } from '@/features/dashboard/components/PrinterComparison';
import { PrintDetailsModal } from '@/features/prints/components/PrintDetailsModal';
import { getProfit } from '@/features/prints/utils';
import type { PrintEntry, Printer, Settings } from '@/types';

const PrintersModal = dynamic(() => import('@/features/printers/components/PrintersModal'), {
  ssr: false,
});
const FilamentsModal = dynamic(() => import('@/features/filaments/components/FilamentsModal'), {
  ssr: false,
});

type Filament = {
  id: string;
  materialName: string;
  brand: string;
  color: string;
  spoolPrice: number;
  spoolWeight: number;
};

export type DashboardView = 'overview' | 'history' | 'printers-comparison';

interface DashboardProps {
  printHistory: PrintEntry[];
  settings: Settings;
  onEdit: (id: number | string) => void;
  onDelete: (id: number | string) => Promise<boolean> | boolean;
  onDuplicate: (id: number | string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  loading?: boolean;
  /** When set, only this view is rendered (no tabs, no Trash/Printers/Filaments buttons). */
  view?: DashboardView;
  /** For view='overview' only: callback to open printers modal. */
  onOpenPrintersModal?: () => void;
  /** For view='overview' only: e.g. router.push('/dashboard/prints'). */
  onViewAllPrints?: () => void;
}

export function Dashboard({
  printHistory,
  settings,
  onEdit,
  onDelete: _onDelete,
  onDuplicate: _onDuplicate,
  searchTerm,
  onSearchChange: _onSearchChange,
  loading = false,
  view,
  onOpenPrintersModal,
  onViewAllPrints,
}: DashboardProps) {
  const router = useRouter();
  const { success: _success, error: _showError, info: _info } = useToast();
  const [_groupBy] = React.useState<'none' | 'day' | 'week' | 'month'>('none');

  // Filter State (used in filtered; setters unused after history view moved to /dashboard/prints)
  const [dateFrom, _setDateFrom] = React.useState('');
  const [dateTo, _setDateTo] = React.useState('');
  const [selectedBrand, _setSelectedBrand] = React.useState('');
  const [priceFrom, _setPriceFrom] = React.useState('');
  const [priceTo, _setPriceTo] = React.useState('');
  const [selectedPrinterId, _setSelectedPrinterId] = React.useState<number | string | null>(null);

  // Modals State
  const [showPrintersModal, setShowPrintersModal] = React.useState(false);
  const [showFilamentsModal, setShowFilamentsModal] = React.useState(false);
  const [detailsItem, setDetailsItem] = React.useState<PrintEntry | null>(null);
  const [_showTrashModal, _setShowTrashModal] = React.useState(false);

  // Data State
  const [printers, setPrinters] = React.useState<Printer[]>([]);
  const [filaments, setFilaments] = React.useState<Filament[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  // Trash / Delete State
  const [_printToDelete, _setPrintToDelete] = React.useState<number | string | null>(null);
  const [_printToDeletePermanently, _setPrintToDeletePermanently] = React.useState<string | null>(null);
  const [_showEmptyTrashConfirmation, _setShowEmptyTrashConfirmation] = React.useState(false);
  const [_deletedPrints, _setDeletedPrints] = React.useState<PrintEntry[]>([]);
  const [_trashLoading, _setTrashLoading] = React.useState(false);
  const [_actionLoading, _setActionLoading] = React.useState(false);
  const [_isGeneratingPDF, _setIsGeneratingPDF] = React.useState(false);
  const [_isExportingCSV, _setIsExportingCSV] = React.useState(false);
  const [_isExportingJSON, _setIsExportingJSON] = React.useState(false);

  // --- Data Fetching ---

  const fetchPrinters = React.useCallback(async () => {
    try {
      const res = await fetch('/api/printers');
      if (res.ok) {
        const data = (await res.json()) as Printer[];
        setPrinters(data);
      }
    } catch (e) {
      console.error('Error fetching printers:', e);
    }
  }, []);

  React.useEffect(() => {
    const init = async () => {
      await fetchPrinters();
      setHydrated(true);
    };
    init();
  }, [fetchPrinters]);

  React.useEffect(() => {
    const fetchFilaments = async () => {
      try {
        const res = await fetch('/api/filaments?limit=1000');
        if (res.ok) {
          const result = await res.json();
          // biome-ignore lint/suspicious/noExplicitAny: API response handling
          const data = (Array.isArray(result) ? result : result.data || []) as Filament[];
          setFilaments(data);
        }
      } catch (e) {
        console.error('Error fetching filaments:', e);
      }
    };
    fetchFilaments();
  }, []);

  const _fetchTrash = React.useCallback(async () => {
    _setTrashLoading(true);
    try {
      const res = await fetch('/api/trash/prints');
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((p: PrintEntry) => ({ ...p, date: p.date }));
        _setDeletedPrints(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      _setTrashLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (_showTrashModal) _fetchTrash();
  }, [_showTrashModal, _fetchTrash]);

  // --- Filtering & Sorting ---

  const filtered = printHistory.filter((item) => {
    if (!item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (dateFrom && item.date < dateFrom) return false;
    if (dateTo && item.date > dateTo) return false;
    if (selectedBrand && item.brand !== selectedBrand) return false;
    if (selectedPrinterId && String(item.printerId) !== String(selectedPrinterId)) return false;

    const itemProfit = Number(getProfit(item));
    const minProfit = priceFrom !== '' ? Number(priceFrom) : null;
    const maxProfit = priceTo !== '' ? Number(priceTo) : null;

    if (minProfit !== null && itemProfit < minProfit) return false;
    if (maxProfit !== null && itemProfit > maxProfit) return false;

    return true;
  });

  // --- Derived Data for UI ---
  const effectiveView = view ?? 'overview';

  React.useEffect(() => {
    if (view === 'history') router.replace('/dashboard/prints');
  }, [view, router]);

  if (effectiveView === 'history') return null;

  // Printer Comparison view only
  if (effectiveView === 'printers-comparison') {
    return (
      <main className="flex flex-col flex-1 min-h-0 w-full">
        <div className="space-y-6 min-h-0">
          <h1 className="text-xl font-bold text-slate-800">Printer Comparison</h1>
          <PrinterComparison filtered={filtered} printers={printers} hydrated={hydrated} />
        </div>
      </main>
    );
  }

  // Dashboard overview only – no tabs
  return (
    <main className="flex flex-col flex-1 min-h-0 w-full">
      <div className="space-y-6 min-h-0 flex flex-col flex-1">
        <DashboardOverview
          printHistory={printHistory}
          printers={printers}
          filaments={filaments}
          lowStockAlertPercent={settings.lowStockAlertPercent ?? 20}
          loading={loading}
          onEdit={onEdit}
          onOpenPrintersModal={onOpenPrintersModal ?? (() => setShowPrintersModal(true))}
          onViewAllPrints={onViewAllPrints}
          onOpenFilamentModal={() => setShowFilamentsModal(true)}
        />
      </div>

      <PrintDetailsModal
        item={detailsItem}
        onClose={() => setDetailsItem(null)}
        settings={settings}
        printers={printers}
        filaments={filaments}
      />
      <PrintersModal
        isOpen={showPrintersModal}
        onClose={() => setShowPrintersModal(false)}
        onPrinterAdded={() => fetchPrinters()}
      />
      <FilamentsModal isOpen={showFilamentsModal} onClose={() => setShowFilamentsModal(false)} />
    </main>
  );
}
