'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { CustomerModal } from './CustomerModal';
import { getCustomerDisplayName, type CustomerCardCustomer } from './CustomerCard';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { deleteCustomer } from '../actions';
import { useToast } from '@/components/ui/ToastProvider';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { OrdersLockedView } from '@/components/subscription/OrdersLockedView';
import { getInitials, getAvatarColor } from '../utils';

interface OrderSummary {
  id: string;
  title: string;
  customerName: string | null;
  createdAt: Date;
  status: string;
}

interface Customer extends CustomerCardCustomer {}

interface CustomersManagementProps {
  customers: Customer[];
  unassignedOrders: OrderSummary[];
  initialOpenNew?: boolean;
  initialOpenEditId?: string;
}

type StatusFilter = 'all' | 'active' | 'inactive';

const FILTER_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'active',   label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
];

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  QUOTE:       { label: 'Quote',       color: 'bg-slate-100 text-slate-600 border-slate-200' },
  IN_PROGRESS: { label: 'In progress', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  COMPLETED:   { label: 'Done',        color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  CANCELLED:   { label: 'Cancelled',   color: 'bg-red-100 text-red-700 border-red-200' },
};

export function CustomersManagement({
  customers,
  unassignedOrders,
  initialOpenNew,
  initialOpenEditId,
}: CustomersManagementProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (initialOpenNew) {
      setIsCreateModalOpen(true);
      router.replace('/dashboard/customers', { scroll: false });
    }
  }, [initialOpenNew, router]);

  useEffect(() => {
    if (initialOpenEditId && customers.length > 0) {
      const customer = customers.find((c) => c.id === initialOpenEditId);
      if (customer) setEditingCustomer(customer);
      router.replace('/dashboard/customers', { scroll: false });
    }
  }, [initialOpenEditId, customers, router]);

  const filteredCustomers = customers.filter((c) => {
    const searchStr = [getCustomerDisplayName(c), c.email ?? '', c.contactPerson ?? ''].join(' ').toLowerCase();
    const matchSearch = !query.trim() || searchStr.includes(query.toLowerCase());
    const status = c.status ?? 'active';
    const matchFilter = filter === 'all' || (filter === 'active' && status === 'active') || (filter === 'inactive' && status === 'inactive');
    return matchSearch && matchFilter;
  });

  // Stats
  const totalCount    = customers.length;
  const activeCount   = customers.filter((c) => (c.status ?? 'active') === 'active').length;
  const inactiveCount = customers.filter((c) => c.status === 'inactive').length;
  const b2bCount      = customers.filter((c) => c.type === 'B2B').length;
  const totalOrders   = customers.reduce((sum, c) => sum + (c.orders?.length ?? 0), 0);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteCustomer(itemToDelete);
      if (result.success) success('Customer deleted');
      else error('Failed to delete customer');
    } catch (err) {
      error('Failed to delete customer');
      console.error(err);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setEditingCustomer(null);
  };

  return (
    <FeatureGate feature="clientManagement" mode="lock" fallback={<OrdersLockedView />}>

        {/* ── Page Header ── */}
        <PageHeader
          title="Customers"
          subtitle="Client management & orders"
          icon={<Users className="w-6 h-6" />}
          actions={
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add customer
            </button>
          }
        />

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-0.5">Total clients</p>
              <h3 className="text-2xl font-black text-slate-900">{totalCount}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-0.5">Active</p>
              <h3 className="text-2xl font-black text-slate-900">{activeCount}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-0.5">B2B clients</p>
              <h3 className="text-2xl font-black text-slate-900">{b2bCount}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-0.5">Total orders</p>
              <h3 className="text-2xl font-black text-slate-900">{totalOrders}</h3>
            </div>
          </div>
        </div>

        {/* ── Main table card ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Toolbar inside card */}
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full sm:w-72">
              <SearchInput
                placeholder="Search by name, email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                size="sm"
              />
            </div>
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
          {filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 hidden md:table-cell">Email</th>
                    <th className="px-6 py-4 hidden lg:table-cell">Phone</th>
                    <th className="px-6 py-4 hidden lg:table-cell">Tags</th>
                    <th className="px-6 py-4 text-center">Orders</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCustomers.map((customer) => {
                    const name      = getCustomerDisplayName(customer);
                    const initials  = getInitials(name);
                    const avatarCls = getAvatarColor(name);
                    const status    = customer.status ?? 'active';
                    const isActive  = status === 'active';
                    const tags      = customer.tags ?? [];
                    const orders    = customer.orders ?? [];
                    const isB2B     = customer.type === 'B2B';

                    return (
                      <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">

                        {/* Customer name + avatar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${avatarCls}`}>
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 truncate max-w-[180px]">{name}</p>
                                {isB2B && (
                                  <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                    B2B
                                  </span>
                                )}
                                {!isB2B && customer.type === 'B2C' && (
                                  <span className="bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                    B2C
                                  </span>
                                )}
                              </div>
                              {customer.contactPerson && (
                                <p className="text-xs text-slate-500 font-medium">{customer.contactPerson}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 hidden md:table-cell">
                          {customer.email ? (
                            <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors group/email">
                              <Mail className="w-3.5 h-3.5 text-slate-400 group-hover/email:text-indigo-400 shrink-0" />
                              <span className="font-medium truncate max-w-[180px]">{customer.email}</span>
                            </a>
                          ) : <span className="text-slate-400">—</span>}
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-4 hidden lg:table-cell">
                          {customer.phone ? (
                            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors group/phone">
                              <Phone className="w-3.5 h-3.5 text-slate-400 group-hover/phone:text-indigo-400 shrink-0" />
                              <span className="font-medium">{customer.phone}</span>
                            </a>
                          ) : <span className="text-slate-400">—</span>}
                        </td>

                        {/* Tags */}
                        <td className="px-6 py-4 hidden lg:table-cell">
                          {tags.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                              {tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                                  {tag}
                                </span>
                              ))}
                              {tags.length > 2 && (
                                <span className="text-xs text-slate-400 font-medium">+{tags.length - 2}</span>
                              )}
                            </div>
                          ) : <span className="text-slate-400">—</span>}
                        </td>

                        {/* Orders */}
                        <td className="px-6 py-4 text-center">
                          <Link
                            href={`/dashboard/orders?customerId=${customer.id}`}
                            className="inline-flex flex-col items-center gap-0.5 group/orders"
                          >
                            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg group-hover/orders:bg-indigo-100 transition-colors">
                              {orders.length}
                            </span>
                            {orders.length > 0 && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ORDER_STATUS_CONFIG[orders[0]?.status ?? 'QUOTE']?.color ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {ORDER_STATUS_CONFIG[orders[0]?.status ?? 'QUOTE']?.label ?? '—'}
                              </span>
                            )}
                          </Link>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingCustomer(customer)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemToDelete(customer.id)}
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

              {/* Footer count */}
              {totalCount > 0 && (
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-400">
                    Showing {filteredCustomers.length} of {totalCount} customers
                  </p>
                  {!isUnlimitedCustomers && (
                    <p className="text-xs font-medium text-slate-400">
                      {inactiveCount} inactive
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                {query || filter !== 'all'
                  ? <Search className="w-7 h-7 text-slate-400" />
                  : <Users className="w-7 h-7 text-slate-400" />}
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-1">
                  {query || filter !== 'all' ? 'No results found' : 'No customers yet'}
                </p>
                <p className="text-sm font-medium text-slate-500">
                  {query || filter !== 'all'
                    ? 'Try adjusting your search or filter.'
                    : 'Add your first customer to manage orders.'}
                </p>
              </div>
              {(query || filter !== 'all') ? (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setFilter('all'); }}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200"
                >
                  <Plus className="w-4 h-4" /> Add first customer
                </button>
              )}
            </div>
          )}
        </div>


      {/* ── Modals ── */}
      <CustomerModal
        isOpen={isCreateModalOpen}
        onClose={closeModals}
        unassignedOrders={unassignedOrders}
      />

      {editingCustomer && (
        <CustomerModal
          isOpen={!!editingCustomer}
          onClose={closeModals}
          unassignedOrders={unassignedOrders}
          initialData={getInitialData(editingCustomer)}
          initialAssignedOrders={getInitialAssignedOrders(editingCustomer)}
          customerId={editingCustomer.id}
        />
      )}

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? All order associations will be removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={isDeleting}
        isDanger
      />
    </FeatureGate>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Placeholder — not used in table view but kept for ESLint
const isUnlimitedCustomers = true;

function getInitialData(c: Customer): import('../schemas').CustomerFormData {
  return {
    type: (c.type === 'B2B' || c.type === 'B2C' ? c.type : undefined) ?? 'B2B',
    firstName: c.firstName ?? undefined,
    lastName: c.lastName ?? undefined,
    companyName: c.companyName ?? undefined,
    contactPerson: c.contactPerson ?? undefined,
    status: (c.status === 'active' || c.status === 'inactive' ? c.status : undefined) ?? 'active',
    tags: c.tags && c.tags.length > 0 ? c.tags : undefined,
    email: c.email ?? '',
    phone: c.phone ?? undefined,
    nip: undefined,
    street: undefined,
    city: undefined,
    zipCode: undefined,
    country: undefined,
    notes: c.notes ?? undefined,
    assignedOrderIds: c.orders?.map((o) => o.id) ?? [],
  };
}

function getInitialAssignedOrders(c: Customer): OrderSummary[] {
  const name = getCustomerDisplayName(c);
  return (c.orders ?? []).map((o) => ({
    id: o.id,
    title: o.title,
    status: o.status ?? 'QUOTE',
    createdAt: o.createdAt,
    customerName: name,
  }));
}
