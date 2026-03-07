'use client';

import { Mail, Phone, Pencil, Trash2, ShoppingBag, Tag } from 'lucide-react';
import Link from 'next/link';
import { getInitials, getAvatarColor } from '../utils';

export interface CustomerCardCustomer {
  id: string;
  type: string | null;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  contactPerson: string | null;
  status: string | null;
  tags: string[] | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  orders: { id: string; title: string; status: string; createdAt: Date }[];
}

interface CustomerCardProps {
  customer: CustomerCardCustomer;
  onEdit: (customer: CustomerCardCustomer) => void;
  onDelete: (id: string) => void;
}

export function getCustomerDisplayName(c: CustomerCardCustomer): string {
  if (c.companyName?.trim()) return c.companyName.trim();
  const first = (c.firstName ?? '').trim();
  const last = (c.lastName ?? '').trim();
  return [first, last].filter(Boolean).join(' ') || '—';
}

// ─── Order status config ──────────────────────────────────────────────────────

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  QUOTE: { label: 'Quote', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  IN_PROGRESS: { label: 'In progress', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  COMPLETED: { label: 'Done', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' },
};

// ─── CustomerCard ─────────────────────────────────────────────────────────────

export function CustomerCard({ customer, onEdit, onDelete }: CustomerCardProps) {
  const name = getCustomerDisplayName(customer);
  const initials = getInitials(name);
  const avatarColorClass = getAvatarColor(name);
  const tags = customer.tags ?? [];
  const orders = customer.orders ?? [];
  const orderCount = orders.length;
  const status = customer.status ?? 'active';
  const isActive = status === 'active';
  const isB2B = customer.type === 'B2B';

  // Show up to 2 most recent orders
  const recentOrders = orders.slice(0, 2);

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col group
      ${isActive ? 'border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50' : 'border-slate-200 opacity-75'}
    `}>
      <div className="p-5 flex-1 flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-start gap-3 mb-4">
          {/* Avatar */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${avatarColorClass}`}>
            {initials}
          </div>

          {/* Name + type */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-black text-slate-900 leading-tight truncate" title={name}>
                {name}
              </h3>
              {isB2B && (
                <span className="shrink-0 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  B2B
                </span>
              )}
              {!isB2B && customer.type === 'B2C' && (
                <span className="shrink-0 bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  B2C
                </span>
              )}
            </div>
            {customer.contactPerson && (
              <p className="text-xs text-slate-500 font-medium truncate">{customer.contactPerson}</p>
            )}
          </div>

          {/* Status */}
          <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
            ${isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
          `}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* ── Contact info ── */}
        {(customer.email || customer.phone) && (
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 space-y-2 mb-4">
            {customer.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a
                  href={`mailto:${customer.email}`}
                  className="text-sm text-slate-600 hover:text-indigo-600 transition-colors truncate font-medium"
                >
                  {customer.email}
                </a>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href={`tel:${customer.phone}`} className="text-sm text-slate-600 hover:text-indigo-600 transition-colors font-medium">
                  {customer.phone}
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Tags ── */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <Tag className="w-3 h-3 text-slate-400 shrink-0" />
            {tags.map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md border border-slate-200/60 uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* ── Recent orders ── */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Orders</p>
            </div>
            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
              {orderCount}
            </span>
          </div>

          {recentOrders.length > 0 ? (
            <div className="space-y-1.5">
              {recentOrders.map((order) => {
                const orderCfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.QUOTE;
                return (
                  <div key={order.id} className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-600 font-medium truncate">{order.title}</p>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${orderCfg.color}`}>
                      {orderCfg.label}
                    </span>
                  </div>
                );
              })}
              {orderCount > 2 && (
                <p className="text-[10px] text-slate-400 font-medium">+{orderCount - 2} more</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium">No orders yet</p>
          )}
        </div>
      </div>

      {/* ── Footer: actions ── */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-between gap-2">
        <Link
          href={`/dashboard/orders?customerId=${customer.id}`}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          View orders →
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(customer)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(customer.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
