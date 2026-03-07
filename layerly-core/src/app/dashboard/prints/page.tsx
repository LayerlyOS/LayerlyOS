'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { FullPageLoader } from '@/components/ui/DataLoader';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { PrintHistoryView } from '@/features/prints/components/PrintHistoryView';
import { TrashModal } from '@/features/prints/components/TrashModal';
import { getCost, getPrice, getProfit } from '@/features/prints/utils';
import { generatePrintsReportPDF } from '@/features/prints/utils/pdf-generator';
import { formatCurrency } from '@/lib/format';
import { safeJsonParse } from '@/lib/fetch-json';
import { Trash2, ChevronDown, History } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import type { PrintEntry, Printer, Settings, AdvancedSettings } from '@/types';

type FilamentLike = {
  id: string;
  materialName?: string;
  brand: string;
  color: string;
  colorHex?: string | null;
  spoolPrice?: number;
  spoolWeight?: number;
};

interface ApiPrintResponse {
  id: string;
  name: string;
  brand?: string;
  color?: string;
  weight: number;
  timeH: number;
  timeM: number;
  qty: number;
  date: string;
  printerId: string;
  filamentId: string;
  filament: unknown;
  orderId?: string | null;
  order?: {
    title: string;
    customerName: string;
    status: string;
  } | null;
  totalCost: number;
  price: number;
  profit: number;
  extraCost?: number;
  manualPrice?: number;
  advancedSettings?: unknown;
  calculatorSnapshot?: unknown;
  status?: string;
  operatorName?: string | null;
  notes?: string | null;
  errorReason?: string | null;
}

function mapApiPrintToEntry(p: ApiPrintResponse): PrintEntry {
  const status = p.status === 'failed' || p.status === 'canceled' ? p.status : 'success';
  return {
    id: p.id,
    name: p.name,
    brand: p.brand || '',
    color: p.color || '',
    weight: p.weight,
    timeH: p.timeH,
    timeM: p.timeM,
    qty: p.qty,
    date: new Date(p.date).toISOString(),
    printerId: p.printerId,
    filamentId: p.filamentId,
    filament: p.filament as PrintEntry['filament'],
    orderId: p.orderId ?? null,
    orderTitle: p.order?.title ?? null,
    orderCustomerName: p.order?.customerName ?? null,
    orderStatus: (p.order?.status as PrintEntry['orderStatus']) ?? null,
    totalCost: p.totalCost,
    price: p.price,
    profit: p.profit,
    extraCost: p.extraCost || undefined,
    manualPrice: p.manualPrice || undefined,
    advancedSettings: (p.advancedSettings as AdvancedSettings) || null,
    calculatorSnapshot: p.calculatorSnapshot ?? null,
    status,
    operatorName: p.operatorName ?? null,
    notes: p.notes ?? null,
    errorReason: p.errorReason ?? null,
  };
}

