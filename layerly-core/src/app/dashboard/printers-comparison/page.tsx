'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageLoader } from '@/components/ui/DataLoader';
import { useSession } from '@/hooks/useSession';
import { safeJsonParse } from '@/lib/fetch-json';
import { PrinterComparisonView } from '@/features/dashboard/components/PrinterComparison';
import type { PrintEntry, Printer } from '@/types';

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
  order?: { title: string; customerName: string; status: string } | null;
  totalCost: number;
  price: number;
  profit: number;
  extraCost?: number;
  manualPrice?: number;
  advancedSettings?: unknown;
  calculatorSnapshot?: unknown;
  status?: 'success' | 'failed' | 'canceled';
}

export default function PrintersComparisonPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;
  const [authGrace, setAuthGrace] = useState(true);

  const [printHistory, setPrintHistory] = useState<PrintEntry[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) setAuthGrace(false);
    else {
      const t = setTimeout(() => setAuthGrace(false), 2000);
      return () => clearTimeout(t);
    }
  }, [userId]);

  useEffect(() => {
    if (!isPending && !authGrace && !userId) router.replace('/login');
  }, [authGrace, isPending, router, userId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [printsRes, printersRes] = await Promise.all([
        fetch('/api/prints'),
        fetch('/api/printers'),
      ]);

      if (printsRes.ok) {
        const data = await safeJsonParse<ApiPrintResponse[]>(printsRes);
        setPrintHistory(
          data.map((p) => ({
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
            filament: p.filament as PrintEntry['filament'],
            orderId: p.orderId ?? null,
            orderTitle: p.order?.title ?? null,
            orderCustomerName: p.order?.customerName ?? null,
            orderStatus: (p.order?.status as PrintEntry['orderStatus']) ?? null,
            totalCost: p.totalCost,
            price: p.price,
            profit: p.profit,
            extraCost: p.extraCost,
            manualPrice: p.manualPrice,
            advancedSettings: (p.advancedSettings ?? null) as PrintEntry['advancedSettings'],
            calculatorSnapshot: p.calculatorSnapshot ?? null,
            status: p.status ?? 'success',
          }))
        );
      }

      if (printersRes.ok) {
        const data: Printer[] = await printersRes.json();
        setPrinters(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, fetchData]);

  if ((isPending || authGrace) && !userId) return <FullPageLoader />;
  if (!userId) return null;

  return (
    <PrinterComparisonView
      printHistory={printHistory}
      printers={printers}
      loading={loading}
      onRefresh={fetchData}
    />
  );
}
