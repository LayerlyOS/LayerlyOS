'use client';

import crypto from 'crypto-js';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/layout/Logo';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NotificationIsland } from '@/components/notifications/NotificationIsland';
import { useSubscription } from '@/hooks/useSubscription';
import { useSession } from '@/hooks/useSession';
import { authClient } from '@/lib/auth-client';
import { safeJsonParse } from '@/lib/fetch-json';

export function DashboardHeader() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [useGravatar, setUseGravatar] = useState(false);
  const [authGrace, setAuthGrace] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { data: session, isPending } = useSession();
  const { features } = useSubscription();
  const showOrders = features?.ordersAccess;
  const showCustomers = true;
  const pathname = usePathname();
  const router = useRouter();
  const isProtectedPath = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin');
  const showAuthShell = !!session?.user || (isProtectedPath && (isPending || authGrace));
  const showGuestShell = !showAuthShell && !isPending && !authGrace;

  useEffect(() => {
    if (!isProtectedPath) {
      setAuthGrace(false);
      return;
    }

    if (session?.user) {
      setAuthGrace(false);
      return;
    }

    setAuthGrace(true);
    const t = setTimeout(() => setAuthGrace(false), 900);
    return () => clearTimeout(t);
  }, [isProtectedPath, session?.user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Ignore clicks on mobile menu button (it handles its own toggle)
      if (mobileMenuBtnRef.current?.contains(target)) {
        return;
      }

      // Close dropdown if clicked outside
      if (dropdownOpen && menuRef.current && !menuRef.current.contains(target)) {
        setDropdownOpen(false);
      }

      // Close mobile menu if clicked outside
      if (mobileOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setMobileOpen(false);
      }
    }

    if (dropdownOpen || mobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen, mobileOpen]);

  useEffect(() => {
    setDropdownOpen(false);
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!session?.user) {
        if (!cancelled) setIsAdmin(false);
        return;
      }
      try {
        const res = await fetch('/api/user/me');
        if (!res.ok) {
          if (!cancelled) setIsAdmin(false);
          return;
        }
        const data = await safeJsonParse(res);
        if (!cancelled) setIsAdmin(!!data?.isAdmin);

        // Fetch settings for Gravatar
        const resSettings = await fetch('/api/settings');
        if (resSettings.ok) {
          const settings = await safeJsonParse(resSettings);
          if (!cancelled) setUseGravatar(!!settings.useGravatar);
        }
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      try {
        sessionStorage.setItem('postLogoutRedirect', '1');
      } catch {}
      await authClient.auth.signOut();
      router.replace('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getGravatarUrl = (email: string) => {
    const hash = crypto.MD5(email.toLowerCase().trim()).toString();
    return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
  };

  const navLinkClass = (active: boolean) =>
    `px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
      active
        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="flex flex-col relative z-50">
      {/* Dark Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-lg relative z-50">
        <NotificationIsland />
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between relative">
            <div className="flex items-center">
              {/* Logo */}
              <Link
                href="/dashboard"
                className="flex-shrink-0 flex items-center gap-3 group hover:opacity-80 transition-opacity"
              >
                <div className="w-40 sm:w-48">
                  <Logo variant="light" />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="flex items-baseline space-x-2">
                {showAuthShell ? (
                  <>
                    <Link
                      href="/dashboard"
                      className={navLinkClass(
                        pathname?.startsWith('/dashboard') &&
                          !pathname?.startsWith('/dashboard/profile') &&
                          !pathname?.startsWith('/dashboard/settings') &&
                      !pathname?.startsWith('/dashboard/orders') &&
                      !pathname?.startsWith('/dashboard/customers')
                  )}
                >
                  Dashboard
                    </Link>
                    <Link
                      href="/dashboard/orders"
                      className={navLinkClass(!!pathname?.startsWith('/dashboard/orders'))}
                    >
                      Orders
                    </Link>
                    {showCustomers && (
                      <Link
                        href="/dashboard/customers"
                        className={navLinkClass(!!pathname?.startsWith('/dashboard/customers'))}
                      >
                        Customers
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className={navLinkClass(!!pathname?.startsWith('/admin'))}
                      >
                        Admin
                      </Link>
                    )}
                  </>
                ) : showGuestShell ? (
                  <Link href="/" className={navLinkClass(pathname === '/')}>
                    Home
                  </Link>
                ) : null}
              </div>
            </nav>

            {/* Right Side / User Menu */}
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                {session?.user && (
                  <div className="mx-2">
                    <NotificationCenter />
                  </div>
                )}
                <div className="relative" ref={menuRef}>
                  {showAuthShell ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen((v) => !v);
                          setMobileOpen(false);
                        }}
                        disabled={!session?.user}
                        className={`flex max-w-xs items-center rounded-full bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 ${dropdownOpen ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                        id="user-menu-button"
                        aria-expanded={dropdownOpen}
                        aria-haspopup="true"
                      >
                        <span className="sr-only">Open user menu</span>
                        {session?.user ? (
                          useGravatar && session.user.email ? (
                            <Image
                              src={getGravatarUrl(session.user.email)}
                              alt="Avatar"
                              width={36}
                              height={36}
                              className="h-9 w-9 rounded-full ring-2 ring-slate-700"
                            />
                          ) : (
                            <div className="h-9 w-9 bg-slate-700 rounded-full flex items-center justify-center text-white font-semibold text-xs ring-2 ring-slate-700">
                              {getInitials(
                            session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name,
                            session?.user?.email
                          )}
                            </div>
                          )
                        ) : (
                          <div className="h-9 w-9 bg-slate-700 rounded-full animate-pulse" />
                        )}
                      </button>
                    </div>
                  ) : showGuestShell ? (
                    <div className="flex items-center gap-3">
                      <Link
                        href="/login"
                        className="text-slate-300 hover:bg-slate-800 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Login
                      </Link>
                      <Link
                        href="/login"
                        className="bg-blue-600 text-white hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
                      >
                        Start now
                      </Link>
                    </div>
                  ) : null}

                  {/* Dropdown Menu */}
                  {dropdownOpen && session?.user && (
                    <div
                      className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-xl bg-white py-2 shadow-2xl ring-1 ring-slate-900/5 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-200"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                      tabIndex={-1}
                    >
                      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5 font-mono">
                          {session?.user?.email}
                        </p>
                      </div>

                      <div className="py-2 flex flex-col">
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="w-full px-5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
                            role="menuitem"
                          >
                            <div className="w-6 flex justify-center text-slate-400 group-hover:text-blue-500">
                              <i className="fa-solid fa-shield-halved"></i>
                            </div>
                            <span className="font-medium">Admin panel</span>
                          </Link>
                        )}
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full px-5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors group"
                          role="menuitem"
                        >
                          <div className="w-6 flex justify-center text-slate-400 group-hover:text-blue-500">
                            <i className="fa-solid fa-user-circle"></i>
                          </div>
                          <span className="font-medium">Your profile</span>
                        </Link>
                        <Link
                          href="/dashboard/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full px-5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors group"
                          role="menuitem"
                        >
                          <div className="w-6 flex justify-center text-slate-400 group-hover:text-blue-500">
                            <i className="fa-solid fa-cog"></i>
                          </div>
                          <span className="font-medium">Settings</span>
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 py-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="w-full px-5 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                          role="menuitem"
                        >
                          <div className="w-6 flex justify-center text-red-400 group-hover:text-red-600">
                            <i className={`fa-solid ${isLoggingOut ? 'fa-spinner fa-spin' : 'fa-arrow-right-from-bracket'}`}></i>
                          </div>
                          <span className="font-medium">Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden">
              <button
                ref={mobileMenuBtnRef}
                type="button"
                onClick={() => {
                  setMobileOpen((v) => !v);
                  setDropdownOpen(false);
                }}
                className="inline-flex items-center justify-center rounded-xl bg-slate-800 w-10 h-10 text-slate-400 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
                aria-controls="mobile-menu"
                aria-expanded={mobileOpen}
              >
                <span className="sr-only">Open main menu</span>
                <i
                  className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'} text-xl leading-none`}
                ></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-slate-800 bg-slate-900"
            id="mobile-menu"
          >
            <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
              {showAuthShell ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                      pathname === '/dashboard'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    Dashboard
                  </Link>
                  {showOrders && (
                    <Link
                      href="/dashboard/orders"
                      onClick={() => setMobileOpen(false)}
                      className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                        pathname?.startsWith('/dashboard/orders')
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Orders
                    </Link>
                  )}
                  {showCustomers && (
                    <Link
                      href="/dashboard/customers"
                      onClick={() => setMobileOpen(false)}
                      className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                        pathname?.startsWith('/dashboard/customers')
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Customers
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                        pathname?.startsWith('/admin')
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      Admin
                    </Link>
                  )}
                </>
              ) : showGuestShell ? (
                <>
                  {/* Language switcher removed */}
                </>
              ) : null}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
