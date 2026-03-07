import { DataLoader } from '@/components/ui/DataLoader';
import { formatCurrency, formatDate } from '@/lib/format';
import { IconButton } from '@/components/ui/IconButton';
import { Pencil, Printer, Trash2 } from 'lucide-react';
import type { Printer as PrinterType } from '@/types';

interface PrinterListProps {
  printers: PrinterType[];
  isLoading: boolean;
  onEdit: (printer: PrinterType) => void;
  onDelete: (id: string | number) => void;
  onAdd: () => void;
}

export default function PrinterList({
  printers,
  isLoading,
  onEdit,
  onDelete,
}: PrinterListProps) {

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center">
        <DataLoader className="min-h-[300px]" />
      </div>
    );
  }

  if (printers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 h-full">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200 shadow-sm">
          <Printer className="w-10 h-10 text-slate-300" />
        </div>
        <p className="font-bold text-lg text-slate-700">No printers found</p>
        <p className="text-sm text-slate-500 mt-1 max-w-xs text-center">Add your first printer to start calculating costs.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Table Header - Hidden on Mobile */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
        <div className="col-span-4">Printer Name</div>
        <div className="col-span-2">Power</div>
        <div className="col-span-2">Cost/h</div>
        <div className="col-span-2">Purchase Date</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* List Content */}
      <div className="overflow-y-auto flex-1">
        {printers.map((printer) => (
          <div
            key={printer.id}
            className="flex flex-col md:grid md:grid-cols-12 gap-4 px-4 py-3 md:px-6 border-b border-slate-100 hover:bg-slate-50 transition-colors items-start md:items-center group"
          >
            {/* Name & Model */}
            <div className="col-span-4 flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 truncate">{printer.name}</h4>
                <div className="text-xs text-slate-500 font-mono truncate">{printer.model}</div>
              </div>
            </div>

            {/* Power */}
            <div className="col-span-2 flex flex-col md:block w-full">
              <span className="md:hidden text-[10px] uppercase font-bold text-slate-400 mb-1">Power</span>
              <span className="text-sm font-medium text-slate-700">{printer.power} W</span>
            </div>

            {/* Cost/h */}
            <div className="col-span-2 flex flex-col md:block w-full">
              <span className="md:hidden text-[10px] uppercase font-bold text-slate-400 mb-1">Cost/h</span>
              <span className="text-sm font-medium text-slate-700">
                {formatCurrency(printer.costPerHour || 0)}
              </span>
            </div>

            {/* Purchase Date */}
            <div className="col-span-2 flex flex-col md:block w-full">
              <span className="md:hidden text-[10px] uppercase font-bold text-slate-400 mb-1">Purchase Date</span>
              <span className="text-sm text-slate-600">
                {printer.purchaseDate ? formatDate(printer.purchaseDate) : '-'}
              </span>
            </div>

            {/* Actions */}
            <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 w-full mt-4 md:mt-0">
              <IconButton
                onClick={() => onEdit(printer)}
                tooltip="Edit printer"
                variant="default"
                size="lg"
                className="rounded-2xl"
                icon={Pencil}
              />
              <IconButton
                onClick={() => onDelete(printer.id)}
                tooltip="Delete printer"
                variant="danger"
                size="lg"
                className="rounded-2xl"
                icon={Trash2}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
