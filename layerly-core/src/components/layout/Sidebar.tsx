'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  CalculatorView,
  type CalculatorViewHandle,
} from '@/features/calculator/components/CalculatorView';
import type { Order, PrintEntry, Printer, Settings } from '@/types';

const FilamentsModal = dynamic(
  () => import('@/features/filaments/components/FilamentsModal'),
  { ssr: false }
);
const PrintersModal = dynamic(
  () => import('@/features/printers/components/PrintersModal'),
  { ssr: false }
);

interface SidebarProps {
  onSavePrint: (entry: PrintEntry) => Promise<void> | void;
  onClear: () => void;
  editingId: number | string | null;
  editingEntry: PrintEntry | null;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export function Sidebar({
  onSavePrint: _onSavePrint,
  onClear,
  editingId,
  editingEntry,
  settings: _settings,
  onSettingsChange: _onSettingsChange,
}: SidebarProps) {
  const [showFilamentModal, setShowFilamentModal] = useState(false);
  const [showPrintersModal, setShowPrintersModal] = useState(false);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [, setOrders] = useState<Order[]>([]);
  const [pendingFilamentRowId, setPendingFilamentRowId] = useState<
    string | null
  >(null);
  const [clearTrigger, setClearTrigger] = useState(0);
  const calculatorRef = useRef<CalculatorViewHandle>(null);

  const fetchPrinters = useCallback(async () => {
    try {
      const res = await fetch('/api/printers');
      if (res.ok) {
        const data = await res.json();
        setPrinters(data);
        return data;
      }
    } catch (e) {
      console.error('Error fetching printers:', e);
    }
    return [];
  }, []);

  useEffect(() => {
    fetchPrinters();
  }, [fetchPrinters]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Error fetching orders:', e);
      }
    };
    fetchOrders();
  }, []);

  const handlePrinterModalClose = async () => {
    setShowPrintersModal(false);
    await fetchPrinters();
  };

  const handleCalculatorClear = () => {
    setClearTrigger((c) => c + 1);
    onClear();
  };

  return (
    <>
      <aside className="w-full xl:w-[480px] bg-white border-r border-slate-200 flex flex-col h-full shadow-xl z-20 shrink-0 overflow-y-auto custom-scroll transition-colors duration-300">
        <div className="w-full max-w-3xl mx-auto flex flex-col min-h-full relative bg-white">
          <div className="px-6 py-4 border-b border-slate-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
            <div>
              <h2
                className={`text-lg font-bold ${
                  editingId ? 'text-amber-600' : 'text-slate-800'
                }`}
              >
                {editingId
                  ? `Edit Print: ${editingEntry?.name ?? ''}`
                  : 'Quote calculator'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {editingId
                  ? 'Modify print parameters'
                  : 'Calculate 3D print costs and prices'}
              </p>
            </div>
            <Button
              onClick={handleCalculatorClear}
              variant="ghost"
              className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 h-8 w-8 rounded-full flex items-center justify-center transition-all"
              title="Clear form"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </Button>
          </div>

          <CalculatorView
            ref={calculatorRef}
            clearTrigger={clearTrigger}
            printers={printers}
            onOpenFilamentCatalog={(filamentRowId) => {
              setPendingFilamentRowId(filamentRowId);
              setShowFilamentModal(true);
            }}
          />
        </div>
      </aside>

      <FilamentsModal
        isOpen={showFilamentModal}
        onClose={() => {
          setShowFilamentModal(false);
          setPendingFilamentRowId(null);
        }}
        onFilamentSelected={(filament, context) => {
          if (pendingFilamentRowId) {
            const name = [filament.brand, filament.materialName, filament.color]
              .filter(Boolean)
              .join(' ');
            const pricePerKg =
              filament.spoolWeight && filament.spoolWeight > 0
                ? (filament.spoolPrice / filament.spoolWeight) * 1000
                : 0;
            const brand = filament.brand ? [filament.brand, filament.materialName].filter(Boolean).join(' ') : undefined;
            const color = filament.color ?? undefined;
            const filamentId = context?.fromWarehouse && filament.id ? filament.id : undefined;
            calculatorRef.current?.setFilamentFromCatalog(pendingFilamentRowId, {
              filamentId,
              name,
              pricePerKg,
              brand,
              color,
            });
          }
          setShowFilamentModal(false);
          setPendingFilamentRowId(null);
        }}
        showSelectButton={true}
      />
      <PrintersModal
        isOpen={showPrintersModal}
        onClose={handlePrinterModalClose}
        onPrinterAdded={() => fetchPrinters()}
      />
    </>
  );
}