export default function PrintsPage() {
  const router = useRouter();
  const { success: showSuccess, error: showError, info } = useToast();
  const { data: session, isPending } = useSession();
  const { features } = useSubscription();
  const userId = session?.user?.id;
  const [authGrace, setAuthGrace] = useState(true);
  const [printHistory, setPrintHistory] = useState<PrintEntry[]>([]);
  const [settings, setSettings] = useState<Settings>({
    power: 200,
    energyRate: 1.15,
    spoolPrice: 69.9,
    spoolWeight: 1000,
  });
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [filaments, setFilaments] = useState<FilamentLike[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTrashModal, setShowTrashModal] = useState(false);
  const [printToDelete, setPrintToDelete] = useState<string | number | null>(null);
  const [printToDeletePermanently, setPrintToDeletePermanently] = useState<string | null>(null);
  const [showEmptyTrashConfirmation, setShowEmptyTrashConfirmation] = useState(false);
  const [deletedPrints, setDeletedPrints] = useState<PrintEntry[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  useEffect(() => {
    if (userId) setAuthGrace(false);
    else {
      const t = setTimeout(() => setAuthGrace(false), 2000);
      return () => clearTimeout(t);
    }
  }, [userId]);

  useEffect(() => {
    if (!isPending && !authGrace && !userId) {
      router.replace('/login');
    }
  }, [authGrace, isPending, router, userId]);

  const fetchPrints = useCallback(async () => {
    try {
      const res = await fetch('/api/prints');
      if (res.ok) {
        const data = await safeJsonParse<ApiPrintResponse[]>(res);
        setPrintHistory(data.map(mapApiPrintToEntry));
      }
    } catch (e) {
      console.error('Error fetching prints:', e);
      showError('Error loading prints');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await safeJsonParse(res);
        setSettings({
          power: 200,
          energyRate: data.energyRate || 1.15,
          spoolPrice: 69.9,
          spoolWeight: 1000,
          defaultPrinterId: data.defaultPrinterId,
        });
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  }, []);

  const fetchPrinters = useCallback(async () => {
    try {
      const res = await fetch('/api/printers');
      if (res.ok) {
        const data = await safeJsonParse<Printer[]>(res);
        setPrinters(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error fetching printers:', e);
    }
  }, []);

  const fetchFilaments = useCallback(async () => {
    try {
      const res = await fetch('/api/filaments?limit=1000');
      if (res.ok) {
        const result = await safeJsonParse(res);
        const data = Array.isArray(result) ? result : (result as { data?: FilamentLike[] })?.data ?? [];
        setFilaments(data);
      }
    } catch (e) {
      console.error('Error fetching filaments:', e);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchPrints();
      fetchSettings();
      fetchPrinters();
      fetchFilaments();
    }
  }, [userId, fetchPrints, fetchSettings, fetchPrinters, fetchFilaments]);

  const fetchTrash = useCallback(async () => {
    setTrashLoading(true);
    try {
      const res = await fetch('/api/trash/prints');
      if (res.ok) {
        const data = await safeJsonParse<PrintEntry[]>(res);
        setDeletedPrints(data ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTrashLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showTrashModal) fetchTrash();
  }, [showTrashModal, fetchTrash]);

  const handleDelete = async (id: string | number) => {
    try {
      const res = await fetch(`/api/prints/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showSuccess('Print moved to trash');
        fetchPrints();
        return true;
      }
      showError('Error deleting');
      return false;
    } catch (e) {
      console.error(e);
      showError('Connection error');
      return false;
    }
  };

  const handleEdit = (id: string | number) => {
    router.push('/dashboard/calculator?edit=' + encodeURIComponent(String(id)));
  };

  const handleDuplicate = async (id: string | number) => {
    const original = printHistory.find((p) => String(p.id) === String(id));
    if (!original) return;
    try {
      const res = await fetch('/api/prints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: original.printerId,
          filamentId: original.filamentId || null,
          orderId: null,
          name: `${original.name} (Copy)`,
          brand: original.brand,
          color: original.color,
          weight: original.weight,
          timeH: original.timeH,
          timeM: original.timeM,
          qty: original.qty,
          price: original.price,
          profit: original.profit,
          totalCost: original.totalCost,
          extraCost: original.extraCost,
          manualPrice: original.manualPrice,
          advancedSettings: original.advancedSettings,
          calculatorSnapshot: original.calculatorSnapshot ?? null,
          status: original.status ?? 'success',
          operatorName: (session?.user as { name?: string } | undefined)?.name ?? undefined,
          notes: original.notes ?? null,
          errorReason: original.errorReason ?? null,
        }),
      });
      if (res.ok) {
        showSuccess('Print duplicated');
        fetchPrints();
      } else {
        showError('Error duplicating');
      }
    } catch (e) {
      console.error(e);
      showError('Connection error');
    }
  };

  const confirmDelete = async () => {
    if (!printToDelete) return;
    setActionLoading(true);
    try {
      await handleDelete(printToDelete);
    } finally {
      setActionLoading(false);
      setPrintToDelete(null);
    }
  };

  const confirmDeletePermanently = async () => {
    if (!printToDeletePermanently) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trash/prints/${printToDeletePermanently}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletedPrints((prev) => prev.filter((p) => p.id !== printToDeletePermanently));
        showSuccess('Item deleted permanently');
      } else {
        showError('Delete error');
      }
    } catch (e) {
      console.error(e);
      showError('Connection error');
    } finally {
      setActionLoading(false);
      setPrintToDeletePermanently(null);
    }
  };

  const handleEmptyTrash = () => setShowEmptyTrashConfirmation(true);

  const confirmEmptyTrash = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/trash/prints/empty', { method: 'DELETE' });
      if (res.ok) {
        setDeletedPrints([]);
        showSuccess('Trash emptied');
      } else {
        showError('Error emptying trash');
      }
    } catch (e) {
      console.error(e);
      showError('Connection error');
    } finally {
      setActionLoading(false);
      setShowEmptyTrashConfirmation(false);
    }
  };

  const sorted = [...printHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const exportToCSV = async () => {
    if (!features.csvExport) return;
    setIsExportingCSV(true);
    await new Promise((r) => setTimeout(r, 300));
    try {
      const headers = [
        'Date', 'Project', 'Order', 'Brand', 'Color', 'Time (h)', 'Time (m)',
        'Weight (g)', 'Qty', 'Total weight (g)', 'Cost', 'Price', 'Profit', 'Manual Price', 'Status',
      ];
      const rows = sorted.map((item) => [
        item.date, item.name, item.orderTitle || '', item.brand, item.color,
        item.timeH, item.timeM, item.weight, item.qty, item.weight * item.qty,
        formatCurrency(getCost(item)), formatCurrency(getPrice(item)), formatCurrency(getProfit(item)),
        (item.manualPrice ?? 0) > 0 ? 'Yes' : 'No', item.status ?? 'success',
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `print_history_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (e) {
      console.error(e);
      showError('CSV export error');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const exportToJSON = async () => {
    setIsExportingJSON(true);
    await new Promise((r) => setTimeout(r, 300));
    try {
      const blob = new Blob(
        [JSON.stringify({ exportDate: new Date().toISOString(), printHistory: sorted }, null, 2)],
        { type: 'application/json' }
      );
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `prints_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) {
      console.error(e);
      showError('Export error');
    } finally {
      setIsExportingJSON(false);
    }
  };

  const generatePDF = async () => {
    if (!features.pdfExport) return;
    setIsGeneratingPDF(true);
    try {
      await generatePrintsReportPDF(sorted);
      showSuccess('PDF generated');
    } catch (e) {
      console.error(e);
      showError('PDF error');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const importFromJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as { printHistory?: PrintEntry[] };
          if (!data.printHistory || !Array.isArray(data.printHistory)) {
            showError('Invalid JSON: missing "printHistory"');
            return;
          }
          info('Import not supported in this view. Use calculator to add prints.');
        } catch (err) {
          showError('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if ((isPending || authGrace) && !userId) return <FullPageLoader />;
  if (!userId) return null;
  if (loading) return <FullPageLoader />;

  return (
    <>
        <PageHeader
          icon={<History className="w-6 h-6" />}
          title="Print History"
          subtitle="Full log of jobs, parameters and cost calculation"
          actions={
            <>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold shrink-0"
                  onClick={() => setExportDropdownOpen((o) => !o)}
                >
                  Export <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
                {exportDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      aria-hidden
                      onClick={() => setExportDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 py-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 min-w-[160px]">
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 rounded-lg mx-1"
                        onClick={() => { generatePDF(); setExportDropdownOpen(false); }}
                        disabled={!features.pdfExport || isGeneratingPDF}
                      >
                        {isGeneratingPDF ? 'Generating…' : 'PDF'}
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 rounded-lg mx-1"
                        onClick={() => { exportToCSV(); setExportDropdownOpen(false); }}
                        disabled={!features.csvExport || isExportingCSV}
                      >
                        {isExportingCSV ? 'Exporting…' : 'CSV'}
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg mx-1"
                        onClick={() => { exportToJSON(); setExportDropdownOpen(false); }}
                        disabled={isExportingJSON}
                      >
                        {isExportingJSON ? 'Exporting…' : 'JSON'}
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg mx-1"
                        onClick={() => { importFromJSON(); setExportDropdownOpen(false); }}
                      >
                        Import JSON
                      </button>
                    </div>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-bold shrink-0"
                onClick={() => setShowTrashModal(true)}
                title="Trash"
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Trash</span>
              </Button>
            </>
          }
        />
        <div className="mt-8">
          <PrintHistoryView
            printHistory={printHistory}
            settings={settings}
            printers={printers}
            filaments={filaments}
            onEdit={handleEdit}
            onRequestDelete={setPrintToDelete}
            onDuplicate={handleDuplicate}
            onSaved={fetchPrints}
            operatorName={(session?.user as { name?: string } | undefined)?.name}
          />
        </div>

      <TrashModal
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
        deletedPrints={deletedPrints}
        onEmptyTrash={handleEmptyTrash}
        onDeletePermanently={setPrintToDeletePermanently}
        isLoading={trashLoading}
      />
      <ConfirmationModal
        isOpen={!!printToDelete}
        onClose={() => setPrintToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete print"
        message="Move this print to trash?"
        confirmLabel="Delete"
        isDanger
        isLoading={actionLoading}
      />
      <ConfirmationModal
        isOpen={!!printToDeletePermanently}
        onClose={() => setPrintToDeletePermanently(null)}
        onConfirm={confirmDeletePermanently}
        title="Delete permanently"
        message="This cannot be undone. Delete this print permanently?"
        confirmLabel="Delete"
        isDanger
        isLoading={actionLoading}
      />
      <ConfirmationModal
        isOpen={showEmptyTrashConfirmation}
        onClose={() => setShowEmptyTrashConfirmation(false)}
        onConfirm={confirmEmptyTrash}
        title="Empty trash"
        message="Delete all items in trash permanently? This cannot be undone."
        confirmLabel="Empty trash"
        isDanger
        isLoading={actionLoading}
      />
    </>
  );
}
