import { Copy, FileText, Inbox, Info, Lock, Pencil, Trash2, Download, Upload, FileSpreadsheet, Clock, Weight, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { getCost, getPrice, getProfit } from '@/features/prints/utils';
import { useSubscription } from '@/hooks/useSubscription';
import { formatCurrency, formatDate } from '@/lib/format';
import type { PrintEntry, Printer } from '@/types';

interface PrintsTableProps {
  items: PrintEntry[];
  groupBy: 'none' | 'day' | 'week' | 'month';
  sortField: keyof PrintEntry;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof PrintEntry) => void;
  onEdit: (id: number | string) => void;
  onDelete: (id: number | string) => void;
  onDuplicate: (id: number | string) => void;
  onDetails: (item: PrintEntry) => void;
  printers: Printer[];
  // Export actions
  onGeneratePDF: () => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  onExportCSV: () => void;
  loading?: boolean;
  isGeneratingPDF?: boolean;
  isExportingCSV?: boolean;
  isExportingJSON?: boolean;
}

export function PrintsTable({
  items,
  groupBy,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onDuplicate,
  onDetails,
  printers,
  onGeneratePDF,
  onExportJSON,
  onImportJSON,
  onExportCSV,
  loading = false,
  isGeneratingPDF = false,
  isExportingCSV = false,
  isExportingJSON = false,
}: PrintsTableProps) {
  const { features } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleGeneratePDF = () => {
    if (!features.pdfExport) {
      setShowUpgradeModal(true);
      return;
    }
    onGeneratePDF();
  };

  const handleExportCSV = () => {
    if (!features.csvExport) {
      setShowUpgradeModal(true);
      return;
    }
    onExportCSV();
  };

  const getPrinterName = (id: number | string | null | undefined) => {
    if (!id) return '';
    const printer = printers.find((p) => String(p.id) === String(id));
    return printer ? printer.name : "Unknown Printer";
  };

  const groupData = () => {
    if (groupBy === 'none') return { default: items };

    // Simple grouping logic (can be expanded if needed)
    // For now, assume grouping is handled by parent or just simple date grouping here?
    // In original Dashboard.tsx, there was `groupedData` calculation.
    // Let's assume `items` passed here are already sorted, but grouping needs to happen here.

    const groups: Record<string, PrintEntry[]> = {};
    items.forEach((item) => {
      let key = "Other";
      const date = new Date(item.date);

      if (groupBy === 'day') {
        key = formatDate(date, { year: 'numeric', month: '2-digit', day: '2-digit' });
      } else if (groupBy === 'week') {
        const week = Math.ceil(date.getDate() / 7);
        const monthYear = formatDate(date, { year: 'numeric', month: '2-digit' });
        key = `${monthYear} - Week ${week}`;
      } else if (groupBy === 'month') {
        key = formatDate(date, { year: 'numeric', month: 'long' });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  };

  const groupedData = groupData();
  const isGrouped = groupBy !== 'none';

  return (
    <div className="relative overflow-hidden space-y-4">
      {/* Mobile/Tablet/Laptop Card View (< xl) */}
      <div className="xl:hidden space-y-4">
        {items.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
            <Inbox className="w-10 h-10 mb-4 text-slate-300 mx-auto" />
            <p className="text-slate-500">No prints found</p>
          </div>
        ) : isGrouped ? (
          Object.entries(groupedData).map(([groupKey, groupItems]) => {
            const groupProfit = groupItems.reduce((acc, item) => acc + getProfit(item), 0);
            return (
              <div key={groupKey} className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold text-slate-700">{groupKey}</h3>
                  <span className="text-sm font-bold text-green-600">
                    Profit: {formatCurrency(groupProfit)}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupItems.map((item) => (
                    <MobilePrintCard
                      key={item.id}
                      item={item}
                      onDetails={onDetails}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      getPrinterName={getPrinterName}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <MobilePrintCard
                key={item.id}
                item={item}
                onDetails={onDetails}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                getPrinterName={getPrinterName}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View (>= xl) */}
      <div className="hidden xl:block rounded-2xl shadow-sm border overflow-hidden bg-white border-slate-200">
        <div className="p-6 border-b flex justify-between items-center border-slate-200 flex-wrap gap-4">
          <h3 className="text-lg font-bold text-slate-800">Recent Prints</h3>
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative group">
              <Button
                onClick={handleGeneratePDF}
                variant="danger"
                className="flex items-center gap-2 rounded-full"
                leftIcon={<FileText className="w-4 h-4" />}
                title={
                  features.pdfExport
                    ? "Export to PDF"
                    : "Export to PDF (Premium)"
                }
                isLoading={isGeneratingPDF}
              >
                PDF
                {!features.pdfExport && <Lock className="w-3 h-3 ml-1" />}
              </Button>
            </div>
            <Button
              onClick={onExportJSON}
              variant="primary"
              className="flex items-center gap-2 rounded-full"
              leftIcon={<Download className="w-4 h-4" />}
              title="Export to JSON"
              isLoading={isExportingJSON}
            >
              JSON
            </Button>
            <Button
              onClick={onImportJSON}
              variant="indigo"
              className="flex items-center gap-2 rounded-full"
              leftIcon={<Upload className="w-4 h-4" />}
              title="Import from JSON"
            >
              Import
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="success"
              className="flex items-center gap-2 rounded-full"
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
              title={
                features.csvExport
                  ? "Export to CSV"
                  : "Export to CSV (Premium)"
              }
              isLoading={isExportingCSV}
            >
              CSV
              {!features.csvExport && <Lock className="w-3 h-3 ml-1" />}
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-10 h-10 mb-4 mx-auto text-slate-300 block" />
            <p className="text-slate-500">No prints found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wider border-b bg-slate-50/50 text-slate-500 border-slate-200">
                  <th
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => onSort('date')}
                  >
                    Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => onSort('name')}
                  >
                    Project {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4">Parameters</th>
                  <th
                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => onSort('totalCost')}
                  >
                    Cost {sortField === 'totalCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => onSort('price')}
                  >
                    Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => onSort('qty')}
                  >
                    Qty {sortField === 'qty' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => onSort('profit')}
                  >
                    Profit {sortField === 'profit' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {isGrouped
                  ? Object.entries(groupedData).map(([groupKey, groupItems]) => {
                      const groupProfit = groupItems.reduce(
                        (acc, item) => acc + getProfit(item),
                        0
                      );
                      return (
                        <React.Fragment key={groupKey}>
                          <tr className="bg-blue-50 border-t-2 border-blue-200">
                            <td colSpan={8} className="px-6 py-3 font-bold text-blue-900">
                              {groupKey}
                            </td>
                          </tr>
                          {groupItems.map((item) => (
                            <PrintRow
                              key={item.id}
                              item={item}
                              onDetails={onDetails}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              onDuplicate={onDuplicate}
                              getPrinterName={getPrinterName}
                            />
                          ))}
                          <tr className="bg-slate-50 border-b-2 border-blue-200 font-bold text-slate-700">
                            <td colSpan={6} className="px-6 py-2">
                              Subtotal
                            </td>
                            <td className="px-6 py-2 text-right text-green-600">
                              {formatCurrency(groupProfit)}
                            </td>
                            <td className="px-6 py-2"></td>
                          </tr>
                        </React.Fragment>
                      );
                    })
                  : items.map((item) => (
                      <PrintRow
                        key={item.id}
                        item={item}
                        onDetails={onDetails}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                        getPrinterName={getPrinterName}
                      />
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {loading && items.length > 0 && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
          <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
            <span className="text-sm font-bold text-slate-700 pr-2">Refreshing data...</span>
          </div>
        </div>
      )}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade Plan"
        description="Unlock premium features like PDF/CSV export and more."
      />
    </div>
  );
}

// Helper component for Row to keep things clean
function PrintRow({
  item,
  onDetails,
  onEdit,
  onDelete,
  onDuplicate,
  getPrinterName,
}: {
  item: PrintEntry;
  onDetails: (item: PrintEntry) => void;
  onEdit: (id: number | string) => void;
  onDelete: (id: number | string) => void;
  onDuplicate: (id: number | string) => void;
  getPrinterName: (id: number | string | null | undefined) => string;
}) {
  const totalWeight = item.weight * item.qty;
  const totalWeightDisplay =
    totalWeight >= 1000
      ? `${(totalWeight / 1000).toFixed(2)} kg`
      : `${Number(totalWeight.toFixed(2))} g`;
  const manualFlag = (item.manualPrice ?? 0) > 0;

  return (
    <tr className="transition border-b group hover:bg-slate-50 border-slate-100">
      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
        {formatDate(new Date(item.date), {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </td>
      <td className="px-6 py-4">
        <div className="font-bold text-slate-700">{item.name}</div>
        <div className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
          {(() => {
            const snap = item.calculatorSnapshot as { filaments?: Array<{ name?: string }> } | null | undefined;
            const fromSnapshot = snap?.filaments?.[0]?.name;
            if (fromSnapshot) return fromSnapshot;
            if (item.brand && item.color) return `${item.brand} • ${item.color}`;
            return item.brand || item.color || '—';
          })()}
        </div>
        {item.printerId && (
          <div className="text-blue-600 text-xs font-medium mt-1">
            🖨️ {getPrinterName(item.printerId)}
          </div>
        )}
        {(item.orderTitle || item.orderId) && (
          <div
            className="text-[10px] font-bold tracking-wide text-purple-600"
            title={item.orderTitle || item.orderCustomerName || item.orderId || ''}
          >
            🧾 {item.orderTitle || (item.orderId ? item.orderId.slice(0, 8) : '')}
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-xs space-y-1 text-slate-500">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-center" />
          {item.timeH}h {item.timeM}m
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Weight className="w-4 h-4 text-center" />
            {Number(item.weight.toFixed(2))}g
          </div>
          {item.qty > 1 && (
            <span className="text-[10px] text-orange-600 font-bold block mt-0.5">
              Σ {totalWeightDisplay}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right font-mono text-slate-600">
        {formatCurrency(getCost(item))}
      </td>
      <td className="px-6 py-4 text-right font-bold font-mono text-slate-800">
        {formatCurrency(getPrice(item))}
        {manualFlag && (
          <span className="text-[9px] text-amber-500 block">
            (manual)
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        <span className="py-1 px-2.5 rounded-md text-xs font-bold border bg-blue-50 text-blue-600 border-blue-100">
          {item.qty}
        </span>
      </td>
      <td className="px-6 py-4 text-right font-bold font-mono text-emerald-600">
        {formatCurrency(getProfit(item))}
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex justify-center gap-2">
          <IconButton
            onClick={() => onDetails(item)}
            tooltip="Details"
            variant="default"
            size="lg"
            className="rounded-2xl"
            icon={Info}
          />
          <IconButton
            onClick={() => onDuplicate(item.id)}
            tooltip="Duplicate"
            variant="default"
            size="lg"
            className="rounded-2xl"
            icon={Copy}
          />
          <IconButton
            onClick={() => onEdit(item.id)}
            tooltip="Edit"
            variant="warning"
            size="lg"
            className="rounded-2xl"
            icon={Pencil}
          />
          <IconButton
            onClick={() => onDelete(item.id)}
            tooltip="Delete"
            variant="danger"
            size="lg"
            className="rounded-2xl"
            icon={Trash2}
          />
        </div>
      </td>
    </tr>
  );
}

function MobilePrintCard({
  item,
  onDetails,
  onEdit,
  onDelete,
  onDuplicate,
  getPrinterName,
}: {
  item: PrintEntry;
  onDetails: (item: PrintEntry) => void;
  onEdit: (id: number | string) => void;
  onDelete: (id: number | string) => void;
  onDuplicate: (id: number | string) => void;
  getPrinterName: (id: number | string | null | undefined) => string;
}) {
  const profit = getProfit(item);
  const cost = getCost(item);
  const date = formatDate(new Date(item.date), {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-3 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>

      <div className="flex justify-between items-start pl-2">
        <div>
          <h4 className="font-bold text-slate-800 line-clamp-1">{item.name}</h4>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>{date}</span>
            {item.printerId && (
              <>
                <span>•</span>
                <span className="text-blue-600 font-medium">{getPrinterName(item.printerId)}</span>
              </>
            )}
          </div>
        </div>
        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">
          x{item.qty}
        </span>
      </div>

      <div className="pl-2 grid grid-cols-2 gap-2 text-sm">
        <div className="bg-slate-50 p-2 rounded-lg">
          <span className="text-slate-400 text-xs block">Cost</span>
          <span className="font-mono text-slate-700">
            {formatCurrency(cost)}
          </span>
        </div>
        <div className="bg-emerald-50 p-2 rounded-lg">
          <span className="text-emerald-400 text-xs block">Profit</span>
          <span className="font-mono font-bold text-emerald-700">
            +
            {formatCurrency(profit)}
          </span>
        </div>
      </div>

      <div className="pl-2 pt-2 border-t border-slate-100 flex justify-end gap-2">
        <IconButton
          onClick={() => onDetails(item)}
          tooltip="Details"
          variant="default"
          size="lg"
          className="rounded-2xl"
          icon={Info}
        />
        <IconButton
          onClick={() => onDuplicate(item.id)}
          tooltip="Duplicate"
          variant="default"
          size="lg"
          className="rounded-2xl"
          icon={Copy}
        />
        <IconButton
          onClick={() => onEdit(item.id)}
          tooltip="Edit"
          variant="warning"
          size="lg"
          className="rounded-2xl"
          icon={Pencil}
        />
        <IconButton
          onClick={() => onDelete(item.id)}
          tooltip="Delete"
          variant="danger"
          size="lg"
          className="rounded-2xl"
          icon={Trash2}
        />
      </div>
    </div>
  );
}
