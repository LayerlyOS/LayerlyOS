'use client';

import { CustomerForm } from './CustomerForm';
import { CustomerFormData } from '../schemas';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface OrderSummary {
  id: string;
  title: string;
  customerName: string | null;
  createdAt: Date;
  status: string;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  unassignedOrders: OrderSummary[];
  initialData?: CustomerFormData;
  initialAssignedOrders?: OrderSummary[];
  customerId?: string;
}

export function CustomerModal({
  isOpen,
  onClose,
  unassignedOrders,
  initialData,
  initialAssignedOrders,
  customerId,
}: CustomerModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            {customerId ? 'Edit customer' : 'Add new customer'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <CustomerForm
          unassignedOrders={unassignedOrders}
          initialData={initialData}
          initialAssignedOrders={initialAssignedOrders}
          customerId={customerId}
          onSuccess={onClose}
          isModal
        />
        </div>
      </div>
    </div>,
    document.body
  );
}
