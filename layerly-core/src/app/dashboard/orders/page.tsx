'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { OrdersLockedView } from '@/components/subscription/OrdersLockedView';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { useToast } from '@/components/ui/ToastProvider';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  Calendar,
  Check,
  Link as LinkIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Share2,
  Trash2,
  TriangleAlert,
  Unlink,
  X,
} from 'lucide-react';
import { FullPageLoader } from '@/components/ui/DataLoader';
import type { Order, OrderStatus, PrintEntry } from '@/types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  QUOTE: 'Quote',
  IN_PRODUCTION: 'In Production',
  READY: 'Ready',
  SHIPPED: 'Shipped',
};

interface ApiPrintEntry {
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
  orderId?: string | null;
  totalCost: number;
  price: number;
  profit: number;
  extraCost?: number;
  manualPrice?: number;
}

function toIso(d: unknown) {
  if (typeof d === 'string' || typeof d === 'number' || d instanceof Date) {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return new Date().toISOString();
    return date.toISOString();
  }
  return new Date().toISOString();
}

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;
  const twoFactorRequired = !!(session as unknown as { twoFactorRequired?: boolean })?.twoFactorRequired;
  const [authGrace, setAuthGrace] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [prints, setPrints] = useState<PrintEntry[]>([]);
  const [customers, setCustomers] = useState<{ id: string; companyName?: string; firstName?: string; lastName?: string }[]>([]);
  
  // Loading states: separate initial load from background refresh
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [printQuery, setPrintQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    customerName: '',
    customerId: null as string | null,
    status: 'QUOTE' as OrderStatus,
    deadline: '',
    notes: '',
    printEntryIds: [] as string[],
  });

  const showToast = useCallback(
    (message: string, isError: boolean) => {
      addToast(message, isError ? 'error' : 'success');
    },
    [addToast]
  );

  useEffect(() => {
    if (userId) {
      setAuthGrace(false);
      return;
    }
    const t = setTimeout(() => setAuthGrace(false), 900);
    return () => clearTimeout(t);
  }, [userId]);

  useEffect(() => {
    if (isPending || authGrace) return;
    if (userId) return;
    if (twoFactorRequired) {
      router.replace('/two-factor');
      return;
    }
    router.replace('/');
  }, [authGrace, isPending, router, twoFactorRequired, userId]);

  const fetchAll = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [ordersRes, printsRes, customersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/prints'),
        fetch('/api/customers'),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data);
      }
      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data);
      }
      if (printsRes.ok) {
        const data = await printsRes.json();
        const mapped = (data as ApiPrintEntry[]).map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand || '',
          color: p.color || '',
          weight: p.weight,
          timeH: p.timeH,
          timeM: p.timeM,
          qty: p.qty,
          date: toIso(p.date),
          printerId: p.printerId,
          filamentId: p.filamentId,
          orderId: p.orderId ?? null,
          totalCost: p.totalCost,
          price: p.price,
          profit: p.profit,
          extraCost: p.extraCost || null,
          manualPrice: p.manualPrice || null,
        })) as PrintEntry[];
        setPrints(mapped);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
      showToast('Failed to load orders', true);
    } finally {
      setIsRefreshing(false);
      setIsInitialLoad(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (userId) fetchAll();
  }, [fetchAll, userId]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'QUOTE':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'IN_PRODUCTION':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'READY':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SHIPPED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const inTitle = (o.title || '').toLowerCase().includes(q);
      const inCustomer = (o.customerName || '').toLowerCase().includes(q);
      const inNotes = (o.notes || '').toLowerCase().includes(q);
      return inTitle || inCustomer || inNotes;
    });
  }, [orders, query]);

  const filteredPrints = useMemo(() => {
    const q = printQuery.trim().toLowerCase();
    if (!q) return prints;
    return prints.filter((p) => (p.name || '').toLowerCase().includes(q));
  }, [prints, printQuery]);

  const openNewOrder = () => {
    setEditingId(null);
    setForm({
      title: '',
      customerId: null,
      customerName: '',
      status: 'QUOTE',
      deadline: '',
      notes: '',
      printEntryIds: [],
    });
    setIsModalOpen(true);
  };

  const openEditOrder = (order: Order) => {
    setEditingId(order.id);
    setForm({
      title: order.title || '',
      customerId: order.customerId || null,
      customerName: order.customerName || '',
      status: order.status,
      deadline: order.deadline ? new Date(order.deadline).toISOString().slice(0, 10) : '',
      notes: order.notes || '',
      printEntryIds: (order.printEntries || []).map((p) => String(p.id)),
    });
    setIsModalOpen(true);
  };

  const closeForm = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const orderTotals = (order: Order) => {
    const entries = order.printEntries || [];
    const price = entries.reduce((acc, p) => {
      const qty = Number(p.qty || 1);
      const unit = Number(p.price ?? 0);
      return acc + unit * qty;
    }, 0);
    const profit = entries.reduce((acc, p) => acc + Number(p.profit ?? 0), 0);
    return { price, profit, count: entries.length };
  };

  const save = async () => {
    const title = form.title.trim();
    if (!title) {
      showToast('Title is required', true);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        customerName: form.customerName.trim() || null,
        customerId: form.customerId,
        status: form.status,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        notes: form.notes.trim() || null,
        printEntryIds: form.printEntryIds,
      };
      const res = await fetch(editingId ? `/api/orders/${editingId}` : '/api/orders', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        showToast(err?.error || 'Failed to save order', true);
        return;
      }
      showToast(editingId ? 'Order updated successfully' : 'Order created successfully', false);
      closeForm();
      await fetchAll();
    } catch (e) {
      console.error('Error saving order:', e);
      showToast('Connection error', true);
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: string) => setItemToDelete(id);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${itemToDelete}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        showToast(err?.error || 'Failed to delete order', true);
        return;
      }
      showToast('Order deleted successfully', false);
      if (editingId === itemToDelete) closeForm();
      await fetchAll();
    } catch (e) {
      console.error('Error deleting order:', e);
      showToast('Connection error', true);
    } finally {
      setDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleShare = async (id: string) => {
    setSharingId(id);
    try {
      const res = await fetch(`/api/orders/${id}/share`, { method: 'POST' });
      if (!res.ok) {
        showToast('Failed to generate share link', true);
        return;
      }
      const data = await res.json();
      const link = `${window.location.origin}/order/${data.shareToken}`;
      await navigator.clipboard.writeText(link);
      showToast('Link copied to clipboard', false);
      await fetchAll();
    } catch (e) {
      console.error('Share error:', e);
      showToast('Failed to generate share link', true);
    } finally {
      setSharingId(null);
    }
  };

  const handleUnshare = async (id: string) => {
    setSharingId(id);
    try {
      const res = await fetch(`/api/orders/${id}/share`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Failed to unshare order', true);
        return;
      }
      showToast('Order is no longer shared', false);
      await fetchAll();
    } catch (e) {
      console.error('Unshare error:', e);
      showToast('Failed to unshare order', true);
    } finally {
      setSharingId(null);
    }
  };

  const togglePrint = (printId: string) => {
    setForm((prev) => {
      const exists = prev.printEntryIds.includes(printId);
      return {
        ...prev,
        printEntryIds: exists
          ? prev.printEntryIds.filter((id) => id !== printId)
          : [...prev.printEntryIds, printId],
      };
    });
  };

  const assignedInfo = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of prints) {
      if (p.orderId) map.set(String(p.id), String(p.orderId));
    }
    return map;
  }, [prints]);

  // Use main loader only on first load
  if (isInitialLoad) {
    return (
      <FeatureGate feature="ordersAccess" mode="lock" fallback={<OrdersLockedView />}>
        <FullPageLoader />
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="ordersAccess" mode="lock" fallback={<OrdersLockedView />}>
      <div className="selection:bg-indigo-500 selection:text-white">
        <PageHeader
            title="Orders"
            subtitle="Production management"
            icon={<Package className="w-6 h-6" />}
            actions={
              <>
                <div className="flex-1 sm:w-64 min-w-0">
                  <SearchInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search orders..."
                    size="sm"
                  />
                </div>
                <button
                  onClick={openNewOrder}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Order</span>
                </button>
              </>
            }
        />

        <div className="mt-6">
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Table headers (Desktop) – column proportions (5-2-3-2) to fit action buttons */}
              <div className="hidden md:grid grid-cols-12 gap-6 px-6 sm:px-8 py-4 bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="col-span-5">Order details</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3 text-right">Finances (Net)</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              <div className="relative divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                      <Package className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-700">No orders</p>
                    <p className="text-sm text-slate-500">No orders match your criteria.</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const totals = orderTotals(order);
                    const hasShareToken = !!order.shareToken;
                    return (
                      <div
                        key={order.id}
                        className="px-6 sm:px-8 py-5 flex flex-col md:grid md:grid-cols-12 md:gap-6 gap-4 items-start md:items-center hover:bg-slate-50/50 transition-colors group cursor-default"
                      >
                        {/* Column 1: Info */}
                        <div className="col-span-5 min-w-0">
                          <h3 className="font-bold text-slate-900 text-base truncate">{order.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-medium text-slate-600 truncate">
                              {order.customerName || 'No customer'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />{' '}
                              {order.deadline ? formatDate(order.deadline) : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Column 2: Status */}
                        <div className="col-span-2 flex flex-col items-start gap-2">
                          <span
                            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${getStatusBadge(order.status)}`}
                          >
                            {STATUS_LABELS[order.status]}
                          </span>
                          {hasShareToken && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <LinkIcon className="w-3 h-3" /> Shared
                            </span>
                          )}
                        </div>

                        {/* Column 3: Finances */}
                        <div className="col-span-3 min-w-0 w-full md:text-right pr-2">
                          <p className="font-black text-slate-900 text-lg">{formatCurrency(totals.price)}</p>
                          <p className="text-xs font-medium text-slate-500">
                            Profit:{' '}
                            <span className="text-emerald-600 font-bold">{formatCurrency(totals.profit)}</span>
                            <span className="mx-1 text-slate-300">|</span>
                            {totals.count} items
                          </p>
                        </div>

                        {/* Column 4: Actions (col-span-2, no width constraints) */}
                        <div className="col-span-2 flex items-center justify-end gap-1 w-full md:w-auto mt-4 md:mt-0 shrink-0">
                          {hasShareToken ? (
                            <>
                              <button
                                onClick={() => handleShare(order.id)}
                                disabled={!!sharingId}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-60"
                                title="Copy link again"
                              >
                                {sharingId === order.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Share2 className="w-5 h-5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleUnshare(order.id)}
                                disabled={!!sharingId}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-60"
                                title="Stop sharing"
                              >
                                {sharingId === order.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Unlink className="w-5 h-5" />
                                )}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleShare(order.id)}
                              disabled={!!sharingId}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-60"
                              title="Share"
                            >
                              {sharingId === order.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Share2 className="w-5 h-5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => openEditOrder(order)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => remove(order.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* Data refresh overlay */}
                {isRefreshing && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                      <span className="text-sm font-bold text-slate-700 pr-2">Refreshing data...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* --- ADD / EDIT ORDER MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={closeForm}
              aria-hidden
            />
            <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
              {/* Modal header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {editingId ? 'Edit Order' : 'New Order'}
                  </h2>
                  <p className="text-sm font-medium text-slate-500">
                    Configure details and assign prints from the system.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl font-bold transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal body (2 columns) */}
              <div className="flex-1 overflow-y-auto p-8 bg-white grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Column 1: Form data */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Order name
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Batch of enclosures v2"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Customer
                      </label>
                      <div className="space-y-2">
                        <CustomSelect
                          value={form.customerId || ''}
                          onChange={(val) => {
                            const c = customers.find((x) => x.id === val);
                            setForm((p) => ({
                              ...p,
                              customerId: val ? String(val) : null,
                              customerName: c
                                ? c.companyName || `${c.firstName || ''} ${c.lastName || ''}`.trim()
                                : p.customerName,
                            }));
                          }}
                          options={[
                            { value: '', label: 'Select from list...' },
                            ...customers.map((c) => ({
                              value: c.id,
                              label: c.companyName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.id,
                            })),
                          ]}
                          placeholder="Select from list..."
                        />
                        <input
                          value={form.customerName}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, customerName: e.target.value, customerId: null }))
                          }
                          placeholder="Or enter custom name"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Deadline
                      </label>
                      <input
                        type="date"
                        value={form.deadline}
                        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Order status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as OrderStatus })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer"
                    >
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Internal notes
                    </label>
                    <textarea
                      rows={4}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Additional info, file links, notes for the operator..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Column 2: Assign prints (selectable cards) */}
                <div className="flex flex-col h-full max-h-[500px]">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Assign prints
                    </label>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      Selected: {form.printEntryIds.length}
                    </span>
                  </div>
                  <div className="mb-4 shrink-0">
                    <SearchInput
                      value={printQuery}
                      onChange={(e) => setPrintQuery(e.target.value)}
                      placeholder="Search by part name..."
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-smooth relative min-h-[120px]">
                    {isRefreshing ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
                        <span className="text-sm font-bold text-slate-600">Loading…</span>
                      </div>
                    ) : filteredPrints.length === 0 ? (
                      <div className="text-center py-4 text-slate-500">No prints found.</div>
                    ) : (
                      filteredPrints.map((p) => {
                        const id = String(p.id);
                        const isChecked = form.printEntryIds.includes(id);
                        const assignedOrderId = assignedInfo.get(id);
                        const isAssignedElsewhere =
                          !!assignedOrderId && assignedOrderId !== editingId;
                        return (
                          <label key={id} className="relative flex cursor-pointer group">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={isChecked}
                              onChange={() => togglePrint(id)}
                            />
                            <div
                              className={`w-full rounded-2xl border-2 p-4 transition-all duration-200 flex items-center justify-between ${
                                isChecked
                                  ? 'border-indigo-600 bg-indigo-50/20'
                                  : 'border-slate-200 bg-white hover:border-indigo-300'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    isChecked
                                      ? 'bg-[#4f46e5] text-white'
                                      : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                  }`}
                                >
                                  <Printer className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 text-sm truncate max-w-[180px]">
                                    {p.name}
                                  </span>
                                  <span className="text-xs font-medium text-slate-500 mt-0.5">
                                    {p.qty || 0} pcs • {formatCurrency((p.price || 0) * (p.qty || 1))}
                                  </span>
                                  {isAssignedElsewhere && (
                                    <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-1">
                                      <TriangleAlert className="w-3 h-3" /> Assigned to another order
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div
                                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ml-4 ${
                                  isChecked
                                    ? 'border-[#4f46e5] bg-[#4f46e5]'
                                    : 'border-slate-300 bg-white group-hover:border-indigo-400'
                                }`}
                              >
                                <Check
                                  className={`w-4 h-4 text-white transition-opacity ${isChecked ? 'opacity-100' : 'opacity-0'}`}
                                  strokeWidth={3}
                                />
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Modal footer – UI Kit */}
              <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={closeForm}
                  className="bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                  {saving ? (editingId ? 'Saving…' : 'Creating…') : editingId ? 'Save changes' : 'Create order'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={confirmDelete}
          title="Delete order"
          message="Are you sure you want to delete this order? This action cannot be undone."
          confirmLabel="Delete"
          isDanger
          isLoading={deleting}
        />
      </div>
    </FeatureGate>
  );
}