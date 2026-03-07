'use client';

import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  Calculator,
  ChevronUp,
  Database,
  History,
  Layers,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Printer,
  Search,
  Settings,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/layout/Logo';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NotificationIsland } from '@/components/notifications/NotificationIsland';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { authClient } from '@/lib/auth-client';

// ─── Nav config ───────────────────────────────────────────────────────────────

type NavItem = { id: string; href: string; label: string; icon: LucideIcon };

const NAV_GROUPS: { id: string; label: string | null; items: NavItem[] }[] = [
  {
    id: 'core',
    label: null,
    items: [
      { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: Layers },
    ],
  },
  {
    id: 'production',
    label: 'Production',
    items: [
      { id: 'calculator', href: '/dashboard/calculator', label: 'New Quote', icon: Calculator },
      { id: 'orders', href: '/dashboard/orders', label: 'Orders', icon: Package },
      { id: 'prints', href: '/dashboard/prints', label: 'Print History', icon: History },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    items: [
      { id: 'inventory', href: '/dashboard/filaments', label: 'Materials', icon: Database },
      { id: 'printers', href: '/dashboard/printers', label: 'Machine Fleet', icon: Printer },
      { id: 'comparison', href: '/dashboard/printers-comparison', label: 'Comparison', icon: BarChart3 },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    items: [
      { id: 'clients', href: '/dashboard/customers', label: 'Customers', icon: Users },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBreadcrumbLabel(pathname: string): string {
  if (pathname === '/dashboard' || pathname === '/dashboard/') return 'Dashboard';
  if (pathname.startsWith('/dashboard/calculator')) return 'New Quote';
  if (pathname.startsWith('/dashboard/orders')) return 'Orders';
  if (pathname === '/dashboard/prints') return 'Print History';
  if (pathname === '/dashboard/printers-comparison') return 'Printer Comparison';
  if (pathname.startsWith('/dashboard/filaments')) return 'Materials';
  if (pathname.startsWith('/dashboard/printers')) return 'Machine Fleet';
  if (pathname.startsWith('/dashboard/customers')) return 'Customers';
  if (pathname.startsWith('/dashboard/profile')) return 'My Profile';
  if (pathname.startsWith('/dashboard/settings')) return 'Account Settings';
  if (pathname.startsWith('/dashboard/notifications')) return 'Notifications';
  return 'Dashboard';
}

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  item,
  isCollapsed,
  isActive,
}: {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <div className="relative group/navitem">
      <Link
        href={item.href}
        className={`
          relative flex items-center gap-3 rounded-xl text-sm font-medium
          transition-all duration-200 select-none
          ${isCollapsed ? 'justify-center py-3 mx-0' : 'px-3 py-2.5'}
          ${isActive
            ? 'bg-white/10 text-white'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
          }
        `}
      >
        {/* Active left accent */}
        {isActive && !isCollapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-full" />
        )}

        <Icon
          className={`shrink-0 transition-colors ${
            isActive ? 'text-indigo-400' : 'text-slate-500 group-hover/navitem:text-slate-300'
          } ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`}
        />

        {!isCollapsed && (
          <span className="truncate">{item.label}</span>
        )}
      </Link>

      {/* Tooltip (collapsed only) */}
      {isCollapsed && (
        <div className="
          pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60]
          px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap
          bg-slate-800 text-white border border-slate-700/80 shadow-xl
          opacity-0 group-hover/navitem:opacity-100 transition-opacity duration-150
        ">
          {item.label}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
        </div>
      )}
    </div>
  );
}

// ─── UserMenu ─────────────────────────────────────────────────────────────────

function UserMenu({
  isCollapsed,
  displayName,
  email,
  initials,
  planName,
  onLogout,
}: {
  isCollapsed: boolean;
  displayName: string;
  email: string;
  initials: string;
  planName: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const menuLinks = [
    { href: '/dashboard/profile', icon: User, label: 'My Profile' },
    { href: '/dashboard/settings', icon: Settings, label: 'Account Settings' },
    { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
  ];

  return (
    <div ref={ref} className="relative">

      {/* ── Dropdown ── */}
      {open && (
        <div
          className={`
            absolute z-[60] bg-slate-900 border border-slate-700/60
            rounded-2xl shadow-2xl shadow-black/50 overflow-hidden
            animate-in fade-in slide-in-from-bottom-2 duration-150
            ${isCollapsed
              ? 'left-full bottom-0 ml-3 w-56'
              : 'bottom-full left-0 right-0 mb-2'
            }
          `}
        >
          {/* User header */}
          <div className="px-4 py-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-indigo-900/50">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{email}</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                {planName}
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="p-2">
            {menuLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all group/menulink"
                >
                  <Icon className="w-4 h-4 text-slate-500 group-hover/menulink:text-slate-300 shrink-0 transition-colors" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Log out
            </button>
          </div>
        </div>
      )}

      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          w-full flex items-center gap-3 rounded-xl cursor-pointer
          border transition-all duration-200
          ${open
            ? 'bg-white/10 border-white/10'
            : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/8 hover:border-white/10'
          }
          ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}
        `}
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md shadow-indigo-900/40">
          {initials}
        </div>

        {!isCollapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{displayName}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest truncate mt-0.5">{planName}</p>
            </div>
            <ChevronUp
              className={`w-4 h-4 text-slate-600 shrink-0 transition-transform duration-200 ${open ? 'rotate-0' : 'rotate-180'}`}
            />
          </>
        )}
      </button>
    </div>
  );
}

// ─── DashboardLayout ──────────────────────────────────────────────────────────

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { planName } = useSubscription();

  const handleLogout = useCallback(async () => {
    try {
      sessionStorage.setItem('postLogoutRedirect', '1');
      await authClient.auth.signOut();
      router.replace('/');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  }, [router]);

  const isActive = useCallback(
    (href: string) => {
      if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/dashboard/';
      if (href === '/dashboard/printers') return pathname === '/dashboard/printers';
      if (href === '/dashboard/printers-comparison') return pathname === '/dashboard/printers-comparison';
      return pathname?.startsWith(href) ?? false;
    },
    [pathname]
  );

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  const displayName =
    (session?.user?.user_metadata?.name as string) ||
    (session?.user?.user_metadata?.full_name as string) ||
    session?.user?.email?.split('@')[0] ||
    'User';

  const email = session?.user?.email || '';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 overflow-hidden">
      <NotificationIsland />

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col
          bg-slate-950 ring-1 ring-white/[0.06]
          transition-all duration-300 ease-in-out shrink-0
          ${isCollapsed ? 'w-[72px]' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >

        {/* ── Header: Logo + collapse toggle ── */}
        <div
          className={`
            h-16 shrink-0 flex items-center border-b border-white/[0.06]
            ${isCollapsed ? 'justify-center px-0' : 'px-4'}
          `}
        >
          <Link
            href="/dashboard"
            className={`flex items-center shrink-0 ${isCollapsed ? 'w-9 h-9' : 'w-32 h-8'}`}
          >
            <Logo variant="light" iconOnly={isCollapsed} />
          </Link>

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="ml-auto p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 dashboard-sidebar-scroll">

          {/* Expand button — only when collapsed */}
          {isCollapsed && (
            <div className="px-2 mb-2">
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="w-full flex justify-center items-center py-2.5 rounded-xl text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all cursor-pointer"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Groups */}
          {NAV_GROUPS.map((group, idx) => (
            <div key={group.id} className={idx > 0 ? 'mt-4' : ''}>
              {/* Group divider/label */}
              {group.label && (
                isCollapsed
                  ? <div className="mx-4 my-1 h-px bg-white/[0.06]" />
                  : <p className="px-4 pt-1 pb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      {group.label}
                    </p>
              )}

              {/* Items */}
              <div className={isCollapsed ? 'px-2 space-y-0.5' : 'px-3 space-y-0.5'}>
                {group.items.map((item) => (
                  <NavLink
                    key={item.id}
                    item={item}
                    isCollapsed={isCollapsed}
                    isActive={isActive(item.href)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── User menu ── */}
        <div className={`shrink-0 border-t border-white/[0.06] ${isCollapsed ? 'p-2' : 'p-3'}`}>
          <UserMenu
            isCollapsed={isCollapsed}
            displayName={displayName}
            email={email}
            initials={initials}
            planName={planName}
            onLogout={handleLogout}
          />
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">

        {/* Top header bar */}
        <header className="h-16 bg-slate-50 border-b border-slate-100 shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">/</span>
              <span className="text-slate-800 font-semibold">{getBreadcrumbLabel(pathname || '')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <button
              type="button"
              className="hidden md:flex items-center gap-2 w-52 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl pl-3.5 pr-3 py-2 text-sm text-slate-400 transition-colors cursor-pointer"
              aria-label="Search (Ctrl+K)"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Search</span>
              <span className="flex items-center gap-0.5 shrink-0">
                <kbd className="inline-flex items-center h-5 px-1.5 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-400 shadow-sm">⌘</kbd>
                <kbd className="inline-flex items-center h-5 px-1.5 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-400 shadow-sm">K</kbd>
              </span>
            </button>

            {/* Notifications */}
            <NotificationCenter />

            {/* New Quote */}
            <Link
              href="/dashboard/calculator"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Quote</span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
