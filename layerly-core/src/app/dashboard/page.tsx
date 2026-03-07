'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from '@/components/Dashboard';
import { FullPageLoader } from '@/components/ui/DataLoader';
import { useToast } from '@/components/ui/ToastProvider';
import { useSession } from '@/hooks/useSession';
import { safeJsonParse } from '@/lib/fetch-json';
import type { PrintEntry, Settings, AdvancedSettings } from '@/types';

interface ApiPrintResponse {
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
  filament: unknown;
  orderId?: string | null;
  order?: {
    title: string;
    customerName: string;
    status: string;
  } | null;
  totalCost: number;
  price: number;
  profit: number;
  extraCost?: number;
  manualPrice?: number;
  advancedSettings?: unknown;
  calculatorSnapshot?: unknown;
}

export default function DashboardPage() {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();
  const { data: session, isPending, refetch: refetchSession } = useSession();
  const userId = session?.user?.id;
  const twoFactorRequired = !!(session as unknown as { twoFactorRequired?: boolean })
    ?.twoFactorRequired;
  const [authGrace, setAuthGrace] = useState(true);
  const [printHistory, setPrintHistory] = useState<PrintEntry[]>([]);
  const [settings, setSettings] = useState<Settings>({
    power: 200,
    energyRate: 1.15,
    spoolPrice: 69.9,
    spoolWeight: 1000,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Handle OAuth callback - check for OAuth callback params and refetch session
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    // If we have OAuth callback params, refetch session and clean up URL
    if (code && state) {
      // Clean up URL params
      window.history.replaceState({}, '', window.location.pathname);
      // Refetch session to get updated auth state after OAuth
      // Give it more time for cookie to be set
      setTimeout(() => {
        refetchSession();
      }, 500);
    }
  }, [refetchSession]);

  useEffect(() => {
    if (userId) {
      setAuthGrace(false);
      return;
    }

    // Increase grace period for OAuth callback - more time in production
    const graceTime = process.env.NODE_ENV === 'production' ? 5000 : 2000;
    const t = setTimeout(() => setAuthGrace(false), graceTime);
    return () => clearTimeout(t);
  }, [userId]);

  useEffect(() => {
    if (isPending || authGrace) return;
    if (userId) return;
    if (twoFactorRequired) {
      router.replace('/two-factor');
      return;
    }
    // Don't redirect during maintenance mode - let proxy handle it
    // router.replace('/');
  }, [authGrace, isPending, router, twoFactorRequired, userId]);

  const fetchPrints = useCallback(async () => {
    try {
      const res = await fetch('/api/prints');
      if (res.ok) {
        const data = await safeJsonParse<ApiPrintResponse[]>(res);
        // Convert API data to PrintEntry format with all fields
        const prints = data.map((p: ApiPrintResponse) => ({
          id: p.id,
          name: p.name,
          brand: p.brand || '',
          color: p.color || '',
          weight: p.weight,
          timeH: p.timeH,
          timeM: p.timeM,
          qty: p.qty,
          date: new Date(p.date).toISOString(),
          printerId: p.printerId,
          filamentId: p.filamentId,
          filament: p.filament as PrintEntry['filament'], // Pass full filament object for calculations
          orderId: p.orderId ?? null,
          orderTitle: p.order?.title ?? null,
          orderCustomerName: p.order?.customerName ?? null,
          orderStatus: (p.order?.status as PrintEntry['orderStatus']) ?? null,
          totalCost: p.totalCost,
          price: p.price,
          profit: p.profit,
          extraCost: p.extraCost || undefined,
          manualPrice: p.manualPrice || undefined,
          advancedSettings: (p.advancedSettings as AdvancedSettings) || null,
          calculatorSnapshot: p.calculatorSnapshot ?? null,
        }));
        setPrintHistory(prints);
      }
    } catch (e) {
      console.error('Error fetching prints:', e);
      showError('Error loading prints');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await safeJsonParse(res);
        setSettings({
          power: 200, // Deprecated - per-printer now
          energyRate: data.energyRate || 1.15,
          spoolPrice: 69.9, // Default - will be overridden from filaments
          spoolWeight: 1000,
          defaultPrinterId: data.defaultPrinterId,
          lowStockAlertPercent: data.lowStockAlertPercent ?? 20,
        });
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  }, []);

  // Load data from API
  useEffect(() => {
    if (userId) {
      fetchPrints();
      fetchSettings();
    }
  }, [userId, fetchPrints, fetchSettings]);

  if (!userId && !authGrace && !isPending) {
    return null;
  }

  const handleDelete = async (id: string | number) => {
    const stringId = String(id);
    try {
      const res = await fetch(`/api/prints/${stringId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showSuccess('Print deleted');
        fetchPrints();
        return true;
      } else {
        showError('Error deleting print');
        return false;
      }
    } catch (e) {
      console.error('Error deleting print:', e);
      showError('Connection error');
      return false;
    }
  };

  const handleEdit = (id: string | number) => {
    router.push(
      '/dashboard/calculator?edit=' + encodeURIComponent(String(id))
    );
  };

  const handleDuplicate = async (id: string | number) => {
    const stringId = String(id);
    const original = printHistory.find((p) => p.id === stringId);
    if (!original) return;

    try {
      const res = await fetch('/api/prints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: original.printerId,
          filamentId: original.filamentId || null,
          orderId: null,
          name: `${original.name} (Copy)`,
          brand: original.brand,
          color: original.color,
          weight: original.weight,
          timeH: original.timeH,
          timeM: original.timeM,
          qty: original.qty,
          price: original.price,
          profit: original.profit,
          totalCost: original.totalCost,
          extraCost: original.extraCost,
          manualPrice: original.manualPrice,
          advancedSettings: original.advancedSettings,
          calculatorSnapshot: original.calculatorSnapshot ?? null,
        }),
      });

      if (res.ok) {
        showSuccess('Print duplicated');
        fetchPrints();
      } else {
        showError('Error duplicating print');
      }
    } catch (e) {
      console.error('Error duplicating print:', e);
      showError('Connection error');
    }
  };

  if ((isPending || authGrace) && !userId) {
    return <FullPageLoader />;
  }

  // If user is not logged in after grace period, null (will redirect)
  if (!userId) return null;

  // Single Loader Principle: only one loader on screen – block Dashboard until loading is false
  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <div className="flex flex-col flex-1 w-full">
      <Dashboard
        printHistory={printHistory}
        settings={settings}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        loading={loading}
        view="overview"
        onViewAllPrints={() => router.push('/dashboard/prints')}
      />
    </div>
  );
}
