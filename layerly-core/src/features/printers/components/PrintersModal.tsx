'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import type { Printer as PrinterType } from '@/types';
import type { PrinterCardData } from './PrinterCard';
import PrinterForm, { type PrinterFormData } from './PrinterForm';

interface PrintersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrinterAdded?: () => void;
  initialEditingPrinterId?: string | null;
}

export default function PrintersModal({
  isOpen,
  onClose,
  onPrinterAdded,
  initialEditingPrinterId,
}: PrintersModalProps) {
  const { success, error: showError } = useToast();
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const defaultFormData: PrinterFormData = {
    name: '',
    model: '',
    type: 'FDM',
    status: 'available',
    location: '',
    ipAddress: '',
    lastMaintenance: '',
    notes: '',
    currentMaterialId: '',
    power: 200,
    costPerHour: '',
    purchaseDate: '',
  };

  const [formData, setFormData] = useState<PrinterFormData>(defaultFormData);
  const appliedInitialEditRef = useRef(false);

  const fetchPrinters = useCallback(async () => {
    try {
      const res = await fetch('/api/printers');
      if (res.ok) {
        const data: PrinterType[] = await res.json();
        setPrinters(data);
      }
    } catch (e) {
      console.error('Error fetching printers:', e);
      showError('Failed to load printers');
    }
  }, [showError]);

  useEffect(() => {
    if (isOpen) {
      fetchPrinters();
      if (!initialEditingPrinterId) {
        setEditingId(null);
        setFormData(defaultFormData);
      }
    }
  }, [isOpen, fetchPrinters, initialEditingPrinterId]);

  const mapPrinterToForm = (printer: PrinterType | PrinterCardData): PrinterFormData => ({
    name: printer.name,
    model: printer.model ?? '',
    type: (printer.type as PrinterFormData['type']) ?? 'FDM',
    status: (printer.status as PrinterFormData['status']) ?? 'available',
    location: printer.location ?? '',
    ipAddress: (printer as PrinterType).ipAddress ?? (printer as PrinterCardData).ip ?? '',
    lastMaintenance: printer.lastMaintenance
      ? new Date(printer.lastMaintenance).toISOString().split('T')[0]
      : '',
    notes: printer.notes ?? '',
    currentMaterialId: printer.currentMaterialId ?? '',
    power: printer.power ?? 200,
    costPerHour:
      printer.costPerHour !== undefined && printer.costPerHour !== null
        ? String(printer.costPerHour)
        : '',
    purchaseDate: printer.purchaseDate
      ? new Date(printer.purchaseDate).toISOString().split('T')[0]
      : '',
  });

  useEffect(() => {
    if (!isOpen) {
      appliedInitialEditRef.current = false;
      return;
    }
    if (initialEditingPrinterId && printers.length > 0 && !appliedInitialEditRef.current) {
      const printer = printers.find((p) => String(p.id) === String(initialEditingPrinterId));
      if (printer) {
        setFormData(mapPrinterToForm(printer));
        setEditingId(String(printer.id));
        appliedInitialEditRef.current = true;
      }
    }
  }, [isOpen, initialEditingPrinterId, printers]);

  const handleReset = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError('Name is required');
      return;
    }
    const parsedCost = formData.costPerHour === '' ? null : parseFloat(formData.costPerHour);
    const payload = {
      name: formData.name.trim(),
      model: formData.model.trim() || null,
      type: formData.type,
      status: formData.status,
      location: formData.location.trim() || null,
      ipAddress: formData.ipAddress.trim() || null,
      lastMaintenance: formData.lastMaintenance || null,
      notes: formData.notes.trim() || null,
      currentMaterialId: formData.currentMaterialId || null,
      power: formData.power,
      costPerHour: parsedCost,
      purchaseDate: formData.purchaseDate || null,
      isDefault: false,
    };
    setIsSaving(true);
    try {
      const url = editingId ? `/api/printers/${editingId}` : '/api/printers';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save');
      await fetchPrinters();
      onPrinterAdded?.();
      success(editingId ? 'Printer updated successfully' : 'Printer added successfully');
      handleReset();
    } catch (e) {
      console.error('Error saving printer:', e);
      showError('Failed to save printer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideHeader
      size="2xl"
      className="max-w-2xl max-h-[90vh] p-0 overflow-hidden bg-slate-50"
    >
      <div className="flex flex-col h-full bg-slate-50">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="min-w-0">
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              {editingId ? 'Edit printer' : 'Add printer'}
            </h2>
            <p className="text-slate-500 mt-0.5 text-sm">
              Device details, location and loaded material.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-sm transition-all"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-5">
            <PrinterForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onCancel={handleReset}
              isSaving={isSaving}
              isEditing={!!editingId}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
